import { useParams, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { useRSVPs } from '@/hooks/use-rsvps';
import { useCheckIns } from '@/hooks/use-check-ins';

export function EventOverviewPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const eid = eventId ?? '';
  const { data: event, isLoading, error } = useEvent(eid);
  const { data: guests } = useGuests(eid);
  const { data: tables } = useTables(eid);
  const { data: rsvps } = useRSVPs(eid);
  const { data: checkIns } = useCheckIns(eid);

  if (isLoading) return <div className="page">Loading...</div>;
  if (error || !event) return <div className="page">Event not found.</div>;

  const totalGuests = guests?.length ?? 0;
  const totalCapacity = (tables ?? []).reduce((sum, t) => sum + t.capacity, 0);
  const seated = (guests ?? []).filter((g) => g.table_id).length;

  const attending = (rsvps ?? []).filter(
    (r) => r.status === 'attending',
  ).length;

  const checkedIn = checkIns?.length ?? 0;
  const checkInPct = totalGuests > 0 ? (checkedIn / totalGuests) * 100 : 0;

  const seatingPct = totalGuests > 0 ? (seated / totalGuests) * 100 : 0;
  const capacityPct =
    totalCapacity > 0 ? (totalGuests / totalCapacity) * 100 : 0;

  return (
    <div className="page">
      <div className="page__header">
        <h1>{event.name} — Overview</h1>
      </div>

      <div className="overview__layout">
        <div className="overview__stats-grid">
          <div className="overview__stat overview__stat--guests">
            <span className="overview__stat__number">{totalGuests}</span>
            <span className="overview__stat__label">Total Guests</span>
          </div>
          <div className="overview__stat overview__stat--tables">
            <span className="overview__stat__number">
              {tables?.length ?? 0}
            </span>
            <span className="overview__stat__label">Tables</span>
          </div>
          <div className="overview__stat overview__stat--attending">
            <span className="overview__stat__number">{attending}</span>
            <span className="overview__stat__label">Attending</span>
          </div>
          <div className="overview__stat overview__stat--checked-in">
            <span className="overview__stat__number">{checkedIn}</span>
            <span className="overview__stat__label">Checked In</span>
          </div>
        </div>

        <div className="card overview__progress-card">
          <h2>Progress</h2>

          <div className="overview__progress">
            <div className="overview__progress-header">
              <span className="overview__progress-label">Seating</span>
              <span className="overview__progress-value">
                {seated}/{totalGuests} ({seatingPct.toFixed(0)}%)
              </span>
            </div>
            <div className="overview__progress-bar">
              <div
                className="overview__progress-fill overview__progress-fill--primary"
                style={{ width: `${seatingPct}%` }}
              />
            </div>
          </div>

          <div className="overview__progress">
            <div className="overview__progress-header">
              <span className="overview__progress-label">Capacity</span>
              <span className="overview__progress-value">
                {totalGuests}/{totalCapacity} ({capacityPct.toFixed(0)}%)
              </span>
            </div>
            <div className="overview__progress-bar">
              <div
                className="overview__progress-fill overview__progress-fill--teal"
                style={{ width: `${Math.min(capacityPct, 100)}%` }}
              />
            </div>
          </div>

          <div className="overview__progress">
            <div className="overview__progress-header">
              <span className="overview__progress-label">Check-in</span>
              <span className="overview__progress-value">
                {checkedIn}/{totalGuests} ({checkInPct.toFixed(0)}%)
              </span>
            </div>
            <div className="overview__progress-bar">
              <div
                className="overview__progress-fill overview__progress-fill--success"
                style={{ width: `${checkInPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="card overview__tables-card">
          <h2>Table Occupancy</h2>
          <div className="overview__tables-grid">
            {(tables ?? []).map((table) => {
              const count = (guests ?? []).filter(
                (g) => g.table_id === table.id,
              ).length;
              const pct =
                table.capacity > 0 ? (count / table.capacity) * 100 : 0;
              const isFull = count >= table.capacity;
              return (
                <div
                  key={table.id}
                  className={`overview__table-item${isFull ? ' overview__table-item--full' : ''}`}
                >
                  <span className="overview__table-item__name">
                    {table.name}
                  </span>
                  <span className="overview__table-item__count">
                    {count}/{table.capacity}
                  </span>
                  <div className="overview__table-item__bar">
                    <div
                      className="overview__table-item__fill"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {(!tables || tables.length === 0) && (
              <p style={{ fontSize: 13, color: '#64748b' }}>No tables yet.</p>
            )}
          </div>
        </div>

        <div className="card overview__actions-card">
          <h2>Quick Actions</h2>
          <div className="overview__actions-grid">
            <Link
              to={`/events/${eid}/guests`}
              className="overview__action overview__action--guests"
            >
              <span className="overview__action__icon">👥</span>
              <span className="overview__action__label">Manage Guests</span>
            </Link>
            <Link
              to={`/events/${eid}/seating`}
              className="overview__action overview__action--seating"
            >
              <span className="overview__action__icon">🪑</span>
              <span className="overview__action__label">Arrange Seating</span>
            </Link>
            <Link
              to={`/events/${eid}/check-in`}
              className="overview__action overview__action--checkin"
            >
              <span className="overview__action__icon">✅</span>
              <span className="overview__action__label">Check-in</span>
            </Link>
            <Link
              to={`/events/${eid}/analytics`}
              className="overview__action overview__action--analytics"
            >
              <span className="overview__action__icon">📊</span>
              <span className="overview__action__label">Analytics</span>
            </Link>
            <Link
              to={`/events/${eid}/print`}
              className="overview__action overview__action--print"
            >
              <span className="overview__action__icon">🖨️</span>
              <span className="overview__action__label">Print Chart</span>
            </Link>
            <Link
              to={`/events/${eid}`}
              className="overview__action overview__action--settings"
            >
              <span className="overview__action__icon">⚙️</span>
              <span className="overview__action__label">Settings</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
