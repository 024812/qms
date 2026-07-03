import { getRequestConfig } from 'next-intl/server';
import type { AbstractIntlMessages } from 'next-intl';
import enMessages from '../../messages/en.json';
import zhMessages from '../../messages/zh.json';
import { routing } from './routing';

type AppLocale = (typeof routing.locales)[number];

const messagesByLocale: Record<AppLocale, AbstractIntlMessages> = {
  en: enMessages,
  zh: zhMessages,
};

function isValidLocale(locale: string): locale is AppLocale {
  return routing.locales.includes(locale as AppLocale);
}

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  const requestedLocale = await requestLocale;

  // Ensure that a valid locale is used
  const locale =
    requestedLocale && isValidLocale(requestedLocale) ? requestedLocale : routing.defaultLocale;

  return {
    locale,
    messages: messagesByLocale[locale],
  };
});
