import { NextResponse } from 'next/server';
import { lookupGuestInDevStore, shouldUseDevRsvpStore } from '@/lib/dev-rsvp-store';
import { prisma } from '@/lib/prisma';
import { getDeadlineDate, isLateSubmission, normalizeInviteCode } from '@/lib/rsvp';

export async function POST(request: Request) {
  let code = '';

  try {
    const body = (await request.json()) as { code?: string };
    code = normalizeInviteCode(body.code ?? '');

    if (!code) {
      return NextResponse.json({ error: 'Invite code is required.' }, { status: 400 });
    }

    const household = await prisma.household.findUnique({
      where: { code },
      include: {
        rsvp: true,
        eventResponses: true
      }
    });

    if (!household) {
      return NextResponse.json({ error: 'Invite code not found.' }, { status: 404 });
    }

    const events = await prisma.event.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: 'asc' }
    });

    return NextResponse.json({
      household: {
        householdName: household.householdName,
        maxGuests: household.maxGuests,
        code: household.code
      },
      events: events.map((event) => ({
        id: event.id,
        name: event.name,
        startsAt: event.startsAt.toISOString()
      })),
      existing: household.rsvp
        ? {
            guestName: household.rsvp.guestName,
            bringingPlusOne: household.rsvp.bringingPlusOne,
            plusOneName: household.rsvp.plusOneName,
            dietaryNotes: household.rsvp.dietaryNotes,
            transportMode: household.rsvp.transportMode,
            songRequestsText: household.rsvp.karaokeSongsText,
            messageToCouple: household.rsvp.messageToCouple,
            eventResponses: household.eventResponses.map((response) => ({
              eventId: response.eventId,
              attending: response.attending,
              attendeeCount: response.attendeeCount
            }))
          }
        : null,
      deadline: getDeadlineDate().toISOString(),
      late: isLateSubmission()
    });
  } catch (error) {
    if (shouldUseDevRsvpStore(error)) {
      if (!code) {
        return NextResponse.json({ error: 'Invite code is required.' }, { status: 400 });
      }

      const lookup = await lookupGuestInDevStore(code);

      if (!lookup) {
        return NextResponse.json({ error: 'Invite code not found.' }, { status: 404 });
      }

      return NextResponse.json({
        household: {
          householdName: lookup.household.householdName,
          maxGuests: lookup.household.maxGuests,
          code: lookup.household.code
        },
        events: lookup.events.map((event) => ({
          id: event.id,
          name: event.name,
          startsAt: new Date(event.startsAt).toISOString()
        })),
        existing: lookup.existing,
        deadline: getDeadlineDate().toISOString(),
        late: isLateSubmission()
      });
    }

    return NextResponse.json({ error: 'Failed to lookup invite code.' }, { status: 500 });
  }
}
