import { useParams, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { useCheckIns } from '@/hooks/use-check-ins';
import { useRSVPs } from '@/hooks/use-rsvps';

export function AnalyticsPage() {
  const eventId = useParams<{ eventId: string }>().eventId ?? '';
  const { data: event, isLoading } = useEvent(eventId);
  const { data: guests = [] } = useGuests(eventId);
  const { data: tables = [] } = useTables(eventId);
  const { data: checkIns = [] } = useCheckIns(eventId);
  const { data: rsvps = [] } = useRSVPs(eventId);

  if (isLoading) {
    return (
      <div className="an-page">
        <div className="an-loading">
          <p className="an-loading-text">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="an-page">
        <div className="an-error">
          <p className="an-error-text">Event not found.</p>
          <Link to="/" className="an-back-link">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const totalGuests = guests.length;
  const checkedIn = checkIns.length;
  const totalTables = tables.length;

  const rsvpYes = rsvps.filter((r) => r.status === 'yes').length;
  const rsvpNo = rsvps.filter((r) => r.status === 'no').length;
  const rsvpMaybe = rsvps.filter((r) => r.status === 'maybe').length;
  const totalRsvps = rsvps.length;

  const checkInRate =
    totalGuests > 0 ? Math.round((checkedIn / totalGuests) * 100) : 0;

  const primaryStats = [
    { label: 'Total Guests', value: totalGuests, icon: '👥' },
    { label: 'Checked In', value: checkedIn, icon: '✅' },
    { label: 'Total Tables', value: totalTables, icon: '🍽️' },
    { label: 'Check-in Rate', value: `${checkInRate}%`, icon: '📈' },
  ];

  const rsvpStats = [
    { label: 'Yes', value: rsvpYes, className: 'an-rsvp-yes', icon: '👍' },
    { label: 'No', value: rsvpNo, className: 'an-rsvp-no', icon: '👎' },
    { label: 'Maybe', value: rsvpMaybe, className: 'an-rsvp-maybe', icon: '🤔' },
  ];

  return (
    <div className="an-page">
      <div className="an-container">
        {/* Header */}
        <div className="an-header">
          <Link to={`/events/${eventId}`} className="an-back-link">
            ← Back to event
          </Link>
          <h1 className="an-title">Analytics</h1>
          <p className="an-subtitle">Insights for "{event.name}"</p>
        </div>

        {/* Primary stat cards */}
        <section className="an-stats">
          {primaryStats.map((stat) => (
            <div key={stat.label} className="an-stat-card">
              <div className="an-stat-icon">{stat.icon}</div>
              <div className="an-stat-content">
                <span className="an-stat-value">{stat.value}</span>
                <span className="an-stat-label">{stat.label}</span>
              </div>
            </div>
          ))}
        </section>

        {/* RSVP breakdown */}
        <section className="an-section">
          <h2 className="an-section-title">RSVP Breakdown</h2>
          <div className="an-rsvp-grid">
            {rsvpStats.map((stat) => (
              <div
                key={stat.label}
                className={`an-rsvp-card ${stat.className}`}
              >
                <div className="an-rsvp-icon">{stat.icon}</div>
                <div className="an-rsvp-content">
                  <span className="an-rsvp-value">{stat.value}</span>
                  <span className="an-rsvp-label">{stat.label}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="an-rsvp-total">
            Total RSVPs received: <strong>{totalRsvps}</strong>
          </p>
        </section>

        {/* Check-in summary */}
        <section className="an-section">
          <h2 className="an-section-title">Check-in Summary</h2>
          <div className="an-checkin-summary">
            <div className="an-checkin-bar-wrapper">
              <div className="an-checkin-bar-label">
                <span>{checkedIn} checked in</span>
                <span>{totalGuests - checkedIn} not checked in</span>
              </div>
              <div className="an-checkin-bar">
                <div
                  className="an-checkin-bar-fill"
                  style={{ width: `${checkInRate}%` }}
                />
              </div>
              <p className="an-checkin-rate">
                {checkInRate}% of {totalGuests} guests have checked in
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
