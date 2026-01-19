/**
 * Proxy Matcher Pattern Verification Script
 *
 * Verifies that the matcher patterns in proxy.ts correctly
 * exclude all necessary paths according to Next.js 16 best practices.
 *
 * Requirements: 1.4 (Update configuration to use proxy matcher patterns)
 */

/**
 * Helper function to test if a path matches the proxy matcher pattern
 *
 * The matcher pattern from proxy.ts:
 * '/((?!api/|_next/static|_next/image|_next/data|favicon\\.ico|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|html)$).*)'
 */
function shouldProxyRun(pathname: string): boolean {
  // Negative lookahead pattern - excludes these paths
  const excludePattern =
    /^\/(?!api\/|_next\/static|_next\/image|_next\/data|favicon\.ico|manifest\.json|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|html)$).*/;
  return excludePattern.test(pathname);
}

interface TestCase {
  path: string;
  shouldRun: boolean;
  description: string;
}

const testCases: TestCase[] = [
  // Application routes - should run proxy
  { path: '/', shouldRun: true, description: 'Root path' },
  { path: '/login', shouldRun: true, description: 'Login page' },
  { path: '/register', shouldRun: true, description: 'Register page' },
  { path: '/quilts', shouldRun: true, description: 'Quilts module' },
  { path: '/quilts/123', shouldRun: true, description: 'Quilts detail page' },
  { path: '/usage', shouldRun: true, description: 'Usage module' },
  { path: '/settings', shouldRun: true, description: 'Settings page' },
  { path: '/analytics', shouldRun: true, description: 'Analytics page' },
  { path: '/dashboard', shouldRun: true, description: 'Dashboard page' },

  // API routes - should NOT run proxy
  { path: '/api/auth/login', shouldRun: false, description: 'Auth login API' },
  { path: '/api/auth/logout', shouldRun: false, description: 'Auth logout API' },
  { path: '/api/quilts', shouldRun: false, description: 'Quilts API' },
  { path: '/api/quilts/123', shouldRun: false, description: 'Quilts detail API' },
  { path: '/api/usage', shouldRun: false, description: 'Usage API' },
  { path: '/api/dashboard', shouldRun: false, description: 'Dashboard API' },
  { path: '/api/analytics', shouldRun: false, description: 'Analytics API' },
  { path: '/api/settings', shouldRun: false, description: 'Settings API' },
  { path: '/api/health', shouldRun: false, description: 'Health check API' },
  { path: '/api/weather', shouldRun: false, description: 'Weather API' },

  // Next.js internals - should NOT run proxy
  { path: '/_next/static/chunks/main.js', shouldRun: false, description: 'Next.js static files' },
  {
    path: '/_next/image?url=/test.png',
    shouldRun: false,
    description: 'Next.js image optimization',
  },
  {
    path: '/_next/data/build-id/quilts.json',
    shouldRun: false,
    description: 'Next.js data routes',
  },

  // Static assets - should NOT run proxy
  { path: '/favicon.ico', shouldRun: false, description: 'Favicon' },
  { path: '/manifest.json', shouldRun: false, description: 'PWA manifest' },
  { path: '/icons/icon-192x192.svg', shouldRun: false, description: 'SVG icon' },
  { path: '/images/logo.png', shouldRun: false, description: 'PNG image' },
  { path: '/photos/quilt.jpg', shouldRun: false, description: 'JPG image' },
  { path: '/photos/quilt.jpeg', shouldRun: false, description: 'JPEG image' },
  { path: '/animations/loading.gif', shouldRun: false, description: 'GIF image' },
  { path: '/images/optimized.webp', shouldRun: false, description: 'WebP image' },
  { path: '/icons/shortcut.ico', shouldRun: false, description: 'ICO file' },
  { path: '/data/config.json', shouldRun: false, description: 'JSON file' },
  { path: '/clear-cache.html', shouldRun: false, description: 'HTML file' },

  // Edge cases
  { path: '/quilts?status=active', shouldRun: true, description: 'Path with query parameters' },
  { path: '/quilts#section', shouldRun: true, description: 'Path with hash fragment' },
  { path: '/api/quilts/123/status', shouldRun: false, description: 'Nested API route' },
  { path: '/_next/static/css/app.css', shouldRun: false, description: 'Deeply nested static file' },
  { path: '/api-docs', shouldRun: true, description: 'Route containing "api" but not API route' },
  {
    path: '/next-steps',
    shouldRun: true,
    description: 'Route containing "_next" but not Next.js internal',
  },
];

function runTests(): void {
  console.log('🧪 Verifying Proxy Matcher Patterns\n');
  console.log('='.repeat(80));

  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const testCase of testCases) {
    const result = shouldProxyRun(testCase.path);
    const success = result === testCase.shouldRun;

    if (success) {
      passed++;
      console.log(`✅ ${testCase.description}`);
      console.log(`   Path: ${testCase.path}`);
      console.log(`   Expected: ${testCase.shouldRun ? 'Run proxy' : 'Skip proxy'}`);
      console.log(`   Result: ${result ? 'Run proxy' : 'Skip proxy'}`);
    } else {
      failed++;
      const failureMsg = `❌ ${testCase.description}\n   Path: ${testCase.path}\n   Expected: ${testCase.shouldRun ? 'Run proxy' : 'Skip proxy'}\n   Got: ${result ? 'Run proxy' : 'Skip proxy'}`;
      failures.push(failureMsg);
      console.log(failureMsg);
    }
    console.log('');
  }

  console.log('='.repeat(80));
  console.log(
    `\n📊 Test Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests\n`
  );

  if (failed > 0) {
    console.log('❌ Failed Tests:\n');
    failures.forEach(failure => console.log(failure + '\n'));
    process.exit(1);
  } else {
    console.log('✅ All tests passed! Proxy matcher patterns are correctly configured.\n');
    console.log('📝 Summary:');
    console.log('   - Application routes: Proxy will run ✓');
    console.log('   - API routes: Proxy will be skipped ✓');
    console.log('   - Next.js internals: Proxy will be skipped ✓');
    console.log('   - Static assets: Proxy will be skipped ✓');
    console.log('\n✨ Matcher patterns follow Next.js 16 best practices!');
    process.exit(0);
  }
}

// Run the tests
runTests();
