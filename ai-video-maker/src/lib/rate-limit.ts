/**
 * Rate Limiting System
 * API 요청 제한 시스템
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;  // 시간 윈도우 (밀리초)
  maxRequests: number;  // 최대 요청 수
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// 인메모리 저장소 (프로덕션에서는 Redis 사용 권장)
const ipLimits = new Map<string, RateLimitEntry>();
const userLimits = new Map<string, RateLimitEntry>();

// 기본 설정
const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000,  // 1분
  maxRequests: 60,  // 분당 60회
};

// API별 설정
const apiConfigs: Record<string, RateLimitConfig> = {
  '/api/animations': {
    windowMs: 60 * 1000,
    maxRequests: 10,  // 분당 10회 (AI 생성은 비용이 크므로 제한)
  },
  '/api/render': {
    windowMs: 60 * 1000,
    maxRequests: 5,  // 분당 5회 (렌더링은 리소스 소모가 크므로 제한)
  },
  '/api/photos': {
    windowMs: 60 * 1000,
    maxRequests: 30,  // 분당 30회
  },
  '/api/payments': {
    windowMs: 60 * 1000,
    maxRequests: 20,  // 분당 20회
  },
};

/**
 * IP 주소 추출
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

/**
 * Rate limit 체크
 */
function checkLimit(
  store: Map<string, RateLimitEntry>,
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = store.get(key);

  // 새로운 윈도우 시작
  if (!entry || now >= entry.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    store.set(key, newEntry);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // 기존 윈도우 내 요청
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  entry.count++;
  store.set(key, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Rate limit 미들웨어
 */
export function rateLimit(
  request: NextRequest,
  userId?: string | null,
  customConfig?: RateLimitConfig
): { success: boolean; response?: NextResponse } {
  const path = request.nextUrl.pathname;

  // API별 설정 또는 커스텀 설정 또는 기본 설정 사용
  const config = customConfig ||
    Object.entries(apiConfigs).find(([apiPath]) => path.startsWith(apiPath))?.[1] ||
    defaultConfig;

  const ip = getClientIp(request);
  const ipKey = `ip:${ip}:${path}`;

  // IP 기반 체크
  const ipCheck = checkLimit(ipLimits, ipKey, config);

  if (!ipCheck.allowed) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((ipCheck.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': ipCheck.resetTime.toString(),
            'Retry-After': Math.ceil((ipCheck.resetTime - Date.now()) / 1000).toString(),
          },
        }
      ),
    };
  }

  // 사용자 기반 체크 (인증된 경우)
  if (userId) {
    const userKey = `user:${userId}:${path}`;
    const userCheck = checkLimit(userLimits, userKey, config);

    if (!userCheck.allowed) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil((userCheck.resetTime - Date.now()) / 1000),
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': config.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': userCheck.resetTime.toString(),
              'Retry-After': Math.ceil((userCheck.resetTime - Date.now()) / 1000).toString(),
            },
          }
        ),
      };
    }
  }

  return { success: true };
}

/**
 * Rate limit 헤더 추가
 */
export function addRateLimitHeaders(
  response: NextResponse,
  remaining: number,
  limit: number,
  resetTime: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', resetTime.toString());
  return response;
}

/**
 * 주기적으로 만료된 엔트리 정리 (메모리 관리)
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();

  for (const [key, entry] of ipLimits.entries()) {
    if (now >= entry.resetTime) {
      ipLimits.delete(key);
    }
  }

  for (const [key, entry] of userLimits.entries()) {
    if (now >= entry.resetTime) {
      userLimits.delete(key);
    }
  }
}

// 5분마다 정리 실행
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}
