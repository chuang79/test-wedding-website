import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function HomePage({
  params
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'home' });
  const dayLabels = {
    en: ['Day 1', 'Day 2', 'Day 3'],
    'zh-TW': ['第 1 天', '第 2 天', '第 3 天'],
    'zh-CN': ['第 1 天', '第 2 天', '第 3 天']
  } as const;
  const days = dayLabels[locale as keyof typeof dayLabels] ?? dayLabels.en;

  return (
    <main className="stack">
      <section className="card hero hero-home">
        <div className="stack">
          <span className="badge">{t('badge')}</span>
          <h1>{t('title')}</h1>
          <p className="hero-subtext">{t('intro')}</p>
          <div className="row cta-row">
            <Link className="btn" href={`/${locale}/rsvp`}>
              {t('rsvpCta')}
            </Link>
            <Link className="btn btn-ghost" href={`/${locale}/faq`}>
              {t('faqCta')}
            </Link>
            <Link className="btn btn-ghost" href={`/${locale}/chat`}>
              {t('chatCta')}
            </Link>
          </div>
        </div>

        <aside className="hero-panel">
          <p className="hero-panel-title">{t('eventTitle')}</p>
          <ul className="quick-list">
            <li className="quick-item">
              <span>{days[0]}</span>
              <strong>{t('event1')}</strong>
            </li>
            <li className="quick-item">
              <span>{days[1]}</span>
              <strong>{t('event2')}</strong>
            </li>
            <li className="quick-item">
              <span>{days[2]}</span>
              <strong>{t('event3')}</strong>
            </li>
          </ul>
        </aside>
      </section>

      <section className="stack card">
        <div className="section-head">
          <h2>{t('eventTitle')}</h2>
          <p>{t('eventIntro')}</p>
        </div>
        <div className="event-grid">
          <article className="event-card">
            <span className="event-date">{days[0]}</span>
            <div className="event-title">{t('event1')}</div>
          </article>
          <article className="event-card">
            <span className="event-date">{days[1]}</span>
            <div className="event-title">{t('event2')}</div>
          </article>
          <article className="event-card">
            <span className="event-date">{days[2]}</span>
            <div className="event-title">{t('event3')}</div>
          </article>
        </div>
      </section>
    </main>
  );
}
