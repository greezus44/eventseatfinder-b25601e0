import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useEventBySlug } from '@/hooks/use-events';
import { useSearchGuest } from '@/hooks/use-guests';
import { useGuestPageSettingsBySlug } from '@/hooks/use-guest-page-settings';
import { useRSVPByGuest, useUpsertRSVP } from '@/hooks/use-rsvps';
import { DEFAULT_SETTINGS } from '@/types/guest-page-settings';
import type { GuestPageSettings } from '@/types/guest-page-settings';

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'find-seat', label: 'Find Seat' },
  { id: 'venue', label: 'Venue' },
  { id: 'details', label: 'Details' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'rsvp', label: 'RSVP' },
];

export function FindYourSeatPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading: eventLoading } = useEventBySlug(slug ?? '');
  const { data: settings } = useGuestPageSettingsBySlug(slug ?? '');

  const [searchName, setSearchName] = useState('');
  const [searchedName, setSearchedName] = useState('');
  const [activeSection, setActiveSection] = useState('home');
  const [rsvpStatus, setRsvpStatus] = useState<'yes' | 'no' | 'maybe' | ''>('');
  const [plusOnes, setPlusOnes] = useState(0);
  const [rsvpMessage, setRsvpMessage] = useState('');
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);

  // Zoom/pan image viewer state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const venueImgRef = useRef<HTMLDivElement>(null);

  const effectiveSettings = { ...(DEFAULT_SETTINGS as GuestPageSettings), ...(settings ?? {}) } as GuestPageSettings;

  const { data: guest, isFetching: guestFetching } = useSearchGuest(
    event?.id ?? '',
    searchedName,
  );

  const { data: existingRsvp } = useRSVPByGuest(event?.id ?? '', guest?.id ?? '');

  const { mutateAsync: upsertRSVP } = useUpsertRSVP(event?.id ?? '');

  useEffect(() => {
    if (existingRsvp) {
      setRsvpStatus(existingRsvp.status as 'yes' | 'no' | 'maybe');
      setPlusOnes(existingRsvp.plus_ones ?? 0);
      setRsvpMessage(existingRsvp.message ?? '');
    }
  }, [existingRsvp]);

  // Scroll-spy with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 },
    );

    NAV_ITEMS.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [effectiveSettings.enable_schedule, effectiveSettings.enable_gallery]);

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchName.trim()) return;
    setSearchedName(searchName.trim());
  };

  const handleRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guest || !rsvpStatus) return;
    setRsvpSubmitting(true);
    try {
      await upsertRSVP({
        guest_id: guest.id,
        status: rsvpStatus,
        plus_ones: plusOnes,
        message: rsvpMessage || undefined,
      });
    } finally {
      setRsvpSubmitting(false);
    }
  };

  // Zoom/pan handlers
  const clampZoom = (z: number) => Math.min(5, Math.max(1, z));

  const handleZoomIn = () => {
    setZoom((z) => clampZoom(z + 0.5));
  };

  const handleZoomOut = () => {
    setZoom((z) => clampZoom(z - 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.3 : 0.3;
    setZoom((z) => clampZoom(z + delta));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom === 1) return;
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({
      x: dragStart.current.panX + dx,
      y: dragStart.current.panY + dy,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoom === 1 || e.touches.length !== 1) return;
    const t = e.touches[0];
    setIsDragging(true);
    dragStart.current = {
      x: t.clientX,
      y: t.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const t = e.touches[0];
    const dx = t.clientX - dragStart.current.x;
    const dy = t.clientY - dragStart.current.y;
    setPan({
      x: dragStart.current.panX + dx,
      y: dragStart.current.panY + dy,
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  const themeStyle = {
    '--gp-color-primary': effectiveSettings.color_primary,
    '--gp-color-secondary': effectiveSettings.color_secondary,
    '--gp-color-background': effectiveSettings.color_background,
    '--gp-color-card': effectiveSettings.color_card,
    '--gp-color-text': effectiveSettings.color_text,
    '--gp-color-header': effectiveSettings.color_header,
    '--gp-color-button': effectiveSettings.color_button,
    '--gp-color-button-text': effectiveSettings.color_button_text,
    '--gp-color-link': effectiveSettings.color_link,
    '--gp-color-footer': effectiveSettings.color_footer,
    '--gp-font-heading': effectiveSettings.font_heading,
    '--gp-font-body': effectiveSettings.font_body,
    '--gp-font-button': effectiveSettings.font_button,
    '--gp-font-heading-size': effectiveSettings.font_heading_size,
    '--gp-font-body-size': effectiveSettings.font_body_size,
    '--gp-font-heading-weight': effectiveSettings.font_heading_weight,
    '--gp-font-body-weight': effectiveSettings.font_body_weight,
    '--gp-border-radius': effectiveSettings.border_radius,
    '--gp-banner-height': effectiveSettings.banner_height,
    '--gp-logo-size': effectiveSettings.logo_size,
    '--gp-overlay-opacity': effectiveSettings.background_overlay_opacity,
  } as React.CSSProperties;

  if (eventLoading) {
    return (
      <div className="gp-loading" style={themeStyle}>
        <div className="gp-loading-spinner" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="gp-not-found" style={themeStyle}>
        <h1 className="gp-not-found-title">Event not found</h1>
        <p className="gp-not-found-text">
          The event you're looking for doesn't exist or has been removed.
        </p>
      </div>
    );
  }

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.id === 'schedule' && !effectiveSettings.enable_schedule) return false;
    if (item.id === 'gallery' && !effectiveSettings.enable_gallery) return false;
    return true;
  });

  const heroBg = effectiveSettings.cover_image || event.cover_url || '';
  const hasVenueImage = Boolean(effectiveSettings.venue_image_url);

  return (
    <div className="gp-page" style={themeStyle}>
      {/* Hero */}
      <section id="home" className="gp-hero">
        {heroBg ? (
          <div
            className="gp-hero-bg"
            style={{ backgroundImage: `url(${heroBg})` }}
          />
        ) : (
          <div className="gp-hero-bg gp-hero-bg--gradient" />
        )}
        <div className="gp-hero-overlay" />
        <div className="gp-hero-content">
          {effectiveSettings.logo_url || event.logo_url ? (
            <img
              src={effectiveSettings.logo_url || event.logo_url || undefined}
              alt={`${event.name} logo`}
              className={`gp-hero-logo ${
                effectiveSettings.logo_rounded ? 'gp-hero-logo--rounded' : ''
              }`}
            />
          ) : null}
          <h1 className="gp-hero-title">{event.name}</h1>
          {effectiveSettings.event_subtitle && (
            <p className="gp-hero-subtitle">{effectiveSettings.event_subtitle}</p>
          )}
          {effectiveSettings.welcome_message && (
            <p className="gp-hero-welcome">{effectiveSettings.welcome_message}</p>
          )}
          <button
            className="gp-hero-cta"
            onClick={() => scrollToSection('find-seat')}
          >
            Find Your Seat
          </button>
        </div>
      </section>

      {/* Sticky Nav */}
      <nav className="gp-nav">
        <div className="gp-nav-inner">
          {visibleNavItems.map((item) => (
            <button
              key={item.id}
              className={`gp-nav-link ${
                activeSection === item.id ? 'gp-nav-link--active' : ''
              }`}
              onClick={() => scrollToSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Find Seat */}
      <section id="find-seat" className="gp-section">
        <div className="gp-container">
          <h2 className="gp-section-title">Find Your Seat</h2>
          <p className="gp-section-subtitle">
            Type your name to discover where you'll be seated.
          </p>
          <form className="gp-search-form" onSubmit={handleSearch}>
            <input
              type="text"
              className="gp-search-input"
              placeholder="Enter your name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
            <button type="submit" className="gp-search-btn" disabled={guestFetching}>
              {guestFetching ? 'Searching...' : 'Search'}
            </button>
          </form>

          {searchedName && !guestFetching && guest && (
            <div className="gp-search-result">
              <div className="gp-result-avatar">
                {guest.name.charAt(0).toUpperCase()}
              </div>
              <div className="gp-result-info">
                <h3 className="gp-result-name">{guest.name}</h3>
                {guest.table ? (
                  <p className="gp-result-table">
                    Table <strong>{guest.table.name || `#${guest.table.number}`}</strong>
                    {guest.table.number != null && guest.table.name
                      ? ` (Table ${guest.table.number})`
                      : ''}
                  </p>
                ) : (
                  <p className="gp-result-table gp-result-table--unassigned">
                    Your table is being assigned — check back soon!
                  </p>
                )}
              </div>
            </div>
          )}

          {searchedName && !guestFetching && !guest && (
            <div className="gp-search-empty">
              <p>
                We couldn't find "<strong>{searchedName}</strong>" on the guest list.
                Please check the spelling or contact the host.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Venue — Zoom/Pan Image Viewer */}
      <section id="venue" className="gp-section gp-section--venue">
        <div className="gp-container">
          <h2 className="gp-section-title">Venue Layout</h2>
          <p className="gp-section-subtitle">
            Explore the seating arrangement. Zoom and pan to find your spot.
          </p>

          {hasVenueImage ? (
            <div className="gp-venue-viewer">
              <div
                className="gp-venue-viewport"
                ref={venueImgRef}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
              >
                <img
                  src={effectiveSettings.venue_image_url ?? undefined}
                  alt="Venue layout"
                  className="gp-venue-image"
                  draggable={false}
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transition: isDragging ? 'none' : 'transform 0.25s ease-out',
                  }}
                />
              </div>
              <div className="gp-venue-controls">
                <button
                  className="gp-venue-btn"
                  onClick={handleZoomIn}
                  aria-label="Zoom in"
                  title="Zoom in"
                >
                  +
                </button>
                <button
                  className="gp-venue-btn"
                  onClick={handleZoomOut}
                  aria-label="Zoom out"
                  title="Zoom out"
                >
                  −
                </button>
                <button
                  className="gp-venue-btn gp-venue-btn--reset"
                  onClick={handleResetZoom}
                  aria-label="Reset zoom"
                  title="Reset zoom"
                >
                  ⟲
                </button>
                <span className="gp-venue-zoom-label">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="gp-venue-placeholder">
              <div className="gp-venue-placeholder-icon" aria-hidden="true">🗺️</div>
              <p className="gp-venue-placeholder-text">
                A venue layout image will be available here soon.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Details */}
      <section id="details" className="gp-section">
        <div className="gp-container">
          <h2 className="gp-section-title">Event Details</h2>
          <div className="gp-details-grid">
            <div className="gp-detail-card">
              <span className="gp-detail-label">Date</span>
              <span className="gp-detail-value">
                {event.date
                  ? new Date(event.date).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'TBA'}
              </span>
            </div>
            <div className="gp-detail-card">
              <span className="gp-detail-label">Time</span>
              <span className="gp-detail-value">{event.time || 'TBA'}</span>
            </div>
            <div className="gp-detail-card">
              <span className="gp-detail-label">Venue</span>
              <span className="gp-detail-value">{event.venue || 'TBA'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Schedule */}
      {effectiveSettings.enable_schedule &&
        Array.isArray(effectiveSettings.schedule_items) &&
        effectiveSettings.schedule_items.length > 0 && (
          <section id="schedule" className="gp-section gp-section--schedule">
            <div className="gp-container">
              <h2 className="gp-section-title">Schedule</h2>
              <div className="gp-timeline">
                {(effectiveSettings.schedule_items as { time?: string; title?: string; description?: string }[]).map((item, idx) => (
                  <div className="gp-timeline-item" key={idx}>
                    <div className="gp-timeline-time">{item.time}</div>
                    <div className="gp-timeline-dot" />
                    <div className="gp-timeline-content">
                      <h3 className="gp-timeline-title">{item.title}</h3>
                      {item.description && (
                        <p className="gp-timeline-desc">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      {/* Gallery */}
      {effectiveSettings.enable_gallery &&
        Array.isArray(effectiveSettings.gallery_images) &&
        effectiveSettings.gallery_images.length > 0 && (
          <section id="gallery" className="gp-section gp-section--gallery">
            <div className="gp-container">
              <h2 className="gp-section-title">Gallery</h2>
              <div className="gp-gallery-grid">
                {effectiveSettings.gallery_images.map((img, idx) => (
                  <div className="gp-gallery-item" key={idx}>
                    <img src={img} alt={`Gallery image ${idx + 1}`} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      {/* RSVP */}
      <section id="rsvp" className="gp-section gp-section--rsvp">
        <div className="gp-container">
          <h2 className="gp-section-title">RSVP</h2>
          {!guest ? (
            <div className="gp-rsvp-locked">
              <p className="gp-rsvp-locked-text">
                Please find your seat above first, then return here to RSVP.
              </p>
              <button
                className="gp-rsvp-locked-btn"
                onClick={() => scrollToSection('find-seat')}
              >
                Find Your Seat
              </button>
            </div>
          ) : (
            <form className="gp-rsvp-form" onSubmit={handleRSVP}>
              <p className="gp-rsvp-greeting">
                Hi <strong>{guest.name}</strong>! Will you be joining us?
              </p>

              <div className="gp-rsvp-options">
                {(['yes', 'no', 'maybe'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`gp-rsvp-option ${
                      rsvpStatus === opt ? 'gp-rsvp-option--active' : ''
                    } gp-rsvp-option--${opt}`}
                    onClick={() => setRsvpStatus(opt)}
                  >
                    {opt === 'yes' ? '✓ Yes' : opt === 'no' ? '✕ No' : '? Maybe'}
                  </button>
                ))}
              </div>

              {rsvpStatus === 'yes' && (
                <label className="gp-rsvp-field">
                  <span className="gp-rsvp-label">Number of plus-ones</span>
                  <input
                    type="number"
                    className="gp-rsvp-input"
                    min={0}
                    max={10}
                    value={plusOnes}
                    onChange={(e) => setPlusOnes(Math.max(0, Number(e.target.value)))}
                  />
                </label>
              )}

              <label className="gp-rsvp-field">
                <span className="gp-rsvp-label">Message (optional)</span>
                <textarea
                  className="gp-rsvp-textarea"
                  rows={3}
                  value={rsvpMessage}
                  onChange={(e) => setRsvpMessage(e.target.value)}
                  placeholder="Leave a note for the host..."
                />
              </label>

              <button
                type="submit"
                className="gp-rsvp-submit"
                disabled={!rsvpStatus || rsvpSubmitting}
              >
                {rsvpSubmitting ? 'Sending...' : 'Send RSVP'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="gp-footer">
        <div className="gp-container">
          <p className="gp-footer-text">{event.name}</p>
          <p className="gp-footer-sub">Powered by Seatly</p>
        </div>
      </footer>
    </div>
  );
}
