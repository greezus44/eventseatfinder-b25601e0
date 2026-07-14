import { useParams, Link } from 'react-router-dom';
import { useEventBySlug } from '@/hooks/use-events';

const INV_CSS = `
.inv-root {
  min-height: 100vh; background: #F8F8F8; font-family: 'Inter', system-ui, sans-serif;
  display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px;
}
.inv-card {
  background: #FFFFFF; border: 1px solid #EFEFEF; border-radius: 16px;
  max-width: 560px; width: 100%; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);
}
.inv-cover { height: 200px; position: relative; overflow: hidden; }
.inv-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
.inv-cover-placeholder {
  width: 100%; height: 100%; background: linear-gradient(135deg, #1A1A1A 0%, #4A4A4A 100%);
  display: flex; align-items: center; justify-content: center;
}
.inv-cover-placeholder span { font-size: 48px; font-weight: 700; color: #FFFFFF; letter-spacing: 0.1em; }
.inv-body { padding: 40px 32px; text-align: center; }
.inv-eyebrow {
  font-size: 12px; font-weight: 600; color: #B0B0B0; text-transform: uppercase;
  letter-spacing: 0.15em; margin: 0 0 12px;
}
.inv-title {
  font-size: 32px; font-weight: 700; color: #1A1A1A; margin: 0 0 20px; letter-spacing: -0.02em;
  line-height: 1.2;
}
.inv-meta { display: flex; flex-direction: column; gap: 8px; margin-bottom: 32px; }
.inv-meta-row {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  font-size: 15px; color: #4A4A4A;
}
.inv-meta-row svg { flex-shrink: 0; color: #B0B0B0; }
.inv-cta {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  height: 52px; padding: 0 32px; border-radius: 12px; background: #1A1A1A; color: #FFFFFF;
  font-size: 15px; font-weight: 600; text-decoration: none; transition: background 200ms ease;
  border: 1px solid #1A1A1A;
}
.inv-cta:hover { background: #333333; }
.inv-cta svg { flex-shrink: 0; }

.inv-loading {
  min-height: 100vh; background: #F8F8F8; display: flex; align-items: center; justify-content: center;
  font-family: 'Inter', system-ui, sans-serif;
}
.inv-spinner {
  width: 32px; height: 32px; border: 3px solid #EFEFEF; border-top-color: #1A1A1A;
  border-radius: 50%; animation: inv-spin 0.8s linear infinite;
}
@keyframes inv-spin { to { transform: rotate(360deg); } }

.inv-error {
  min-height: 100vh; background: #F8F8F8; display: flex; flex-direction: column;
  align-items: center; justify-content: center; padding: 32px; font-family: 'Inter', system-ui, sans-serif;
}
.inv-error-icon { width: 64px; height: 64px; color: #DADADA; margin-bottom: 16px; }
.inv-error-title { font-size: 20px; font-weight: 600; color: #1A1A1A; margin: 0 0 4px; }
.inv-error-text { font-size: 14px; color: #B0B0B0; margin: 0 0 24px; text-align: center; }
.inv-error-link {
  display: inline-flex; align-items: center; gap: 6px; height: 44px; padding: 0 20px;
  border-radius: 12px; background: #1A1A1A; color: #FFFFFF; font-size: 14px; font-weight: 500;
  text-decoration: none; transition: background 200ms ease;
}
.inv-error-link:hover { background: #333333; }
`;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Date to be announced';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function InvitationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading } = useEventBySlug(slug ?? '');

  if (isLoading) {
    return (
      <div className="inv-loading">
        <style>{INV_CSS}</style>
        <div className="inv-spinner" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="inv-error">
        <style>{INV_CSS}</style>
        <svg className="inv-error-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="32" cy="32" r="28" />
          <path d="M24 24l16 16M40 24L24 40" strokeLinecap="round" />
        </svg>
        <h1 className="inv-error-title">Invitation not found</h1>
        <p className="inv-error-text">The event you're looking for doesn't exist or has been removed.</p>
        <Link to="/" className="inv-error-link">Go to Seatly</Link>
      </div>
    );
  }

  return (
    <div className="inv-root">
      <style>{INV_CSS}</style>
      <div className="inv-card">
        <div className="inv-cover">
          {event.cover_url ? (
            <img src={event.cover_url} alt={event.name} />
          ) : (
            <div className="inv-cover-placeholder">
              <span>S</span>
            </div>
          )}
        </div>
        <div className="inv-body">
          <p className="inv-eyebrow">You're invited to</p>
          <h1 className="inv-title">{event.name}</h1>
          <div className="inv-meta">
            <div className="inv-meta-row">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="10" height="10" rx="1.5" />
                <path d="M3 7h10M6 2v4M10 2v4" strokeLinecap="round" />
              </svg>
              {formatDate(event.date)}
              {event.time ? ` at ${event.time}` : ''}
            </div>
            {event.venue && (
              <div className="inv-meta-row">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 14s5-4.5 5-8a5 5 0 10-10 0c0 3.5 5 8 5 8z" />
                  <circle cx="8" cy="6" r="2" />
                </svg>
                {event.venue}
              </div>
            )}
          </div>
          <Link to={`/e/${event.slug}`} className="inv-cta">
            Find Your Seat
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
