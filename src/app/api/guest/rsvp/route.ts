import { NextResponse } from 'next/server';
import {
  lookupGuestInDevStore,
  saveGuestRsvpInDevStore,
  shouldUseDevRsvpStore
} from '@/lib/dev-rsvp-store';
import { prisma } from '@/lib/prisma';
import {
  getDeadlineDate,
  isLateSubmission,
  normalizeInviteCode,
  type EventResponseInput,
  validateEventResponses
} from '@/lib/rsvp';
import { sendRsvpNotification } from '@/lib/notifications';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = normalizeInviteCode(searchParams.get('code') ?? '');

  if (!code) {
    return NextResponse.json({ error: 'Invite code is required.' }, { status: 400 });
  }

  try {
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

    return NextResponse.json({
      household: {
        householdName: household.householdName,
        maxGuests: household.maxGuests
      },
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
    if (!shouldUseDevRsvpStore(error)) {
      return NextResponse.json({ error: 'Failed to load RSVP.' }, { status: 500 });
    }

    const lookup = await lookupGuestInDevStore(code);

    if (!lookup) {
      return NextResponse.json({ error: 'Invite code not found.' }, { status: 404 });
    }

    return NextResponse.json({
      household: {
        householdName: lookup.household.householdName,
        maxGuests: lookup.household.maxGuests
      },
      existing: lookup.existing,
      deadline: getDeadlineDate().toISOString(),
      late: isLateSubmission()
    });
  }
}

export async function POST(request: Request) {
  let body:
    | {
        code?: string;
        guestName?: string;
        bringingPlusOne?: boolean;
        plusOneName?: string;
        dietaryNotes?: string;
        transportMode?: string;
        songRequestsText?: string;
        messageToCouple?: string;
        eventResponses?: EventResponseInput[];
      }
    | null = null;

  try {
    body = (await request.json()) as {
      code?: string;
      guestName?: string;
      bringingPlusOne?: boolean;
      plusOneName?: string;
      dietaryNotes?: string;
      transportMode?: string;
      songRequestsText?: string;
      messageToCouple?: string;
      eventResponses?: EventResponseInput[];
    };
    const payload = body;

    const code = normalizeInviteCode(payload.code ?? '');

    if (!code) {
      return NextResponse.json({ error: 'Invite code is required.' }, { status: 400 });
    }

    const guestName = payload.guestName?.trim() ?? '';
    if (!guestName) {
      return NextResponse.json({ error: 'Guest name is required.' }, { status: 400 });
    }

    const bringingPlusOne = Boolean(payload.bringingPlusOne);
    const plusOneName = payload.plusOneName?.trim() ?? '';
    const transportMode = payload.transportMode?.trim() ?? '';
    if (!['SELF_DRIVING', 'CARPOOL', 'SHUTTLE'].includes(transportMode)) {
      return NextResponse.json({ error: 'Please choose a transportation preference.' }, { status: 400 });
    }

    const eventResponses = payload.eventResponses ?? [];
    const validationError = validateEventResponses(eventResponses);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const household = await prisma.household.findUnique({ where: { code } });
    if (!household) {
      return NextResponse.json({ error: 'Invite code not found.' }, { status: 404 });
    }

    if (bringingPlusOne && household.maxGuests < 2) {
      return NextResponse.json({ error: 'This invitation does not include a plus one.' }, { status: 400 });
    }

    if (bringingPlusOne && !plusOneName) {
      return NextResponse.json({ error: 'Plus one name is required.' }, { status: 400 });
    }

    const uniqueEventIds = [...new Set(eventResponses.map((item) => item.eventId))];
    if (uniqueEventIds.length !== eventResponses.length) {
      return NextResponse.json({ error: 'Duplicate event responses are not allowed.' }, { status: 400 });
    }

    const validEvents = await prisma.event.findMany({
      where: {
        id: { in: uniqueEventIds },
        enabled: true
      },
      select: { id: true }
    });

    if (validEvents.length !== uniqueEventIds.length) {
      return NextResponse.json({ error: 'One or more events are invalid.' }, { status: 400 });
    }

    const expectedAttendeeCount = bringingPlusOne ? 2 : 1;
    for (const response of eventResponses) {
      if (response.attending && response.attendeeCount !== expectedAttendeeCount) {
        return NextResponse.json(
          { error: `Selected events must use an attendee count of ${expectedAttendeeCount}.` },
          { status: 400 }
        );
      }

      if (response.attendeeCount > household.maxGuests) {
        return NextResponse.json(
          { error: `Attendee count cannot exceed max household guests (${household.maxGuests}).` },
          { status: 400 }
        );
      }
    }

    const late = isLateSubmission();
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.householdRsvp.upsert({
        where: { householdId: household.id },
        update: {
          guestName,
          bringingPlusOne,
          plusOneName: bringingPlusOne ? plusOneName : null,
          dietaryNotes: payload.dietaryNotes?.trim() || null,
          transportMode,
          plushieCount: 0,
          karaokeSongsText: payload.songRequestsText?.trim() || null,
          messageToCouple: payload.messageToCouple?.trim() || null,
          submittedAt: now
        },
        create: {
          householdId: household.id,
          guestName,
          bringingPlusOne,
          plusOneName: bringingPlusOne ? plusOneName : null,
          dietaryNotes: payload.dietaryNotes?.trim() || null,
          transportMode,
          plushieCount: 0,
          karaokeSongsText: payload.songRequestsText?.trim() || null,
          messageToCouple: payload.messageToCouple?.trim() || null,
          submittedAt: now
        }
      });

      for (const response of eventResponses) {
        await tx.householdEventResponse.upsert({
          where: {
            householdId_eventId: {
              householdId: household.id,
              eventId: response.eventId
            }
          },
          update: {
            attending: response.attending,
            attendeeCount: response.attending ? response.attendeeCount : 0
          },
          create: {
            householdId: household.id,
            eventId: response.eventId,
            attending: response.attending,
            attendeeCount: response.attending ? response.attendeeCount : 0
          }
        });
      }

      await tx.rsvpAuditLog.create({
        data: {
          householdId: household.id,
          action: 'guest.submit',
          actorType: 'guest',
          payloadJson: {
            late,
            guestName,
            bringingPlusOne,
            plusOneName: bringingPlusOne ? plusOneName : null,
            transportMode,
            dietaryNotes: payload.dietaryNotes?.trim() || null,
            songRequestsText: payload.songRequestsText?.trim() || null,
            messageToCouple: payload.messageToCouple?.trim() || null,
            eventResponses
          }
        }
      });
    });

    await sendRsvpNotification({
      householdName: household.householdName,
      guestName,
      code: household.code,
      late,
      updatedAt: now.toISOString()
    });

    return NextResponse.json({ ok: true, late });
  } catch (error) {
    if (body && shouldUseDevRsvpStore(error)) {
      const fallbackBody = body;
      const code = normalizeInviteCode(fallbackBody.code ?? '');

      if (!code) {
        return NextResponse.json({ error: 'Invite code is required.' }, { status: 400 });
      }

      const guestName = fallbackBody.guestName?.trim() ?? '';
      if (!guestName) {
        return NextResponse.json({ error: 'Guest name is required.' }, { status: 400 });
      }

      const bringingPlusOne = Boolean(fallbackBody.bringingPlusOne);
      const plusOneName = fallbackBody.plusOneName?.trim() || null;
      const transportMode = fallbackBody.transportMode?.trim() ?? '';
      if (!['SELF_DRIVING', 'CARPOOL', 'SHUTTLE'].includes(transportMode)) {
        return NextResponse.json({ error: 'Please choose a transportation preference.' }, { status: 400 });
      }

      const eventResponses = fallbackBody.eventResponses ?? [];
      const validationError = validateEventResponses(eventResponses);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      const lookup = await lookupGuestInDevStore(code);
      if (!lookup) {
        return NextResponse.json({ error: 'Invite code not found.' }, { status: 404 });
      }

      if (bringingPlusOne && lookup.household.maxGuests < 2) {
        return NextResponse.json({ error: 'This invitation does not include a plus one.' }, { status: 400 });
      }

      if (bringingPlusOne && !plusOneName) {
        return NextResponse.json({ error: 'Plus one name is required.' }, { status: 400 });
      }

      const uniqueEventIds = [...new Set(eventResponses.map((item) => item.eventId))];
      if (uniqueEventIds.length !== eventResponses.length) {
        return NextResponse.json({ error: 'Duplicate event responses are not allowed.' }, { status: 400 });
      }

      const validEventIds = new Set(lookup.events.map((event) => event.id));
      if (uniqueEventIds.some((eventId) => !validEventIds.has(eventId))) {
        return NextResponse.json({ error: 'One or more events are invalid.' }, { status: 400 });
      }

      const expectedAttendeeCount = bringingPlusOne ? 2 : 1;
      for (const response of eventResponses) {
        if (response.attending && response.attendeeCount !== expectedAttendeeCount) {
          return NextResponse.json(
            { error: `Selected events must use an attendee count of ${expectedAttendeeCount}.` },
            { status: 400 }
          );
        }

        if (response.attendeeCount > lookup.household.maxGuests) {
          return NextResponse.json(
            { error: `Attendee count cannot exceed max household guests (${lookup.household.maxGuests}).` },
            { status: 400 }
          );
        }
      }

      const saved = await saveGuestRsvpInDevStore({
        code,
        guestName,
        bringingPlusOne,
        plusOneName: bringingPlusOne ? plusOneName : null,
        dietaryNotes: fallbackBody.dietaryNotes?.trim() || null,
        transportMode,
        songRequestsText: fallbackBody.songRequestsText?.trim() || null,
        messageToCouple: fallbackBody.messageToCouple?.trim() || null,
        eventResponses
      });

      if (!saved) {
        return NextResponse.json({ error: 'Invite code not found.' }, { status: 404 });
      }

      await sendRsvpNotification({
        householdName: saved.household.householdName,
        guestName,
        code: saved.household.code,
        late: saved.late,
        updatedAt: saved.updatedAt
      });

      return NextResponse.json({ ok: true, late: saved.late });
    }

    return NextResponse.json({ error: 'Failed to save RSVP.' }, { status: 500 });
  }
}
