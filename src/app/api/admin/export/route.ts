import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';
import { toCsv } from '@/lib/csv';

export async function GET() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (env.ADMIN_ALLOWED_EMAILS.length > 0 && !env.ADMIN_ALLOWED_EMAILS.includes(user.email.toLowerCase())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const households = await prisma.household.findMany({
    include: {
      rsvp: true,
      eventResponses: {
        include: { event: true },
        orderBy: { event: { sortOrder: 'asc' } }
      }
    },
    orderBy: { householdName: 'asc' }
  });

  const rows = households.map((household) => {
    const row: Record<string, string | number | boolean | null | undefined> = {
      householdName: household.householdName,
      code: household.code,
      maxGuests: household.maxGuests,
      contactEmail: household.contactEmail,
      submittedAt: household.rsvp?.submittedAt?.toISOString(),
      plushieCount: household.rsvp?.plushieCount ?? 0,
      karaokeSongsText: household.rsvp?.karaokeSongsText,
      dietaryNotes: household.rsvp?.dietaryNotes
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
