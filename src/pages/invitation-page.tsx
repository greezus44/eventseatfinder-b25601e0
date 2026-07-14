import { useParams, Link } from 'react-router-dom';
import { useEventBySlug } from '@/hooks/use-events';

export function InvitationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading } = useEventBySlug(slug ?? '');

  if (isLoading) {
    return (
      <div className="inv-page">
        <div className="inv-loading">
          <div className="inv-loading-spinner" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="inv-page">
        <div className="inv-not-found">
          <h1 className="inv-not-found-title">Invitation Not Found</h1>
          <p className="inv-not-found-text">
            We couldn't find the event for this invitation link.
          </p>
          <Link className="inv-link" to="/">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="inv-page">
      <div className="inv-card">
        <div className="inv-header">
          {event.logo_url && (
            <img className="inv-logo" src={event.logo_url} alt={`${event.name} logo`} />
          )}
          <p className="inv-eyebrow">You're Invited</p>
          <h1 className="inv-title">{event.name}</h1>
        </div>

        <div className="inv-details">
          {event.date && (
            <div className="inv-detail">
              <span className="inv-detail-label">Date</span>
              <span className="inv-detail-value">
                {new Date(event.date).toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}
          {event.time && (
            <div className="inv-detail">
              <span className="inv-detail-label">Time</span>
              <span className="inv-detail-value">{event.time}</span>
            </div>
          )}
          {event.venue && (
            <div className="inv-detail">
              <span className="inv-detail-label">Venue</span>
              <span className="inv-detail-value">{event.venue}</span>
            </div>
          )}
        </div>

        <Link className="inv-cta" to={`/e/${event.slug}`}>
          View Your Seat
        </Link>
      </div>
    </div>
  );
}
