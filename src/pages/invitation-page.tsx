import { useParams, Link } from 'react-router-dom';
import { useEventBySlug } from '@/hooks/use-events';

const INV_CSS = `
.inv-root {
  min-height: 100vh;
  background: #F8F8F8;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.inv-card {
  max-width: 560px;
  width: 100%;
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 24px;
  padding: 56px 48px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 12px 32px rgba(0,0,0,0.05);
}
.inv-monogram {
  width: 64px;
  height: 64px;
  margin: 0 auto 24px;
  background: #1A1A1A;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.inv-name {
  font-size: 32px;
  font-weight: 700;
  color: #1A1A1A;
  margin: 0 0 16px 0;
  letter-spacing: -0.02em;
}
.inv-meta {
  font-size: 16px;
  color: #4A4A4A;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.inv-meta svg {
  flex-shrink: 0;
  color: #8A8A8A;
}
.inv-divider {
  width: 48px;
  height: 1px;
  background: #D5D5D5;
  margin: 28px auto;
}
.inv-cta {
  display: inline-block;
  padding: 14px 36px;
  background: #1A1A1A;
  color: #FFFFFF;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s ease;
  margin-top: 8px;
}
.inv-cta:hover { background: #2A2A2A; }
.inv-loading {
  color: #8A8A8A;
  font-size: 16px;
}
.inv-not-found {
  text-align: center;
}
.inv-not-found-title {
  font-size: 24px;
  font-weight: 600;
  color: #4A4A4A;
  margin: 0 0 8px 0;
}
.inv-not-found-text {
  font-size: 15px;
  color: #8A8A8A;
  margin: 0;
}
`;

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  try {
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  } catch {
    return timeStr;
  }
}

export function InvitationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading } = useEventBySlug(slug ?? '');

  if (isLoading) {
    return (
      <>
        <style>{INV_CSS}</style>
        <div className="inv-root">
          <div className="inv-card">
            <p className="inv-loading">Loading…</p>
          </div>
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <style>{INV_CSS}</style>
        <div className="inv-root">
          <div className="inv-card inv-not-found">
            <p className="inv-not-found-title">Invitation Not Found</p>
            <p className="inv-not-found-text">The event you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{INV_CSS}</style>
      <div className="inv-root">
        <div className="inv-card">
          <div className="inv-monogram">{event.name.charAt(0)}</div>
          <h1 className="inv-name">{event.name}</h1>

          {event.date && (
            <p className="inv-meta">
              <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="12" height="11" rx="1.5" />
                <path d="M2 6h12M5 1.5v3M11 1.5v3" strokeLinecap="round" />
              </svg>
              {formatDate(event.date)}{event.time ? ` at ${formatTime(event.time)}` : ''}
            </p>
          )}

          {event.venue && (
            <p className="inv-meta">
              <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 14s5-4.5 5-8a5 5 0 0 0-10 0c0 3.5 5 8 5 8z" />
                <circle cx="8" cy="6" r="2" />
              </svg>
              {event.venue}
            </p>
          )}

          <div className="inv-divider" />

          <Link className="inv-cta" to={`/e/${event.slug}`}>Find Your Seat</Link>
        </div>
      </div>
    </>
  );
}
