import Link from 'next/link';
import { requireAdminUser } from '@/lib/auth';
import { getAdminSnapshotFromDevStore, shouldUseDevRsvpStore } from '@/lib/dev-rsvp-store';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const user = await requireAdminUser();

  let households;
  let events;
  let totalRsvps;

  try {
    [households, events, totalRsvps] = await Promise.all([
      prisma.household.findMany({
        include: {
          rsvp: true,
          eventResponses: {
            include: { event: true },
            orderBy: { event: { sortOrder: 'asc' } }
          }
        },
        orderBy: { householdName: 'asc' }
      }),
      prisma.event.findMany({ where: { enabled: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.householdRsvp.count()
    ]);
  } catch (error) {
    if (!shouldUseDevRsvpStore(error)) {
      throw error;
    }

    const snapshot = await getAdminSnapshotFromDevStore();
    households = snapshot.households;
    events = snapshot.events;
    totalRsvps = snapshot.totalRsvps;
  }

  return (
    <main className="stack">
      <section className="card stack hero">
        <span className="badge">Admin</span>
        <h1>RSVP Dashboard</h1>
        <p>Signed in as {user.email}</p>
      </section>

      <section className="info-grid">
        <div className="info-pill">
          <span className="info-label">Total households</span>
          <span className="info-value">{households.length}</span>
        </div>
        <div className="info-pill">
          <span className="info-label">Submitted RSVPs</span>
          <span className="info-value">{totalRsvps}</span>
        </div>
        <div className="info-pill">
          <span className="info-label">Completion</span>
          <span className="info-value">
            {households.length > 0 ? Math.round((totalRsvps / households.length) * 100) : 0}%
          </span>
        </div>
      </section>

      <section className="card stack">
        <h2>Attendance by Event</h2>
        <div className="event-grid">
          {events.map((event) => {
            const attendingCount = households.reduce((sum, household) => {
              const item = household.eventResponses.find((response) => response.eventId === event.id);
              return sum + (item?.attendeeCount ?? 0);
            }, 0);

            return (
              <article key={event.id} className="event-card">
                <span className="event-date">{new Date(event.startsAt).toLocaleDateString()}</span>
                <div className="event-title">{event.name}</div>
                <p>{attendingCount} attending</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="card stack" style={{ overflowX: 'auto' }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2>Household Responses</h2>
          <Link className="btn" href="/api/admin/export">
            Export CSV
          </Link>
        </div>

        <table className="site-table">
          <thead>
            <tr>
              <th align="left">Household</th>
              <th align="left">Code</th>
              <th align="left">Submitted</th>
              <th align="left">Guest</th>
              <th align="left">Plus One</th>
              <th align="left">Transport</th>
            </tr>
          </thead>
          <tbody>
            {households.map((household) => (
              <tr key={household.id}>
                <td>{household.householdName}</td>
                <td>{household.code}</td>
                <td>{household.rsvp?.submittedAt ? new Date(household.rsvp.submittedAt).toLocaleString() : '-'}</td>
                <td>{household.rsvp?.guestName ?? '-'}</td>
                <td>{household.rsvp?.bringingPlusOne ? household.rsvp.plusOneName ?? 'Yes' : 'No'}</td>
                <td>{household.rsvp?.transportMode ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
