import { NextResponse } from 'next/server';
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
          dietaryNotes: household.rsvp.dietaryNotes,
          plushieCount: household.rsvp.plushieCount,
          karaokeSongsText: household.rsvp.karaokeSongsText,
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
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      code?: string;
      dietaryNotes?: string;
      plushieCount?: number;
      karaokeSongsText?: string;
      eventResponses?: EventResponseInput[];
    };

    const code = normalizeInviteCode(body.code ?? '');

    if (!code) {
      return NextResponse.json({ error: 'Invite code is required.' }, { status: 400 });
    }

    const plushieCount = Number(body.plushieCount ?? 0);
    if (!Number.isInteger(plushieCount) || plushieCount < 0) {
      return NextResponse.json({ error: 'Plushie count must be a non-negative integer.' }, { status: 400 });
    }

    const eventResponses = body.eventResponses ?? [];
    const validationError = validateEventResponses(eventResponses);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const household = await prisma.household.findUnique({ where: { code } });
    if (!household) {
      return NextResponse.json({ error: 'Invite code not found.' }, { status: 404 });
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

    for (const response of eventResponses) {
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
          dietaryNotes: body.dietaryNotes?.trim() || null,
          plushieCount,
          karaokeSongsText: body.karaokeSongsText?.trim() || null,
          submittedAt: now
        },
        create: {
          householdId: household.id,
          dietaryNotes: body.dietaryNotes?.trim() || null,
          plushieCount,
          karaokeSongsText: body.karaokeSongsText?.trim() || null,
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
            plushieCount,
            dietaryNotes: body.dietaryNotes?.trim() || null,
            karaokeSongsText: body.karaokeSongsText?.trim() || null,
            eventResponses
          }
        }
      });
    });

    await sendRsvpNotification({
      householdName: household.householdName,
      code: household.code,
      late,
      updatedAt: now.toISOString()
    });

    return NextResponse.json({ ok: true, late });
  } catch {
    return NextResponse.json({ error: 'Failed to save RSVP.' }, { status: 500 });
  }
}
