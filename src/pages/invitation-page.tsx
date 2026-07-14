import { useParams, Link } from 'react-router-dom';
import { useEventBySlug } from '@/hooks/use-events';

export function InvitationPage() {
  const slug = useParams<{ slug: string }>().slug ?? '';
  const { data: event, isLoading } = useEventBySlug(slug);

  if (isLoading) {
    return (
      <div className="inv-page">
        <div className="inv-loading">
          <p className="inv-loading-text">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="inv-page">
        <div className="inv-not-found">
          <h1 className="inv-not-found-title">Invitation not found</h1>
          <p className="inv-not-found-text">
            We couldn't find an event for this invitation. The link may be
            incorrect or the event may have been removed.
          </p>
        </div>
      </div>
    );
  }

  const formattedDate = event.date
    ? new Date(`${event.date}T${event.time || '00:00'}`).toLocaleDateString(
        undefined,
        { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      )
    : null;

  const formattedTime = event.time
    ? new Date(`${event.date || '1970-01-01'}T${event.time}`).toLocaleTimeString(
        undefined,
        { hour: 'numeric', minute: '2-digit' }
      )
    : null;

  return (
    <div
      className="inv-page"
      style={
        event.cover_url
          ? { backgroundImage: `url(${event.cover_url})` }
          : undefined
      }
    >
      <div className="inv-overlay" />
      <div className="inv-card">
        {event.logo_url && (
          <img src={event.logo_url} alt={`${event.name} logo`} className="inv-logo" />
        )}

        <h1 className="inv-event-name">{event.name}</h1>

        <div className="inv-details">
          {formattedDate && (
            <div className="inv-detail-row">
              <span className="inv-detail-icon">📅</span>
              <span className="inv-detail-text">{formattedDate}</span>
            </div>
          )}
          {formattedTime && (
            <div className="inv-detail-row">
              <span className="inv-detail-icon">⏰</span>
              <span className="inv-detail-text">{formattedTime}</span>
            </div>
          )}
          {event.venue && (
            <div className="inv-detail-row">
              <span className="inv-detail-icon">📍</span>
              <span className="inv-detail-text">{event.venue}</span>
            </div>
          )}
        </div>

        <Link to={`/e/${event.slug}`} className="inv-cta">
          Find your seat →
        </Link>
      </div>
    </div>
  );
}
