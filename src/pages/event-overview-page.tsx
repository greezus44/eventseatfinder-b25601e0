import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { useRSVPs } from '@/hooks/use-rsvps';
import { LoadingScreen, ErrorScreen } from '@/components/ui/feedback';
import type { Table } from '@/types/table';
import type { GuestWithTable } from '@/types/guest';

function StatCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: number | string;
  variant?: 'primary' | 'success' | 'warning' | 'error';
}) {
  const variantClass = variant ? `overview__stat--${variant}` : '';
  return (
    <div className={`overview__stat ${variantClass}`}>
      <span className="overview__stat-value">{value}</span>
      <span className="overview__stat-label">{label}</span>
    </div>
  );
}

function ProgressBar({
  label,
  percent,
  color,
}: {
  label: string;
  percent: number;
  color: string;
}) {
  return (
    <div className="overview__progress">
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
          {Math.round(percent)}%
        </span>
      </div>
      <div
        style={{
          height: '8px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.min(100, percent)}%`,
            height: '100%',
            background: color,
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

function getCapacityColor(used: number, capacity: number): string {
  if (capacity === 0) return 'var(--muted)';
  const ratio = used / capacity;
  if (ratio > 1) return 'var(--error)';
  if (ratio >= 0.9) return 'var(--warning)';
  return 'var(--success)';
}

function TableOccupancyGrid({
  tables,
  guestsByTable,
}: {
  tables: Table[];
  guestsByTable: Map<string, GuestWithTable[]>;
}) {
  if (tables.length === 0) {
    return <p className="text-muted">No tables created yet.</p>;
  }

  return (
    <div className="overview__tables-grid">
      {tables.map((table) => {
        const tableGuests = guestsByTable.get(table.id) ?? [];
        const occupancy =
          table.capacity > 0 ? (tableGuests.length / table.capacity) * 100 : 0;
        const isOverCapacity = tableGuests.length > table.capacity;
        const color = getCapacityColor(tableGuests.length, table.capacity);

        return (
          <div key={table.id} className="overview__table-item">
            <div
              className="flex"
              style={{
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-2)',
              }}
            >
              <div>
                <span style={{ fontWeight: 600 }}>Table {table.number}</span>
                {table.name && (
                  <span
                    className="text-muted"
                    style={{
                      marginLeft: 'var(--space-1)',
                      fontSize: '0.8125rem',
                    }}
                  >
                    {table.name}
                  </span>
                )}
              </div>
              <span
                className={
                  isOverCapacity ? 'badge badge--error' : 'badge badge--info'
                }
              >
                {tableGuests.length}/{table.capacity}
              </span>
            </div>
            <div
              style={{
                height: '6px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, occupancy)}%`,
                  height: '100%',
                  background: color,
                  borderRadius: 'var(--radius-full)',
                }}
              />
            </div>
            {isOverCapacity && (
              <p
                style={{
                  color: 'var(--error)',
                  fontSize: '0.75rem',
                  marginTop: 'var(--space-1)',
                }}
              >
                ⚠ Over capacity by {tableGuests.length - table.capacity}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function EventOverviewPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const {
    data: event,
    isLoading: eventLoading,
    error: eventError,
  } = useEvent(eventId ?? '');
  const {
    data: guests,
    isLoading: guestsLoading,
    error: guestsError,
  } = useGuests(eventId ?? '');
  const {
    data: tables,
    isLoading: tablesLoading,
    error: tablesError,
  } = useTables(eventId ?? '');
  const {
    data: rsvps,
    isLoading: rsvpsLoading,
    error: rsvpsError,
  } = useRSVPs(eventId ?? '');

  const stats = useMemo(() => {
    const totalGuests = guests?.length ?? 0;
    const totalTables = tables?.length ?? 0;
    const attending =
      rsvps?.filter((r) => r.status === 'attending').length ?? 0;
    const declined =
      rsvps?.filter((r) => r.status === 'not_attending').length ?? 0;
    const pending = totalGuests - attending - declined;
    const unassigned = guests?.filter((g) => !g.table_id).length ?? 0;
    const seated = totalGuests - unassigned;
    const totalCapacity = tables?.reduce((sum, t) => sum + t.capacity, 0) ?? 0;
    const plusOnes = rsvps?.reduce((sum, r) => sum + r.plus_ones, 0) ?? 0;

    return {
      totalGuests,
      totalTables,
      attending,
      declined,
      pending,
      unassigned,
      seated,
      totalCapacity,
      plusOnes,
    };
  }, [guests, tables, rsvps]);

  const guestsByTable = useMemo(() => {
    const map = new Map<string, GuestWithTable[]>();
    for (const guest of guests ?? []) {
      if (guest.table_id) {
        const list = map.get(guest.table_id) ?? [];
        list.push(guest);
        map.set(guest.table_id, list);
      }
    }
    return map;
  }, [guests]);

  const seatingPercent =
    stats.totalGuests > 0 ? (stats.seated / stats.totalGuests) * 100 : 0;
  const rsvpPercent =
    stats.totalGuests > 0
      ? ((stats.attending + stats.declined) / stats.totalGuests) * 100
      : 0;
  const capacityPercent =
    stats.totalCapacity > 0 ? (stats.seated / stats.totalCapacity) * 100 : 0;

  const isLoading =
    eventLoading || guestsLoading || tablesLoading || rsvpsLoading;
  const error = eventError ?? guestsError ?? tablesError ?? rsvpsError;

  if (isLoading) return <LoadingScreen message="Loading overview..." />;
  if (error) return <ErrorScreen message={error.message} />;
  if (!event) return <ErrorScreen message="Event not found" />;

  const capacityColor = getCapacityColor(stats.seated, stats.totalCapacity);

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <Link
            to={`/events/${eventId}`}
            className="btn btn--ghost btn--sm"
            style={{ marginBottom: 'var(--space-1)' }}
          >
            ← Back to Event
          </Link>
          <h1>{event.name} — Overview</h1>
        </div>
      </div>

      <div className="page__body">
        <div className="overview__layout">
          <div className="overview__stats-grid">
            <StatCard label="Total Guests" value={stats.totalGuests} />
            <StatCard label="Tables" value={stats.totalTables} />
            <StatCard
              label="Attending"
              value={stats.attending}
              variant="success"
            />
            <StatCard label="Declined" value={stats.declined} variant="error" />
            <StatCard
              label="Pending RSVP"
              value={stats.pending}
              variant="warning"
            />
            <StatCard
              label="Unassigned"
              value={stats.unassigned}
              variant="warning"
            />
          </div>

          <div
            className="overview__progress-card card"
            style={{ padding: 'var(--space-5)' }}
          >
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Progress</h3>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
              }}
            >
              <ProgressBar
                label="Seating"
                percent={seatingPercent}
                color={
                  seatingPercent >= 100 ? 'var(--success)' : 'var(--primary)'
                }
              />
              <ProgressBar
                label="RSVP Response"
                percent={rsvpPercent}
                color={
                  rsvpPercent >= 75
                    ? 'var(--success)'
                    : rsvpPercent >= 50
                      ? 'var(--warning)'
                      : 'var(--error)'
                }
              />
              <ProgressBar
                label="Capacity Utilization"
                percent={capacityPercent}
                color={capacityColor}
              />
            </div>
          </div>

          <div
            className="overview__tables-card card"
            style={{ padding: 'var(--space-5)' }}
          >
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Table Occupancy</h3>
            <TableOccupancyGrid
              tables={tables ?? []}
              guestsByTable={guestsByTable}
            />
          </div>

          <div
            className="overview__actions-card card"
            style={{ padding: 'var(--space-5)' }}
          >
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Quick Actions</h3>
            <div className="overview__actions-grid">
              <Link
                to={`/events/${eventId}/guests`}
                className="overview__action"
              >
                <span style={{ fontSize: '1.5rem' }}>👥</span>
                <span>Manage Guests</span>
              </Link>
              <Link
                to={`/events/${eventId}/seating`}
                className="overview__action"
              >
                <span style={{ fontSize: '1.5rem' }}>🪑</span>
                <span>Seating</span>
              </Link>
              <Link to={`/events/${eventId}`} className="overview__action">
                <span style={{ fontSize: '1.5rem' }}>⚙️</span>
                <span>Settings</span>
              </Link>
              <Link to={`/e/${event.slug}`} className="overview__action">
                <span style={{ fontSize: '1.5rem' }}>🔍</span>
                <span>Find Your Seat</span>
              </Link>
              {event.invitation_enabled && (
                <Link to={`/invite/${event.slug}`} className="overview__action">
                  <span style={{ fontSize: '1.5rem' }}>✉️</span>
                  <span>Invitation</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
