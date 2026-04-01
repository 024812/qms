/**
 * Input sanitization and validation utilities
 * Provides protection against XSS, SQL injection, and other security threats
 */

// HTML entities for escaping
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
  '=': '&#x3D;',
};

const IMAGE_DATA_URL_REGEX = /^data:image\/[a-z0-9.+-]+;base64,/i;

function normalizeStringInput(input: unknown): string {
  if (input === null || input === undefined) {
    return '';
  }

  const str = String(input).trim();

  // Remove null bytes
  return str.replace(/\0/g, '');
}

/**
 * Escape HTML entities to prevent XSS attacks
 */
export function escapeHtml(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }

  return input.replace(/[&<>"'`=/]/g, match => HTML_ENTITIES[match] || match);
}

/**
 * Remove potentially dangerous HTML tags and attributes
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }

  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove dangerous HTML tags
  const dangerousTags = [
    'script',
    'iframe',
    'object',
    'embed',
    'form',
    'input',
    'textarea',
    'button',
    'select',
    'option',
    'link',
    'meta',
    'style',
    'base',
  ];

  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });

  // Remove javascript: and data: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:/gi, '');

  // Remove on* event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^>\s]+/gi, '');

  return sanitized.trim();
}

/**
 * Sanitize string input for database operations
 */
export function sanitizeString(input: unknown): string {
  const sanitized = normalizeStringInput(input);

  // Escape HTML entities
  return escapeHtml(sanitized);
}

function sanitizeApiStringValue(input: unknown): string {
  const sanitized = normalizeStringInput(input);

  if (!sanitized) {
    return sanitized;
  }

  // Preserve safe URLs and image data URLs so API payloads are not corrupted
  if (IMAGE_DATA_URL_REGEX.test(sanitized) || sanitizeUrl(sanitized) !== null) {
    return sanitized;
  }

  return escapeHtml(sanitized);
}

/**
 * Sanitize and validate email addresses
 */
export function sanitizeEmail(input: unknown): string | null {
  if (typeof input !== 'string') {
    return null;
  }

  const email = input.trim().toLowerCase();

  // Basic email validation regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(email)) {
    return null;
  }

  // Additional sanitization
  const sanitized = email.replace(/[<>'"]/g, '');

  return sanitized;
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(
  input: unknown,
  options: {
    min?: number;
    max?: number;
    integer?: boolean;
  } = {}
): number | null {
  if (input === null || input === undefined || input === '') {
    return null;
  }

  const num = Number(input);

  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  // Check if integer is required
  if (options.integer && !Number.isInteger(num)) {
    return null;
  }

  // Check bounds
  if (options.min !== undefined && num < options.min) {
    return null;
  }

  if (options.max !== undefined && num > options.max) {
    return null;
  }

  return num;
}

/**
 * Sanitize boolean input
 */
export function sanitizeBoolean(input: unknown): boolean | null {
  if (typeof input === 'boolean') {
    return input;
  }

  if (typeof input === 'string') {
    const lower = input.toLowerCase().trim();
    if (lower === 'true' || lower === '1' || lower === 'yes') {
      return true;
    }
    if (lower === 'false' || lower === '0' || lower === 'no') {
      return false;
    }
  }

  if (typeof input === 'number') {
    return input !== 0;
  }

  return null;
}

/**
 * Sanitize URL input
 */
export function sanitizeUrl(input: unknown): string | null {
  if (typeof input !== 'string') {
    return null;
  }

  const url = input.trim();

  // Check for dangerous protocols
  // eslint-disable-next-line no-script-url
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = url.toLowerCase();

  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return null;
    }
  }

  // Basic URL validation
  try {
    new URL(url);
    return url;
  } catch {
    // If not a valid URL, check if it's a relative path
    if (url.startsWith('/') && !url.startsWith('//')) {
      return url;
    }
    return null;
  }
}

/**
 * Sanitize file name for uploads
 */
export function sanitizeFileName(input: unknown): string | null {
  if (typeof input !== 'string') {
    return null;
  }

  let fileName = input.trim();

  // Remove path traversal attempts
  fileName = fileName.replace(/\.\./g, '');
  fileName = fileName.replace(/[\/\\]/g, '');

  // Remove dangerous characters
  fileName = fileName.replace(/[<>:"|?*\x00-\x1f]/g, '');

  // Limit length
  if (fileName.length > 255) {
    const ext = fileName.substring(fileName.lastIndexOf('.'));
    const name = fileName.substring(0, fileName.lastIndexOf('.'));
    fileName = name.substring(0, 255 - ext.length) + ext;
  }

  // Ensure it's not empty after sanitization
  if (!fileName || fileName === '.') {
    return null;
  }

  return fileName;
}

/**
 * Sanitize search query input
 */
export function sanitizeSearchQuery(input: unknown): string {
  if (typeof input !== 'string') {
    return '';
  }

  let query = input.trim();

  // Remove potentially dangerous characters
  query = query.replace(/[<>'"&]/g, '');

  // Limit length
  if (query.length > 100) {
    query = query.substring(0, 100);
  }

  return query;
}

/**
 * Comprehensive object sanitization
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  schema: Record<keyof T, 'string' | 'number' | 'boolean' | 'email' | 'url' | 'search'>
): Partial<T> {
  const sanitized: Partial<T> = {};

  for (const [key, type] of Object.entries(schema)) {
    const value = obj[key as keyof T];

    switch (type) {
      case 'string':
        const strValue = sanitizeString(value);
        if (strValue) sanitized[key as keyof T] = strValue as T[keyof T];
        break;

      case 'number':
        const numValue = sanitizeNumber(value);
        if (numValue !== null) sanitized[key as keyof T] = numValue as T[keyof T];
        break;

      case 'boolean':
        const boolValue = sanitizeBoolean(value);
        if (boolValue !== null) sanitized[key as keyof T] = boolValue as T[keyof T];
        break;

      case 'email':
        const emailValue = sanitizeEmail(value);
        if (emailValue) sanitized[key as keyof T] = emailValue as T[keyof T];
        break;

      case 'url':
        const urlValue = sanitizeUrl(value);
        if (urlValue) sanitized[key as keyof T] = urlValue as T[keyof T];
        break;

      case 'search':
        const searchValue = sanitizeSearchQuery(value);
        if (searchValue) sanitized[key as keyof T] = searchValue as T[keyof T];
        break;
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize request body for API endpoints
 */
export function sanitizeRequestBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object') {
    return {};
  }

  const sanitized: Record<string, unknown> = {};
  const obj = body as Record<string, unknown>;

  for (const [key, value] of Object.entries(obj)) {
    // Sanitize key name
    const sanitizedKey = sanitizeString(key);
    if (!sanitizedKey) continue;

    // Sanitize value based on type
    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeApiStringValue(value);
    } else if (typeof value === 'number') {
      sanitized[sanitizedKey] = sanitizeNumber(value);
    } else if (typeof value === 'boolean') {
      sanitized[sanitizedKey] = value;
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = value.map(item =>
        typeof item === 'string' ? sanitizeApiStringValue(item) : item
      );
    } else if (value && typeof value === 'object') {
      sanitized[sanitizedKey] = sanitizeRequestBody(value);
    }
  }

  return sanitized;
}

/**
 * Sanitize string fields in an object while preserving other types
 * This is useful for API request bodies where we want to sanitize
 * user-provided strings but keep dates, numbers, etc. intact
 */
export function sanitizeApiInput<T extends Record<string, unknown>>(input: T): T {
  const result = { ...input } as Record<string, unknown>;

  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string') {
      // Preserve safe URLs and image data URLs; escape other strings to prevent XSS
      result[key] = sanitizeApiStringValue(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item =>
        typeof item === 'string' ? sanitizeApiStringValue(item) : item
      );
    } else if (value && typeof value === 'object' && !(value instanceof Date)) {
      // Recursively sanitize nested objects (but not Date objects)
      result[key] = sanitizeApiInput(value as Record<string, unknown>);
    }
  }

  return result as T;
}
