import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { LanguageProvider } from '@/lib/language-provider';
import { ConditionalLayout } from '@/components/layout/ConditionalLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { GlobalErrorHandler } from '@/components/GlobalErrorHandler';
// import { AccessibilityAudit } from '@/components/AccessibilityAudit';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'QMS - 家庭被子管理系统',
  description: '家庭被子库存和使用追踪系统',
  icons: {
    icon: [
      { url: '/icons/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/icons/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} h-full`} suppressHydrationWarning>
        <ThemeProvider defaultTheme="system" storageKey="qms-theme">
          <ErrorBoundary>
            <SessionProvider>
              <LanguageProvider>
                <QueryProvider>
                  <GlobalErrorHandler />
                  <Suspense fallback={null}>
                    <ConditionalLayout>{children}</ConditionalLayout>
                  </Suspense>
                  <Toaster />
                  <SonnerToaster position="top-right" richColors closeButton />
                  {/* {process.env.NODE_ENV === 'development' && <AccessibilityAudit />} */}
                </QueryProvider>
              </LanguageProvider>
            </SessionProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
