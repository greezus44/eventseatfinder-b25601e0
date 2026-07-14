import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { useRSVPs } from '@/hooks/use-rsvps';
import { LoadingScreen, ErrorScreen } from '@/components/ui/feedback';
import type { Table } from '@/types/table';
import type { GuestWithTable } from '@/types/guest';

export function EventOverviewPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const eid = eventId ?? '';

  const { data: event, isLoading, error } = useEvent(eid);
  const { data: guests } = useGuests(eid);
  const { data: tables } = useTables(eid);
  const { data: rsvps } = useRSVPs(eid);

  const stats = useMemo(() => {
    const totalGuests = guests?.length ?? 0;
    const totalTables = tables?.length ?? 0;
    const attending =
      rsvps?.filter((r) => r.status === 'attending').length ?? 0;
    const declined =
      rsvps?.filter((r) => r.status === 'not_attending').length ?? 0;
    const pending = totalGuests - attending - declined;
    const unassigned = guests?.filter((g) => !g.table_id).length ?? 0;
    return {
      totalGuests,
      totalTables,
      attending,
      declined,
      pending,
      unassigned,
    };
  }, [guests, tables, rsvps]);

  const seatingPct =
    stats.totalGuests > 0
      ? Math.round(
          ((stats.totalGuests - stats.unassigned) / stats.totalGuests) * 100,
        )
      : 0;

  const rsvpResponsePct =
    stats.totalGuests > 0
      ? Math.round(
          ((stats.attending + stats.declined) / stats.totalGuests) * 100,
        )
      : 0;

  const totalCapacity = tables?.reduce((sum, t) => sum + t.capacity, 0) ?? 0;
  const capacityPct =
    totalCapacity > 0 ? Math.round((stats.attending / totalCapacity) * 100) : 0;

  if (isLoading) return <LoadingScreen message="Loading overview..." />;
  if (error) return <ErrorScreen message="Failed to load overview." />;
  if (!event) return <ErrorScreen message="Event not found." />;

  const barColor = (pct: number) => {
    if (pct >= 90) return 'var(--error, #dc2626)';
    if (pct >= 75) return 'var(--warning, #f59e0b)';
    return 'var(--success, #16a34a)';
  };

  return (
    <div className="page">
      <div className="page__header">
        <Link
          to={`/events/${eid}`}
          className="text-secondary"
          style={{
            fontSize: '0.875rem',
            marginBottom: 'var(--space-2)',
            display: 'inline-block',
          }}
        >
          ← Back to Event Settings
        </Link>
        <h1>Overview · {event.name}</h1>
      </div>
      <div className="page__body">
        <div className="overview__layout">
          <div className="overview__stats-grid">
            <div
              className="overview__stat card"
              style={{ padding: 'var(--space-4)' }}
            >
              <div
                className="text-muted"
                style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}
              >
                Total Guests
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                {stats.totalGuests}
              </div>
            </div>
            <div
              className="overview__stat card"
              style={{ padding: 'var(--space-4)' }}
            >
              <div
                className="text-muted"
                style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}
              >
                Tables
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                {stats.totalTables}
              </div>
            </div>
            <div
              className="overview__stat card"
              style={{ padding: 'var(--space-4)' }}
            >
              <div
                className="text-muted"
                style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}
              >
                Attending
              </div>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: 'var(--success, #16a34a)',
                }}
              >
                {stats.attending}
              </div>
            </div>
            <div
              className="overview__stat card"
              style={{ padding: 'var(--space-4)' }}
            >
              <div
                className="text-muted"
                style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}
              >
                Declined
              </div>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: 'var(--error, #dc2626)',
                }}
              >
                {stats.declined}
              </div>
            </div>
            <div
              className="overview__stat card"
              style={{ padding: 'var(--space-4)' }}
            >
              <div
                className="text-muted"
                style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}
              >
                Pending RSVP
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                {stats.pending}
              </div>
            </div>
            <div
              className="overview__stat card"
              style={{ padding: 'var(--space-4)' }}
            >
              <div
                className="text-muted"
                style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}
              >
                Unassigned
              </div>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: 'var(--warning, #f59e0b)',
                }}
              >
                {stats.unassigned}
              </div>
            </div>
          </div>

          <div
            className="overview__progress-card card"
            style={{ padding: 'var(--space-5)' }}
          >
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Progress</h3>
            <ProgressBar
              label="Seating"
              pct={seatingPct}
              color="var(--primary)"
            />
            <ProgressBar
              label="RSVP Response"
              pct={rsvpResponsePct}
              color="var(--primary)"
            />
            <ProgressBar
              label="Capacity Utilization"
              pct={capacityPct}
              color={barColor(capacityPct)}
            />
          </div>

          <div
            className="overview__tables-card card"
            style={{ padding: 'var(--space-5)' }}
          >
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Table Occupancy</h3>
            {tables && tables.length === 0 ? (
              <p className="text-muted">No tables yet.</p>
            ) : (
              <div className="overview__tables-grid">
                {tables?.map((table) => (
                  <TableOccupancyItem
                    key={table.id}
                    table={table}
                    guests={guests ?? []}
                  />
                ))}
              </div>
            )}
          </div>

          <div
            className="overview__actions-card card"
            style={{ padding: 'var(--space-5)' }}
          >
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Quick Actions</h3>
            <div className="overview__actions-grid">
              <Link
                to={`/events/${eid}/guests`}
                className="overview__action btn btn--secondary"
              >
                Manage Guests
              </Link>
              <Link
                to={`/events/${eid}/seating`}
                className="overview__action btn btn--secondary"
              >
                Seating
              </Link>
              <Link
                to={`/events/${eid}`}
                className="overview__action btn btn--secondary"
              >
                Settings
              </Link>
              <Link
                to={`/e/${event.slug}`}
                className="overview__action btn btn--secondary"
              >
                Find Seat
              </Link>
              {event.invitation_enabled && (
                <Link
                  to={`/invite/${event.slug}`}
                  className="overview__action btn btn--secondary"
                >
                  Invitation
                </Link>
              )}
              <Link
                to={`/events/${eid}/check-in`}
                className="overview__action btn btn--secondary"
              >
                Check-in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
  return (
    <div
      className="overview__progress"
      style={{ marginBottom: 'var(--space-3)' }}
    >
      <div
        className="flex"
        style={{
          justifyContent: 'space-between',
          marginBottom: 'var(--space-1)',
        }}
      >
        <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
          {label}
        </span>
        <span className="text-muted" style={{ fontSize: '0.875rem' }}>
          {pct}%
        </span>
      </div>
      <div
        style={{
          height: 8,
          background: 'var(--border)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            borderRadius: 4,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

function TableOccupancyItem({
  table,
  guests,
}: {
  table: Table;
  guests: GuestWithTable[];
}) {
  const count = guests.filter((g) => g.table_id === table.id).length;
  const pct =
    table.capacity > 0 ? Math.round((count / table.capacity) * 100) : 0;
  const overCapacity = count > table.capacity;

  return (
    <div
      className="overview__table-item"
      style={{
        padding: 'var(--space-3)',
        border: '1px solid var(--border)',
        borderRadius: 8,
      }}
    >
      <div
        className="flex"
        style={{
          justifyContent: 'space-between',
          marginBottom: 'var(--space-1)',
        }}
      >
        <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>
          {table.name} #{table.number}
        </span>
        <span
          className="text-muted"
          style={{
            fontSize: '0.875rem',
            color: overCapacity ? 'var(--error, #dc2626)' : undefined,
            fontWeight: overCapacity ? 600 : undefined,
          }}
        >
          {count}/{table.capacity}
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: 'var(--border)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.min(pct, 100)}%`,
            height: '100%',
            background: overCapacity
              ? 'var(--error, #dc2626)'
              : 'var(--primary)',
            borderRadius: 3,
          }}
        />
      </div>
      {overCapacity && (
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--error, #dc2626)',
            marginTop: 'var(--space-1)',
          }}
        >
          ⚠ Over capacity
        </div>
      )}
    </div>
  );
}
