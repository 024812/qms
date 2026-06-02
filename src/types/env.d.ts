declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Database
      DATABASE_URL: string;

      // Authentication
      BETTER_AUTH_SECRET?: string;
      BETTER_AUTH_URL?: string;
      NEXT_PUBLIC_BETTER_AUTH_URL?: string;
      AUTH_SECRET?: string;
      /** @deprecated Better Auth uses BETTER_AUTH_SECRET or AUTH_SECRET. */
      NEXTAUTH_SECRET?: string;
      /** @deprecated Better Auth uses BETTER_AUTH_URL. */
      NEXTAUTH_URL?: string;
      
      // Next.js
      NODE_ENV: 'development' | 'production' | 'test';
      PORT?: string;
      
      // Vercel
      VERCEL_URL?: string;
      
      // Package info
      npm_package_version?: string;
      
      // Logging
      LOG_LEVEL?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
      
      // Error tracking
      SENTRY_DSN?: string;
      WEBHOOK_ERROR_URL?: string;
      
      // Build tools
      ANALYZE?: 'true' | 'false';
      
      // Custom
      CUSTOM_KEY?: string;
    }
  }
}

export {};
