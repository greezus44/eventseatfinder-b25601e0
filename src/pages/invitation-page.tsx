import { useParams, Link } from 'react-router-dom';
import { useEventBySlug } from '@/hooks/use-events';

const INV_CSS = `
.inv-root { min-height: 100vh; background: #F8F8F8; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; padding: 24px; }
.inv-card { background: #FFFFFF; border: 1px solid #EFEFEF; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); max-width: 480px; width: 100%; overflow: hidden; }
.inv-cover { height: 200px; position: relative; overflow: hidden; }
.inv-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
.inv-cover-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, #1A1A1A 0%, #4A4A4A 100%); display: flex; align-items: center; justify-content: center; }
.inv-cover-placeholder span { font-size: 48px; font-weight: 700; color: #FFFFFF; letter-spacing: 0.05em; }
.inv-body { padding: 40px 32px; text-align: center; }
.inv-eyebrow { font-size: 11px; font-weight: 600; color: #B0B0B0; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 16px; }
.inv-name { font-size: 28px; font-weight: 700; color: #1A1A1A; margin-bottom: 20px; line-height: 1.2; }
.inv-meta { display: flex; flex-direction: column; gap: 8px; margin-bottom: 32px; }
.inv-meta-row { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 15px; color: #4A4A4A; }
.inv-meta-row svg { flex-shrink: 0; color: #B0B0B0; }
.inv-cta { display: inline-flex; align-items: center; gap: 8px; height: 48px; padding: 0 28px; border-radius: 12px; background: #1A1A1A; color: #FFFFFF; font-size: 15px; font-weight: 600; text-decoration: none; transition: background 200ms ease; }
.inv-cta:hover { background: #333333; }
.inv-footer { font-size: 12px; color: #B0B0B0; margin-top: 24px; }

.inv-loading { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #F8F8F8; }
.inv-spinner { width: 32px; height: 32px; border: 3px solid #EFEFEF; border-top-color: #1A1A1A; border-radius: 50%; animation: inv-spin 0.8s linear infinite; }
@keyframes inv-spin { to { transform: rotate(360deg); } }

.inv-error { text-align: center; padding: 64px 32px; }
.inv-error-icon { margin-bottom: 16px; }
.inv-error-title { font-size: 20px; font-weight: 600; color: #1A1A1A; margin-bottom: 8px; }
.inv-error-text { font-size: 14px; color: #B0B0B0; }
.inv-error-link { display: inline-block; margin-top: 20px; color: #1A1A1A; font-size: 14px; font-weight: 500; text-decoration: underline; }
`;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Date TBD';
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
      <div className="inv-root">
        <style>{INV_CSS}</style>
        <div className="inv-loading">
          <div className="inv-spinner" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="inv-root">
        <style>{INV_CSS}</style>
        <div className="inv-card">
          <div className="inv-body">
            <div className="inv-error">
              <div className="inv-error-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#DADADA" strokeWidth="1.5"><circle cx="24" cy="24" r="20" /><path d="M24 16v8M24 30v2" strokeLinecap="round" /></svg>
              </div>
              <div className="inv-error-title">Invitation Not Found</div>
              <div className="inv-error-text">The event you're looking for doesn't exist or may have been removed.</div>
              <Link to="/" className="inv-error-link">Go to Seatly</Link>
            </div>
          </div>
        </div>
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
              <span>{event.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>
        <div className="inv-body">
          <div className="inv-eyebrow">You're Invited</div>
          <div className="inv-name">{event.name}</div>
          <div className="inv-meta">
            <div className="inv-meta-row">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="12" height="11" rx="1" /><path d="M3 7h12M7 2v3M11 2v3" strokeLinecap="round" /></svg>
              {formatDate(event.date)}{event.time ? ` · ${event.time}` : ''}
            </div>
            {event.venue && (
              <div className="inv-meta-row">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 16s5-4.5 5-9a5 5 0 00-10 0c0 4.5 5 9 5 9z" /><circle cx="9" cy="7" r="2" /></svg>
                {event.venue}
              </div>
            )}
          </div>
          <Link to={`/e/${event.slug}`} className="inv-cta">
            Find Your Seat
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 9h10M10 5l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
          <div className="inv-footer">Powered by Seatly</div>
        </div>
      </div>
    </div>
  );
}
