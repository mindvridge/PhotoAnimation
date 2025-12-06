/**
 * Logging System
 * 로깅 시스템
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  requestId?: string;
  path?: string;
  method?: string;
  duration?: number;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// 로그 레벨 우선순위
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// 현재 로그 레벨 (환경변수에서 가져옴)
const currentLogLevel: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

/**
 * 로그 엔트리 포맷팅
 */
function formatLogEntry(entry: LogEntry): string {
  if (process.env.NODE_ENV === 'production') {
    // 프로덕션에서는 JSON 형식
    return JSON.stringify(entry);
  }

  // 개발 환경에서는 읽기 쉬운 형식
  const { timestamp, level, message, context, error } = entry;
  let output = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

  if (context && Object.keys(context).length > 0) {
    output += ` | ${JSON.stringify(context)}`;
  }

  if (error) {
    output += `\n  Error: ${error.name}: ${error.message}`;
    if (error.stack) {
      output += `\n  Stack: ${error.stack}`;
    }
  }

  return output;
}

/**
 * 로그 출력
 */
function log(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): void {
  // 로그 레벨 체크
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLogLevel]) {
    return;
  }

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    ...(error && {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    }),
  };

  const formattedLog = formatLogEntry(entry);

  switch (level) {
    case 'debug':
      console.debug(formattedLog);
      break;
    case 'info':
      console.info(formattedLog);
      break;
    case 'warn':
      console.warn(formattedLog);
      break;
    case 'error':
      console.error(formattedLog);
      break;
  }

  // Sentry 또는 다른 에러 트래킹 서비스 연동 (선택)
  if (level === 'error' && error) {
    // TODO: Sentry 연동
    // Sentry.captureException(error, { extra: context });
  }
}

/**
 * Logger 객체
 */
export const logger = {
  debug: (message: string, context?: LogContext) => log('debug', message, context),
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext) => log('warn', message, context),
  error: (message: string, context?: LogContext, error?: Error) =>
    log('error', message, context, error),
};

/**
 * API 요청 로깅
 */
export function logApiRequest(
  method: string,
  path: string,
  userId?: string,
  duration?: number,
  statusCode?: number
): void {
  logger.info('API Request', {
    method,
    path,
    userId,
    duration,
    statusCode,
  } as LogContext);
}

/**
 * 비즈니스 이벤트 로깅
 */
export function logEvent(
  eventName: string,
  eventData: Record<string, unknown>,
  userId?: string
): void {
  logger.info(`Event: ${eventName}`, {
    userId,
    ...eventData,
  } as LogContext);
}

/**
 * 결제 관련 로깅
 */
export function logPayment(
  action: 'request' | 'confirm' | 'webhook' | 'refund',
  paymentData: {
    paymentId?: string;
    orderId?: string;
    amount?: number;
    userId?: string;
    status?: string;
    error?: string;
  }
): void {
  logger.info(`Payment: ${action}`, paymentData as LogContext);
}

/**
 * 렌더링 관련 로깅
 */
export function logRender(
  action: 'start' | 'progress' | 'complete' | 'fail',
  renderData: {
    jobId?: string;
    projectId?: string;
    userId?: string;
    progress?: number;
    duration?: number;
    error?: string;
  }
): void {
  const level = action === 'fail' ? 'error' : 'info';
  log(level, `Render: ${action}`, renderData as LogContext);
}

/**
 * AI 생성 관련 로깅
 */
export function logAnimation(
  action: 'request' | 'processing' | 'complete' | 'fail',
  animationData: {
    taskId?: string;
    photoId?: string;
    userId?: string;
    duration?: number;
    error?: string;
  }
): void {
  const level = action === 'fail' ? 'error' : 'info';
  log(level, `Animation: ${action}`, animationData as LogContext);
}

/**
 * 보안 관련 로깅
 */
export function logSecurity(
  action: 'login' | 'logout' | 'failed_login' | 'rate_limited' | 'unauthorized',
  securityData: {
    userId?: string;
    ip?: string;
    userAgent?: string;
    path?: string;
    reason?: string;
  }
): void {
  const level = ['failed_login', 'rate_limited', 'unauthorized'].includes(action)
    ? 'warn'
    : 'info';
  log(level, `Security: ${action}`, securityData as LogContext);
}

export default logger;
