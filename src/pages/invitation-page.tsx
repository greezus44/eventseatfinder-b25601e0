import React, { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useGuestPageSettingsBySlug } from '@/hooks/use-guest-page-settings';
import { getFontLinkTag, getFontCss, getFontSize, getFontWeight } from '@/lib/fonts';

export function InvitationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useGuestPageSettingsBySlug(slug ?? '');

  const settings = data;
  const event = data?.event;

  // Collect all font families used
  const fontFamilies = useMemo(
    () =>
      [
        settings?.font_title_family,
        settings?.font_subtitle_family,
        settings?.font_datetime_family,
        settings?.font_venue_family,
      ].filter(Boolean) as string[],
    [settings]
  );

  // Dynamically load Google Fonts
  useEffect(() => {
    const href = getFontLinkTag(fontFamilies);
    if (!href) return;
    const existing = document.querySelector(`link[href="${href}"]`);
    if (!existing) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  }, [fontFamilies.join(',')]);

  if (isLoading) {
    return (
      <div className="full-center">
        <div className="spinner" />
      </div>
    );
  }

  if (isError || !settings || !event) {
    return (
      <div className="empty-state">
        <p className="empty-state-title">Invitation not found</p>
        <p>Please check your link and try again.</p>
      </div>
    );
  }

  const bgColor = settings.color_background ?? '#FFFFFF';
  const cardColor = settings.color_card ?? '#FFFFFF';
  const textColor = settings.color_text ?? '#1A1A1A';
  const headerColor = settings.color_header ?? '#1A1A1A';
  const primaryColor = settings.color_primary ?? '#1A1A1A';
  const borderRadius = settings.border_radius ?? 12;
  const logoSize = Math.min(settings.logo_size ?? 120, 500);
  const logoRounded = settings.logo_rounded ?? false;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '';
    try {
      const [h, m] = timeStr.split(':');
      const d = new Date();
      d.setHours(Number(h), Number(m));
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return timeStr;
    }
  };

  const datetimeStr = [
    formatDate(event.date ?? null),
    formatTime(event.time ?? null),
  ]
    .filter(Boolean)
    .join(' at ');

  return (
    <div
      className="guest-page"
      style={{
        background: bgColor,
        color: textColor,
      }}
    >
      {settings.logo_url && (
        <img
          src={settings.logo_url}
          alt="Event logo"
          className="guest-page-logo"
          style={{
            width: `${logoSize}px`,
            maxWidth: '500px',
            height: 'auto',
            borderRadius: logoRounded ? '50%' : '0',
          }}
        />
      )}

      <div
        className="guest-page-card"
        style={{
          background: cardColor,
          borderRadius: `${borderRadius}px`,
          color: textColor,
        }}
      >
        <h1
          className="guest-page-title"
          style={{
            color: headerColor,
            fontFamily: getFontCss(settings.font_title_family),
            fontSize: getFontSize(settings.font_title_size),
            fontWeight: getFontWeight(settings.font_title_weight),
          }}
        >
          {event.name}
        </h1>

        {settings.event_subtitle && (
          <p
            className="guest-page-subtitle"
            style={{
              fontFamily: getFontCss(settings.font_subtitle_family),
              fontSize: getFontSize(settings.font_subtitle_size),
              fontWeight: getFontWeight(settings.font_subtitle_weight),
            }}
          >
            {settings.event_subtitle}
          </p>
        )}

        {datetimeStr && (
          <p
            className="guest-page-datetime"
            style={{
              fontFamily: getFontCss(settings.font_datetime_family),
              fontSize: getFontSize(settings.font_datetime_size),
              fontWeight: getFontWeight(settings.font_datetime_weight),
            }}
          >
            {datetimeStr}
          </p>
        )}

        {event.venue && (
          <p
            className="guest-page-venue"
            style={{
              fontFamily: getFontCss(settings.font_venue_family),
              fontSize: getFontSize(settings.font_venue_size),
              fontWeight: getFontWeight(settings.font_venue_weight),
            }}
          >
            {event.venue}
          </p>
        )}

        {settings.welcome_message && (
          <p className="guest-page-welcome">{settings.welcome_message}</p>
        )}

        <button
          className="btn btn-primary"
          style={{
            background: primaryColor,
            borderColor: primaryColor,
            borderRadius: `${borderRadius}px`,
          }}
          onClick={() => {
            window.location.href = `/find-your-seat/${event.slug}`;
          }}
        >
          Find Your Seat
        </button>
      </div>

      {settings.venue_image_url && (
        <img
          src={settings.venue_image_url}
          alt="Venue layout"
          className="guest-page-venue-image"
          style={{ maxWidth: '800px' }}
        />
      )}
    </div>
  );
}
