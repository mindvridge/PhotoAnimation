/**
 * API Handler Wrapper
 * Rate Limiting + Logging 통합 핸들러
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';
import { logger, logApiRequest, logSecurity } from '@/lib/logger';
import { ApiError, AuthenticationError, handleError } from '@/lib/errors';

export interface ApiContext {
  userId?: string;
  isAdmin?: boolean;
  requestId: string;
  startTime: number;
}

type ApiHandler = (
  request: NextRequest,
  context: ApiContext,
  params?: Record<string, string>
) => Promise<NextResponse>;

interface ApiHandlerOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  skipRateLimit?: boolean;
}

/**
 * 요청 ID 생성
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * IP 주소 추출
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * API 핸들러 래퍼
 */
export function withApiHandler(
  handler: ApiHandler,
  options: ApiHandlerOptions = {}
) {
  return async (
    request: NextRequest,
    { params }: { params?: Promise<Record<string, string>> } = {}
  ): Promise<NextResponse> => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    const path = request.nextUrl.pathname;
    const method = request.method;
    const ip = getClientIp(request);

    try {
      // 1. Rate Limiting 체크
      if (!options.skipRateLimit) {
        const rateLimitResult = rateLimit(request);
        if (!rateLimitResult.success && rateLimitResult.response) {
          logSecurity('rate_limited', {
            ip,
            path,
            userAgent: request.headers.get('user-agent') || undefined,
          });
          return rateLimitResult.response;
        }
      }

      // 2. 인증 체크
      let userId: string | undefined;
      let isAdmin = false;

      if (options.requireAuth || options.requireAdmin) {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          logSecurity('unauthorized', {
            ip,
            path,
            reason: 'No valid session',
          });
          throw new AuthenticationError('인증이 필요합니다.');
        }

        userId = user.id;

        // 관리자 권한 체크
        if (options.requireAdmin) {
          const { data: userProfile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

          if (userProfile?.role !== 'admin') {
            logSecurity('unauthorized', {
              userId,
              ip,
              path,
              reason: 'Admin required',
            });
            throw new AuthenticationError('관리자 권한이 필요합니다.');
          }
          isAdmin = true;
        }
      } else {
        // 선택적 인증 (인증 정보가 있으면 사용)
        try {
          const supabase = await createClient();
          const { data: { user } } = await supabase.auth.getUser();
          userId = user?.id;
        } catch {
          // 인증 실패는 무시
        }
      }

      // 3. 핸들러 실행
      const context: ApiContext = {
        userId,
        isAdmin,
        requestId,
        startTime,
      };

      const resolvedParams = params ? await params : undefined;
      const response = await handler(request, context, resolvedParams);

      // 4. 성공 로깅
      const duration = Date.now() - startTime;
      logApiRequest(method, path, userId, duration, response.status);

      // 5. 요청 ID 헤더 추가
      response.headers.set('X-Request-ID', requestId);

      return response;
    } catch (error) {
      // 6. 에러 로깅 및 처리
      const duration = Date.now() - startTime;

      if (error instanceof ApiError) {
        logger.warn(`API Error: ${error.message}`, {
          requestId,
          path,
          method,
          duration,
          statusCode: error.statusCode,
        });
      } else {
        logger.error(
          'Unexpected API Error',
          {
            requestId,
            path,
            method,
            duration,
          },
          error instanceof Error ? error : new Error(String(error))
        );
      }

      const errorResponse = handleError(error);
      errorResponse.headers.set('X-Request-ID', requestId);

      return errorResponse;
    }
  };
}

/**
 * 인증 필수 API 핸들러
 */
export function withAuth(handler: ApiHandler) {
  return withApiHandler(handler, { requireAuth: true });
}

/**
 * 관리자 전용 API 핸들러
 */
export function withAdmin(handler: ApiHandler) {
  return withApiHandler(handler, { requireAuth: true, requireAdmin: true });
}

/**
 * 공개 API 핸들러 (Rate Limiting만 적용)
 */
export function withPublic(handler: ApiHandler) {
  return withApiHandler(handler, { requireAuth: false });
}
