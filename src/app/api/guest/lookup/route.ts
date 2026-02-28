import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDeadlineDate, isLateSubmission, normalizeInviteCode } from '@/lib/rsvp';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { code?: string };
    const code = normalizeInviteCode(body.code ?? '');

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
  } catch {
    return NextResponse.json({ error: 'Failed to lookup invite code.' }, { status: 500 });
  }
}
