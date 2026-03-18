'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

type ChatItem = {
  role: 'user' | 'assistant';
  text: string;
};

export default function ChatPage() {
  const t = useTranslations('chat');
  const locale = useLocale();
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();

    if (!trimmed || loading) {
      return;
    }

    setLoading(true);
    setHistory((current) => [...current, { role: 'user', text: trimmed }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ locale, message: trimmed })
      });
      const data = (await response.json()) as { answer?: string; error?: string };

      setHistory((current) => [
        ...current,
        {
          role: 'assistant',
          text: data.answer ?? data.error ?? t('fallback')
        }
      ]);
      setMessage('');
    } catch {
      setHistory((current) => [...current, { role: 'assistant', text: t('fallback') }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="stack content-page">
      <section className="stack hero content-hero">
        <span className="badge">Ask Kittie</span>
        <h1>{t('title')}</h1>
        <p className="hero-subtext">{t('intro')}</p>
      </section>

      <section className="chat-shell content-panel">
        <div className="chat-log">
          {history.length === 0 ? <p className="chat-empty">{t('empty')}</p> : null}
          {history.map((entry, index) => (
            <div
              key={`${entry.role}-${index}`}
              className={`chat-bubble ${entry.role === 'user' ? 'user' : 'assistant'}`}
            >
              <strong>{entry.role === 'user' ? t('you') : t('assistant')}</strong>
              <p>{entry.text}</p>
            </div>
          ))}
        </div>

        <form onSubmit={onSubmit} className="stack">
          <label>
            {t('askLabel')}
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={3}
              placeholder={t('askPlaceholder')}
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? t('sending') : t('send')}
          </button>
        </form>
      </section>

      <div className="row content-row">
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
