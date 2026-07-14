import { useParams, Link } from 'react-router-dom';
import { useEventBySlug } from '@/hooks/use-events';

export function InvitationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading, isError } = useEventBySlug(slug ?? '');

  return (
    <>
      <style>{`
        .inv-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F8F8F8;
          padding: 24px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          color: #1A1A1A;
        }
        .inv-card {
          background: #FFFFFF;
          border: 1px solid #EFEFEF;
          border-radius: 20px;
          overflow: hidden;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.04);
        }
        .inv-cover {
          width: 100%;
          height: 200px;
          object-fit: cover;
          display: block;
        }
        .inv-cover-placeholder {
          width: 100%;
          height: 200px;
          background: linear-gradient(135deg, #1A1A1A 0%, #4A4A4A 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.5);
          font-size: 56px;
          font-weight: 800;
          letter-spacing: -3px;
        }
        .inv-body {
          padding: 40px 36px;
          text-align: center;
        }
        .inv-eyebrow {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #4A4A4A;
          margin: 0 0 12px 0;
        }
        .inv-name {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 16px 0;
          letter-spacing: -0.5px;
          line-height: 1.2;
        }
        .inv-meta {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
        }
        .inv-meta-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
          color: #4A4A4A;
        }
        .inv-meta-icon {
          flex-shrink: 0;
          color: #4A4A4A;
        }
        .inv-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 32px;
          height: 48px;
          background: #1A1A1A;
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .inv-cta:hover {
          opacity: 0.85;
        }
        .inv-loading {
          text-align: center;
          padding: 80px 24px;
          color: #4A4A4A;
          font-size: 14px;
        }
        .inv-loading-spinner {
          display: inline-block;
          width: 32px;
          height: 32px;
          border: 3px solid #EFEFEF;
          border-top-color: #1A1A1A;
          border-radius: 50%;
          animation: inv-spin 0.6s linear infinite;
          margin-bottom: 16px;
        }
        @keyframes inv-spin {
          to { transform: rotate(360deg); }
        }
        .inv-error {
          text-align: center;
          padding: 80px 24px;
        }
        .inv-error-title {
          font-size: 20px;
          font-weight: 600;
          color: #1A1A1A;
          margin: 0 0 8px 0;
        }
        .inv-error-text {
          font-size: 14px;
          color: #4A4A4A;
          margin: 0;
        }
        .inv-divider {
          width: 40px;
          height: 2px;
          background: #1A1A1A;
          margin: 0 auto 24px;
          border: none;
          border-radius: 1px;
        }
      `}</style>

      <div className="inv-page">
        {isLoading ? (
          <div className="inv-card">
            <div className="inv-loading">
              <div className="inv-loading-spinner" />
              <p>Loading invitation...</p>
            </div>
          </div>
        ) : isError || !event ? (
          <div className="inv-card">
            <div className="inv-error">
              <p className="inv-error-title">Invitation Not Found</p>
              <p className="inv-error-text">
                The event you're looking for doesn't exist or has been removed.
              </p>
            </div>
          </div>
        ) : (
          <div className="inv-card">
            {event.cover_url ? (
              <img className="inv-cover" src={event.cover_url} alt={event.name} />
            ) : (
              <div className="inv-cover-placeholder">
                {event.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="inv-body">
              <p className="inv-eyebrow">You're Invited</p>
              <h1 className="inv-name">{event.name}</h1>
              <hr className="inv-divider" />
              <div className="inv-meta">
                {event.date && (
                  <div className="inv-meta-row">
                    <svg className="inv-meta-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="3.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M5 1.5v3M11 1.5v3M2 6.5h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                    {new Date(event.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    {event.time ? ` at ${event.time}` : ''}
                  </div>
                )}
                {event.venue && (
                  <div className="inv-meta-row">
                    <svg className="inv-meta-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 14s5-4.5 5-8.5a5 5 0 0 0-10 0c0 4 5 8.5 5 8.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                      <circle cx="8" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.3" />
                    </svg>
                    {event.venue}
                  </div>
                )}
              </div>
              <Link to={`/e/${event.slug}`} className="inv-cta">
                Find Your Seat
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
