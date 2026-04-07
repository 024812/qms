declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Database
      DATABASE_URL: string;

      // Authentication
      AUTH_SECRET?: string;
      NEXTAUTH_SECRET?: string;
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
