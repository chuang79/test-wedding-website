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
  en: { home: 'Home', rsvp: 'RSVP', faq: 'FAQ', chat: 'Assistant' },
  'zh-TW': { home: '首頁', rsvp: '回覆', faq: 'FAQ', chat: '小幫手' },
  'zh-CN': { home: '首页', rsvp: '回复', faq: 'FAQ', chat: '助手' }
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
    { href: `/${locale}`, label: labels.home },
    { href: `/${locale}/rsvp`, label: labels.rsvp },
    { href: `/${locale}/faq`, label: labels.faq },
    { href: `/${locale}/chat`, label: labels.chat }
  ];

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="site-shell">
        <div className="site-glow site-glow-a" aria-hidden />
        <div className="site-glow site-glow-b" aria-hidden />
        <div className="site-glow site-glow-c" aria-hidden />

        <header className="site-header">
          <div className="site-header-inner">
            <Link href={`/${locale}`} className="brand-mark">
              <span className="brand-title">C+J Wedding</span>
              <span className="brand-subtitle">May 2027</span>
            </Link>

            <nav className="site-nav" aria-label="Main">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="site-nav-link">
                  {item.label}
                </Link>
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

        {children}

        <footer className="site-footer">
          <p>With love, gratitude, and too many karaoke songs.</p>
        </footer>
      </div>
    </NextIntlClientProvider>
  );
}
