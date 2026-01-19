/**
 * Login Form Component
 * 
 * Client component that handles user login with:
 * - Progressive enhancement using Next.js 16 Form (when available)
 * - Client-side validation feedback
 * - Server Action integration
 * - Error handling and display
 * 
 * Requirements: 8.1 (User authentication)
 */

'use client';

import { useActionState , useEffect } from 'react';
import { loginUser } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Login form component
 */
export function LoginForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await loginUser(formData);
      return result;
    },
    null
  );

  // Redirect on successful login
  useEffect(() => {
    if (state?.success) {
      router.push('/');
      router.refresh();
    }
  }, [state?.success, router]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl text-center">欢迎回来</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {/* Email field */}
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="请输入您的邮箱"
              disabled={isPending}
              className="w-full"
            />
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              placeholder="请输入您的密码"
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
                登录成功！正在跳转...
              </AlertDescription>
            </Alert>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full"
          >
            {isPending ? '登录中...' : '登录'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
