'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

type EventItem = {
  id: string;
  name: string;
  startsAt: string;
};

type ExistingPayload = {
  guestName: string | null;
  bringingPlusOne: boolean;
  plusOneName: string | null;
  dietaryNotes: string | null;
  transportMode: string | null;
  songRequestsText: string | null;
  messageToCouple: string | null;
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
  const [guestName, setGuestName] = useState('');
  const [bringingPlusOne, setBringingPlusOne] = useState(false);
  const [plusOneName, setPlusOneName] = useState('');
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [transportMode, setTransportMode] = useState('');
  const [songRequestsText, setSongRequestsText] = useState('');
  const [messageToCouple, setMessageToCouple] = useState('');
  const [eventSelections, setEventSelections] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const deadlineText = useMemo(() => {
    if (!lookup) {
      return '';
    }

    return new Date(lookup.deadline).toLocaleString(locale);
  }, [lookup, locale]);

  const plusOneAvailable = (lookup?.household.maxGuests ?? 1) > 1;
  const attendeeCount = bringingPlusOne && plusOneAvailable ? 2 : 1;

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
      setGuestName(data.existing?.guestName ?? '');

      const hasStoredPlusOne = Boolean(data.existing?.bringingPlusOne) && data.household.maxGuests > 1;
      setBringingPlusOne(hasStoredPlusOne);
      setPlusOneName(data.existing?.plusOneName ?? '');
      setDietaryNotes(data.existing?.dietaryNotes ?? '');
      setTransportMode(data.existing?.transportMode ?? '');
      setSongRequestsText(data.existing?.songRequestsText ?? '');
      setMessageToCouple(data.existing?.messageToCouple ?? '');

      const selectionMap: Record<string, boolean> = {};
      for (const eventItem of data.events) {
        const existing = data.existing?.eventResponses.find((item) => item.eventId === eventItem.id);
        selectionMap[eventItem.id] = existing?.attending ?? false;
      }
      setEventSelections(selectionMap);
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
        guestName,
        bringingPlusOne: plusOneAvailable ? bringingPlusOne : false,
        plusOneName: plusOneAvailable && bringingPlusOne ? plusOneName : '',
        dietaryNotes,
        transportMode,
        songRequestsText,
        messageToCouple,
        eventResponses: lookup.events.map((eventItem) => {
          const attending = Boolean(eventSelections[eventItem.id]);
          return {
            eventId: eventItem.id,
            attending,
            attendeeCount: attending ? attendeeCount : 0
          };
        })
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

  function toggleEvent(eventId: string) {
    setEventSelections((current) => ({
      ...current,
      [eventId]: !current[eventId]
    }));
  }

  return (
    <div className="stack content-panel">
      <form onSubmit={lookupInvite} className="stack form-grid rsvp-lookup-form">
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
        <form onSubmit={submitRsvp} className="stack form-grid rsvp-details-form">
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

          <div className="form-split">
            <label>
              {t('guestName')}
              <input value={guestName} onChange={(event) => setGuestName(event.target.value)} required />
            </label>

            <label>
              {t('bringingPlusOne')}
              <select
                value={bringingPlusOne ? 'yes' : 'no'}
                onChange={(event) => {
                  const nextValue = event.target.value === 'yes' && plusOneAvailable;
                  setBringingPlusOne(nextValue);
                  if (!nextValue) {
                    setPlusOneName('');
                  }
                }}
                disabled={!plusOneAvailable}
              >
                <option value="no">{t('no')}</option>
                <option value="yes">{t('yes')}</option>
              </select>
            </label>
          </div>

          {!plusOneAvailable ? <p className="field-note">{t('plusOneNotAvailable')}</p> : null}

          {bringingPlusOne && plusOneAvailable ? (
            <label>
              {t('plusOneName')}
              <input value={plusOneName} onChange={(event) => setPlusOneName(event.target.value)} required />
            </label>
          ) : null}

          <label>
            {t('dietaryNotes')}
            <textarea value={dietaryNotes} onChange={(event) => setDietaryNotes(event.target.value)} rows={3} />
          </label>

          <label>
            {t('transportMode')}
            <select value={transportMode} onChange={(event) => setTransportMode(event.target.value)} required>
              <option value="">{t('transportPlaceholder')}</option>
              <option value="SELF_DRIVING">{t('transportSelfDriving')}</option>
              <option value="CARPOOL">{t('transportCarpool')}</option>
              <option value="SHUTTLE">{t('transportShuttle')}</option>
            </select>
          </label>

          <div className="stack">
            <h3>{t('attendanceTitle')}</h3>
            <div className="attendance-grid">
              {lookup.events.map((eventItem) => {
                const attending = Boolean(eventSelections[eventItem.id]);
                return (
                  <label
                    key={eventItem.id}
                    className={`attendance-option ${attending ? 'selected' : ''}`.trim()}
                  >
                    <input
                      type="checkbox"
                      checked={attending}
                      onChange={() => toggleEvent(eventItem.id)}
                    />
                    <span className="attendance-option-copy">
                      <strong>{eventItem.name}</strong>
                      <span>{new Date(eventItem.startsAt).toLocaleString(locale)}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <label>
            {t('songRequests')}
            <textarea
              value={songRequestsText}
              onChange={(event) => setSongRequestsText(event.target.value)}
              rows={4}
            />
          </label>

          <label>
            {t('messageToCouple')}
            <textarea
              value={messageToCouple}
              onChange={(event) => setMessageToCouple(event.target.value)}
              rows={5}
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
