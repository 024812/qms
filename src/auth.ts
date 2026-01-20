/**
 * Auth.js v5 Configuration
 * 
 * This module configures authentication using Auth.js v5 (NextAuth.js v5).
 * It provides user authentication with credentials provider and session management.
 * 
 * Features:
 * - Credentials-based authentication (email/password)
 * - JWT session management
 * - Role-based access control
 * - Module subscription tracking
 * 
 * Requirements: 8.1, 8.3 (Authentication and authorization)
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

/**
 * Credentials validation schema
 */
const credentialsSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

/**
 * Auth.js v5 configuration
 * 
 * Best practices:
 * - Use Credentials Provider for username/password authentication
 * - Validate credentials in authorize function
 * - Use bcrypt for password hashing verification
 * - Extend session and JWT in callbacks
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        try {
          // Validate input
          const parsedCredentials = credentialsSchema.safeParse(credentials);

          if (!parsedCredentials.success) {
            return null;
          }

          const { email, password } = parsedCredentials.data;

          // Query user from database
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (!user) {
            return null;
          }

          // Verify password (using hashedPassword field)
          const passwordMatch = await bcrypt.compare(password, user.hashedPassword);

          if (!passwordMatch) {
            return null;
          }

          // Extract role and activeModules from preferences
          const role = user.preferences?.role || 'member';
          const activeModules = user.preferences?.activeModules || [];

          // Return user object (without password)
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role,
            activeModules,
          };
        } catch (error) {
          // Log errors only in development
          if (process.env.NODE_ENV === 'development') {
            console.error('[AUTH] Authorization error:', error);
          }
          return null;
        }
      },
    }),
  ],
  callbacks: {
    /**
     * JWT callback - extends JWT token with user data
     */
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.activeModules = user.activeModules;
      }

      // On update trigger, refresh user data from database
      if (trigger === 'update' && token.id) {
        const [updatedUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, token.id as string))
          .limit(1);

        if (updatedUser) {
          token.role = updatedUser.preferences?.role || 'member';
          token.activeModules = updatedUser.preferences?.activeModules || [];
        }
      }

      return token;
    },
    /**
     * Session callback - extends session with user data from JWT
     * Also refreshes activeModules from database to ensure latest data
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;

        // Always fetch latest user data from database for session
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, token.id as string))
          .limit(1);

        if (user) {
          session.user.role = user.preferences?.role || 'member';
          session.user.activeModules = user.preferences?.activeModules || [];
        } else {
          // Fallback to token data if user not found
          session.user.role = token.role as string;
          session.user.activeModules = token.activeModules as string[];
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

