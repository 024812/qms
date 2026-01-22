/**
 * Login Page
 * 
 * This page provides a login form using Next.js 16 Form component with Server Actions.
 * Implements progressive enhancement - works without JavaScript.
 * 
 * Requirements: 8.1 (User authentication)
 */

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { LoginForm } from './LoginForm';
import { connection } from 'next/server';


export default async function LoginPage() {
  // Opt-in to dynamic rendering for auth check
  await connection();
  
  // Redirect if already authenticated
  const session = await auth();

  if (session) {
    redirect('/');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-foreground">
            登录账户
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            或者{' '}
            <a
              href="/register"
              className="font-medium text-primary hover:text-primary/80"
            >
              创建新账户
            </a>
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
