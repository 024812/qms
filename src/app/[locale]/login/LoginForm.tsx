/**
 * Login Form Component
 * 
 * Client component that handles user login with:
 * - Progressive enhancement using Next.js 16 Form (when available)
 * - Client-side validation feedback
 * - Server Action integration (Server-Side Redirect)
 * - Error handling and display
 * 
 * Requirements: 8.1 (User authentication)
 */

'use client';

import { useActionState } from 'react';
import { loginUser } from '@/app/actions/auth';
import { useSearchParams } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslations } from 'next-intl';

/**
 * Login form component
 */
export function LoginForm() {
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [state, formAction, isPending] = useActionState(loginUser, null);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl text-center">{t('loginSubtitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />

          {/* Email field */}
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder={t('emailPlaceholder')}
              disabled={isPending}
              className="w-full"
            />
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              placeholder={t('passwordPlaceholder')}
              disabled={isPending}
              className="w-full"
            />
          </div>

          {/* Error message */}
          {state && !state.success && (
            <Alert variant="destructive">
              <AlertDescription>
                {state.message}
                {state.error && (
                  <div className="mt-1 text-sm">
                    {state.error}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full"
          >
            {isPending ? t('loggingIn') : t('loginButton')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
