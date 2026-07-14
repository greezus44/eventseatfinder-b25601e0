import { useParams, Link } from 'react-router-dom';
import { useEventBySlug } from '@/hooks/use-events';

export function InvitationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading } = useEventBySlug(slug ?? '');

  if (isLoading) {
    return (
      <div className="inv-page">
        <div className="inv-loading">
          <div className="inv-loading__spinner" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="inv-page">
        <div className="inv-card">
          <h1 className="inv-card__title">Invitation not found</h1>
          <p className="inv-card__text">
            This invitation may have expired or the event no longer exists.
          </p>
        </div>
      </div>
    );
  }

  const eventDate = event.date
    ? new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : 'Date to be announced';

  return (
    <div className="inv-page">
      <div className="inv-card">
        {event.cover_url && (
          <div className="inv-card__cover">
            <img src={event.cover_url ?? undefined} alt="" />
          </div>
        )}
        <div className="inv-card__body">
          {event.logo_url && (
            <img className="inv-card__logo" src={event.logo_url ?? undefined} alt={event.name} />
          )}
          <p className="inv-card__eyebrow">You're invited to</p>
          <h1 className="inv-card__title">{event.name}</h1>
          <div className="inv-card__details">
            <div className="inv-card__detail">
              <span className="inv-card__detail-label">When</span>
              <span className="inv-card__detail-value">{eventDate}</span>
            </div>
            {event.time && (
              <div className="inv-card__detail">
                <span className="inv-card__detail-label">Time</span>
                <span className="inv-card__detail-value">{event.time}</span>
              </div>
            )}
            {event.venue && (
              <div className="inv-card__detail">
                <span className="inv-card__detail-label">Where</span>
                <span className="inv-card__detail-value">{event.venue}</span>
              </div>
            )}
          </div>
          <Link to={`/e/${event.slug}`} className="inv-card__cta">
            Find Your Seat
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
