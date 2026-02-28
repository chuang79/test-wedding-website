import { Resend } from 'resend';
import { env } from '@/lib/env';

let resend: Resend | null = null;

if (env.RESEND_API_KEY) {
  resend = new Resend(env.RESEND_API_KEY);
}

type NotificationPayload = {
  householdName: string;
  code: string;
  late: boolean;
  updatedAt: string;
};

export async function sendRsvpNotification(payload: NotificationPayload) {
  if (!resend || !env.NOTIFY_FROM_EMAIL || !env.NOTIFY_TO_EMAIL) {
    return;
  }

  await resend.emails.send({
    from: env.NOTIFY_FROM_EMAIL,
    to: env.NOTIFY_TO_EMAIL,
    subject: `RSVP updated: ${payload.householdName}`,
    text: [
      `Household: ${payload.householdName}`,
      `Invite code: ${payload.code}`,
      `Updated: ${payload.updatedAt}`,
      `Late submission: ${payload.late ? 'Yes' : 'No'}`
    ].join('\n')
  });
}
