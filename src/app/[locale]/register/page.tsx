/**
 * User Registration Page
 * 
 * This page provides a registration form for new users using Next.js 16 Form component.
 * Implements progressive enhancement - works without JavaScript.
 * 
 * Requirements: 8.1 (User registration and authentication)
 */

import { redirect, Link } from '@/i18n/routing';
import { auth } from '@/auth';
import { RegisterForm } from './RegisterForm';

import { setRequestLocale } from 'next-intl/server';
import { connection } from 'next/server';


export default async function RegisterPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  // Enable static rendering
  setRequestLocale(locale);
  
  // Opt-in to dynamic rendering for auth check
  await connection();

  // Redirect if already authenticated
  const session = await auth();

  if (session) {
    redirect({ href: '/', locale });
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
            创建新账户
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            或者{' '}
            <Link
              href="/login"
              className="font-medium text-primary hover:text-primary/80"
            >
              登录已有账户
            </Link>
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
