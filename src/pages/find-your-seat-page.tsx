import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGuestPageSettingsBySlug } from '@/hooks/use-guest-page-settings';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { useCreateRsvp } from '@/hooks/use-rsvps';
import { useToast } from '@/providers/toast-provider';

export function FindYourSeatPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: eventData, isLoading } = useGuestPageSettingsBySlug(slug);
  const { data: guests } = useGuests(eventData?.event.id);
  const { data: tables } = useTables(eventData?.event.id);
  const createRsvp = useCreateRsvp();
  const toast = useToast();
  const [searchName, setSearchName] = useState('');

  const event = eventData ? {
    id: eventData.event.id,
    name: eventData.event.name,
    slug: eventData.event.slug,
    date: eventData.event.date,
    time: eventData.event.time,
    venue: eventData.event.venue,
    logo_url: eventData.logo_url,
    accent_color: eventData.color_primary,
  } : null;
  const settings = eventData ?? null;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#4A4A4A', fontSize: '14px' }}>Loading...</p>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '8px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Event Not Found</h1>
        <p style={{ fontSize: '14px', color: '#4A4A4A' }}>The event you're looking for doesn't exist.</p>
      </div>
    );
  }

  const matchedGuest = searchName
    ? guests?.find((g) => g.name.toLowerCase().includes(searchName.toLowerCase()))
    : null;
  const matchedTable = matchedGuest?.table_id
    ? tables?.find((t) => t.id === matchedGuest.table_id)
    : null;

  const bgColor = settings?.color_background || '#F8F8F8';
  const cardColor = settings?.color_card || '#FFFFFF';
  const textColor = settings?.color_text || '#1A1A1A';
  const headerColor = settings?.color_header || '#1A1A1A';
  const primaryColor = settings?.color_primary || '#1A1A1A';
  const borderRadius = settings?.border_radius ?? 12;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: bgColor,
      color: textColor,
      fontFamily: settings?.font_body || 'sans-serif',
    }}>
      <div className="gp-container" style={{ padding: '24px 16px' }}>
        {settings?.logo_url && (
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <img
              src={settings.logo_url}
              alt="Event logo"
              style={{
                maxWidth: '120px',
                maxHeight: '120px',
                borderRadius: settings.logo_rounded ? '50%' : `${borderRadius}px`,
              }}
            />
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: `${settings?.font_heading_size || 28}px`,
            fontFamily: settings?.font_heading || 'serif',
            fontWeight: settings?.font_heading_weight || 700,
            color: headerColor,
            marginBottom: '8px',
          }}>
            {event?.name}
          </h1>
          {settings?.welcome_message && (
            <p style={{ fontSize: '15px', opacity: 0.8 }}>{settings.welcome_message}</p>
          )}
          {event?.date && (
            <p style={{ fontSize: '14px', opacity: 0.6, marginTop: '4px' }}>
              {new Date(event.date).toLocaleDateString()}
              {event.time ? ` at ${event.time}` : ''}
              {event.venue ? ` • ${event.venue}` : ''}
            </p>
          )}
        </div>

        <div className="gp-card" style={{
          background: cardColor,
          borderRadius: `${borderRadius}px`,
          padding: '24px',
          boxShadow: settings?.card_shadow === 'none' ? 'none' : '0 2px 12px rgba(0,0,0,0.08)',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Find Your Seat</h2>
          <input
            type="text"
            placeholder="Enter your name"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="gp-input"
            style={{
              height: '44px',
              padding: '0 16px',
              borderRadius: `${borderRadius}px`,
              border: `1px solid ${settings?.color_button_text === '#FFFFFF' ? '#DADADA' : '#DADADA'}`,
              background: '#FFFFFF',
              fontSize: '15px',
              color: textColor,
              outline: 'none',
              width: '100%',
            }}
          />

          {searchName && matchedGuest && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              borderRadius: `${borderRadius}px`,
              background: bgColor,
            }}>
              <p style={{ fontSize: '15px', fontWeight: 600 }}>Welcome, {matchedGuest.name}!</p>
              {matchedTable ? (
                <p style={{ fontSize: '14px', marginTop: '4px', opacity: 0.8 }}>
                  You're seated at <strong>Table {matchedTable.number} — {matchedTable.name}</strong>
                </p>
              ) : (
                <p style={{ fontSize: '14px', marginTop: '4px', opacity: 0.8 }}>No table assigned yet.</p>
              )}
            </div>
          )}

          {searchName && !matchedGuest && guests && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              borderRadius: `${borderRadius}px`,
              background: bgColor,
            }}>
              <p style={{ fontSize: '14px', opacity: 0.7 }}>No match found. Please check your spelling or contact the host.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
