# Proxy Matcher Patterns Documentation

## Overview

This document explains the matcher patterns used in `src/proxy.ts` to control when the Next.js 16 Proxy API runs.

## Matcher Pattern

```typescript
export const config = {
  matcher: [
    '/((?!api/|_next/static|_next/image|_next/data|favicon\\.ico|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|html)$).*)',
  ],
};
```

## Pattern Explanation

The matcher uses a **negative lookahead** regex pattern to exclude specific paths. The proxy will run for all paths **except** those matching the excluded patterns.

### Excluded Paths

#### 1. API Routes (`api/`)

- **Pattern**: `api/`
- **Examples**:
  - `/api/auth/login`
  - `/api/quilts`
  - `/api/usage/123`
- **Reason**: API routes handle their own authentication and don't need proxy intervention

#### 2. Next.js Static Files (`_next/static`)

- **Pattern**: `_next/static`
- **Examples**:
  - `/_next/static/chunks/main.js`
  - `/_next/static/css/app.css`
- **Reason**: Static files are served directly by Next.js and don't require authentication

#### 3. Next.js Image Optimization (`_next/image`)

- **Pattern**: `_next/image`
- **Examples**:
  - `/_next/image?url=/test.png&w=640&q=75`
- **Reason**: Image optimization is handled by Next.js internally

#### 4. Next.js Data Routes (`_next/data`)

- **Pattern**: `_next/data`
- **Examples**:
  - `/_next/data/build-id/quilts.json`
- **Reason**: Data fetching routes are internal to Next.js

#### 5. Favicon (`favicon\.ico`)

- **Pattern**: `favicon\.ico`
- **Examples**:
  - `/favicon.ico`
- **Reason**: Browser requests for favicon should not trigger authentication

#### 6. PWA Manifest (`manifest\.json`)

- **Pattern**: `manifest\.json`
- **Examples**:
  - `/manifest.json`
- **Reason**: PWA manifest is a public file

#### 7. Static Asset Files

- **Pattern**: `.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|html)$`
- **Extensions**: `.svg`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.ico`, `.json`, `.html`
- **Examples**:
  - `/icons/icon-192x192.svg`
  - `/images/logo.png`
  - `/clear-cache.html`
- **Reason**: Static assets in the public directory should be served without authentication

### Included Paths (Proxy Runs)

The proxy **will run** for all application routes:

- `/` - Root/home page
- `/login` - Login page
- `/register` - Registration page
- `/quilts` - Quilts module
- `/quilts/123` - Quilt detail pages
- `/usage` - Usage tracking module
- `/settings` - Settings page
- `/analytics` - Analytics page
- `/dashboard` - Dashboard page
- Any other application routes

## Best Practices

### ✅ Do's

1. **Use negative lookahead** for cleaner exclusion patterns
2. **Exclude all API routes** - they handle their own auth
3. **Exclude Next.js internals** - `_next/*` paths
4. **Exclude static assets** - images, icons, manifests
5. **Test matcher patterns** - use the verification script

### ❌ Don'ts

1. **Don't include API routes** in proxy - causes double authentication
2. **Don't include static assets** - unnecessary overhead
3. **Don't include Next.js internals** - breaks optimization
4. **Don't use overly complex patterns** - keep it maintainable

## Verification

Run the verification script to test matcher patterns:

```bash
npx tsx scripts/verify-proxy-matcher.ts
```

This script tests:

- ✅ Application routes (should run proxy)
- ✅ API routes (should skip proxy)
- ✅ Next.js internals (should skip proxy)
- ✅ Static assets (should skip proxy)
- ✅ Edge cases (query params, hash fragments, etc.)

## Migration from Middleware

### Before (middleware.ts)

```typescript
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### After (proxy.ts) - Next.js 16

```typescript
export const config = {
  matcher: [
    '/((?!api/|_next/static|_next/image|_next/data|favicon\\.ico|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|html)$).*)',
  ],
};
```

### Changes Made

1. **Added trailing slash to `api/`** - More explicit API route exclusion
2. **Added `_next/data`** - Exclude Next.js data fetching routes
3. **Added `manifest\.json`** - Exclude PWA manifest
4. **Added more file extensions** - `.ico`, `.json`, `.html`
5. **Escaped dots properly** - `\.` instead of `.` for literal dots

## Performance Impact

### Before Optimization

- Proxy ran on some static assets
- Unnecessary authentication checks
- Slower response times for static files

### After Optimization

- Proxy only runs on application routes
- Static assets served directly
- Faster response times
- Reduced server load

## References

- [Next.js 16 Proxy Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Next.js Matcher Configuration](https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher)
- [path-to-regexp Documentation](https://github.com/pillarjs/path-to-regexp)

## Related Files

- `src/proxy.ts` - Proxy implementation
- `scripts/verify-proxy-matcher.ts` - Verification script
- `src/__tests__/proxy.matcher.test.ts` - Unit tests
- `.kiro/specs/nextjs-16-best-practices-migration/` - Migration spec

## Troubleshooting

### Issue: Proxy not running on application routes

**Solution**: Check if the route matches the excluded patterns. Use the verification script to test.

### Issue: Proxy running on API routes

**Solution**: Ensure `api/` has a trailing slash in the matcher pattern.

### Issue: Static assets triggering authentication

**Solution**: Add the file extension to the excluded patterns.

### Issue: Next.js internals not working

**Solution**: Ensure `_next/static`, `_next/image`, and `_next/data` are excluded.

## Maintenance

When adding new routes or static assets:

1. **Application routes** - No changes needed (proxy will run automatically)
2. **API routes** - No changes needed (already excluded with `api/`)
3. **Static assets** - Add extension to the pattern if not already included
4. **Next.js internals** - No changes needed (already excluded)

Always run the verification script after making changes:

```bash
npx tsx scripts/verify-proxy-matcher.ts
```
