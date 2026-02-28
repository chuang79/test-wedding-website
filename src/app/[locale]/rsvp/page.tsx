import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { RsvpForm } from './rsvp-form';

export default async function RsvpPage({
  params
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'rsvp' });

  return (
    <main className="stack">
      <section className="stack card hero">
        <span className="badge">RSVP</span>
        <h1>{t('pageTitle')}</h1>
        <p className="hero-subtext">{t('pageIntro')}</p>
      </section>

      <RsvpForm locale={locale} />

      <div className="row">
        <Link className="btn btn-ghost" href={`/${locale}/faq`}>
          {t('faqCta')}
        </Link>
        <Link className="btn btn-ghost" href={`/${locale}`}>
          {t('homeCta')}
        </Link>
      </div>
    </main>
  );
}
