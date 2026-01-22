import { auth } from '@/auth';
import { redirect } from '@/i18n/routing';
import { WelcomePage } from './WelcomePage';

import { setRequestLocale } from 'next-intl/server';
import { connection } from 'next/server';


export default async function DashboardPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  // Enable static rendering
  setRequestLocale(locale);
  
  // Opt-in to dynamic rendering for auth check
  await connection();


  const session = await auth();

  if (!session?.user) {
    redirect({ href: '/login', locale });
  }

  // Show welcome page for all users
  return <WelcomePage />;
}
