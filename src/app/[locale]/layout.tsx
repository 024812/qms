import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import '@/app/globals.css';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ConditionalLayout } from '@/components/layout/ConditionalLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster as SonnerToaster } from 'sonner';
import { GlobalErrorHandler } from '@/components/GlobalErrorHandler';
import { ServiceWorkerCleaner } from '@/components/ServiceWorkerCleaner';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

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

// Generate static params for all supported locales
export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} h-full`} suppressHydrationWarning>
        <ThemeProvider defaultTheme="system" storageKey="qms-theme">
          <ErrorBoundary>
            <SessionProvider>
              <NextIntlClientProvider messages={messages}>
                <QueryProvider>
                  <GlobalErrorHandler />
                  <ServiceWorkerCleaner />
                  <Suspense fallback={null}>
                    <ConditionalLayout>{children}</ConditionalLayout>
                  </Suspense>
                  <SonnerToaster position="top-right" richColors closeButton />
                </QueryProvider>
              </NextIntlClientProvider>
            </SessionProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
