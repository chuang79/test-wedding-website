import { getRequestConfig } from 'next-intl/server';
import { routing } from '@/i18n/routing';

function isSupportedLocale(locale: string) {
  return routing.locales.includes(locale as (typeof routing.locales)[number]);
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale =
    requested && isSupportedLocale(requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default
  };
});
