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
  const pageCopy = {
    en: {
      chaptersTitle: 'Three chapters. One flow.',
      chaptersIntro: 'A simple structure keeps planning clear on desktop and mobile.',
      chapter1Kicker: 'Chapter 01',
      chapter2Kicker: 'Chapter 02',
      chapter3Kicker: 'Chapter 03',
      chapter1Title: 'Schedule',
      chapter2Title: 'RSVP',
      chapter3Title: 'Guest Guide',
      chapter1Intro: 'Review the weekend timeline and key moments.',
      chapter2Intro: 'Confirm your attendance for each event.',
      chapter3Intro: 'Check logistics or ask the assistant for details.',
      chapter1Cta: 'Jump to timeline',
      chapter3Cta: 'Open assistant',
      rsvpPoint1: 'Submit one household response.',
      rsvpPoint2: 'Update your answers any time before deadline.',
      rsvpPoint3: 'Add dietary notes and attendee count.',
      guidePoint1: 'Read FAQ for dress code and parking.',
      guidePoint2: 'Use assistant for quick planning questions.',
      guidePoint3: 'Return here anytime for links.'
    },
    'zh-TW': {
      chaptersTitle: '三個章節，一次看懂。',
      chaptersIntro: '以一致結構整理資訊，桌機與手機都容易閱讀。',
      chapter1Kicker: '章節 01',
      chapter2Kicker: '章節 02',
      chapter3Kicker: '章節 03',
      chapter1Title: '行程',
      chapter2Title: 'RSVP 回覆',
      chapter3Title: '賓客指南',
      chapter1Intro: '先看婚禮週末的主要安排與時間。',
      chapter2Intro: '依活動分別提交出席回覆。',
      chapter3Intro: '查詢常見問題，或直接詢問小幫手。',
      chapter1Cta: '查看時間表',
      chapter3Cta: '開啟小幫手',
      rsvpPoint1: '以家庭為單位提交一次回覆。',
      rsvpPoint2: '截止日前可隨時更新內容。',
      rsvpPoint3: '可加上飲食備註與參加人數。',
      guidePoint1: 'FAQ 含穿著與停車資訊。',
      guidePoint2: '可用小幫手快速詢問細節。',
      guidePoint3: '所有入口可隨時回到此頁。'
    },
    'zh-CN': {
      chaptersTitle: '三个章节，一次看清。',
      chaptersIntro: '统一结构让桌面和手机端都更易浏览。',
      chapter1Kicker: '章节 01',
      chapter2Kicker: '章节 02',
      chapter3Kicker: '章节 03',
      chapter1Title: '行程',
      chapter2Title: 'RSVP 回复',
      chapter3Title: '宾客指南',
      chapter1Intro: '先查看婚礼周末的关键时间安排。',
      chapter2Intro: '按活动分别提交是否出席。',
      chapter3Intro: '查看常见问题，或直接询问助手。',
      chapter1Cta: '查看时间线',
      chapter3Cta: '打开助手',
      rsvpPoint1: '以家庭为单位提交一次回复。',
      rsvpPoint2: '截止日前可随时更新内容。',
      rsvpPoint3: '可填写饮食备注与出席人数。',
      guidePoint1: 'FAQ 包含着装与停车信息。',
      guidePoint2: '可用助手快速咨询细节。',
      guidePoint3: '所有入口都可从此页返回。'
    }
  } as const;
  const copy = pageCopy[locale as keyof typeof pageCopy] ?? pageCopy.en;
  const chapters = [
    {
      id: 'schedule',
      kicker: copy.chapter1Kicker,
      title: copy.chapter1Title,
      intro: copy.chapter1Intro,
      items: [t('event1'), t('event2'), t('event3')],
      ctaLabel: copy.chapter1Cta,
      ctaHref: `/${locale}#schedule`
    },
    {
      id: 'rsvp',
      kicker: copy.chapter2Kicker,
      title: copy.chapter2Title,
      intro: copy.chapter2Intro,
      items: [copy.rsvpPoint1, copy.rsvpPoint2, copy.rsvpPoint3],
      ctaLabel: t('rsvpCta'),
      ctaHref: `/${locale}/rsvp`
    },
    {
      id: 'guide',
      kicker: copy.chapter3Kicker,
      title: copy.chapter3Title,
      intro: copy.chapter3Intro,
      items: [copy.guidePoint1, copy.guidePoint2, copy.guidePoint3],
      ctaLabel: copy.chapter3Cta,
      ctaHref: `/${locale}/chat`
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
            <div className="stack hero-copy">
              <span className="badge">{t('badge')}</span>
              <h1>{t('title')}</h1>
              <p className="hero-subtext">{t('intro')}</p>
            </div>

            <aside className="hero-panel">
              <div className="stack">
                <h2>{copy.chaptersTitle}</h2>
                <p>{copy.chaptersIntro}</p>
              </div>
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
            </aside>
          </div>
        </div>
      </section>

      {chapters.map((chapter, chapterIndex) => (
        <article key={chapter.id} id={chapter.id} className="home-section section-anchor">
          <div className="home-section-inner">
            <div className="chapter-row">
              <span className="section-kicker">{chapter.kicker}</span>
              <div className="chapter-content">
                <h2>{chapter.title}</h2>
                <p>{chapter.intro}</p>
              </div>
              <ul className="chapter-list">
                {chapter.items.map((item, itemIndex) => (
                  <li key={`${chapter.id}-${itemIndex}`}>
                    <span>{days[itemIndex] ?? `0${itemIndex + 1}`}</span>
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
          </div>
        </article>
      ))}

      <section className="home-section map-demo-section">
        <div className="home-section-inner map-demo-inner">
          <div className="map-demo-label">
            <span className="section-kicker">Venue</span>
            <h2>Conti di San Bonifacio</h2>
            <p>Maremma, Toscana — Maggio 2027</p>
          </div>
          <figure className="map-demo-figure">
            <img src="/map-demo.svg" alt="Cartographic map of Maremma, Toscana" />
          </figure>
        </div>
      </section>
    </main>
  );
}
