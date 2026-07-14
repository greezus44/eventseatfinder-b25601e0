import { useParams } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useRSVPs } from '@/hooks/use-rsvps';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { useCheckIns } from '@/hooks/use-check-ins';

export function AnalyticsPage() {
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
  const totalTables = tables?.length ?? 0;
  const totalCapacity = (tables ?? []).reduce((sum, t) => sum + t.capacity, 0);
  const seated = (guests ?? []).filter((g) => g.table_id).length;
  const unassigned = totalGuests - seated;

  const attending = (rsvps ?? []).filter(
    (r) => r.status === 'attending',
  ).length;
  const declined = (rsvps ?? []).filter(
    (r) => r.status === 'not_attending',
  ).length;
  const pending = (rsvps ?? []).filter((r) => r.status === 'maybe').length;
  const noRsvp = totalGuests - attending - declined - pending;

  const checkedIn = (checkIns ?? []).filter((c) => c.checked_in).length;
  const plusOnesTotal = (rsvps ?? []).reduce(
    (sum, r) => sum + (r.status === 'attending' ? r.plus_ones : 0),
    0,
  );

  const seatingPct = totalGuests > 0 ? (seated / totalGuests) * 100 : 0;
  const capacityPct =
    totalCapacity > 0 ? (totalGuests / totalCapacity) * 100 : 0;
  const checkInPct = totalGuests > 0 ? (checkedIn / totalGuests) * 100 : 0;
  const attendingPct = totalGuests > 0 ? (attending / totalGuests) * 100 : 0;

  const rsvpTotal = attending + declined + pending;
  const attendingSlice = rsvpTotal > 0 ? (attending / rsvpTotal) * 100 : 0;
  const declinedSlice = rsvpTotal > 0 ? (declined / rsvpTotal) * 100 : 0;
  const pendingSlice = rsvpTotal > 0 ? (pending / rsvpTotal) * 100 : 0;

  const donutSegments = [
    { value: attendingSlice, color: '#16a34a' },
    { value: declinedSlice, color: '#dc2626' },
    { value: pendingSlice, color: '#f59e0b' },
  ];

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;
  const donutPaths = donutSegments.map((seg) => {
    const dash = (seg.value / 100) * circumference;
    const offset = cumulativeOffset;
    cumulativeOffset += dash;
    return {
      dash,
      offset,
      color: seg.color,
    };
  });

  const insights: { icon: string; text: string; variant: string }[] = [];

  if (unassigned > 0) {
    insights.push({
      icon: '⚠️',
      text: `${unassigned} guest${unassigned > 1 ? 's' : ''} not yet assigned to a table.`,
      variant: 'warning',
    });
  } else if (totalGuests > 0) {
    insights.push({
      icon: '✅',
      text: 'All guests are assigned to tables.',
      variant: 'success',
    });
  }

  if (capacityPct > 90) {
    insights.push({
      icon: '🔴',
      text: `Capacity at ${capacityPct.toFixed(0)}% — consider adding more tables.`,
      variant: 'error',
    });
  } else if (capacityPct < 50 && totalGuests > 0) {
    insights.push({
      icon: '💡',
      text: `Capacity only at ${capacityPct.toFixed(0)}% — plenty of room for more guests.`,
      variant: 'info',
    });
  }

  if (noRsvp > 0) {
    insights.push({
      icon: '⏳',
      text: `${noRsvp} guest${noRsvp > 1 ? 's' : ''} haven't responded to the invitation.`,
      variant: 'warning',
    });
  }

  if (checkInPct === 100 && totalGuests > 0) {
    insights.push({
      icon: '🎉',
      text: 'All guests have checked in!',
      variant: 'success',
    });
  } else if (checkInPct > 0) {
    insights.push({
      icon: '📊',
      text: `${checkedIn} of ${totalGuests} guests checked in (${checkInPct.toFixed(0)}%).`,
      variant: 'info',
    });
  }

  if (plusOnesTotal > 0) {
    insights.push({
      icon: '👥',
      text: `${plusOnesTotal} plus ones expected across attending guests.`,
      variant: 'info',
    });
  }

  const barItems = [
    { label: 'Seating', value: seatingPct, variant: 'primary' },
    { label: 'Capacity', value: capacityPct, variant: 'teal' },
    { label: 'Check-in', value: checkInPct, variant: 'success' },
    { label: 'Attending', value: attendingPct, variant: 'accent' },
  ];

  const barVariant = (variant: string) => {
    switch (variant) {
      case 'primary':
        return 'analytics__bar-fill--primary';
      case 'teal':
        return 'analytics__bar-fill--teal';
      case 'success':
        return 'analytics__bar-fill--success';
      case 'accent':
        return 'analytics__bar-fill--accent';
      case 'warning':
        return 'analytics__bar-fill--warning';
      case 'error':
        return 'analytics__bar-fill--error';
      default:
        return 'analytics__bar-fill--primary';
    }
  };

  return (
    <div className="page">
      <div className="page__header">
        <h1>Analytics — {event.name}</h1>
      </div>

      <div className="analytics__body">
        <div className="analytics__stats-grid">
          <div className="analytics__stat analytics__stat--guests">
            <span className="analytics__stat__number">{totalGuests}</span>
            <span className="analytics__stat__label">Total Guests</span>
          </div>
          <div className="analytics__stat analytics__stat--attending">
            <span className="analytics__stat__number">{attending}</span>
            <span className="analytics__stat__label">Attending</span>
          </div>
          <div className="analytics__stat analytics__stat--checked-in">
            <span className="analytics__stat__number">{checkedIn}</span>
            <span className="analytics__stat__label">Checked In</span>
          </div>
          <div className="analytics__stat analytics__stat--tables">
            <span className="analytics__stat__number">{totalTables}</span>
            <span className="analytics__stat__label">Tables</span>
          </div>
        </div>

        <div className="analytics__charts">
          <div className="card analytics__chart-card">
            <h2 className="analytics__chart-title">RSVP Breakdown</h2>
            <div className="analytics__donut-wrapper">
              <svg
                className="analytics__donut"
                width={160}
                height={160}
                viewBox="0 0 160 160"
              >
                <circle
                  cx={80}
                  cy={80}
                  r={radius}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth={20}
                />
                {donutPaths.map((path, i) => (
                  <circle
                    key={i}
                    cx={80}
                    cy={80}
                    r={radius}
                    fill="none"
                    stroke={path.color}
                    strokeWidth={20}
                    strokeDasharray={`${path.dash} ${circumference - path.dash}`}
                    strokeDashoffset={-path.offset}
                    transform="rotate(-90 80 80)"
                  />
                ))}
                <text
                  x={80}
                  y={74}
                  textAnchor="middle"
                  className="analytics__donut-center-value"
                >
                  {rsvpTotal}
                </text>
                <text
                  x={80}
                  y={92}
                  textAnchor="middle"
                  className="analytics__donut-center-label"
                >
                  Responses
                </text>
              </svg>
            </div>
            <div className="analytics__legend">
              <div className="analytics__legend-item analytics__legend-item--attending">
                <span className="analytics__legend-dot" />
                <span className="analytics__legend-label">Attending</span>
                <span className="analytics__legend-value">{attending}</span>
              </div>
              <div className="analytics__legend-item analytics__legend-item--declined">
                <span className="analytics__legend-dot" />
                <span className="analytics__legend-label">Declined</span>
                <span className="analytics__legend-value">{declined}</span>
              </div>
              <div className="analytics__legend-item analytics__legend-item--pending">
                <span className="analytics__legend-dot" />
                <span className="analytics__legend-label">Maybe</span>
                <span className="analytics__legend-value">{pending}</span>
              </div>
            </div>
          </div>

          <div className="card analytics__chart-card">
            <h2 className="analytics__chart-title">Progress</h2>
            <div className="analytics__bars">
              {barItems.map((item) => (
                <div key={item.label} className="analytics__bar-item">
                  <div className="analytics__bar-header">
                    <span className="analytics__bar-label">{item.label}</span>
                    <span className="analytics__bar-value">
                      {item.value.toFixed(0)}%
                    </span>
                  </div>
                  <div className="analytics__bar-track">
                    <div
                      className={`analytics__bar-fill ${barVariant(item.variant)}`}
                      style={{ width: `${Math.min(item.value, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="analytics__lower">
          <div className="card analytics__table-card">
            <h2 className="analytics__chart-title">Table Occupancy</h2>
            <div className="analytics__table-list">
              {(tables ?? []).map((table) => {
                const count = (guests ?? []).filter(
                  (g) => g.table_id === table.id,
                ).length;
                const pct =
                  table.capacity > 0 ? (count / table.capacity) * 100 : 0;
                const isFull = count >= table.capacity;
                const isEmpty = count === 0;
                return (
                  <div
                    key={table.id}
                    className={`analytics__table-row${isFull ? ' analytics__table-row--full' : ''}${isEmpty ? ' analytics__table-row--empty' : ''}`}
                  >
                    <span className="analytics__table-row__name">
                      {table.name}
                    </span>
                    <span className="analytics__table-row__count">
                      {count}/{table.capacity}
                    </span>
                    <div className="analytics__table-row__bar">
                      <div
                        className="analytics__table-row__fill"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {(!tables || tables.length === 0) && (
                <div className="analytics__empty">
                  <p>No tables yet.</p>
                </div>
              )}
            </div>
          </div>

          <div className="card analytics__insights-card">
            <h2 className="analytics__chart-title">Smart Insights</h2>
            <div className="analytics__insights">
              {insights.length === 0 ? (
                <div className="analytics__empty">
                  <p>No insights available yet.</p>
                </div>
              ) : (
                insights.map((insight, i) => (
                  <div
                    key={i}
                    className={`analytics__insight analytics__insight--${insight.variant}`}
                  >
                    <span className="analytics__insight__icon">
                      {insight.icon}
                    </span>
                    <span className="analytics__insight__text">
                      {insight.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
