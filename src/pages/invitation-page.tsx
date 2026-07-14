import { useParams, Link } from 'react-router-dom';
import { useEventBySlug } from '@/hooks/use-events';

const INV_CSS = `
.inv-root {
  min-height: 100vh; background: #F8F8F8; font-family: 'Inter', sans-serif;
  color: #1A1A1A; display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 40px 24px; box-sizing: border-box;
}
.inv-card {
  background: #FFFFFF; border-radius: 20px; overflow: hidden;
  width: 100%; max-width: 520px;
  box-shadow: 0 4px 32px rgba(0,0,0,0.06);
  border: 1px solid #EFEFEF;
}
.inv-cover { height: 200px; position: relative; overflow: hidden; }
.inv-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
.inv-cover-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, #1A1A1A 0%, #4A4A4A 100%); }
.inv-logo {
  position: absolute; top: 16px; right: 16px;
  width: 48px; height: 48px; border-radius: 12px;
  object-fit: cover; border: 2px solid #FFFFFF; background: #FFFFFF;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}
.inv-body { padding: 40px 36px; text-align: center; }
.inv-eyebrow {
  font-size: 12px; font-weight: 600; color: #4A4A4A;
  text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;
}
.inv-title {
  margin: 0 0 16px; font-size: 30px; font-weight: 700; color: #1A1A1A;
  letter-spacing: -0.5px; line-height: 1.2;
}
.inv-divider {
  width: 40px; height: 2px; background: #1A1A1A; margin: 0 auto 20px;
  border-radius: 2px;
}
.inv-date {
  font-size: 16px; font-weight: 600; color: #1A1A1A; margin-bottom: 6px;
}
.inv-venue {
  font-size: 15px; color: #4A4A4A; margin-bottom: 32px;
  display: flex; align-items: center; justify-content: center; gap: 6px;
}
.inv-cta {
  display: inline-flex; align-items: center; gap: 8px;
  height: 48px; padding: 0 28px; border-radius: 12px;
  background: #1A1A1A; color: #FFFFFF; font-size: 15px; font-weight: 600;
  font-family: inherit; text-decoration: none; cursor: pointer;
  transition: background 200ms ease, transform 100ms ease;
  border: none;
}
.inv-cta:hover { background: #333333; }
.inv-cta:active { transform: scale(0.98); }
.inv-footer {
  margin-top: 24px; font-size: 13px; color: #B0B0B0;
}

/* ---- Loading ---- */
.inv-loading { text-align: center; padding: 80px 20px; }
.inv-loading-dot {
  width: 32px; height: 32px; border-radius: 50%;
  border: 3px solid #EFEFEF; border-top-color: #1A1A1A;
  animation: inv-spin 0.7s linear infinite; margin: 0 auto 16px;
}
@keyframes inv-spin { to { transform: rotate(360deg); } }
.inv-loading-text { font-size: 14px; color: #4A4A4A; }

/* ---- Error ---- */
.inv-error { text-align: center; padding: 80px 20px; }
.inv-error-icon {
  width: 56px; height: 56px; margin: 0 auto 16px; border-radius: 14px;
  background: #EFEFEF; display: flex; align-items: center; justify-content: center;
  color: #4A4A4A;
}
.inv-error h2 { margin: 0 0 8px; font-size: 20px; font-weight: 600; color: #1A1A1A; }
.inv-error p { margin: 0; font-size: 14px; color: #4A4A4A; }

@media (max-width: 480px) {
  .inv-body { padding: 32px 24px; }
  .inv-title { font-size: 24px; }
}
`;

function formatInvDate(dateStr: string | null, timeStr: string | null): string {
  if (!dateStr) return 'Date TBD';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const datePart = d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  if (timeStr) {
    return `${datePart} at ${timeStr}`;
  }
  return datePart;
}

export function InvitationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading } = useEventBySlug(slug);

  return (
    <div className="inv-root">
      <style>{INV_CSS}</style>
      {isLoading ? (
        <div className="inv-loading">
          <div className="inv-loading-dot" />
          <p className="inv-loading-text">Loading invitation...</p>
        </div>
      ) : !event ? (
        <div className="inv-error">
          <div className="inv-error-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h2>Invitation Not Found</h2>
          <p>This event may no longer be available.</p>
        </div>
      ) : (
        <div className="inv-card">
          <div className="inv-cover">
            {event.cover_url ? (
              <img src={event.cover_url} alt={event.name} />
            ) : (
              <div className="inv-cover-placeholder" />
            )}
            {event.logo_url && (
              <img className="inv-logo" src={event.logo_url} alt="Event logo" />
            )}
          </div>
          <div className="inv-body">
            <p className="inv-eyebrow">You're Invited</p>
            <h1 className="inv-title">{event.name}</h1>
            <div className="inv-divider" />
            <p className="inv-date">{formatInvDate(event.date, event.time)}</p>
            {event.venue && (
              <p className="inv-venue">
                <svg width="15" height="15" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M7 12s-4-3.5-4-7a4 4 0 1 1 8 0c0 3.5-4 7-4 7z" stroke="currentColor" strokeWidth="1.3" fill="none" />
                  <circle cx="7" cy="5" r="1.5" fill="currentColor" />
                </svg>
                {event.venue}
              </p>
            )}
            <Link to={`/e/${event.slug}`} className="inv-cta">
              Find Your Seat
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <p className="inv-footer">Powered by Seatly</p>
          </div>
        </div>
      )}
    </div>
  );
}
