import { Link, useParams } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { useRSVPs } from '@/hooks/use-rsvps';
import { useCheckIns } from '@/hooks/use-check-ins';
import { LoadingScreen, ErrorScreen } from '@/components/ui/feedback';
import type { GuestWithTable } from '@/types/guest';
import type { RSVPStatus } from '@/types/rsvp';

interface Insight {
  severity: 'info' | 'warning' | 'success';
  text: string;
}

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

const RSVP_COLORS: Record<RSVPStatus, string> = {
  attending: '#16a34a',
  not_attending: '#dc2626',
  maybe: '#f59e0b',
};

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

function buildInsights(opts: {
  totalGuests: number;
  attending: number;
  declined: number;
  pending: number;
  checkedIn: number;
  assignedGuests: number;
  totalCapacity: number;
  totalTables: number;
  overCapacityTables: number;
  expectedAttendees: number;
}): Insight[] {
  const {
    totalGuests,
    attending,
    declined,
    pending,
    checkedIn,
    assignedGuests,
    totalCapacity,
    totalTables,
    overCapacityTables,
    expectedAttendees,
  } = opts;

  const insights: Insight[] = [];

  if (totalGuests === 0) {
    insights.push({ severity: 'info', text: 'No guests have been added yet.' });
    return insights;
  }

  const rsvpResponseRate = Math.round(
    ((attending + declined) / totalGuests) * 100,
  );
  if (pending > 0 && rsvpResponseRate < 60) {
    insights.push({
      severity: 'warning',
      text: `${pending} guest${pending === 1 ? '' : 's'} still pending RSVP. Consider sending a reminder.`,
    });
  } else if (pending === 0) {
    insights.push({
      severity: 'success',
      text: 'All guests have responded to the RSVP.',
    });
  }

  if (totalTables > 0 && assignedGuests < totalGuests) {
    const unassigned = totalGuests - assignedGuests;
    insights.push({
      severity: 'warning',
      text: `${unassigned} guest${unassigned === 1 ? '' : 's'} not yet assigned to a table.`,
    });
  } else if (assignedGuests === totalGuests && totalGuests > 0) {
    insights.push({
      severity: 'success',
      text: 'All guests are seated.',
    });
  }

  if (totalCapacity > 0 && totalCapacity < totalGuests) {
    insights.push({
      severity: 'warning',
      text: `Total capacity (${totalCapacity}) is below guest count (${totalGuests}). Add more tables or increase capacity.`,
    });
  }

  if (overCapacityTables > 0) {
    insights.push({
      severity: 'warning',
      text: `${overCapacityTables} table${overCapacityTables === 1 ? '' : 's'} exceed capacity. Reassign guests to balance.`,
    });
  }

  if (checkedIn > 0 && expectedAttendees > 0) {
    const attendanceRate = Math.round((checkedIn / expectedAttendees) * 100);
    if (attendanceRate >= 90) {
      insights.push({
        severity: 'success',
        text: `Strong turnout — ${attendanceRate}% of expected attendees checked in.`,
      });
    } else if (attendanceRate < 50) {
      insights.push({
        severity: 'info',
        text: `Check-in at ${attendanceRate}% of expected attendees.`,
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      severity: 'info',
      text: 'Everything looks on track.',
    });
  }

  return insights;
}

export function AnalyticsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const id = eventId ?? '';

  const { data: event, isLoading } = useEvent(id);
  const { data: guests } = useGuests(id);
  const { data: tables } = useTables(id);
  const { data: rsvps } = useRSVPs(id);
  const { data: checkIns } = useCheckIns(id);

  if (isLoading) return <LoadingScreen label="Loading analytics…" />;

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
  const attending = rsvpList.filter((r) => r.status === 'attending').length;
  const declined = rsvpList.filter((r) => r.status === 'not_attending').length;
  const maybe = rsvpList.filter((r) => r.status === 'maybe').length;
  const responded = rsvpList.length;
  const pending = totalGuests - responded;
  const checkedIn = checkInList.length;
  const plusOnesExpected = rsvpList.reduce((sum, r) => sum + r.plus_ones, 0);
  const plusOnesActual = checkInList.reduce(
    (sum, c) => sum + (c.plus_ones_actual ?? 0),
    0,
  );
  const expectedAttendees = attending + plusOnesExpected;
  const totalCapacity = tableList.reduce((sum, t) => sum + t.capacity, 0);
  const assignedGuests = guestList.filter((g) => g.table_id !== null).length;

  const guestsByTable = new Map<string, GuestWithTable[]>();
  for (const g of guestList) {
    if (!g.table_id) continue;
    const arr = guestsByTable.get(g.table_id) ?? [];
    arr.push(g);
    guestsByTable.set(g.table_id, arr);
  }

  const overCapacityTables = tableList.filter((t) => {
    const count = (guestsByTable.get(t.id) ?? []).length;
    return count > t.capacity;
  }).length;

  const rsvpResponseRate =
    totalGuests > 0 ? Math.round((responded / totalGuests) * 100) : 0;
  const seatingCompletion =
    totalGuests > 0 ? Math.round((assignedGuests / totalGuests) * 100) : 0;
  const checkInProgress =
    totalGuests > 0 ? Math.round((checkedIn / totalGuests) * 100) : 0;
  const attendanceRate =
    expectedAttendees > 0
      ? Math.round((checkedIn / expectedAttendees) * 100)
      : 0;

  const donutSegments: DonutSegment[] = [
    { label: 'Attending', value: attending, color: RSVP_COLORS.attending },
    { label: 'Declined', value: declined, color: RSVP_COLORS.not_attending },
    { label: 'Maybe', value: maybe, color: RSVP_COLORS.maybe },
    { label: 'Pending', value: pending, color: '#94a3b8' },
  ];
  const donutTotal = donutSegments.reduce((sum, s) => sum + s.value, 0);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  const insights = buildInsights({
    totalGuests,
    attending,
    declined,
    pending,
    checkedIn,
    assignedGuests,
    totalCapacity,
    totalTables: tableList.length,
    overCapacityTables,
    expectedAttendees,
  });

  const statCards = [
    { label: 'Total Guests', value: totalGuests, modifier: '', icon: '👥' },
    {
      label: 'Attending',
      value: attending,
      modifier: 'analytics__stat--success',
      icon: '✓',
    },
    {
      label: 'Declined',
      value: declined,
      modifier: 'analytics__stat--error',
      icon: '✕',
    },
    {
      label: 'Pending RSVP',
      value: pending,
      modifier: 'analytics__stat--warning',
      icon: '⏳',
    },
    { label: 'Checked In', value: checkedIn, modifier: '', icon: '🎟' },
    { label: 'Plus Ones', value: plusOnesActual, modifier: '', icon: '➕' },
    {
      label: 'Expected Attendees',
      value: expectedAttendees,
      modifier: '',
      icon: '🎯',
    },
    { label: 'Total Capacity', value: totalCapacity, modifier: '', icon: '🏛' },
  ];

  const progressBars = [
    {
      label: 'RSVP Response Rate',
      value: rsvpResponseRate,
      detail: `${responded} of ${totalGuests} responded`,
      fillClass: 'analytics__bar-fill--primary',
    },
    {
      label: 'Seating Completion',
      value: seatingCompletion,
      detail: `${assignedGuests} of ${totalGuests} seated`,
      fillClass: 'analytics__bar-fill--teal',
    },
    {
      label: 'Check-in Progress',
      value: checkInProgress,
      detail: `${checkedIn} of ${totalGuests} checked in`,
      fillClass: 'analytics__bar-fill--success',
    },
    {
      label: 'Attendance Rate',
      value: attendanceRate,
      detail: `${checkedIn} of ${expectedAttendees} expected`,
      fillClass: 'analytics__bar-fill--accent',
    },
  ];

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Analytics</h1>
          <p className="text-secondary">
            {event.name} · {formatDate(event.date)}
          </p>
        </div>
        <Link to={`/events/${id}/overview`} className="btn btn--ghost btn--sm">
          ← Back to overview
        </Link>
      </div>

      <div className="analytics__body">
        <div className="analytics__stats-grid">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className={`analytics__stat card ${stat.modifier}`.trim()}
            >
              <div className="analytics__stat__icon">{stat.icon}</div>
              <div className="analytics__stat__value">{stat.value}</div>
              <div className="analytics__stat__label">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="analytics__charts">
          <div className="analytics__chart-card card">
            <h2 className="analytics__chart-title">RSVP Breakdown</h2>
            {donutTotal === 0 ? (
              <p className="analytics__empty text-secondary">
                No RSVP data yet.
              </p>
            ) : (
              <div className="analytics__donut-wrapper">
                <svg
                  className="analytics__donut"
                  viewBox="0 0 140 140"
                  width="180"
                  height="180"
                >
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="14"
                  />
                  {donutSegments.map((segment) => {
                    if (segment.value === 0) return null;
                    const fraction = segment.value / donutTotal;
                    const dash = fraction * circumference;
                    const gap = circumference - dash;
                    const offset = -cumulativeOffset;
                    cumulativeOffset += dash;
                    return (
                      <circle
                        key={segment.label}
                        cx="70"
                        cy="70"
                        r={radius}
                        fill="none"
                        stroke={segment.color}
                        strokeWidth="14"
                        strokeDasharray={`${dash} ${gap}`}
                        strokeDashoffset={offset}
                        transform="rotate(-90 70 70)"
                        style={{
                          transition:
                            'stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease',
                        }}
                      >
                        <animate
                          attributeName="stroke-dasharray"
                          from={`0 ${circumference}`}
                          to={`${dash} ${gap}`}
                          dur="0.8s"
                          fill="freeze"
                        />
                      </circle>
                    );
                  })}
                  <text
                    x="70"
                    y="66"
                    textAnchor="middle"
                    className="analytics__donut-center-value"
                  >
                    {donutTotal}
                  </text>
                  <text
                    x="70"
                    y="84"
                    textAnchor="middle"
                    className="analytics__donut-center-label"
                  >
                    Guests
                  </text>
                </svg>
                <div className="analytics__legend">
                  {donutSegments.map((segment) => {
                    const pct =
                      donutTotal > 0
                        ? Math.round((segment.value / donutTotal) * 100)
                        : 0;
                    return (
                      <div
                        key={segment.label}
                        className="analytics__legend-item"
                      >
                        <span
                          className="analytics__legend-dot"
                          style={{ background: segment.color }}
                        />
                        <span className="analytics__legend-label">
                          {segment.label}
                        </span>
                        <span className="analytics__legend-value">
                          {segment.value}
                        </span>
                        <span className="analytics__legend-pct">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="analytics__chart-card card">
            <h2 className="analytics__chart-title">Progress Metrics</h2>
            <div className="analytics__bars">
              {progressBars.map((bar) => (
                <div key={bar.label} className="analytics__bar-item">
                  <div className="analytics__bar-header">
                    <span className="analytics__bar-label">{bar.label}</span>
                    <span className="analytics__bar-value">{bar.value}%</span>
                  </div>
                  <div className="analytics__bar-track">
                    <div
                      className={`analytics__bar-fill ${bar.fillClass}`.trim()}
                      style={{ width: `${bar.value}%` }}
                    />
                  </div>
                  <div className="analytics__bar-detail">{bar.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="analytics__lower">
          <div className="analytics__table-card card">
            <h2 className="analytics__chart-title">Table Occupancy</h2>
            {tableList.length === 0 ? (
              <p className="analytics__empty text-secondary">No tables yet.</p>
            ) : (
              <div className="analytics__table-list">
                {tableList.map((table) => {
                  const count = (guestsByTable.get(table.id) ?? []).length;
                  const pct =
                    table.capacity > 0
                      ? Math.round((count / table.capacity) * 100)
                      : 0;
                  const fillClass =
                    pct > 100
                      ? 'analytics__bar-fill--error'
                      : pct === 100
                        ? 'analytics__bar-fill--warning'
                        : 'analytics__bar-fill--success';
                  return (
                    <div key={table.id} className="analytics__table-row">
                      <div className="analytics__table-row__info">
                        <span className="analytics__table-row__name">
                          {table.name}
                        </span>
                        <span className="analytics__table-row__meta">
                          #{table.number} · {count}/{table.capacity}
                        </span>
                      </div>
                      <div className="analytics__table-row__bar-wrap">
                        <div className="analytics__table-row__bar">
                          <div
                            className={`analytics__table-row__bar-fill ${fillClass}`.trim()}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="analytics__table-row__pct">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="analytics__insights-card card">
            <h2 className="analytics__chart-title">Smart Insights</h2>
            <div className="analytics__insights">
              {insights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`analytics__insight analytics__insight--${insight.severity}`}
                >
                  <span className="analytics__insight__icon">
                    {insight.severity === 'success'
                      ? '✓'
                      : insight.severity === 'warning'
                        ? '⚠'
                        : 'ℹ'}
                  </span>
                  <span className="analytics__insight__text">
                    {insight.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
