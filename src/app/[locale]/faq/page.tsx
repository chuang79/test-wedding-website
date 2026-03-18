import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function FaqPage({
  params
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'faq' });

  return (
    <main className="stack content-page">
      <section className="stack hero content-hero">
        <span className="badge">FAQ</span>
        <h1>{t('title')}</h1>
        <p className="hero-subtext">{t('intro')}</p>
      </section>

      <section className="stack faq-grid content-panel">
        <article className="faq-item">
          <h2>{t('q1')}</h2>
          <p>{t('a1')}</p>
        </article>
        <article className="faq-item">
          <h2>{t('q2')}</h2>
          <p>{t('a2')}</p>
        </article>
        <article className="faq-item">
          <h2>{t('q3')}</h2>
          <p>{t('a3')}</p>
        </article>
        <article className="faq-item">
          <h2>{t('q4')}</h2>
          <p>{t('a4')}</p>
        </article>
      </section>

      <div className="row content-row">
        <Link className="btn btn-ghost" href={`/${locale}/chat`}>
          {t('chatCta')}
        </Link>
        <Link className="btn btn-ghost" href={`/${locale}`}>
          {t('homeCta')}
        </Link>
      </div>
    </main>
  );
}
