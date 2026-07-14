import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { useRSVPs } from '@/hooks/use-rsvps';
import { LoadingScreen, ErrorScreen } from '@/components/ui/feedback';

export function EventOverviewPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading: eventLoading } = useEvent(eventId ?? '');
  const { data: guests, isLoading: guestsLoading } = useGuests(eventId ?? '');
  const { data: tables, isLoading: tablesLoading } = useTables(eventId ?? '');
  const { data: rsvps, isLoading: rsvpsLoading } = useRSVPs(eventId ?? '');

  const stats = useMemo(() => {
    const totalGuests = guests?.length ?? 0;
    const totalTables = tables?.length ?? 0;
    const totalCapacity = tables?.reduce((sum, t) => sum + t.capacity, 0) ?? 0;
    const assignedGuests =
      guests?.filter((g) => g.table_id !== null).length ?? 0;
    const unassignedGuests = totalGuests - assignedGuests;

    const attending =
      rsvps?.filter((r) => r.status === 'attending').length ?? 0;
    const declined =
      rsvps?.filter((r) => r.status === 'not_attending').length ?? 0;
    const maybe = rsvps?.filter((r) => r.status === 'maybe').length ?? 0;
    const rsvpedIds = new Set(rsvps?.map((r) => r.guest_id) ?? []);
    const pending = totalGuests - rsvpedIds.size;
    const totalPlusOnes =
      rsvps?.reduce((sum, r) => sum + (r.plus_ones ?? 0), 0) ?? 0;
    const totalAttendingWithPlusOnes = attending + totalPlusOnes;

    const seatingProgress =
      totalGuests > 0 ? Math.round((assignedGuests / totalGuests) * 100) : 0;
    const rsvpProgress =
      totalGuests > 0
        ? Math.round(((attending + declined + maybe) / totalGuests) * 100)
        : 0;
    const capacityUtilization =
      totalCapacity > 0
        ? Math.round((totalAttendingWithPlusOnes / totalCapacity) * 100)
        : 0;

    return {
      totalGuests,
      totalTables,
      totalCapacity,
      assignedGuests,
      unassignedGuests,
      attending,
      declined,
      maybe,
      pending,
      totalPlusOnes,
      totalAttendingWithPlusOnes,
      seatingProgress,
      rsvpProgress,
      capacityUtilization,
    };
  }, [guests, tables, rsvps]);

  const tableOccupancy = useMemo(() => {
    if (!tables || !guests) return [];
    const counts = new Map<string, number>();
    for (const g of guests) {
      if (g.table_id) {
        counts.set(g.table_id, (counts.get(g.table_id) ?? 0) + 1);
      }
    }
    return tables.map((t) => ({
      ...t,
      occupied: counts.get(t.id) ?? 0,
      utilization: Math.round(((counts.get(t.id) ?? 0) / t.capacity) * 100),
    }));
  }, [tables, guests]);

  if (eventLoading || guestsLoading || tablesLoading || rsvpsLoading)
    return <LoadingScreen message="Loading overview…" />;
  if (!event) return <ErrorScreen message="Event not found." />;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <Link
            to={`/events/${eventId}`}
            className="text-secondary"
            style={{ fontSize: '0.875rem' }}
          >
            ← Event settings
          </Link>
          <h1 style={{ marginTop: 'var(--space-2)' }}>Overview</h1>
          <p className="text-secondary">{event.name}</p>
        </div>
        <div className="flex gap-3">
          <Link to={`/events/${eventId}/guests`} className="btn btn--secondary">
            Guests
          </Link>
          <Link
            to={`/events/${eventId}/seating`}
            className="btn btn--secondary"
          >
            Seating
          </Link>
        </div>
      </div>

      <div className="overview__layout">
        {/* Stat cards */}
        <div className="overview__stats-grid">
          <StatCard label="Total Guests" value={stats.totalGuests} icon="👥" />
          <StatCard label="Tables" value={stats.totalTables} icon="🍽" />
          <StatCard
            label="Attending"
            value={stats.attending}
            sublabel={`+${stats.totalPlusOnes} plus ones`}
            color="success"
            icon="✓"
          />
          <StatCard
            label="Declined"
            value={stats.declined}
            color="error"
            icon="✕"
          />
          <StatCard
            label="Pending RSVP"
            value={stats.pending}
            color="warning"
            icon="⏳"
          />
          <StatCard
            label="Unassigned"
            value={stats.unassignedGuests}
            icon="📍"
          />
        </div>

        {/* Progress bars */}
        <div className="card overview__progress-card">
          <h3 style={{ marginBottom: 'var(--space-5)' }}>Progress</h3>
          <ProgressBar
            label="Seating Assignment"
            value={stats.seatingProgress}
            color="var(--primary)"
            detail={`${stats.assignedGuests} / ${stats.totalGuests} guests seated`}
          />
          <ProgressBar
            label="RSVP Responses"
            value={stats.rsvpProgress}
            color="var(--success)"
            detail={`${stats.totalGuests - stats.pending} / ${stats.totalGuests} responses`}
          />
          <ProgressBar
            label="Capacity Utilization"
            value={stats.capacityUtilization}
            color={
              stats.capacityUtilization > 90
                ? 'var(--error)'
                : stats.capacityUtilization > 75
                  ? 'var(--warning)'
                  : 'var(--primary)'
            }
            detail={`${stats.totalAttendingWithPlusOnes} / ${stats.totalCapacity} expected attendees`}
          />
        </div>

        {/* Table occupancy */}
        {tableOccupancy.length > 0 && (
          <div className="card overview__tables-card">
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Table Occupancy</h3>
            <div className="overview__tables-grid">
              {tableOccupancy.map((t) => (
                <div
                  key={t.id}
                  className={`overview__table-item ${
                    t.utilization > 100
                      ? 'overview__table-item--over'
                      : t.utilization === 100
                        ? 'overview__table-item--full'
                        : ''
                  }`}
                >
                  <div className="overview__table-item__header">
                    <span className="overview__table-item__name">{t.name}</span>
                    <span className="overview__table-item__number">
                      #{t.number}
                    </span>
                  </div>
                  <div className="overview__table-item__bar">
                    <div
                      className="overview__table-item__bar-fill"
                      style={{
                        width: `${Math.min(t.utilization, 100)}%`,
                        background:
                          t.utilization > 100
                            ? 'var(--error)'
                            : t.utilization === 100
                              ? 'var(--warning)'
                              : 'var(--primary)',
                      }}
                    />
                  </div>
                  <span className="overview__table-item__count">
                    {t.occupied}/{t.capacity}
                    {t.utilization > 100 && ' (over capacity)'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="card overview__actions-card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Quick Actions</h3>
          <div className="overview__actions-grid">
            <Link to={`/events/${eventId}/guests`} className="overview__action">
              <span className="overview__action__icon">📝</span>
              <span className="overview__action__label">Manage Guests</span>
            </Link>
            <Link
              to={`/events/${eventId}/seating`}
              className="overview__action"
            >
              <span className="overview__action__icon">🪑</span>
              <span className="overview__action__label">Arrange Seating</span>
            </Link>
            <Link to={`/events/${eventId}`} className="overview__action">
              <span className="overview__action__icon">⚙</span>
              <span className="overview__action__label">Event Settings</span>
            </Link>
            <Link to={`/e/${event.slug}`} className="overview__action">
              <span className="overview__action__icon">🔍</span>
              <span className="overview__action__label">Find Your Seat</span>
            </Link>
            {event.invitation_enabled && (
              <Link to={`/invite/${event.slug}`} className="overview__action">
                <span className="overview__action__icon">✉</span>
                <span className="overview__action__label">Invitation</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  color,
  icon,
}: {
  label: string;
  value: number;
  sublabel?: string;
  color?: 'success' | 'error' | 'warning';
  icon: string;
}) {
  const colorClass = color ? `overview__stat--${color}` : '';
  return (
    <div className={`card overview__stat ${colorClass}`}>
      <div className="overview__stat__icon">{icon}</div>
      <div className="overview__stat__value">{value}</div>
      <div className="overview__stat__label">{label}</div>
      {sublabel && <div className="overview__stat__sublabel">{sublabel}</div>}
    </div>
  );
}

function ProgressBar({
  label,
  value,
  color,
  detail,
}: {
  label: string;
  value: number;
  color: string;
  detail: string;
}) {
  return (
    <div className="overview__progress">
      <div className="overview__progress__header">
        <span className="overview__progress__label">{label}</span>
        <span className="overview__progress__value">{value}%</span>
      </div>
      <div className="overview__progress__bar">
        <div
          className="overview__progress__fill"
          style={{ width: `${Math.min(value, 100)}%`, background: color }}
        />
      </div>
      <span className="overview__progress__detail">{detail}</span>
    </div>
  );
}
