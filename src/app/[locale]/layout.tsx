import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

function isSupportedLocale(locale: string) {
  return routing.locales.includes(locale as (typeof routing.locales)[number]);
}

const localeMeta = {
  en: { label: 'English' },
  'zh-TW': { label: '繁體中文' },
  'zh-CN': { label: '简体中文' }
} as const;

const navLabels = {
  en: { overview: 'Scroll', schedule: 'Chapters', rsvp: 'RSVP' },
  'zh-TW': { overview: '瀏覽', schedule: '章節', rsvp: '回覆' },
  'zh-CN': { overview: '浏览', schedule: '章节', rsvp: '回复' }
} as const;

const footerCopy = {
  en: 'With love and gratitude.',
  'zh-TW': '帶著愛與感謝，期待與您相聚。',
  'zh-CN': '带着爱与感谢，期待与您相聚。'
} as const;

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const labels = navLabels[locale as keyof typeof navLabels];
  const navItems = [
    { href: `/${locale}#overview`, label: labels.overview },
    { href: `/${locale}#schedule`, label: labels.schedule },
    { href: `/${locale}/rsvp`, label: labels.rsvp }
  ];

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="site-shell">
        <header className="site-header">
          <div className="site-header-inner">
            <a href={`/${locale}#overview`} className="brand-mark">
              <span className="brand-title">C+J Wedding</span>
              <span className="brand-subtitle">May 2027</span>
            </a>

            <nav className="site-nav" aria-label="Main">
              {navItems.map((item) => (
                <a key={item.href} href={item.href} className="site-nav-link">
                  {item.label}
                </a>
              ))}
            </nav>

            <nav className="locale-switcher" aria-label="Language">
              {routing.locales.map((item) => (
                <Link
                  key={item}
                  href={`/${item}`}
                  className={`locale-chip ${item === locale ? 'active' : ''}`.trim()}
                >
                  {localeMeta[item].label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <div className="site-content">{children}</div>

        <footer className="site-footer">
          <p>{footerCopy[locale as keyof typeof footerCopy]}</p>
        </footer>
      </div>
    </NextIntlClientProvider>
  );
}
