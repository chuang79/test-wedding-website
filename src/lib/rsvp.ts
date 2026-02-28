import { env } from '@/lib/env';

export type EventResponseInput = {
  eventId: string;
  attending: boolean;
  attendeeCount: number;
};

export function getDeadlineDate() {
  return new Date(env.RSVP_DEADLINE);
}

export function isLateSubmission(now: Date = new Date()) {
  return now > getDeadlineDate();
}

export function validateEventResponses(values: EventResponseInput[]) {
  if (!Array.isArray(values) || values.length === 0) {
    return 'At least one event response is required.';
  }

  for (const value of values) {
    if (!value.eventId) {
      return 'Missing event ID.';
    }

    if (value.attendeeCount < 0 || !Number.isInteger(value.attendeeCount)) {
      return 'Attendee count must be a non-negative integer.';
    }

    if (!value.attending && value.attendeeCount !== 0) {
      return 'If not attending, attendee count must be 0.';
    }

    if (value.attending && value.attendeeCount < 1) {
      return 'If attending, attendee count must be at least 1.';
    }
  }

  return null;
}

export function normalizeInviteCode(value: string) {
  return value.trim().toUpperCase();
}
