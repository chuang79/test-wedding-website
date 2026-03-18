import { NextResponse } from 'next/server';
import { getAdminUserOrNull } from '@/lib/auth';
import { getAdminSnapshotFromDevStore, shouldUseDevRsvpStore } from '@/lib/dev-rsvp-store';
import { prisma } from '@/lib/prisma';
import { toCsv } from '@/lib/csv';

export async function GET() {
  const user = await getAdminUserOrNull();
  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let households;
  try {
    households = await prisma.household.findMany({
      include: {
        rsvp: true,
        eventResponses: {
          include: { event: true },
          orderBy: { event: { sortOrder: 'asc' } }
        }
      },
      orderBy: { householdName: 'asc' }
    });
  } catch (error) {
    if (!shouldUseDevRsvpStore(error)) {
      return NextResponse.json({ error: 'Unable to export RSVP data.' }, { status: 500 });
    }

    const snapshot = await getAdminSnapshotFromDevStore();
    households = snapshot.households;
  }

  const rows = households.map((household) => {
    const row: Record<string, string | number | boolean | null | undefined> = {
      householdName: household.householdName,
      code: household.code,
      maxGuests: household.maxGuests,
      contactEmail: household.contactEmail,
      submittedAt: household.rsvp?.submittedAt?.toISOString(),
      guestName: household.rsvp?.guestName,
      bringingPlusOne: household.rsvp?.bringingPlusOne ?? false,
      plusOneName: household.rsvp?.plusOneName,
      dietaryNotes: household.rsvp?.dietaryNotes,
      transportMode: household.rsvp?.transportMode,
      songRequestsText: household.rsvp?.karaokeSongsText,
      messageToCouple: household.rsvp?.messageToCouple
    };

    for (const response of household.eventResponses) {
      row[`${response.event.slug}_attending`] = response.attending;
      row[`${response.event.slug}_count`] = response.attendeeCount;
    }

    return row;
  });

  const csv = toCsv(rows);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="rsvp-export-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}
