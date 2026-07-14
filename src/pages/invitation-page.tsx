import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useGuestPageSettingsBySlug } from '@/hooks/use-guest-page-settings'
import { loadGoogleFonts, getFontCss } from '@/lib/fonts'

export function InvitationPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data, isLoading } = useGuestPageSettingsBySlug(slug ?? '')
  const [fontsLoaded, setFontsLoaded] = useState(false)

  const settings = data
  const event = data?.events

  const titleFont = settings?.font_title_family ?? 'Inter'
  const subtitleFont = settings?.font_subtitle_family ?? 'Inter'
  const datetimeFont = settings?.font_datetime_family ?? 'Inter'
  const venueFont = settings?.font_venue_family ?? 'Inter'
  const welcomeFont = settings?.font_welcome_family ?? 'Inter'

  useEffect(() => {
    loadGoogleFonts([titleFont, subtitleFont, datetimeFont, venueFont, welcomeFont])
    setFontsLoaded(true)
  }, [titleFont, subtitleFont, datetimeFont, venueFont, welcomeFont])

  if (isLoading) {
    return (
      <div className="gp-loading">
        <div className="spinner spinner-lg" />
      </div>
    )
  }

  if (!settings || !event) {
    return (
      <div className="gp-loading">
        <p>Event not found</p>
      </div>
    )
  }

  const primary = settings.color_primary ?? '#0f766e'
  const bg = settings.color_background ?? '#f8fafc'
  const card = settings.color_card ?? '#ffffff'
  const text = settings.color_text ?? '#0f172a'
  const header = settings.color_header ?? '#ffffff'
  const radius = `${settings.border_radius ?? 16}px`
  const logoSize = settings.logo_size ?? 80
  const logoRounded = settings.logo_rounded ?? false
  const welcomeMessage = settings.welcome_message ?? 'Welcome to our event! We look forward to celebrating with you.'

  const formatDate = () => {
    if (!event.date) return ''
    const d = new Date(event.date)
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const formatTime = () => {
    if (!event.time) return ''
    return event.time
  }

  return (
    <div className="gp-page" style={{ background: bg, color: text }}>
      <div className="gp-container">
        {/* Logo */}
        {settings.logo_url && (
          <div className="gp-logo-wrapper">
            <img
              src={settings.logo_url}
              alt="Event logo"
              className="gp-logo"
              style={{
                width: `${Math.min(logoSize, 500)}px`,
                height: 'auto',
                borderRadius: logoRounded ? '50%' : '0',
              }}
            />
          </div>
        )}

        {/* Event Name */}
        <h1
          className="gp-title"
          style={{
            fontFamily: getFontCss(titleFont),
            fontSize: `${settings.font_title_size ?? 32}px`,
            color: settings.font_title_color ?? text,
          }}
        >
          {event.name}
        </h1>

        {/* Subtitle */}
        {settings.event_subtitle && (
          <p
            className="gp-subtitle"
            style={{
              fontFamily: getFontCss(subtitleFont),
              fontSize: `${settings.font_subtitle_size ?? 16}px`,
              color: settings.font_subtitle_color ?? text,
            }}
          >
            {settings.event_subtitle}
          </p>
        )}

        {/* Date & Time */}
        {event.date && (
          <p
            className="gp-datetime"
            style={{
              fontFamily: getFontCss(datetimeFont),
              fontSize: `${settings.font_datetime_size ?? 14}px`,
              color: settings.font_datetime_color ?? text,
            }}
          >
            {formatDate()}
            {event.time && ` at ${formatTime()}`}
          </p>
        )}

        {/* Venue */}
        {event.venue && (
          <p
            className="gp-venue"
            style={{
              fontFamily: getFontCss(venueFont),
              fontSize: `${settings.font_venue_size ?? 14}px`,
              color: settings.font_venue_color ?? text,
            }}
          >
            {event.venue}
          </p>
        )}

        {/* Welcome Message */}
        <p
          className="gp-welcome"
          style={{
            fontFamily: getFontCss(welcomeFont),
            fontSize: `${settings.font_welcome_size ?? 16}px`,
            color: settings.font_welcome_color ?? text,
          }}
        >
          {welcomeMessage}
        </p>

        {/* Find Your Seat Button */}
        <a
          href={`/find-your-seat/${slug}`}
          className="gp-find-seat-btn"
          style={{
            background: primary,
            color: settings.color_button_text ?? '#ffffff',
            borderRadius: radius,
          }}
        >
          Find Your Seat
        </a>

        {/* Venue Layout */}
        {settings.venue_image_url && (
          <div className="gp-venue-layout">
            <img
              src={settings.venue_image_url}
              alt="Venue layout"
              className="gp-venue-img"
              style={{ borderRadius: radius }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
