import { describe, it, expect } from 'vitest';
import {
  ApiError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  InsufficientCreditsError,
  RateLimitError,
  ExternalServiceError,
  ErrorCodes,
  validateRequired,
} from '@/lib/errors';

describe('ApiError', () => {
  it('should create an error with default values', () => {
    const error = new ApiError('Test error');

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe(ErrorCodes.INTERNAL_ERROR);
    expect(error.details).toBeUndefined();
  });

  it('should create an error with custom values', () => {
    const error = new ApiError('Custom error', 400, ErrorCodes.VALIDATION_ERROR, { field: 'email' });

    expect(error.message).toBe('Custom error');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
    expect(error.details).toEqual({ field: 'email' });
  });

  it('should serialize to JSON correctly', () => {
    const error = new ApiError('Test', 400, ErrorCodes.VALIDATION_ERROR, { test: true });
    const json = error.toJSON();

    expect(json).toEqual({
      error: 'Test',
      code: ErrorCodes.VALIDATION_ERROR,
      details: { test: true },
    });
  });
});

describe('UnauthorizedError', () => {
  it('should create with default message', () => {
    const error = new UnauthorizedError();

    expect(error.message).toBe('인증이 필요합니다.');
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe(ErrorCodes.UNAUTHORIZED);
  });

  it('should create with custom message', () => {
    const error = new UnauthorizedError('세션이 만료되었습니다.');

    expect(error.message).toBe('세션이 만료되었습니다.');
    expect(error.statusCode).toBe(401);
  });
});

describe('ForbiddenError', () => {
  it('should create with default message', () => {
    const error = new ForbiddenError();

    expect(error.message).toBe('접근 권한이 없습니다.');
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe(ErrorCodes.FORBIDDEN);
  });
});

describe('NotFoundError', () => {
  it('should create with resource name', () => {
    const error = new NotFoundError('프로젝트');

    expect(error.message).toBe('프로젝트를 찾을 수 없습니다.');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe(ErrorCodes.NOT_FOUND);
  });
});

describe('ValidationError', () => {
  it('should create with details', () => {
    const error = new ValidationError('유효성 검사 실패', { email: ['이메일 형식이 올바르지 않습니다.'] });

    expect(error.message).toBe('유효성 검사 실패');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
    expect(error.details).toEqual({ email: ['이메일 형식이 올바르지 않습니다.'] });
  });
});

describe('InsufficientCreditsError', () => {
  it('should include required and available credits', () => {
    const error = new InsufficientCreditsError(10, 5);

    expect(error.message).toBe('크레딧이 부족합니다. (필요: 10, 보유: 5)');
    expect(error.statusCode).toBe(402);
    expect(error.code).toBe(ErrorCodes.INSUFFICIENT_CREDITS);
    expect(error.details).toEqual({ required: 10, available: 5 });
  });
});

describe('RateLimitError', () => {
  it('should include retry after', () => {
    const error = new RateLimitError(60);

    expect(error.statusCode).toBe(429);
    expect(error.code).toBe(ErrorCodes.RATE_LIMIT_EXCEEDED);
    expect(error.details).toEqual({ retryAfter: 60 });
  });
});

describe('ExternalServiceError', () => {
  it('should include service name', () => {
    const error = new ExternalServiceError('Kling AI', 'API 호출 실패');

    expect(error.message).toBe('Kling AI 서비스 오류: API 호출 실패');
    expect(error.statusCode).toBe(502);
    expect(error.code).toBe(ErrorCodes.EXTERNAL_SERVICE_ERROR);
    expect(error.details).toEqual({ service: 'Kling AI' });
  });
});

describe('validateRequired', () => {
  it('should pass when all required fields are present', () => {
    const data = { name: 'Test', email: 'test@example.com' };

    expect(() => validateRequired(data, ['name', 'email'])).not.toThrow();
  });

  it('should throw when required fields are missing', () => {
    const data = { name: 'Test' };

    expect(() => validateRequired(data, ['name', 'email'])).toThrow('필수 필드가 누락되었습니다');
  });

  it('should throw when required fields are empty', () => {
    const data = { name: 'Test', email: '' };

    expect(() => validateRequired(data, ['name', 'email'])).toThrow('필수 필드가 누락되었습니다');
  });

  it('should include missing field names in error', () => {
    const data = { name: 'Test' };

    try {
      validateRequired(data, ['name', 'email', 'password']);
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect((error as ValidationError).code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect((error as ValidationError).details).toEqual({ missingFields: ['email', 'password'] });
    }
  });
});
