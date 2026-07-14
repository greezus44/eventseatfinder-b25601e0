import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGuestPageSettingsBySlug } from '@/hooks/use-guest-page-settings';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { GOOGLE_FONTS } from '@/lib/fonts';

export function FindYourSeatPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: settings, isLoading } = useGuestPageSettingsBySlug(slug);
  const [searchName, setSearchName] = useState('');
  const [searched, setSearched] = useState(false);

  const eventId = settings?.event?.id;
  const { data: guests } = useGuests(eventId);
  const { data: tables } = useTables(eventId);

  const fontsNeeded = new Set<string>();
  if (settings) {
    fontsNeeded.add(settings.font_title_family || 'Inter');
    fontsNeeded.add(settings.font_subtitle_family || 'Inter');
    fontsNeeded.add(settings.font_datetime_family || 'Inter');
    fontsNeeded.add(settings.font_venue_family || 'Inter');
    fontsNeeded.add(settings.font_body || 'Inter');
  }
  useEffect(() => {
    const links = Array.from(fontsNeeded).map((f) => {
      const fontDef = GOOGLE_FONTS.find((ft) => ft.value === f);
      if (!fontDef) return null;
      const id = `gp-font-${f.replace(/\s+/g, '-').toLowerCase()}`;
      if (document.getElementById(id)) return null;
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${fontDef.css}&display=swap`;
      document.head.appendChild(link);
      return link;
    }).filter(Boolean);
    return () => { links.forEach((l) => l?.remove()); };
  }, [settings]);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!settings || !settings.event) {
    return (
      <div className="gp-container">
        <div className="gp-card">
          <h1 style={{ fontSize: '24px', marginBottom: '12px' }}>Event Not Found</h1>
          <p style={{ color: '#4A4A4A' }}>The event you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const event = settings.event;
  const tableMap = new Map<string, { name: string; number: number }>();
  (tables ?? []).forEach((t) => tableMap.set(t.id, { name: t.name, number: t.number }));

  const matchedGuest = searched
    ? (guests ?? []).find((g) => g.name.toLowerCase().trim() === searchName.toLowerCase().trim())
    : undefined;

  const bgColor = settings.color_background || '#ffffff';
  const cardColor = settings.color_card || '#ffffff';
  const textColor = settings.color_text || '#1a1a1a';
  const headerColor = settings.color_header || '#1a1a1a';
  const primaryColor = settings.color_primary || '#1a1a1a';
  const buttonColor = settings.color_button || '#1a1a1a';
  const buttonTextColor = settings.color_button_text || '#ffffff';
  const borderRadius = settings.border_radius ?? 12;
  const logoSize = settings.logo_size ?? 80;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: bgColor,
        color: textColor,
        fontFamily: settings.font_body || 'Inter, sans-serif',
      }}
    >
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 24px' }}>
        {settings.logo_url && (
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <img
              src={settings.logo_url}
              alt="Event logo"
              style={{
                maxWidth: '100%',
                maxHeight: `${logoSize}px`,
                width: 'auto',
                borderRadius: settings.logo_rounded ? '50%' : `${borderRadius}px`,
                objectFit: 'contain',
              }}
            />
          </div>
        )}

        <div
          style={{
            background: cardColor,
            borderRadius: `${borderRadius}px`,
            padding: '32px',
            boxShadow: settings.card_shadow ? '0 4px 24px rgba(0,0,0,0.08)' : 'none',
            border: '1px solid #EFEFEF',
          }}
        >
          <h1
            style={{
              fontFamily: settings.font_title_family || settings.font_heading || 'Inter, sans-serif',
              fontSize: `${settings.font_title_size ?? 28}px`,
              fontWeight: settings.font_title_weight ?? 700,
              color: headerColor,
              marginBottom: '8px',
              textAlign: 'center',
            }}
          >
            {event.name}
          </h1>

          {settings.event_subtitle && (
            <p
              style={{
                fontFamily: settings.font_subtitle_family || settings.font_body || 'Inter, sans-serif',
                fontSize: `${settings.font_subtitle_size ?? 16}px`,
                fontWeight: settings.font_subtitle_weight ?? 400,
                color: textColor,
                marginBottom: '12px',
                textAlign: 'center',
                opacity: 0.85,
              }}
            >
              {settings.event_subtitle}
            </p>
          )}

          {(event.date || event.time) && (
            <p
              style={{
                fontFamily: settings.font_datetime_family || settings.font_body || 'Inter, sans-serif',
                fontSize: `${settings.font_datetime_size ?? 14}px`,
                fontWeight: settings.font_datetime_weight ?? 400,
                color: textColor,
                marginBottom: '4px',
                textAlign: 'center',
                opacity: 0.75,
              }}
            >
              {event.date ? new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
              {event.time ? ` at ${event.time}` : ''}
            </p>
          )}

          {event.venue && (
            <p
              style={{
                fontFamily: settings.font_venue_family || settings.font_body || 'Inter, sans-serif',
                fontSize: `${settings.font_venue_size ?? 14}px`,
                fontWeight: settings.font_venue_weight ?? 400,
                color: textColor,
                marginBottom: '24px',
                textAlign: 'center',
                opacity: 0.75,
              }}
            >
              {event.venue}
            </p>
          )}

          {settings.welcome_message && (
            <p style={{ fontSize: '14px', color: textColor, marginBottom: '24px', textAlign: 'center', lineHeight: 1.6, opacity: 0.7 }}>
              {settings.welcome_message}
            </p>
          )}

          <p style={{ fontSize: '15px', color: textColor, marginBottom: '16px', textAlign: 'center' }}>
            Enter your name to find your assigned table.
          </p>

          <input
            style={{
              width: '100%',
              height: '44px',
              padding: '0 16px',
              borderRadius: `${borderRadius}px`,
              border: '1px solid #DADADA',
              background: '#FFFFFF',
              fontSize: '15px',
              color: textColor,
              outline: 'none',
              marginBottom: '12px',
            }}
            value={searchName}
            onChange={(e) => { setSearchName(e.target.value); setSearched(false); }}
            placeholder="Your full name"
            onKeyDown={(e) => { if (e.key === 'Enter') setSearched(true); }}
          />

          <button
            style={{
              width: '100%',
              height: '44px',
              borderRadius: `${borderRadius}px`,
              border: 'none',
              background: buttonColor,
              color: buttonTextColor,
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onClick={() => setSearched(true)}
          >
            Search
          </button>

          {searched && (
            <div style={{ marginTop: '24px', textAlign: 'left' }}>
              {matchedGuest ? (
                matchedGuest.table_id ? (
                  <div>
                    <p style={{ fontSize: '14px', color: textColor, marginBottom: '8px' }}>
                      {matchedGuest.name}, you are seated at:
                    </p>
                    <p style={{ fontSize: '20px', fontWeight: 600, color: headerColor }}>
                      {(() => { const t = tableMap.get(matchedGuest.table_id); return t ? `Table ${t.number} — ${t.name}` : 'Table'; })()}
                    </p>
                  </div>
                ) : (
                  <p style={{ fontSize: '14px', color: textColor }}>
                    {matchedGuest.name}, you don't have a table assignment yet.
                  </p>
                )
              ) : (
                <p style={{ fontSize: '14px', color: textColor }}>
                  No guest found with that name. Please check your spelling or contact the host.
                </p>
              )}
            </div>
          )}

          <button
            onClick={() => navigate(`/invitation/${event.slug}`)}
            style={{
              background: 'none', border: 'none', color: settings.color_link || '#4A4A4A',
              fontSize: '13px', marginTop: '24px', cursor: 'pointer', textDecoration: 'underline',
            }}
          >
            Back to invitation
          </button>
        </div>

        {settings.venue_image_url && (
          <div style={{ marginTop: '32px' }}>
            <h2
              style={{
                fontFamily: settings.font_title_family || 'Inter, sans-serif',
                fontSize: `${(settings.font_title_size ?? 28) * 0.7}px`,
                fontWeight: settings.font_title_weight ?? 700,
                color: headerColor,
                marginBottom: '16px',
                textAlign: 'center',
              }}
            >
              Venue Layout
            </h2>
            <div
              style={{
                borderRadius: `${borderRadius}px`,
                overflow: 'hidden',
                border: '1px solid #EFEFEF',
                boxShadow: settings.card_shadow ? '0 4px 24px rgba(0,0,0,0.08)' : 'none',
                background: cardColor,
              }}
            >
              <img
                src={settings.venue_image_url}
                alt="Venue layout"
                style={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                  maxHeight: '800px',
                  objectFit: 'contain',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
