import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGuestPageSettingsBySlug } from '@/hooks/use-guest-page-settings';
import { getFontCss, getFontSize, getFontWeight } from '@/lib/fonts';

function loadGoogleFonts(fontFamilies: (string | null | undefined)[]) {
  const unique = [...new Set(fontFamilies.filter((f): f is string => !!f))];
  unique.forEach((family) => {
    const id = `font-${family.replace(/\s+/g, '-').toLowerCase()}`;
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@300;400;500;600;700&display=swap`;
    document.head.appendChild(link);
  });
}

export function InvitationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: settings, isLoading } = useGuestPageSettingsBySlug(slug);

  useEffect(() => {
    if (!settings) return;
    loadGoogleFonts([
      settings.font_title_family,
      settings.font_subtitle_family,
      settings.font_datetime_family,
      settings.font_venue_family,
      settings.font_welcome_family,
    ]);
  }, [settings]);

  if (isLoading) {
    return React.createElement(
      'div',
      { className: 'loading-screen' },
      React.createElement('div', { className: 'spinner' }),
    );
  }

  if (!settings || !settings.event) {
    return React.createElement(
      'div',
      { className: 'loading-screen' },
      React.createElement(
        'div',
        { className: 'card text-center' },
        React.createElement('h2', null, 'Invitation Not Found'),
        React.createElement('p', { className: 'text-muted mt-4' }, 'This invitation may have been disabled or the link is incorrect.'),
      ),
    );
  }

  const event = settings.event;
  const accentColor = settings.color_primary || '#1A1A1A';
  const bgColor = settings.color_background || '#F8F8F8';

  const titleStyle: React.CSSProperties = {
    fontFamily: getFontCss(settings.font_title_family),
    fontSize: getFontSize(settings.font_title_size),
    fontWeight: getFontWeight(settings.font_title_weight),
    color: settings.font_title_color || '#1A1A1A',
  };

  const subtitleStyle: React.CSSProperties = {
    fontFamily: getFontCss(settings.font_subtitle_family),
    fontSize: getFontSize(settings.font_subtitle_size),
    fontWeight: getFontWeight(settings.font_subtitle_weight),
    color: settings.font_subtitle_color || '#4A4A4A',
  };

  const datetimeStyle: React.CSSProperties = {
    fontFamily: getFontCss(settings.font_datetime_family),
    fontSize: getFontSize(settings.font_datetime_size),
    fontWeight: getFontWeight(settings.font_datetime_weight),
    color: settings.font_datetime_color || '#4A4A4A',
  };

  const venueStyle: React.CSSProperties = {
    fontFamily: getFontCss(settings.font_venue_family),
    fontSize: getFontSize(settings.font_venue_size),
    fontWeight: getFontWeight(settings.font_venue_weight),
    color: settings.font_venue_color || '#4A4A4A',
  };

  const welcomeStyle: React.CSSProperties = {
    fontFamily: getFontCss(settings.font_welcome_family),
    fontSize: getFontSize(settings.font_welcome_size),
    fontWeight: getFontWeight(settings.font_welcome_weight),
    color: settings.font_welcome_color || '#4A4A4A',
  };

  const logoSize = settings.logo_size ? Math.min(settings.logo_size, 500) : 120;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
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
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${m} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const dateStr = formatDate(event.date);
  const timeStr = formatTime(event.time);

  return React.createElement(
    'div',
    {
      className: 'guest-page',
      style: { background: bgColor },
    },
    settings.logo_url
      ? React.createElement('img', {
          src: settings.logo_url,
          alt: event.name,
          className: 'guest-page-logo',
          style: {
            maxHeight: `${logoSize}px`,
            borderRadius: settings.logo_rounded ? '50%' : '0',
          },
        })
      : null,
    React.createElement('h1', { className: 'guest-page-title', style: titleStyle }, event.name),
    settings.event_subtitle || event.venue
      ? React.createElement('p', { style: { ...subtitleStyle, marginBottom: '12px' } }, settings.event_subtitle || '')
      : null,
    dateStr
      ? React.createElement('p', { style: { ...datetimeStyle, marginBottom: '4px' } }, dateStr)
      : null,
    timeStr
      ? React.createElement('p', { style: { ...datetimeStyle, marginBottom: '4px' } }, timeStr)
      : null,
    event.venue
      ? React.createElement('p', { style: { ...venueStyle, marginBottom: '20px' } }, event.venue)
      : null,
    settings.welcome_message
      ? React.createElement('p', { style: { ...welcomeStyle, marginBottom: '24px', maxWidth: '600px', textAlign: 'center' } }, settings.welcome_message)
      : null,
    settings.venue_image_url
      ? React.createElement('img', {
          src: settings.venue_image_url,
          alt: 'Venue Layout',
          className: 'guest-page-venue-image',
          style: { maxHeight: '800px' },
        })
      : null,
    React.createElement(
      Link,
      {
        to: `/find-your-seat/${slug}`,
        className: 'btn',
        style: {
          background: accentColor,
          color: settings.color_button_text || '#FFFFFF',
          borderColor: accentColor,
          marginTop: '24px',
          padding: '0 32px',
          height: '48px',
          fontSize: '15px',
        },
      },
      'Find Your Seat',
    ),
  );
}
