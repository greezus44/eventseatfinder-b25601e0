import { useParams, Link } from 'react-router-dom';
import { useEventBySlug } from '@/hooks/use-events';

function formatDate(dateStr: string): string {
  if (!dateStr) return 'Date TBD';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  try {
    const [h, m] = timeStr.split(':');
    const hours = parseInt(h, 10);
    const minutes = parseInt(m, 10);
    if (isNaN(hours) || isNaN(minutes)) return timeStr;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${period}`;
  } catch {
    return timeStr;
  }
}

export function InvitationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading, isError } = useEventBySlug(slug ?? '');

  if (isLoading) {
    return (
      <div className="inv-page">
        <div className="inv-loading">
          <div className="inv-loading-spinner" aria-hidden="true" />
          <p className="inv-loading-text">Loading invitation…</p>
        </div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="inv-page">
        <div className="inv-not-found">
          <h1 className="inv-not-found-title">Invitation Not Found</h1>
          <p className="inv-not-found-text">
            We couldn't find the event you're looking for. The link may be
            invalid or the event may no longer be available.
          </p>
          <Link to="/" className="inv-not-found-link">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = formatDate(event.date);
  const formattedTime = formatTime(event.time);

  return (
    <div className="inv-page">
      <div className="inv-card">
        {event.cover_url && (
          <div className="inv-cover">
            <img
              src={event.cover_url}
              alt=""
              className="inv-cover-image"
            />
          </div>
        )}

        <div className="inv-body">
          {event.logo_url && (
            <img
              src={event.logo_url}
              alt={`${event.name} logo`}
              className="inv-logo"
            />
          )}

          <p className="inv-eyebrow">You're Invited</p>
          <h1 className="inv-title">{event.name}</h1>

          <div className="inv-details">
            <div className="inv-detail-row">
              <span className="inv-detail-label">Date</span>
              <span className="inv-detail-value">{formattedDate}</span>
            </div>

            {formattedTime && (
              <div className="inv-detail-row">
                <span className="inv-detail-label">Time</span>
                <span className="inv-detail-value">{formattedTime}</span>
              </div>
            )}

            {event.venue && (
              <div className="inv-detail-row">
                <span className="inv-detail-label">Venue</span>
                <span className="inv-detail-value">{event.venue}</span>
              </div>
            )}
          </div>

          <Link to={`/e/${event.slug}`} className="inv-cta">
            Find Your Seat
          </Link>
        </div>
      </div>
    </div>
  );
}
