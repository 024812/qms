/**
 * Input normalisation utilities.
 *
 * Design rule: **escaping is a rendering concern, not a storage concern.**
 *
 * These helpers used to HTML-escape every string before it reached the
 * database. That double-encodes business data — `A & B` was persisted as
 * `A &amp; B`, and rendering it (React escapes text nodes automatically)
 * produced `A &amp;amp; B` on screen — and it silently mangled search terms.
 *
 * So: normalise on the way in (trim, drop control characters), store the raw
 * text, and let the renderer escape. {@link escapeHtml} is exported for the rare
 * case where you must build an HTML *string*; never persist its output.
 */

// HTML entities for escaping — render-time only, see the module doc above.
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

/**
 * Normalise any value into a trimmed string, dropping characters that are never
 * legitimate in persisted business data.
 *
 * Keeps `\t` and `\n` because multi-line notes genuinely contain them. Does not
 * escape HTML — see the module doc.
 */
function normalizeStringInput(input: unknown): string {
  if (input === null || input === undefined) {
    return '';
  }

  return (
    String(input)
      // Null bytes, C0 controls (except \t \n \r), DEL and C1 controls.
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g, '')
      .trim()
  );
}

/**
 * Escape HTML entities so a string can be embedded in an HTML document.
 *
 * Render-time helper only. Do NOT persist the result — see the module doc.
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
 * Sanitize string input for database operations.
 *
 * Normalises only — no HTML escaping. Prefer {@link sanitizeApiInput} for
 * request payloads; this remains for direct field-level normalisation.
 */
export function sanitizeString(input: unknown): string {
  return normalizeStringInput(input);
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
 *
 * Protocol checks rely on the parsed `URL.protocol` rather than string prefix
 * matching, so leading/embedded whitespace or control characters (e.g.
 * "\tjavascript:alert(1)") cannot bypass the dangerous-protocol filter.
 */
const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

export function sanitizeUrl(input: unknown): string | null {
  if (typeof input !== 'string') {
    return null;
  }

  // Strip whitespace and control characters that browsers tolerate but which
  // can be used to smuggle dangerous protocols past naive prefix checks.
  const url = input.replace(/[\u0000-\u001f\u007f-\u009f\s]/g, '');

  if (!url) {
    return null;
  }

  // Basic URL validation
  try {
    const parsed = new URL(url);
    return SAFE_URL_PROTOCOLS.has(parsed.protocol.toLowerCase()) ? url : null;
  } catch {
    // If not a valid absolute URL, check if it's a safe relative path
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
 * Sanitize search query input.
 *
 * A search term is business data: `AT&T` has to stay `AT&T`. The previous
 * implementation deleted `& < > ' "` outright, so those queries silently
 * matched the wrong rows. Only normalisation and a length cap happen here — the
 * defence against `LIKE` wildcards lives in `src/lib/data/search.ts`, which
 * escapes `%`, `_` and `\` before the term reaches SQL.
 */
export function sanitizeSearchQuery(input: unknown): string {
  if (typeof input !== 'string') {
    return '';
  }

  const query = normalizeStringInput(input);

  return query.length > 100 ? query.substring(0, 100) : query;
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
      sanitized[sanitizedKey] = normalizeStringInput(value);
    } else if (typeof value === 'number') {
      sanitized[sanitizedKey] = sanitizeNumber(value);
    } else if (typeof value === 'boolean') {
      sanitized[sanitizedKey] = value;
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = value.map(item =>
        typeof item === 'string' ? normalizeStringInput(item) : item
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
      // Normalise only — escaping happens at render time (see module doc).
      result[key] = normalizeStringInput(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => (typeof item === 'string' ? normalizeStringInput(item) : item));
    } else if (value && typeof value === 'object' && !(value instanceof Date)) {
      // Recursively sanitize nested objects (but not Date objects)
      result[key] = sanitizeApiInput(value as Record<string, unknown>);
    }
  }

  return result as T;
}
