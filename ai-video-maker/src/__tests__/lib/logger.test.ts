import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, logEvent, logPayment, logRender, logAnimation, logSecurity } from '@/lib/logger';

describe('Logger', () => {
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logger.debug', () => {
    it('should log debug messages', () => {
      logger.debug('Debug message', { userId: 'test-user' });

      expect(consoleSpy.debug).toHaveBeenCalled();
    });
  });

  describe('logger.info', () => {
    it('should log info messages', () => {
      logger.info('Info message', { action: 'test' });

      expect(consoleSpy.info).toHaveBeenCalled();
    });
  });

  describe('logger.warn', () => {
    it('should log warning messages', () => {
      logger.warn('Warning message');

      expect(consoleSpy.warn).toHaveBeenCalled();
    });
  });

  describe('logger.error', () => {
    it('should log error messages', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', { path: '/api/test' }, error);

      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });
});

describe('logEvent', () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log business events', () => {
    logEvent('project_created', { projectId: 'proj-123' }, 'user-123');

    expect(infoSpy).toHaveBeenCalled();
    const logOutput = infoSpy.mock.calls[0][0] as string;
    expect(logOutput).toContain('Event: project_created');
  });
});

describe('logPayment', () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log payment events', () => {
    logPayment('confirm', {
      paymentId: 'pay-123',
      amount: 10000,
      userId: 'user-123',
      status: 'completed',
    });

    expect(infoSpy).toHaveBeenCalled();
    const logOutput = infoSpy.mock.calls[0][0] as string;
    expect(logOutput).toContain('Payment: confirm');
  });
});

describe('logRender', () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log render start as info', () => {
    logRender('start', { jobId: 'job-123', projectId: 'proj-123' });

    expect(infoSpy).toHaveBeenCalled();
  });

  it('should log render fail as error', () => {
    logRender('fail', { jobId: 'job-123', error: 'Render failed' });

    expect(errorSpy).toHaveBeenCalled();
  });
});

describe('logAnimation', () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log animation complete as info', () => {
    logAnimation('complete', { taskId: 'task-123', duration: 5000 });

    expect(infoSpy).toHaveBeenCalled();
  });

  it('should log animation fail as error', () => {
    logAnimation('fail', { taskId: 'task-123', error: 'Animation failed' });

    expect(errorSpy).toHaveBeenCalled();
  });
});

describe('logSecurity', () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log login as info', () => {
    logSecurity('login', { userId: 'user-123', ip: '127.0.0.1' });

    expect(infoSpy).toHaveBeenCalled();
  });

  it('should log failed login as warning', () => {
    logSecurity('failed_login', { ip: '127.0.0.1', reason: 'Invalid password' });

    expect(warnSpy).toHaveBeenCalled();
  });

  it('should log rate limited as warning', () => {
    logSecurity('rate_limited', { ip: '127.0.0.1', path: '/api/animations' });

    expect(warnSpy).toHaveBeenCalled();
  });
});
