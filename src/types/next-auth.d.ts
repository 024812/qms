/**
 * Type definitions for Auth.js v5
 * 
 * Extends the default Auth.js types to include custom user properties
 */

import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Extended User interface
   */
  interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    activeModules: string[];
    image?: string | null;
  }

  /**
   * Extended Session interface
   */
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      activeModules: string[];
      image?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extended JWT interface
   */
  interface JWT {
    id: string;
    role: string;
    activeModules: string[];
  }
}
