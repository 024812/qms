/**
 * Formatting Utilities
 * Provides locale-aware formatting for dates, numbers, and currency
 */

import { format as dateFnsFormat, formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
// Basic language type compatible with next-intl locale strings
export type Language = string;

/**
 * Get the date-fns locale object for the given language
 */
function getDateLocale(language: Language) {
  return language === 'zh' ? zhCN : enUS;
}

/**
 * Format a date according to the specified language
 * @param date - The date to format (Date object, timestamp, or date string)
 * @param language - The language to use for formatting
 * @param formatString - Optional custom format string (defaults to locale-specific format)
 */
export function formatDate(
  date: Date | number | string,
  language: Language,
  formatString?: string
): string {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return '';
    }

    const locale = getDateLocale(language);

    // Default format strings based on language
    const defaultFormat = language === 'zh' ? 'yyyy年MM月dd日' : 'MMM dd, yyyy';

    return dateFnsFormat(dateObj, formatString || defaultFormat, { locale });
  } catch {
    return '';
  }
}

/**
 * Format a date with time according to the specified language
 */
export function formatDateTime(
  date: Date | number | string,
  language: Language,
  formatString?: string
): string {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return '';
    }

    const locale = getDateLocale(language);

    // Default format strings based on language
    const defaultFormat = language === 'zh' ? 'yyyy年MM月dd日 HH:mm' : 'MMM dd, yyyy HH:mm';

    return dateFnsFormat(dateObj, formatString || defaultFormat, { locale });
  } catch {
    return '';
  }
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | number | string, language: Language): string {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return '';
    }

    const locale = getDateLocale(language);

    return formatDistanceToNow(dateObj, {
      addSuffix: true,
      locale,
    });
  } catch {
    return '';
  }
}

/**
 * Format a number according to the specified language
 * @param value - The number to format
 * @param language - The language to use for formatting
 * @param options - Optional Intl.NumberFormat options
 */
export function formatNumber(
  value: number,
  language: Language,
  options?: Intl.NumberFormatOptions
): string {
  try {
    const locale = language === 'zh' ? 'zh-CN' : 'en-US';
    return new Intl.NumberFormat(locale, options).format(value);
  } catch {
    return value.toString();
  }
}

/**
 * Format a number as currency
 * @param value - The amount to format
 * @param language - The language to use for formatting
 * @param currency - The currency code (default: CNY for Chinese, USD for English)
 */
export function formatCurrency(value: number, language: Language, currency?: string): string {
  try {
    const locale = language === 'zh' ? 'zh-CN' : 'en-US';
    const currencyCode = currency || (language === 'zh' ? 'CNY' : 'USD');

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).format(value);
  } catch {
    return value.toString();
  }
}

/**
 * Format a number as a percentage
 */
export function formatPercentage(value: number, language: Language, decimals: number = 0): string {
  try {
    const locale = language === 'zh' ? 'zh-CN' : 'en-US';

    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch {
    return `${(value * 100).toFixed(decimals)}%`;
  }
}

/**
 * Format a file size in bytes to human-readable format
 */
export function formatFileSize(bytes: number, language: Language): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes =
    language === 'zh' ? ['字节', 'KB', 'MB', 'GB', 'TB'] : ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  return `${formatNumber(value, language, { maximumFractionDigits: 2 })} ${sizes[i]}`;
}

/**
 * Format a duration in milliseconds to human-readable format
 */
export function formatDuration(ms: number, language: Language): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (language === 'zh') {
    if (days > 0) return `${days}天`;
    if (hours > 0) return `${hours}小时`;
    if (minutes > 0) return `${minutes}分钟`;
    return `${seconds}秒`;
  } else {
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
}

/**
 * Format a weight in grams to a more readable format
 */
export function formatWeight(grams: number, language: Language): string {
  if (grams >= 1000) {
    const kg = grams / 1000;
    return language === 'zh'
      ? `${formatNumber(kg, language, { maximumFractionDigits: 2 })}千克`
      : `${formatNumber(kg, language, { maximumFractionDigits: 2 })} kg`;
  }

  return language === 'zh'
    ? `${formatNumber(grams, language)}克`
    : `${formatNumber(grams, language)} g`;
}

/**
 * Format dimensions (length x width) in centimeters
 */
export function formatDimensions(length: number, width: number, language: Language): string {
  const unit = language === 'zh' ? '厘米' : 'cm';
  return `${formatNumber(length, language)} × ${formatNumber(width, language)} ${unit}`;
}

/**
 * Format a date range
 */
export function formatDateRange(
  startDate: Date | number | string,
  endDate: Date | number | string | null,
  language: Language
): string {
  const start = formatDate(startDate, language);

  if (!endDate) {
    return language === 'zh' ? `${start} 至今` : `${start} - Present`;
  }

  const end = formatDate(endDate, language);
  return language === 'zh' ? `${start} 至 ${end}` : `${start} - ${end}`;
}
