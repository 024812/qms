#!/usr/bin/env tsx
/**
 * Verify Next.js 16 Configuration
 *
 * This script validates that next.config.js follows Next.js 16 best practices
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  check: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

const results: ValidationResult[] = [];

function addResult(check: string, status: 'pass' | 'fail' | 'warning', message: string) {
  results.push({ check, status, message });
}

function printResults() {
  console.log('\n=== Next.js 16 Configuration Verification ===\n');

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;

  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${result.check}`);
    console.log(`   ${result.message}\n`);
  });

  console.log('=== Summary ===');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`Total: ${results.length}\n`);

  if (failed > 0) {
    console.error('Configuration validation failed!');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('Configuration is valid with warnings.');
    process.exit(0);
  } else {
    console.log('✅ Configuration is fully valid!');
    process.exit(0);
  }
}

async function verifyConfiguration() {
  try {
    // Load the configuration
    const configPath = join(process.cwd(), 'next.config.js');
    const config = require(configPath);

    // Check 1: cacheComponents is at top-level
    if (config.cacheComponents === true) {
      addResult(
        'cacheComponents location',
        'pass',
        'cacheComponents is correctly at top-level (not in experimental)'
      );
    } else if (config.experimental?.cacheComponents) {
      addResult(
        'cacheComponents location',
        'fail',
        'cacheComponents should be at top-level, not in experimental'
      );
    } else {
      addResult('cacheComponents location', 'warning', 'cacheComponents is not enabled');
    }

    // Check 2: turbopack is at top-level
    if (config.turbopack) {
      addResult(
        'turbopack location',
        'pass',
        'turbopack is correctly at top-level (not in experimental)'
      );
    } else if (config.experimental?.turbopack) {
      addResult(
        'turbopack location',
        'fail',
        'turbopack should be at top-level, not in experimental'
      );
    } else {
      addResult('turbopack location', 'warning', 'turbopack is not configured');
    }

    // Check 3: serverExternalPackages is at top-level
    if (config.serverExternalPackages !== undefined) {
      addResult(
        'serverExternalPackages location',
        'pass',
        'serverExternalPackages is correctly at top-level (not in experimental)'
      );
    } else if (config.experimental?.serverExternalPackages) {
      addResult(
        'serverExternalPackages location',
        'fail',
        'serverExternalPackages should be at top-level, not in experimental'
      );
    } else {
      addResult(
        'serverExternalPackages location',
        'warning',
        'serverExternalPackages is not configured'
      );
    }

    // Check 4: No deprecated experimental flags
    const deprecatedFlags = [
      'cacheComponents',
      'turbopack',
      'serverExternalPackages',
      'appDir', // Deprecated in Next.js 14+
      'serverComponentsExternalPackages', // Renamed to serverExternalPackages
    ];

    const foundDeprecated = deprecatedFlags.filter(
      flag => config.experimental?.[flag] !== undefined
    );

    if (foundDeprecated.length === 0) {
      addResult('Deprecated experimental flags', 'pass', 'No deprecated experimental flags found');
    } else {
      addResult(
        'Deprecated experimental flags',
        'fail',
        `Found deprecated flags: ${foundDeprecated.join(', ')}`
      );
    }

    // Check 5: Configuration syntax is valid
    if (typeof config === 'object' && config !== null) {
      addResult('Configuration syntax', 'pass', 'Configuration exports a valid object');
    } else {
      addResult('Configuration syntax', 'fail', 'Configuration does not export a valid object');
    }

    // Check 6: TypeScript configuration
    if (config.typescript) {
      if (config.typescript.ignoreBuildErrors === false) {
        addResult(
          'TypeScript configuration',
          'pass',
          'TypeScript errors will fail the build (recommended)'
        );
      } else {
        addResult('TypeScript configuration', 'warning', 'TypeScript errors are ignored in build');
      }
    } else {
      addResult('TypeScript configuration', 'pass', 'Using default TypeScript configuration');
    }

    // Check 7: Image optimization
    if (config.images) {
      const hasWebP = config.images.formats?.includes('image/webp');
      const hasAvif = config.images.formats?.includes('image/avif');

      if (hasWebP && hasAvif) {
        addResult('Image optimization', 'pass', 'Modern image formats (WebP, AVIF) are enabled');
      } else {
        addResult('Image optimization', 'warning', 'Consider enabling WebP and AVIF formats');
      }
    } else {
      addResult('Image optimization', 'warning', 'Image configuration not found');
    }

    // Check 8: Security headers
    if (typeof config.headers === 'function') {
      addResult('Security headers', 'pass', 'Security headers function is configured');
    } else {
      addResult('Security headers', 'warning', 'No security headers configured');
    }

    // Check 9: Compression
    if (config.compress === true) {
      addResult('Compression', 'pass', 'Response compression is enabled');
    } else {
      addResult('Compression', 'warning', 'Response compression is not enabled');
    }

    // Check 10: Standalone output for Docker
    if (config.output === 'standalone') {
      addResult('Standalone output', 'pass', 'Standalone output is enabled for Docker deployment');
    } else {
      addResult(
        'Standalone output',
        'warning',
        'Standalone output is not enabled (recommended for Docker)'
      );
    }
  } catch (error) {
    addResult(
      'Configuration loading',
      'fail',
      `Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  printResults();
}

// Run verification
verifyConfiguration().catch(error => {
  console.error('Verification failed:', error);
  process.exit(1);
});
