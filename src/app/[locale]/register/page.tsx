import { redirect } from '@/i18n/routing';
import { setRequestLocale } from 'next-intl/server';

export default async function RegisterPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  redirect({ href: '/login', locale });
}
