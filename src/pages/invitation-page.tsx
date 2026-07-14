import { useParams, Link } from 'react-router-dom';
import { useEventBySlug } from '@/hooks/use-events';

export function InvitationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading } = useEventBySlug(slug);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return null;
    try {
      const [h, m] = timeStr.split(':');
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const h12 = hour % 12 || 12;
      return `${h12}:${m} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  if (isLoading) {
    return (
      <>
        <style>{INV_CSS}</style>
        <div className="inv-page">
          <div className="inv-loading">
            <div className="inv-spinner" />
          </div>
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <style>{INV_CSS}</style>
        <div className="inv-page">
          <div className="inv-card">
            <h1 className="inv-not-found">Event Not Found</h1>
            <p className="inv-not-found-hint">The event you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </>
    );
  }

  const dateStr = formatDate(event.date);
  const timeStr = formatTime(event.time);

  return (
    <>
      <style>{INV_CSS}</style>
      <div className="inv-page">
        <div className="inv-card">
          {/* Monogram / Logo */}
          {event.logo_url ? (
            <img src={event.logo_url} alt={event.name} className="inv-logo" />
          ) : (
            <div className="inv-monogram">{event.name.charAt(0).toUpperCase()}</div>
          )}

          {/* Event Name */}
          <h1 className="inv-event-name">{event.name}</h1>

          {/* Divider */}
          <div className="inv-divider">
            <span className="inv-divider-line" />
            <span className="inv-divider-dot" />
            <span className="inv-divider-line" />
          </div>

          {/* Date */}
          {dateStr && (
            <p className="inv-date">{dateStr}</p>
          )}

          {/* Time */}
          {timeStr && (
            <p className="inv-time">{timeStr}</p>
          )}

          {/* Venue */}
          {event.venue && (
            <p className="inv-venue">{event.venue}</p>
          )}

          {/* CTA */}
          <Link to={`/e/${event.slug}`} className="inv-cta">
            Find Your Seat
          </Link>

          {/* Footer */}
          <p className="inv-footer">Powered by Seatly</p>
        </div>
      </div>
    </>
  );
}

const INV_CSS = `
.inv-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F8F8F8;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  padding: 24px;
  box-sizing: border-box;
}

.inv-card {
  background: #FFFFFF;
  border: 1px solid #EFEFEF;
  border-radius: 16px;
  padding: 56px 48px;
  max-width: 480px;
  width: 100%;
  text-align: center;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.inv-logo {
  width: 72px;
  height: 72px;
  border-radius: 14px;
  object-fit: cover;
  margin-bottom: 24px;
}

.inv-monogram {
  width: 72px;
  height: 72px;
  border-radius: 14px;
  background: #1A1A1A;
  color: #FFFFFF;
  font-size: 36px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.inv-event-name {
  font-size: 32px;
  font-weight: 700;
  color: #1A1A1A;
  margin: 0;
  line-height: 1.2;
}

.inv-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0;
  width: 80%;
}

.inv-divider-line {
  flex: 1;
  height: 1px;
  background: #DADADA;
}

.inv-divider-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4A4A4A;
}

.inv-date {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A1A;
  margin: 0 0 4px 0;
  letter-spacing: 0.02em;
}

.inv-time {
  font-size: 15px;
  color: #4A4A4A;
  margin: 0 0 4px 0;
}

.inv-venue {
  font-size: 15px;
  color: #4A4A4A;
  margin: 0;
}

.inv-cta {
  display: inline-block;
  margin-top: 32px;
  padding: 14px 40px;
  border: none;
  border-radius: 10px;
  background: #1A1A1A;
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  font-family: inherit;
  transition: background 0.15s, transform 0.1s;
  letter-spacing: 0.02em;
}

.inv-cta:hover {
  background: #4A4A4A;
}

.inv-cta:active {
  transform: scale(0.98);
}

.inv-footer {
  margin: 32px 0 0 0;
  font-size: 12px;
  color: #DADADA;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* Loading */
.inv-loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.inv-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #EFEFEF;
  border-top-color: #1A1A1A;
  border-radius: 50%;
  animation: inv-spin 0.8s linear infinite;
}

@keyframes inv-spin {
  to { transform: rotate(360deg); }
}

/* Not Found */
.inv-not-found {
  font-size: 24px;
  font-weight: 700;
  color: #1A1A1A;
  margin: 0 0 8px 0;
}

.inv-not-found-hint {
  font-size: 14px;
  color: #4A4A4A;
  margin: 0;
}
`;
