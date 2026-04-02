import { toast } from './toast';

/**
 * Application Error Interface
 *
 * Unified error response format for consistent error handling across the application.
 * Requirements: 10.1 - Specific error messages for database operations
 */
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Error codes for the application
 *
 * Centralized error code definitions for consistent error identification.
 */
export const ErrorCodes = {
  // Database errors
  DB_CONNECTION_FAILED: 'DB_CONNECTION_FAILED',
  DB_QUERY_FAILED: 'DB_QUERY_FAILED',
  DB_TRANSACTION_FAILED: 'DB_TRANSACTION_FAILED',

  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  HTTP_ERROR: 'HTTP_ERROR',
  TIMEOUT: 'TIMEOUT',

  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Error messages in Chinese for user-facing errors
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCodes.DB_CONNECTION_FAILED]: '数据库连接失败，请稍后重试',
  [ErrorCodes.DB_QUERY_FAILED]: '数据库查询失败，请稍后重试',
  [ErrorCodes.DB_TRANSACTION_FAILED]: '数据库事务失败，请稍后重试',
  [ErrorCodes.VALIDATION_FAILED]: '数据验证失败，请检查输入',
  [ErrorCodes.INVALID_INPUT]: '输入数据无效，请检查后重试',
  [ErrorCodes.NOT_FOUND]: '请求的资源不存在',
  [ErrorCodes.ALREADY_EXISTS]: '资源已存在',
  [ErrorCodes.UNAUTHORIZED]: '未授权访问，请先登录',
  [ErrorCodes.FORBIDDEN]: '没有权限执行此操作',
  [ErrorCodes.NETWORK_ERROR]: '网络连接失败，请检查网络',
  [ErrorCodes.HTTP_ERROR]: '服务器请求失败',
  [ErrorCodes.TIMEOUT]: '请求超时，请稍后重试',
  [ErrorCodes.UNKNOWN_ERROR]: '发生未知错误',
  [ErrorCodes.INTERNAL_ERROR]: '内部错误，请稍后重试',
};

/**
 * Create a standardized application error
 *
 * @param code - Error code from ErrorCodes (or any string for flexibility)
 * @param message - Optional custom message (defaults to Chinese message for the code)
 * @param details - Optional additional error details
 * @returns AppError object
 *
 * Requirements: 10.1 - Specific error messages for database operations
 */
export function createError(
  code: ErrorCode | string,
  message?: string,
  details?: Record<string, unknown>
): AppError {
  const defaultMessage =
    ErrorMessages[code as ErrorCode] || ErrorMessages[ErrorCodes.UNKNOWN_ERROR];
  return {
    code,
    message: message || defaultMessage,
    details,
  };
}

/**
 * Check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as AppError).code === 'string' &&
    typeof (error as AppError).message === 'string'
  );
}

/**
 * Get user-friendly error message from any error
 */
export function getErrorMessage(error: unknown, lang: 'zh' | 'en' = 'zh'): string {
  if (isAppError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    // For known error types, return appropriate message
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return lang === 'zh' ? ErrorMessages[ErrorCodes.NETWORK_ERROR] : 'Network connection failed';
    }
    return lang === 'zh' ? ErrorMessages[ErrorCodes.UNKNOWN_ERROR] : error.message;
  }

  return lang === 'zh' ? ErrorMessages[ErrorCodes.UNKNOWN_ERROR] : 'An unknown error occurred';
}

// Legacy interface for backward compatibility
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

/**
 * Parse error from various sources
 */
export function parseError(error: unknown): ApiError {
  // Network error
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      message: 'Network error. Please check your connection.',
      code: 'NETWORK_ERROR',
      status: 0,
    };
  }

  // HTTP error
  if (error instanceof Response) {
    return {
      message: `HTTP ${error.status}: ${error.statusText}`,
      code: 'HTTP_ERROR',
      status: error.status,
    };
  }

  // Standard Error
  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'ERROR',
    };
  }

  // Unknown error
  return {
    message: 'An unknown error occurred',
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Handle API errors with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 2, retryDelay = 1000, onRetry } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx)
      const parsedError = parseError(error);
      if (parsedError.status && parsedError.status >= 400 && parsedError.status < 500) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Notify about retry
      if (onRetry) {
        onRetry(attempt + 1);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }

  throw lastError;
}

/**
 * Fetch with error handling and retry
 */
export async function fetchWithErrorHandling<T = unknown>(
  url: string,
  options?: RequestInit,
  lang: 'zh' | 'en' = 'zh'
): Promise<T> {
  try {
    const response = await withRetry(
      async () => {
        const res = await fetch(url, options);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res;
      },
      {
        maxRetries: 1,
        retryDelay: 1000,
      }
    );

    return await response.json();
  } catch (error) {
    const parsedError = parseError(error);

    // Show user-friendly error message
    const errorMessage =
      lang === 'zh'
        ? parsedError.code === 'NETWORK_ERROR'
          ? '网络连接失败，请检查网络'
          : '操作失败，请重试'
        : parsedError.code === 'NETWORK_ERROR'
          ? 'Network connection failed'
          : 'Operation failed, please try again';

    toast.error(errorMessage, parsedError.message);
    throw error;
  }
}

/**
 * Global error handler for unhandled errors
 */
export function setupGlobalErrorHandler() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', event => {
    const error = parseError(event.reason);
    toast.error('Unexpected error occurred', error.message);
  });

  // Handle global errors
  window.addEventListener('error', event => {
    const error = parseError(event.error);
    toast.error('Unexpected error occurred', error.message);
  });
}

/**
 * Error logging utility (can be extended to send to error tracking service)
 */
export function logError(error: unknown, _context?: Record<string, unknown>) {
  const _parsedError = parseError(error);

  // Future enhancement: Integrate with error tracking service (e.g., Sentry)
  // Example: Sentry.captureException(error, { extra: _context });
}
