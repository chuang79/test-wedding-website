'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

type EventItem = {
  id: string;
  name: string;
  startsAt: string;
};

type ExistingPayload = {
  dietaryNotes: string | null;
  plushieCount: number;
  karaokeSongsText: string | null;
  eventResponses: Array<{
    eventId: string;
    attending: boolean;
    attendeeCount: number;
  }>;
} | null;

type LookupPayload = {
  household: {
    householdName: string;
    maxGuests: number;
    code: string;
  };
  events: EventItem[];
  existing: ExistingPayload;
  deadline: string;
  late: boolean;
};

type Props = {
  locale: string;
};

export function RsvpForm({ locale }: Props) {
  const t = useTranslations('rsvp');

  const [code, setCode] = useState('');
  const [lookup, setLookup] = useState<LookupPayload | null>(null);
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [plushieCount, setPlushieCount] = useState(0);
  const [karaokeSongsText, setKaraokeSongsText] = useState('');
  const [eventResponses, setEventResponses] = useState<Record<string, { attending: boolean; attendeeCount: number }>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const deadlineText = useMemo(() => {
    if (!lookup) {
      return '';
    }

    return new Date(lookup.deadline).toLocaleString(locale);
  }, [lookup, locale]);

  async function lookupInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/guest/lookup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const data = (await response.json()) as LookupPayload & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? t('lookupFailed'));
      }

      setLookup(data);
      setDietaryNotes(data.existing?.dietaryNotes ?? '');
      setPlushieCount(data.existing?.plushieCount ?? 0);
      setKaraokeSongsText(data.existing?.karaokeSongsText ?? '');

      const responseMap: Record<string, { attending: boolean; attendeeCount: number }> = {};
      for (const eventItem of data.events) {
        const existing = data.existing?.eventResponses.find((item) => item.eventId === eventItem.id);
        responseMap[eventItem.id] = {
          attending: existing?.attending ?? false,
          attendeeCount: existing?.attendeeCount ?? 0
        };
      }
      setEventResponses(responseMap);
    } catch (lookupError) {
      setLookup(null);
      setError(lookupError instanceof Error ? lookupError.message : t('lookupFailed'));
    } finally {
      setBusy(false);
    }
  }

  async function submitRsvp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lookup) {
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        code: lookup.household.code,
        dietaryNotes,
        plushieCount,
        karaokeSongsText,
        eventResponses: Object.entries(eventResponses).map(([eventId, value]) => ({
          eventId,
          attending: value.attending,
          attendeeCount: value.attending ? value.attendeeCount : 0
        }))
      };

      const response = await fetch('/api/guest/rsvp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as { error?: string; late?: boolean };

      if (!response.ok) {
        throw new Error(data.error ?? t('submitFailed'));
      }

      setSuccess(data.late ? t('submitSuccessLate') : t('submitSuccess'));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('submitFailed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <form onSubmit={lookupInvite} className="card stack form-grid">
        <h2>{t('lookupTitle')}</h2>
        <label>
          {t('inviteCode')}
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder={t('invitePlaceholder')}
            autoCapitalize="characters"
          />
        </label>
        <button type="submit" disabled={busy || !code.trim()}>
          {busy ? t('loading') : t('lookupButton')}
        </button>
      </form>

      {error ? <p className="error">{error}</p> : null}
      {success ? <p className="success">{success}</p> : null}

      {lookup ? (
        <form onSubmit={submitRsvp} className="stack card form-grid">
          <h2>{t('detailsTitle')}</h2>
          <div className="info-grid">
            <div className="info-pill">
              <span className="info-label">{t('household')}</span>
              <span className="info-value">{lookup.household.householdName}</span>
            </div>
            <div className="info-pill">
              <span className="info-label">{t('maxGuests')}</span>
              <span className="info-value">{lookup.household.maxGuests}</span>
            </div>
            <div className="info-pill">
              <span className="info-label">{t('deadlineLabel')}</span>
              <span className="info-value">{deadlineText}</span>
            </div>
          </div>

          {lookup.late ? <div className="warning">{t('lateWarning')}</div> : null}

          <div className="event-grid">
            {lookup.events.map((eventItem) => {
              const state = eventResponses[eventItem.id] ?? { attending: false, attendeeCount: 0 };
              return (
                <div key={eventItem.id} className="event-card stack">
                  <h3>{eventItem.name}</h3>
                  <p>{new Date(eventItem.startsAt).toLocaleString(locale)}</p>
                  <label>
                    {t('attending')}
                    <select
                      value={state.attending ? 'yes' : 'no'}
                      onChange={(event) =>
                        setEventResponses((current) => ({
                          ...current,
                          [eventItem.id]: {
                            attending: event.target.value === 'yes',
                            attendeeCount:
                              event.target.value === 'yes'
                                ? Math.max(current[eventItem.id]?.attendeeCount ?? 1, 1)
                                : 0
                          }
                        }))
                      }
                    >
                      <option value="yes">{t('yes')}</option>
                      <option value="no">{t('no')}</option>
                    </select>
                  </label>

                  <label>
                    {t('attendeeCount')}
                    <input
                      type="number"
                      min={state.attending ? 1 : 0}
                      max={lookup.household.maxGuests}
                      value={state.attendeeCount}
                      onChange={(event) =>
                        setEventResponses((current) => ({
                          ...current,
                          [eventItem.id]: {
                            attending: state.attending,
                            attendeeCount: Number(event.target.value)
                          }
                        }))
                      }
                      disabled={!state.attending}
                    />
                  </label>
                </div>
              );
            })}
          </div>

          <label>
            {t('dietaryNotes')}
            <textarea value={dietaryNotes} onChange={(event) => setDietaryNotes(event.target.value)} rows={3} />
          </label>

          <label>
            {t('plushieCount')}
            <input
              type="number"
              min={0}
              value={plushieCount}
              onChange={(event) => setPlushieCount(Math.max(0, Number(event.target.value)))}
            />
          </label>

          <label>
            {t('karaokeSongs')}
            <textarea
              value={karaokeSongsText}
              onChange={(event) => setKaraokeSongsText(event.target.value)}
              rows={4}
            />
          </label>

          <button type="submit" disabled={busy}>
            {busy ? t('saving') : t('submitButton')}
          </button>
        </form>
      ) : null}
    </div>
  );
}
