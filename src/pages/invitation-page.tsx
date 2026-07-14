import { useParams, useNavigate } from 'react-router-dom';
import { useGuestPageSettingsBySlug } from '@/hooks/use-guest-page-settings';
import { GOOGLE_FONTS } from '@/lib/fonts';
import { useEffect } from 'react';

export function InvitationPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: settings, isLoading } = useGuestPageSettingsBySlug(slug);

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
      const id = `inv-font-${f.replace(/\s+/g, '-').toLowerCase()}`;
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
          <h1 style={{ fontSize: '24px', marginBottom: '12px' }}>Invitation Not Found</h1>
          <p style={{ color: '#4A4A4A' }}>The invitation you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const event = settings.event;
  const bgColor = settings.color_background || '#ffffff';
  const cardColor = settings.color_card || '#ffffff';
  const textColor = settings.color_text || '#1a1a1a';
  const headerColor = settings.color_header || '#1a1a1a';
  const buttonColor = settings.color_button || '#1a1a1a';
  const buttonTextColor = settings.color_button_text || '#ffffff';
  const borderRadius = settings.border_radius ?? 12;
  const logoSize = settings.logo_size ?? 80;

  const formatDateLine = () => {
    const parts: string[] = [];
    if (event.date) parts.push(new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    if (event.time) parts.push(event.time);
    return parts.join(' at ');
  };

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
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontFamily: settings.font_title_family || settings.font_heading || 'Inter, sans-serif',
              fontSize: `${settings.font_title_size ?? 28}px`,
              fontWeight: settings.font_title_weight ?? 700,
              color: headerColor,
              marginBottom: '8px',
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
                marginBottom: '16px',
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
                marginBottom: '8px',
                opacity: 0.75,
              }}
            >
              {formatDateLine()}
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
                opacity: 0.75,
              }}
            >
              {event.venue}
            </p>
          )}

          {settings.welcome_message && (
            <p style={{ fontSize: '14px', color: textColor, marginBottom: '24px', lineHeight: 1.6, opacity: 0.7 }}>
              {settings.welcome_message}
            </p>
          )}

          <button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '44px',
              padding: '0 32px',
              borderRadius: `${borderRadius}px`,
              border: 'none',
              background: buttonColor,
              color: buttonTextColor,
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onClick={() => navigate(`/find-your-seat/${event.slug}`)}
          >
            Find Your Seat
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
