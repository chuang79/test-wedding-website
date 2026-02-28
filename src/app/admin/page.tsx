import Link from 'next/link';
import { requireAdminUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const user = await requireAdminUser();

  const [households, events, totalRsvps] = await Promise.all([
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
              <th align="left">Plushies</th>
              <th align="left">Songs</th>
            </tr>
          </thead>
          <tbody>
            {households.map((household) => (
              <tr key={household.id}>
                <td>{household.householdName}</td>
                <td>{household.code}</td>
                <td>{household.rsvp?.submittedAt ? new Date(household.rsvp.submittedAt).toLocaleString() : '-'}</td>
                <td>{household.rsvp?.plushieCount ?? 0}</td>
                <td>{household.rsvp?.karaokeSongsText ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
