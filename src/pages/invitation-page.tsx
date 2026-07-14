import { useParams } from 'react-router-dom';
import { useGuestPageSettingsBySlug } from '@/hooks/use-guest-page-settings';

export function InvitationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: eventData, isLoading } = useGuestPageSettingsBySlug(slug);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#4A4A4A', fontSize: '14px' }}>Loading...</p>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#4A4A4A', fontSize: '14px' }}>Invitation not found</p>
      </div>
    );
  }

  const event = eventData.event;
  const settings = eventData;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: settings.color_background || '#F8F8F8',
      color: settings.color_text || '#1A1A1A',
      fontFamily: settings.font_body || 'sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        background: settings.color_card || '#FFFFFF',
        borderRadius: `${settings.border_radius ?? 12}px`,
        padding: '40px 32px',
        textAlign: 'center',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>
        {settings.logo_url && (
          <img
            src={settings.logo_url}
            alt="Event"
            style={{
              maxWidth: '100px',
              maxHeight: '100px',
              marginBottom: '24px',
              borderRadius: settings.logo_rounded ? '50%' : `${settings.border_radius ?? 12}px`,
            }}
          />
        )}

        <h1 style={{
          fontSize: `${settings.font_heading_size || 28}px`,
          fontFamily: settings.font_heading || 'serif',
          fontWeight: settings.font_heading_weight || 700,
          color: settings.color_header || '#1A1A1A',
          marginBottom: '12px',
        }}>
          {event.name}
        </h1>

        {settings.event_subtitle && (
          <p style={{ fontSize: '16px', opacity: 0.8, marginBottom: '16px' }}>{settings.event_subtitle}</p>
        )}

        {event.venue && (
          <p style={{ fontSize: '15px', marginBottom: '8px' }}>{event.venue}</p>
        )}

        {event.date && (
          <p style={{ fontSize: '14px', opacity: 0.7 }}>
            {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {event.time ? ` at ${event.time}` : ''}
          </p>
        )}

        <a
          href={`/find-your-seat/${event.slug}`}
          style={{
            display: 'inline-block',
            marginTop: '32px',
            padding: '12px 32px',
            borderRadius: `${settings.border_radius ?? 12}px`,
            background: settings.color_button || '#1A1A1A',
              color: settings.color_button_text || '#FFFFFF',
            fontSize: '15px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Find Your Seat
        </a>
      </div>
    </div>
  );
}
