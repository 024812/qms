function decodePath(value: string): string | null {
  let decoded = value;
  try {
    for (let i = 0; i < 3; i++) {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function normalizeInternalRedirect(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || value.length === 0) return fallback;
  const decoded = decodePath(value);
  if (
    !decoded ||
    /[\u0000-\u001f\u007f\\]/.test(value) ||
    /[\u0000-\u001f\u007f\\]/.test(decoded) ||
    !decoded.startsWith('/') ||
    decoded.startsWith('//') ||
    /^[a-z][a-z\d+.-]*:/i.test(decoded)
  ) {
    return fallback;
  }
  return decoded;
}
