# Next.js 16 Best Practices Migration - Requirements

## Overview

Migrate the codebase to follow Next.js 16 best practices, replacing outdated patterns with modern approaches recommended by Vercel.

## User Stories

### 1. As a developer, I want to use the modern Proxy API instead of deprecated Middleware

**Acceptance Criteria:**

- 1.1 Replace `src/middleware.ts` with `src/proxy.ts`
- 1.2 Use `proxy()` function instead of `middleware()` function
- 1.3 Maintain all existing authentication and routing logic
- 1.4 Update configuration to use proxy matcher patterns
- 1.5 Remove deprecation warnings from build output

### 2. As a developer, I want to use functional Data Access Layer instead of class-based repositories

**Acceptance Criteria:**

- 2.1 Convert `QuiltRepository` class to functional exports
- 2.2 Use standalone async functions for all database operations
- 2.3 Apply React `cache()` for request deduplication
- 2.4 Apply `'use cache'` directive for persistent caching
- 2.5 Remove all class instances from data access layer
- 2.6 Maintain type safety with TypeScript

### 3. As a developer, I want to properly implement caching with Next.js 16 APIs

**Acceptance Criteria:**

- 3.1 Use `'use cache'` directive in standalone functions only
- 3.2 Use `cacheLife()` and `cacheTag()` for cache configuration
- 3.3 Use `updateTag()` for cache invalidation in mutations
- 3.4 Remove incompatible route segment configs (dynamic, revalidate)
- 3.5 Enable `cacheComponents` in next.config.js (top-level, not experimental)
- 3.6 Ensure all cached functions return serializable data

### 4. As a developer, I want to follow Server Actions best practices

**Acceptance Criteria:**

- 4.1 Use `'use server'` directive at file or function level
- 4.2 Validate input with Zod schemas before database operations
- 4.3 Return serializable data from Server Actions
- 4.4 Use proper error handling and return error states
- 4.5 Implement Data Access Layer pattern for security

### 5. As a developer, I want to remove all deprecated patterns

**Acceptance Criteria:**

- 5.1 Remove all class-based repository patterns
- 5.2 Remove incompatible route segment configurations
- 5.3 Update all imports to use new functional APIs
- 5.4 Ensure build completes without deprecation warnings
- 5.5 Update documentation to reflect new patterns

## Technical Requirements

### Architecture

- Use functional programming patterns over OOP
- Implement Data Access Layer with standalone functions
- Use React `cache()` for request-level deduplication
- Use `'use cache'` for persistent caching across requests

### Caching Strategy

- **Read operations**: Use `'use cache'` with `cacheLife()` and `cacheTag()`
- **Write operations**: Use `updateTag()` for fine-grained invalidation
- **Request deduplication**: Wrap with React `cache()`
- **Serialization**: Ensure all cached data is JSON-serializable

### File Structure

```
src/
├── proxy.ts                    # New: Replaces middleware.ts
├── lib/
│   ├── data/                   # New: Data Access Layer
│   │   ├── quilts.ts          # Functional quilt data access
│   │   ├── usage.ts           # Functional usage data access
│   │   └── stats.ts           # Functional stats data access
│   └── repositories/          # Deprecated: To be removed
│       └── *.repository.ts    # Old class-based pattern
└── app/
    └── actions/               # Server Actions
        └── *.ts              # Use 'use server' directive
```

### Migration Path

1. Create new `src/proxy.ts` from `src/middleware.ts`
2. Create new `src/lib/data/` directory with functional exports
3. Update all imports to use new data access functions
4. Remove old repository classes
5. Update tests to work with functional patterns
6. Verify build and deployment

## Non-Functional Requirements

### Performance

- Caching should improve response times by 50%+
- Request deduplication should reduce database queries
- Build time should not increase

### Compatibility

- Maintain backward compatibility with existing API routes
- Ensure all existing features continue to work
- No breaking changes to public APIs

### Testing

- All existing tests should pass with minimal changes
- Add tests for new caching behavior
- Verify cache invalidation works correctly

## Success Criteria

- ✅ Build completes without errors or deprecation warnings
- ✅ All tests pass
- ✅ Application deploys successfully to Vercel
- ✅ Performance metrics show improvement
- ✅ Code follows Next.js 16 best practices
- ✅ Documentation is updated

## References

- [Next.js 16 Proxy API](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [Next.js 16 Caching](https://nextjs.org/docs/app/api-reference/directives/use-cache)
- [Data Access Layer Pattern](https://nextjs.org/docs/app/guides/data-security)
- [React cache() API](https://react.dev/reference/react/cache)
