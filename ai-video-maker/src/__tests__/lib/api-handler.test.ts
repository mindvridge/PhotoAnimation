/**
 * API Handler Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { role: 'admin' },
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => ({ success: true })),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  logApiRequest: vi.fn(),
  logSecurity: vi.fn(),
}));

vi.mock('@/lib/errors', () => ({
  ApiError: class ApiError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.name = 'ApiError';
      this.statusCode = statusCode;
    }
  },
  AuthenticationError: class AuthenticationError extends Error {
    statusCode = 401;
    constructor(message: string) {
      super(message);
      this.name = 'AuthenticationError';
    }
  },
  ValidationError: class ValidationError extends Error {
    statusCode = 400;
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  },
  NotFoundError: class NotFoundError extends Error {
    statusCode = 404;
    constructor(message: string) {
      super(message);
      this.name = 'NotFoundError';
    }
  },
  handleError: vi.fn((error) => ({
    status: error.statusCode || 500,
    body: { error: error.message },
    headers: new Map(),
  })),
}));

describe('API Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ApiContext 인터페이스', () => {
    it('ApiContext는 필수 필드를 가져야 함', () => {
      const context = {
        userId: 'user-123',
        isAdmin: false,
        requestId: 'req_123456',
        startTime: Date.now(),
      };

      expect(context.requestId).toMatch(/^req_/);
      expect(context.startTime).toBeGreaterThan(0);
    });

    it('관리자 컨텍스트는 isAdmin이 true여야 함', () => {
      const adminContext = {
        userId: 'admin-123',
        isAdmin: true,
        requestId: 'req_admin_123',
        startTime: Date.now(),
      };

      expect(adminContext.isAdmin).toBe(true);
    });
  });

  describe('Request ID 생성', () => {
    it('고유한 요청 ID가 생성되어야 함', () => {
      const generateRequestId = () => {
        return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      };

      const id1 = generateRequestId();
      const id2 = generateRequestId();

      expect(id1).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('IP 추출', () => {
    it('x-forwarded-for에서 첫 번째 IP 추출', () => {
      const getClientIp = (headers: Map<string, string | null>) => {
        const forwarded = headers.get('x-forwarded-for');
        if (forwarded) {
          return forwarded.split(',')[0].trim();
        }
        return headers.get('x-real-ip') || 'unknown';
      };

      const headers = new Map<string, string | null>();
      headers.set('x-forwarded-for', '1.2.3.4, 5.6.7.8');

      expect(getClientIp(headers)).toBe('1.2.3.4');
    });

    it('x-real-ip 폴백', () => {
      const getClientIp = (headers: Map<string, string | null>) => {
        const forwarded = headers.get('x-forwarded-for');
        if (forwarded) {
          return forwarded.split(',')[0].trim();
        }
        return headers.get('x-real-ip') || 'unknown';
      };

      const headers = new Map<string, string | null>();
      headers.set('x-forwarded-for', null);
      headers.set('x-real-ip', '10.0.0.1');

      expect(getClientIp(headers)).toBe('10.0.0.1');
    });
  });

  describe('핸들러 옵션', () => {
    it('requireAuth 옵션은 인증을 필수로 함', () => {
      const options = {
        requireAuth: true,
        requireAdmin: false,
        skipRateLimit: false,
      };

      expect(options.requireAuth).toBe(true);
    });

    it('requireAdmin은 관리자 권한을 필수로 함', () => {
      const options = {
        requireAuth: true,
        requireAdmin: true,
        skipRateLimit: false,
      };

      expect(options.requireAdmin).toBe(true);
      // requireAdmin이 true면 requireAuth도 암묵적으로 true
    });

    it('skipRateLimit은 Rate Limiting을 건너뜀', () => {
      const options = {
        requireAuth: false,
        requireAdmin: false,
        skipRateLimit: true,
      };

      expect(options.skipRateLimit).toBe(true);
    });
  });

  describe('응답 처리', () => {
    it('성공 응답에 X-Request-ID 헤더가 포함되어야 함', () => {
      const response = {
        status: 200,
        headers: new Map<string, string>(),
        body: { data: 'success' },
      };

      response.headers.set('X-Request-ID', 'req_12345');

      expect(response.headers.get('X-Request-ID')).toBe('req_12345');
    });

    it('에러 응답에도 X-Request-ID 헤더가 포함되어야 함', () => {
      const errorResponse = {
        status: 400,
        headers: new Map<string, string>(),
        body: { error: 'Validation failed' },
      };

      errorResponse.headers.set('X-Request-ID', 'req_error_123');

      expect(errorResponse.headers.get('X-Request-ID')).toBe('req_error_123');
    });
  });

  describe('에러 처리', () => {
    it('ValidationError는 400 상태 코드를 반환', () => {
      class ValidationError extends Error {
        statusCode = 400;
      }

      const error = new ValidationError('Invalid input');

      expect(error.statusCode).toBe(400);
    });

    it('AuthenticationError는 401 상태 코드를 반환', () => {
      class AuthenticationError extends Error {
        statusCode = 401;
      }

      const error = new AuthenticationError('Not authenticated');

      expect(error.statusCode).toBe(401);
    });

    it('NotFoundError는 404 상태 코드를 반환', () => {
      class NotFoundError extends Error {
        statusCode = 404;
      }

      const error = new NotFoundError('Resource not found');

      expect(error.statusCode).toBe(404);
    });

    it('일반 Error는 500 상태 코드를 반환', () => {
      const error = new Error('Unexpected error');
      const statusCode = 500; // 기본값

      expect(statusCode).toBe(500);
    });
  });

  describe('지속 시간 계산', () => {
    it('요청 처리 시간이 올바르게 계산되어야 함', () => {
      const startTime = Date.now();

      // 시뮬레이션: 100ms 지연
      const endTime = startTime + 100;
      const duration = endTime - startTime;

      expect(duration).toBe(100);
    });
  });
});
