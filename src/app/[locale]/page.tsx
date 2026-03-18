import { getTranslations } from 'next-intl/server';
import HeroCountdown from './hero-countdown';

function parseTimelineEntry(value: string) {
  const matched = value.match(/^(.*?)[：:]\s*(.+)$/);
  if (!matched) {
    return { date: value, event: value };
  }

  return {
    date: matched[1].trim(),
    event: matched[2].trim()
  };
}

export default async function HomePage({
  params
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'home' });
  const faqT = await getTranslations({ locale, namespace: 'faq' });
  const dayLabels = {
    en: ['Day 1', 'Day 2', 'Day 3'],
    'zh-TW': ['第 1 天', '第 2 天', '第 3 天'],
    'zh-CN': ['第 1 天', '第 2 天', '第 3 天']
  } as const;
  const days = dayLabels[locale as keyof typeof dayLabels] ?? dayLabels.en;
  const pageCopy = {
    en: {
      chapter1Title: 'The Wedding',
      chapter2Title: 'Travel Details',
      chapter3Title: 'RSVP',
      chapter4Title: 'FAQ',
      chapter1Intro: 'Weekend timeline and celebration venue details.',
      chapter2Intro: 'Plan arrival, transportation, and local logistics.',
      chapter3Intro: 'Submit your household attendance and preferences.',
      chapter4Intro: 'Quick answers to common guest questions.',
      chapter1Cta: 'View timeline',
      chapter2Cta: 'Travel notes',
      chapter3Cta: 'Open RSVP',
      chapter4Cta: 'Open FAQ',
      weddingDateRange: 'May 26-28, 2027',
      venueLabel: 'Venue',
      venueName: 'Conti di San Bonifacio',
      venueAddress: 'Maremma, Toscana - Maggio 2027',
      travelPoint1: 'Conti di San Bonifacio, Maremma, Toscana',
      travelPoint2: 'Please plan arrival for May 26-28, 2027 events.',
      travelPoint3: 'Use the assistant for route, parking, and logistics.',
      rsvpPoint1: 'Submit one household response.',
      rsvpPoint2: 'Update your answers any time before deadline.',
      rsvpPoint3: 'Add dietary notes and attendee count.'
    },
    'zh-TW': {
      chapter1Title: '婚禮',
      chapter2Title: '交通資訊',
      chapter3Title: 'RSVP 回覆',
      chapter4Title: 'FAQ',
      chapter1Intro: '查看婚禮流程與場地資訊。',
      chapter2Intro: '整理抵達方式、交通與在地移動。',
      chapter3Intro: '提交家庭出席與偏好設定。',
      chapter4Intro: '快速查看賓客常見問題。',
      chapter1Cta: '查看行程',
      chapter2Cta: '查看交通',
      chapter3Cta: '前往 RSVP',
      chapter4Cta: '查看 FAQ',
      weddingDateRange: '2027 年 5 月 26 日至 5 月 28 日',
      venueLabel: '會場',
      venueName: 'Conti di San Bonifacio',
      venueAddress: 'Maremma, Toscana - Maggio 2027',
      travelPoint1: '會場：Conti di San Bonifacio，托斯卡尼',
      travelPoint2: '活動日期為 2027/05/26-2027/05/28。',
      travelPoint3: '可透過小幫手查詢路線、停車與交通。',
      rsvpPoint1: '以家庭為單位提交一次回覆。',
      rsvpPoint2: '截止日前可隨時更新內容。',
      rsvpPoint3: '可加上飲食備註與參加人數。'
    },
    'zh-CN': {
      chapter1Title: '婚礼',
      chapter2Title: '交通信息',
      chapter3Title: 'RSVP 回复',
      chapter4Title: 'FAQ',
      chapter1Intro: '查看婚礼流程与场地信息。',
      chapter2Intro: '整理到达方式、交通与当地出行。',
      chapter3Intro: '提交家庭出席与偏好设置。',
      chapter4Intro: '快速查看宾客常见问题。',
      chapter1Cta: '查看行程',
      chapter2Cta: '查看交通',
      chapter3Cta: '前往 RSVP',
      chapter4Cta: '查看 FAQ',
      weddingDateRange: '2027 年 5 月 26 日至 5 月 28 日',
      venueLabel: '场地',
      venueName: 'Conti di San Bonifacio',
      venueAddress: 'Maremma, Toscana - Maggio 2027',
      travelPoint1: '场地：Conti di San Bonifacio，托斯卡纳',
      travelPoint2: '活动日期为 2027/05/26-2027/05/28。',
      travelPoint3: '可通过助手查询路线、停车与交通。',
      rsvpPoint1: '以家庭为单位提交一次回复。',
      rsvpPoint2: '截止日前可随时更新内容。',
      rsvpPoint3: '可填写饮食备注与出席人数。'
    }
  } as const;
  const copy = pageCopy[locale as keyof typeof pageCopy] ?? pageCopy.en;
  const weddingTimeline = [t('event1'), t('event2'), t('event3')].map((entry, index) => {
    const parsed = parseTimelineEntry(entry);
    return {
      ...parsed,
      dayLabel: days[index] ?? `Day ${index + 1}`
    };
  });
  const chapters = [
    {
      id: 'wedding',
      title: copy.chapter1Title,
      intro: copy.chapter1Intro,
      items: weddingTimeline.map((item) => `${item.date}: ${item.event}`),
      ctaLabel: copy.chapter1Cta,
      ctaHref: `/${locale}#wedding`,
      itemLabels: days
    },
    {
      id: 'travel',
      title: copy.chapter2Title,
      intro: copy.chapter2Intro,
      items: [copy.travelPoint1, copy.travelPoint2, copy.travelPoint3],
      ctaLabel: copy.chapter2Cta,
      ctaHref: `/${locale}#travel`
    },
    {
      id: 'rsvp',
      title: copy.chapter3Title,
      intro: copy.chapter3Intro,
      items: [copy.rsvpPoint1, copy.rsvpPoint2, copy.rsvpPoint3],
      ctaLabel: copy.chapter3Cta,
      ctaHref: `/${locale}/rsvp`
    },
    {
      id: 'faq',
      title: copy.chapter4Title,
      intro: copy.chapter4Intro,
      items: [faqT('q1'), faqT('q2'), faqT('q3')],
      ctaLabel: copy.chapter4Cta,
      ctaHref: `/${locale}/faq`
    }
  ];

  return (
    <main className="home-flow">
      <section id="overview" className="home-section section-anchor">
        <div className="hero-bg" aria-hidden>
          <img
            src="https://contidisanbonifacio.com/wp-content/uploads/conti-di-san-bonifacio-boutique-hotel-wine-resort-in-tuscany.webp"
            alt=""
          />
        </div>
        <div className="home-section-inner">
          <div className="hero-home">
            <div className="stack hero-copy hero-copy-centered">
              <div className="hero-couple-stack" aria-label="Claire and Jintai">
                <p className="hero-couple hero-couple-first">Claire</p>
                <p className="hero-couple-plus">&amp;</p>
                <p className="hero-couple hero-couple-second">Jintai</p>
              </div>
              <h1 className="hero-tagline">{t('title')}</h1>
              <p className="hero-date">MAY 27, 2027</p>
              <HeroCountdown targetIso="2027-05-27T00:00:00+02:00" />
            </div>
          </div>
        </div>
      </section>

      {chapters.map((chapter, chapterIndex) => (
        <article key={chapter.id} id={chapter.id} className="home-section section-anchor">
          <div className="home-section-inner">
            {chapter.id === 'wedding' ? (
              <section className="wedding-layout" aria-label={chapter.title}>
                <header className="wedding-layout-head">
                  <h2 className="wedding-layout-title">{chapter.title}</h2>
                  <p className="wedding-layout-dates">{copy.weddingDateRange}</p>
                </header>

                <div className="wedding-layout-top">
                  <div className="wedding-layout-venue">
                    <span className="section-kicker">{copy.venueLabel}</span>
                    <h3>{copy.venueName}</h3>
                    <p>{copy.venueAddress}</p>
                  </div>
                  <figure className="wedding-layout-map">
                    <img src="/map-demo.svg" alt="Cartographic map of Maremma, Toscana" />
                  </figure>
                </div>

                <div className="wedding-layout-divider" aria-hidden />

                <div className="wedding-layout-days">
                  {weddingTimeline.map((item, itemIndex) => (
                    <article key={`wedding-day-${itemIndex}`} className="wedding-layout-day">
                      <p className="wedding-layout-day-date">{item.date}</p>
                      <p className="wedding-layout-day-label">{item.dayLabel}</p>
                      <p className="wedding-layout-day-event">{item.event}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : (
              <div className="chapter-row">
                <div className="chapter-content">
                  <h2>{chapter.title}</h2>
                  <p>{chapter.intro}</p>
                </div>
                <ul className="chapter-list">
                  {chapter.items.map((item, itemIndex) => (
                    <li key={`${chapter.id}-${itemIndex}`}>
                      <span>{chapter.itemLabels?.[itemIndex] ?? `0${itemIndex + 1}`}</span>
                      <p>{item}</p>
                    </li>
                  ))}
                </ul>
                <a className="chapter-link" href={chapter.ctaHref}>
                  {chapter.ctaLabel}
                </a>
                <span className="chapter-index" aria-hidden>
                  0{chapterIndex + 1}
                </span>
              </div>
            )}
          </div>
        </article>
      ))}
    </main>
  );
}
