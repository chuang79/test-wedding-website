import { NextResponse } from 'next/server';
import { answerFaqQuestion, type ChatLocale } from '@/lib/chat';

const allowedLocales: ChatLocale[] = ['en', 'zh-TW', 'zh-CN'];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { locale?: string; message?: string };
    const locale = allowedLocales.includes(body.locale as ChatLocale)
      ? (body.locale as ChatLocale)
      : 'en';
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const answer = answerFaqQuestion(locale, message);
    return NextResponse.json({ answer });
  } catch {
    return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 });
  }
}
