import { Link, useParams } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { useRSVPs } from '@/hooks/use-rsvps';
import { useCheckIns } from '@/hooks/use-check-ins';
import { LoadingScreen, ErrorScreen } from '@/components/ui/feedback';
import type { GuestWithTable } from '@/types/guest';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Date TBD';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function EventOverviewPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const id = eventId ?? '';

  const { data: event, isLoading } = useEvent(id);
  const { data: guests } = useGuests(id);
  const { data: tables } = useTables(id);
  const { data: rsvps } = useRSVPs(id);
  const { data: checkIns } = useCheckIns(id);

  if (isLoading) return <LoadingScreen label="Loading overview…" />;

  if (!event) {
    return (
      <div className="page">
        <ErrorScreen message="Event not found" />
        <Link to="/" className="btn btn--secondary btn--sm">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const guestList = guests ?? [];
  const tableList = tables ?? [];
  const rsvpList = rsvps ?? [];
  const checkInList = checkIns ?? [];

  const totalGuests = guestList.length;
  const totalTables = tableList.length;
  const totalCapacity = tableList.reduce((sum, t) => sum + t.capacity, 0);
  const attendingCount = rsvpList.filter(
    (r) => r.status === 'attending',
  ).length;
  const checkedInCount = checkInList.length;
  const respondedCount = rsvpList.length;
  const pendingCount = totalGuests - respondedCount;

  const assignedGuests = guestList.filter((g) => g.table_id !== null).length;
  const seatingPct =
    totalGuests > 0 ? Math.round((assignedGuests / totalGuests) * 100) : 0;
  const rsvpPct =
    totalGuests > 0 ? Math.round((respondedCount / totalGuests) * 100) : 0;
  const checkInPct =
    totalGuests > 0 ? Math.round((checkedInCount / totalGuests) * 100) : 0;

  const guestsByTable = new Map<string, GuestWithTable[]>();
  for (const g of guestList) {
    if (!g.table_id) continue;
    const arr = guestsByTable.get(g.table_id) ?? [];
    arr.push(g);
    guestsByTable.set(g.table_id, arr);
  }

  const quickActions = [
    { label: 'Edit Settings', to: `/events/${id}`, icon: '⚙' },
    { label: 'Manage Guests', to: `/events/${id}/guests`, icon: '👥' },
    { label: 'Arrange Seating', to: `/events/${id}/seating`, icon: '🪑' },
    { label: 'Check-in', to: `/events/${id}/check-in`, icon: '✓' },
    { label: 'Analytics', to: `/events/${id}/analytics`, icon: '📊' },
    { label: 'Print Chart', to: `/events/${id}/print`, icon: '🖨' },
    { label: 'Print Guest List', to: `/events/${id}/print/guests`, icon: '📋' },
  ];

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Overview</h1>
          <p className="text-secondary">
            {event.name} · {formatDate(event.date)}
            {event.venue ? ` · ${event.venue}` : ''}
          </p>
        </div>
        <Link to="/" className="btn btn--ghost btn--sm">
          Back
        </Link>
      </div>

      <div className="overview__layout">
        <div className="overview__stats-grid">
          <div className="overview__stat card">
            <div className="overview__stat__icon">👥</div>
            <div className="overview__stat__value">{totalGuests}</div>
            <div className="overview__stat__label">Total Guests</div>
            <div className="overview__stat__sublabel">
              {assignedGuests} seated
            </div>
          </div>
          <div className="overview__stat card">
            <div className="overview__stat__icon">🪑</div>
            <div className="overview__stat__value">{totalTables}</div>
            <div className="overview__stat__label">Tables</div>
            <div className="overview__stat__sublabel">
              {totalCapacity} capacity
            </div>
          </div>
          <div className="overview__stat card">
            <div className="overview__stat__icon">🏛</div>
            <div className="overview__stat__value">{totalCapacity}</div>
            <div className="overview__stat__label">Total Capacity</div>
            <div className="overview__stat__sublabel">
              {totalGuests > 0
                ? totalCapacity >= totalGuests
                  ? 'Fits all guests'
                  : `${totalCapacity - totalGuests} short`
                : '—'}
            </div>
          </div>
          <div className="overview__stat overview__stat--success card">
            <div className="overview__stat__icon">✓</div>
            <div className="overview__stat__value">{attendingCount}</div>
            <div className="overview__stat__label">Attending</div>
            <div className="overview__stat__sublabel">RSVP confirmed</div>
          </div>
          <div className="overview__stat overview__stat--success card">
            <div className="overview__stat__icon">🎟</div>
            <div className="overview__stat__value">{checkedInCount}</div>
            <div className="overview__stat__label">Checked In</div>
            <div className="overview__stat__sublabel">
              {totalGuests > 0 ? `${checkInPct}% of guests` : '—'}
            </div>
          </div>
          <div className="overview__stat overview__stat--warning card">
            <div className="overview__stat__icon">⏳</div>
            <div className="overview__stat__value">{pendingCount}</div>
            <div className="overview__stat__label">RSVP Pending</div>
            <div className="overview__stat__sublabel">
              {totalGuests > 0 ? `${rsvpPct}% responded` : '—'}
            </div>
          </div>
        </div>

        <div className="overview__progress-card card">
          <h2>Progress</h2>
          <div className="overview__progress">
            <div className="overview__progress__header">
              <span className="overview__progress__label">Seating</span>
              <span className="overview__progress__value">{seatingPct}%</span>
            </div>
            <div className="overview__progress__bar">
              <div
                className="overview__progress__fill"
                style={{ width: `${seatingPct}%` }}
              />
            </div>
            <div className="overview__progress__detail">
              {assignedGuests} of {totalGuests} guests assigned
            </div>
          </div>
          <div className="overview__progress">
            <div className="overview__progress__header">
              <span className="overview__progress__label">RSVP Response</span>
              <span className="overview__progress__value">{rsvpPct}%</span>
            </div>
            <div className="overview__progress__bar">
              <div
                className="overview__progress__fill"
                style={{ width: `${rsvpPct}%` }}
              />
            </div>
            <div className="overview__progress__detail">
              {respondedCount} of {totalGuests} responded
            </div>
          </div>
          <div className="overview__progress">
            <div className="overview__progress__header">
              <span className="overview__progress__label">Check-in</span>
              <span className="overview__progress__value">{checkInPct}%</span>
            </div>
            <div className="overview__progress__bar">
              <div
                className="overview__progress__fill"
                style={{ width: `${checkInPct}%` }}
              />
            </div>
            <div className="overview__progress__detail">
              {checkedInCount} of {totalGuests} checked in
            </div>
          </div>
        </div>

        <div className="overview__tables-card card">
          <h2>Table Occupancy</h2>
          {tableList.length === 0 ? (
            <p className="text-secondary">No tables yet.</p>
          ) : (
            <div className="overview__tables-grid">
              {tableList.map((table) => {
                const count = (guestsByTable.get(table.id) ?? []).length;
                const pct =
                  table.capacity > 0
                    ? Math.round((count / table.capacity) * 100)
                    : 0;
                const isOver = count > table.capacity;
                const isFull = count === table.capacity;
                const itemClass = isOver
                  ? 'overview__table-item--over'
                  : isFull
                    ? 'overview__table-item--full'
                    : '';
                return (
                  <div
                    key={table.id}
                    className={`overview__table-item ${itemClass}`.trim()}
                  >
                    <div className="overview__table-item__header">
                      <span className="overview__table-item__name">
                        {table.name}
                      </span>
                      <span className="overview__table-item__number">
                        #{table.number}
                      </span>
                    </div>
                    <div className="overview__table-item__bar">
                      <div
                        className="overview__table-item__bar-fill"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <div className="overview__table-item__count">
                      {count} / {table.capacity}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="overview__actions-card card">
          <h2>Quick Actions</h2>
          <div className="overview__actions-grid">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.to}
                className="overview__action"
              >
                <span className="overview__action__icon">{action.icon}</span>
                <span className="overview__action__label">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
