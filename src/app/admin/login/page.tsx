'use client';

import { FormEvent, useState } from 'react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/admin/send-magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? 'Unable to send login link.');
      }

      setMessage(data.message ?? 'Check your email for a sign-in link.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to send login link.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="stack">
      <section className="card stack hero">
        <span className="badge">Admin</span>
        <h1>Admin Login</h1>
        <p>Enter your email to receive a secure magic link.</p>
      </section>

      <form className="card stack form-grid" onSubmit={onSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send magic link'}
        </button>
      </form>

      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </main>
  );
}
