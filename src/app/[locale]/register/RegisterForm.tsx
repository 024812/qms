/**
 * Registration Form Component
 * 
 * Client component that handles user registration with:
 * - Progressive enhancement using Next.js 16 Form
 * - Client-side validation feedback
 * - Server Action integration
 * - Error handling and display
 * 
 * Requirements: 8.1 (User registration)
 */

'use client';

import { useActionState , useEffect } from 'react';
import { registerUser } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useTranslations } from 'next-intl';

/**
 * Registration form component
 */
export function RegisterForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await registerUser(formData);
      return result;
    },
    null
  );

  // Redirect on successful registration
  useEffect(() => {
    if (state?.success) {
      router.push('/');
      router.refresh();
    }
  }, [state?.success, router]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl text-center">{t('registerTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="name">{t('name')}</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              minLength={2}
              placeholder={t('namePlaceholder')}
              disabled={isPending}
              className="w-full"
            />
          </div>

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
              autoComplete="new-password"
              required
              minLength={6}
              placeholder={t('passwordMinLength')}
              disabled={isPending}
              className="w-full"
            />
          </div>

          {/* Confirm Password field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              placeholder={t('confirmPasswordPlaceholder')}
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

          {/* Success message */}
          {state?.success && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <AlertDescription>
                {t('registerSuccess')}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full"
          >
            {isPending ? t('registering') : t('registerButton')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
