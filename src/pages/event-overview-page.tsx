import { useParams, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { useCheckIns } from '@/hooks/use-check-ins';
import { useRSVPs } from '@/hooks/use-rsvps';

export function EventOverviewPage() {
  const eventId = useParams<{ eventId: string }>().eventId ?? '';
  const { data: event, isLoading } = useEvent(eventId);
  const { data: guests = [] } = useGuests(eventId);
  const { data: tables = [] } = useTables(eventId);
  const { data: checkIns = [] } = useCheckIns(eventId);
  const { data: rsvps = [] } = useRSVPs(eventId);

  if (isLoading) {
    return (
      <div className="overview-loading">
        <p className="overview-loading-text">Loading event...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="overview-error">
        <p className="overview-error-text">Event not found.</p>
        <Link to="/" className="overview-back-link">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const totalGuests = guests.length;
  const checkedIn = checkIns.length;
  const totalTables = tables.length;
  const rsvpCount = rsvps.length;

  const stats = [
    { label: 'Total Guests', value: totalGuests, icon: '👥' },
    { label: 'Checked In', value: checkedIn, icon: '✅' },
    { label: 'Total Tables', value: totalTables, icon: '🍽️' },
    { label: 'RSVPs', value: rsvpCount, icon: '📝' },
  ];

  const quickActions = [
    {
      label: 'Manage Guests',
      to: `/events/${eventId}/guests`,
      icon: '👥',
      description: 'Add, edit, and organize your guest list',
    },
    {
      label: 'Seating Arrangement',
      to: `/events/${eventId}/seating`,
      icon: '🍽️',
      description: 'Arrange tables and assign seats',
    },
    {
      label: 'Check-in',
      to: `/events/${eventId}/check-in`,
      icon: '✅',
      description: 'Check in guests at the door',
    },
    {
      label: 'Analytics',
      to: `/events/${eventId}/analytics`,
      icon: '📊',
      description: 'View insights and event metrics',
    },
    {
      label: 'Guest Page Editor',
      to: `/events/${eventId}/guest-page`,
      icon: '🎨',
      description: 'Customize the public guest page',
    },
    {
      label: 'Event Settings',
      to: `/events/${eventId}/settings`,
      icon: '⚙️',
      description: 'Edit event details and configuration',
    },
  ];

  return (
    <div className="overview-page">
      <div className="overview-header">
        <Link to="/" className="overview-back-link">
          ← Back to Dashboard
        </Link>
        <h1 className="overview-title">{event.name}</h1>
      </div>

      <section className="overview-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="overview-stat-card">
            <div className="overview-stat-icon">{stat.icon}</div>
            <div className="overview-stat-content">
              <span className="overview-stat-value">{stat.value}</span>
              <span className="overview-stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="overview-quick-actions">
        <h2 className="overview-section-title">Quick Actions</h2>
        <div className="overview-action-grid">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className="overview-action-card"
            >
              <div className="overview-action-icon">{action.icon}</div>
              <div className="overview-action-content">
                <span className="overview-action-label">{action.label}</span>
                <span className="overview-action-description">
                  {action.description}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
