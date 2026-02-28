export type ChatLocale = 'en' | 'zh-TW' | 'zh-CN';

type Rule = {
  keywords: string[];
  answer: string;
};

const rules: Record<ChatLocale, Rule[]> = {
  en: [
    {
      keywords: ['parking', 'car', 'drive'],
      answer: 'Parking is available at the venue lot. Please arrive 20 minutes early for easier check-in.'
    },
    {
      keywords: ['dress', 'attire', 'wear'],
      answer: 'Dress code is semi-formal. We recommend comfortable shoes for evening activities.'
    },
    {
      keywords: ['deadline', 'rsvp', 'late'],
      answer: 'RSVP deadline is May 13, 2027. Late submissions are accepted but may not be guaranteed.'
    },
    {
      keywords: ['welcome', 'dinner'],
      answer: 'Welcome Dinner is on May 26, 2027 in the evening. Please RSVP separately for this event.'
    },
    {
      keywords: ['breakfast', 'next day'],
      answer: 'Venue Breakfast is on May 28, 2027. You can RSVP with yes/no and attendee count.'
    }
  ],
  'zh-TW': [
    {
      keywords: ['停車', '開車'],
      answer: '會場提供停車位，建議提早 20 分鐘到場，方便報到。'
    },
    {
      keywords: ['服裝', '穿著'],
      answer: '建議穿著半正式服裝，晚上活動較多，鞋子以舒適為主。'
    },
    {
      keywords: ['截止', '回覆', 'RSVP'],
      answer: 'RSVP 截止日為 2027 年 5 月 13 日。逾期仍可填寫，但名額不保證。'
    },
    {
      keywords: ['迎賓', '晚餐'],
      answer: '迎賓晚餐在 2027 年 5 月 26 日晚上，請在 RSVP 表單中個別勾選。'
    },
    {
      keywords: ['早餐', '隔天'],
      answer: '會場早餐在 2027 年 5 月 28 日，請填寫是否參加與人數。'
    }
  ],
  'zh-CN': [
    {
      keywords: ['停车', '开车'],
      answer: '场地提供停车位，建议提前 20 分钟到达，方便签到。'
    },
    {
      keywords: ['着装', '穿什么'],
      answer: '建议半正式着装，晚间活动较多，鞋子以舒适为主。'
    },
    {
      keywords: ['截止', '回复', 'RSVP'],
      answer: 'RSVP 截止日期是 2027 年 5 月 13 日。逾期仍可提交，但名额不保证。'
    },
    {
      keywords: ['欢迎', '晚宴'],
      answer: '欢迎晚宴在 2027 年 5 月 26 日晚上，请在 RSVP 中单独勾选。'
    },
    {
      keywords: ['早餐', '第二天'],
      answer: '场地早餐在 2027 年 5 月 28 日，请填写是否参加及人数。'
    }
  ]
};

const fallback: Record<ChatLocale, string> = {
  en: 'I can help with schedule, RSVP deadline, attire, and logistics. Please try a different question or check the FAQ page.',
  'zh-TW': '我可以回答流程、截止日、服裝與交通問題。請換個問法，或直接查看 FAQ。',
  'zh-CN': '我可以回答流程、截止日期、着装与交通问题。请换个问法，或直接查看 FAQ。'
};

export function answerFaqQuestion(locale: ChatLocale, message: string) {
  const normalized = message.toLowerCase();
  const match = rules[locale].find((rule) =>
    rule.keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))
  );

  return match?.answer ?? fallback[locale];
}
