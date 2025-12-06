/**
 * Custom Error Classes
 * 커스텀 에러 클래스 및 에러 처리
 */

import { NextResponse } from 'next/server';

// 에러 코드 상수
export const ErrorCodes = {
  // 인증 관련
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // 유효성 검사
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // 리소스 관련
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // 비즈니스 로직
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  RENDER_FAILED: 'RENDER_FAILED',
  ANIMATION_FAILED: 'ANIMATION_FAILED',

  // 외부 서비스
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  KLING_API_ERROR: 'KLING_API_ERROR',
  TOSS_API_ERROR: 'TOSS_API_ERROR',
  SUPABASE_ERROR: 'SUPABASE_ERROR',

  // 서버 에러
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * 기본 API 에러 클래스
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCode = ErrorCodes.INTERNAL_ERROR,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    // Error 클래스 상속 시 프로토타입 체인 복원
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      ...(this.details && { details: this.details }),
    };
  }

  toResponse(): NextResponse {
    return NextResponse.json(this.toJSON(), { status: this.statusCode });
  }
}

/**
 * 인증 에러
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = '인증이 필요합니다.') {
    super(message, 401, ErrorCodes.UNAUTHORIZED);
    this.name = 'UnauthorizedError';
  }
}

/**
 * 권한 에러
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = '접근 권한이 없습니다.') {
    super(message, 403, ErrorCodes.FORBIDDEN);
    this.name = 'ForbiddenError';
  }
}

/**
 * 리소스 없음 에러
 */
export class NotFoundError extends ApiError {
  constructor(resource: string = '리소스') {
    super(`${resource}를 찾을 수 없습니다.`, 404, ErrorCodes.NOT_FOUND);
    this.name = 'NotFoundError';
  }
}

/**
 * 유효성 검사 에러
 */
export class ValidationError extends ApiError {
  constructor(message: string, details?: Record<string, string[]>) {
    super(message, 400, ErrorCodes.VALIDATION_ERROR, details);
    this.name = 'ValidationError';
  }
}

/**
 * 크레딧 부족 에러
 */
export class InsufficientCreditsError extends ApiError {
  constructor(required: number, available: number) {
    super(
      `크레딧이 부족합니다. (필요: ${required}, 보유: ${available})`,
      402,
      ErrorCodes.INSUFFICIENT_CREDITS,
      { required, available }
    );
    this.name = 'InsufficientCreditsError';
  }
}

/**
 * Rate Limit 에러
 */
export class RateLimitError extends ApiError {
  constructor(retryAfter: number) {
    super(
      '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
      429,
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      { retryAfter }
    );
    this.name = 'RateLimitError';
  }
}

/**
 * 외부 서비스 에러
 */
export class ExternalServiceError extends ApiError {
  constructor(service: string, message: string) {
    super(
      `${service} 서비스 오류: ${message}`,
      502,
      ErrorCodes.EXTERNAL_SERVICE_ERROR,
      { service }
    );
    this.name = 'ExternalServiceError';
  }
}

/**
 * 에러 응답 생성 헬퍼
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage: string = '서버 오류가 발생했습니다.'
): NextResponse {
  // ApiError 인스턴스인 경우
  if (error instanceof ApiError) {
    return error.toResponse();
  }

  // 일반 Error 인스턴스인 경우
  if (error instanceof Error) {
    console.error('Unhandled error:', error);

    // 개발 환경에서는 상세 메시지 표시
    const message = process.env.NODE_ENV === 'development'
      ? error.message
      : defaultMessage;

    return NextResponse.json(
      {
        error: message,
        code: ErrorCodes.INTERNAL_ERROR,
      },
      { status: 500 }
    );
  }

  // 알 수 없는 에러
  console.error('Unknown error:', error);
  return NextResponse.json(
    {
      error: defaultMessage,
      code: ErrorCodes.INTERNAL_ERROR,
    },
    { status: 500 }
  );
}

/**
 * API 핸들러 래퍼 (에러 처리 자동화)
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
): (...args: T) => Promise<NextResponse> {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return createErrorResponse(error);
    }
  };
}

/**
 * 입력 유효성 검사 헬퍼
 */
export function validateRequired<T extends Record<string, unknown>>(
  data: T,
  requiredFields: (keyof T)[]
): void {
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missingFields.push(String(field));
    }
  }

  if (missingFields.length > 0) {
    throw new ValidationError(
      `필수 필드가 누락되었습니다: ${missingFields.join(', ')}`,
      { missingFields }
    );
  }
}
