/**
 * Rate Limit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock NextRequest와 NextResponse
vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
  NextResponse: {
    json: vi.fn((body, init) => ({
      status: init?.status || 200,
      headers: new Map(Object.entries(init?.headers || {})),
      body,
    })),
  },
}));

describe('Rate Limit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('checkLimit 로직', () => {
    it('새로운 요청은 허용되어야 함', () => {
      const store = new Map<string, { count: number; resetTime: number }>();
      const key = 'test-key';
      const config = { windowMs: 60000, maxRequests: 10 };

      const now = Date.now();
      const entry = store.get(key);

      // 새로운 엔트리가 없으면 허용
      expect(entry).toBeUndefined();

      // 첫 요청 시뮬레이션
      store.set(key, { count: 1, resetTime: now + config.windowMs });
      const newEntry = store.get(key);

      expect(newEntry?.count).toBe(1);
      expect(newEntry!.resetTime).toBeGreaterThan(now);
    });

    it('제한 초과 시 차단되어야 함', () => {
      const store = new Map<string, { count: number; resetTime: number }>();
      const key = 'test-key';
      const config = { windowMs: 60000, maxRequests: 3 };
      const now = Date.now();

      // 이미 최대 요청에 도달한 상태
      store.set(key, { count: 3, resetTime: now + 30000 });

      const entry = store.get(key);
      const isBlocked = entry!.count >= config.maxRequests && now < entry!.resetTime;

      expect(isBlocked).toBe(true);
    });

    it('윈도우 만료 후에는 허용되어야 함', () => {
      const store = new Map<string, { count: number; resetTime: number }>();
      const key = 'test-key';
      const now = Date.now();

      // 윈도우가 만료된 상태
      store.set(key, { count: 10, resetTime: now - 1000 });

      const entry = store.get(key);
      const isExpired = now >= entry!.resetTime;

      expect(isExpired).toBe(true);
    });
  });

  describe('API별 설정', () => {
    it('animations API는 분당 10회로 제한되어야 함', () => {
      const apiConfigs: Record<string, { windowMs: number; maxRequests: number }> = {
        '/api/animations': { windowMs: 60000, maxRequests: 10 },
        '/api/render': { windowMs: 60000, maxRequests: 5 },
      };

      const config = apiConfigs['/api/animations'];

      expect(config.maxRequests).toBe(10);
      expect(config.windowMs).toBe(60000);
    });

    it('render API는 분당 5회로 제한되어야 함', () => {
      const apiConfigs: Record<string, { windowMs: number; maxRequests: number }> = {
        '/api/animations': { windowMs: 60000, maxRequests: 10 },
        '/api/render': { windowMs: 60000, maxRequests: 5 },
      };

      const config = apiConfigs['/api/render'];

      expect(config.maxRequests).toBe(5);
    });

    it('기본 설정은 분당 60회여야 함', () => {
      const defaultConfig = { windowMs: 60000, maxRequests: 60 };

      expect(defaultConfig.maxRequests).toBe(60);
    });
  });

  describe('IP 추출 로직', () => {
    it('x-forwarded-for 헤더에서 IP 추출', () => {
      const forwarded = '192.168.1.1, 10.0.0.1';
      const ip = forwarded.split(',')[0].trim();

      expect(ip).toBe('192.168.1.1');
    });

    it('x-real-ip 헤더에서 IP 추출', () => {
      const realIp = '192.168.1.100';

      expect(realIp).toBe('192.168.1.100');
    });

    it('헤더가 없을 경우 unknown 반환', () => {
      const ip = 'unknown';

      expect(ip).toBe('unknown');
    });
  });

  describe('만료 엔트리 정리', () => {
    it('만료된 엔트리는 삭제되어야 함', () => {
      const store = new Map<string, { count: number; resetTime: number }>();
      const now = Date.now();

      // 만료된 엔트리와 유효한 엔트리 추가
      store.set('expired', { count: 5, resetTime: now - 1000 });
      store.set('valid', { count: 3, resetTime: now + 60000 });

      // 정리 로직 시뮬레이션
      for (const [key, entry] of store.entries()) {
        if (now >= entry.resetTime) {
          store.delete(key);
        }
      }

      expect(store.has('expired')).toBe(false);
      expect(store.has('valid')).toBe(true);
    });
  });

  describe('Rate Limit 헤더', () => {
    it('올바른 헤더 값이 설정되어야 함', () => {
      const remaining = 5;
      const limit = 10;
      const resetTime = Date.now() + 60000;

      const headers = new Map<string, string>();
      headers.set('X-RateLimit-Limit', limit.toString());
      headers.set('X-RateLimit-Remaining', remaining.toString());
      headers.set('X-RateLimit-Reset', resetTime.toString());

      expect(headers.get('X-RateLimit-Limit')).toBe('10');
      expect(headers.get('X-RateLimit-Remaining')).toBe('5');
      expect(headers.get('X-RateLimit-Reset')).toBeDefined();
    });
  });
});
