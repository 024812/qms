// Production logging configuration for QMS

interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
}

const LOG_LEVELS: LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

type LogMeta = Record<string, unknown>;

interface RequestLike {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  connection?: {
    remoteAddress?: string;
  };
}

interface ResponseLike {
  statusCode: number;
  on: (event: 'finish', callback: () => void) => void;
}

interface ErrorInfoLike {
  componentStack?: string;
}

class Logger {
  private level: number;
  private context: string;
  private timers = new Map<string, number>();

  constructor(context: string = 'QMS') {
    this.context = context;
    this.level = this.getLogLevel();
  }

  private getLogLevel(): number {
    // Safe access to process.env for Edge Runtime
    const envLevel =
      (typeof process !== 'undefined' && process.env?.LOG_LEVEL?.toUpperCase()) || 'INFO';
    return LOG_LEVELS[envLevel as keyof LogLevel] ?? LOG_LEVELS.INFO;
  }

  private shouldLog(level: number): boolean {
    return level <= this.level;
  }

  private formatMessage(level: string, message: string, meta?: LogMeta): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      context: this.context,
      message,
      ...(meta && { meta }),
      // Only include pid in Node.js environment (not Edge Runtime)
      ...(typeof process !== 'undefined' && typeof process.pid === 'number'
        ? { pid: process.pid }
        : {}),
      environment: (typeof process !== 'undefined' && process.env?.NODE_ENV) || 'development',
    };

    return JSON.stringify(logEntry);
  }

  private writeLog(level: keyof LogLevel, payload: string): void {
    if (level === 'ERROR') {
      console.error(payload);
      return;
    }

    if (level === 'WARN') {
      console.warn(payload);
      return;
    }

    if (typeof process !== 'undefined' && process.stdout?.write) {
      process.stdout.write(`${payload}\n`);
    }
  }

  error(message: string, error?: unknown, meta?: LogMeta): void {
    if (!this.shouldLog(LOG_LEVELS.ERROR)) return;

    const normalizedError =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
            ...(error.cause !== undefined ? { cause: error.cause } : {}),
          }
        : error;

    const errorMeta = {
      ...(meta ?? {}),
      ...(error !== undefined ? { error: normalizedError } : {}),
    };

    this.writeLog('ERROR', this.formatMessage('ERROR', message, errorMeta));

    // Send to external error tracking service in production (only in Node.js runtime)
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
      this.sendToErrorTracking(message, error, errorMeta);
    }
  }

  warn(message: string, meta?: LogMeta): void {
    if (!this.shouldLog(LOG_LEVELS.WARN)) return;
    this.writeLog('WARN', this.formatMessage('WARN', message, meta));
  }

  info(message: string, meta?: LogMeta): void {
    if (!this.shouldLog(LOG_LEVELS.INFO)) return;
    this.writeLog('INFO', this.formatMessage('INFO', message, meta));
  }

  debug(message: string, meta?: LogMeta): void {
    if (!this.shouldLog(LOG_LEVELS.DEBUG)) return;
    this.writeLog('DEBUG', this.formatMessage('DEBUG', message, meta));
  }

  // Performance logging
  time(label: string): void {
    this.timers.set(label, Date.now());
  }

  timeEnd(label: string): void {
    const startTime = this.timers.get(label);
    if (startTime === undefined) {
      return;
    }

    this.timers.delete(label);
    this.debug(`Timer: ${label}`, { duration: `${Date.now() - startTime}ms` });
  }

  // Request logging middleware
  logRequest(req: RequestLike, res: ResponseLike, duration: number): void {
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
      referer: req.headers.referer,
    };

    if (res.statusCode >= 400) {
      this.warn('HTTP Request Error', logData);
    } else {
      this.info('HTTP Request', logData);
    }
  }

  // Database operation logging
  logDatabaseOperation(operation: string, table: string, duration: number, error?: Error): void {
    const logData = {
      operation,
      table,
      duration: `${duration}ms`,
    };

    if (error) {
      this.error(`Database operation failed: ${operation} on ${table}`, error, logData);
    } else {
      this.debug(`Database operation: ${operation} on ${table}`, logData);
    }
  }

  // Business logic logging
  logBusinessEvent(event: string, userId?: string, meta?: LogMeta): void {
    const logData = {
      event,
      ...(userId && { userId }),
      ...(meta ?? {}),
    };

    this.info(`Business Event: ${event}`, logData);
  }

  // Security event logging
  logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    meta?: LogMeta
  ): void {
    const logData = {
      event,
      severity,
      ...(meta ?? {}),
    };

    if (severity === 'critical' || severity === 'high') {
      this.error(`Security Event: ${event}`, undefined, logData);
    } else {
      this.warn(`Security Event: ${event}`, logData);
    }
  }

  private async sendToErrorTracking(
    message: string,
    error?: unknown,
    meta?: LogMeta
  ): Promise<void> {
    try {
      // Integration with error tracking services like Sentry, Bugsnag, etc.
      // This is a placeholder for actual implementation
      if (typeof process === 'undefined') return;

      if (process.env?.SENTRY_DSN) {
        // Sentry integration would go here
        // Sentry.captureException(error, { extra: meta });
      }

      const normalizedError = error instanceof Error ? error : undefined;

      if (process.env?.WEBHOOK_ERROR_URL) {
        // Send to webhook for custom error handling
        await fetch(process.env.WEBHOOK_ERROR_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            error: normalizedError?.message,
            stack: normalizedError?.stack,
            meta,
            timestamp: new Date().toISOString(),
            environment: process.env?.NODE_ENV,
          }),
        });
      }
    } catch (trackingError) {
      // Don't let error tracking failures break the application
      console.error('Failed to send error to tracking service:', trackingError);
    }
  }
}

// Create logger instances for different parts of the application
export const logger = new Logger('QMS');
export const dbLogger = new Logger('QMS:Database');
export const apiLogger = new Logger('QMS:API');
export const authLogger = new Logger('QMS:Auth');

// Request logging middleware for Next.js
export function createRequestLogger() {
  return (req: RequestLike, res: ResponseLike, next?: () => void) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      apiLogger.logRequest(req, res, duration);
    });

    if (next) next();
  };
}

// Error boundary logging
export function logErrorBoundary(error: Error, errorInfo: ErrorInfoLike): void {
  logger.error('React Error Boundary caught an error', error, {
    componentStack: errorInfo.componentStack,
    errorBoundary: true,
  });
}

// Unhandled error logging (only in Node.js runtime, not Edge Runtime)
// This code will only run in Node.js environment, not in Edge Runtime or browser
if (
  typeof window === 'undefined' &&
  typeof process !== 'undefined' &&
  typeof process.on === 'function'
) {
  try {
    // Server-side error handling (Node.js only)
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception', error, { fatal: true });
      // Only exit in Node.js environment
      if (typeof process.exit === 'function') {
        process.exit(1);
      }
    });

    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
      logger.error('Unhandled Rejection', reason as Error, {
        promise: String(promise),
        fatal: false,
      });
    });
  } catch {
    // Silently fail in Edge Runtime where process.on is not available
  }
}

export default logger;
