import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useEventBySlug } from '@/hooks/use-events';
import { useSearchGuest } from '@/hooks/use-guests';
import { useGuestPageSettingsBySlug } from '@/hooks/use-guest-page-settings';
import { useRSVPByGuest, useUpsertRSVP } from '@/hooks/use-rsvps';
import { DEFAULT_SETTINGS } from '@/types/guest-page-settings';
import type { GuestPageSettings } from '@/types/guest-page-settings';

export function FindYourSeatPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading: eventLoading } = useEventBySlug(slug ?? '');
  const { data: settings } = useGuestPageSettingsBySlug(slug ?? '');

  const effectiveSettings = {
    ...(DEFAULT_SETTINGS as GuestPageSettings),
    ...(settings ?? {}),
  } as GuestPageSettings;

  const eventId = event?.id ?? '';

  // --- Find Seat ---
  const [searchName, setSearchName] = useState('');
  const [debouncedName, setDebouncedName] = useState('');
  const { data: guest, isFetching } = useSearchGuest(eventId, debouncedName);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedName(searchName.trim()), 350);
    return () => clearTimeout(t);
  }, [searchName]);

  // --- RSVP ---
  const [rsvpStatus, setRsvpStatus] = useState<'yes' | 'no' | 'maybe'>('yes');
  const [plusOnes, setPlusOnes] = useState(0);
  const [rsvpMessage, setRsvpMessage] = useState('');
  const [rsvpSaved, setRsvpSaved] = useState(false);

  const guestId = guest?.id ?? '';
  const { data: existingRsvp } = useRSVPByGuest(eventId, guestId);
  const { mutateAsync: upsertRSVP } = useUpsertRSVP(eventId);

  useEffect(() => {
    if (existingRsvp) {
      setRsvpStatus(existingRsvp.status);
      setPlusOnes(existingRsvp.plus_ones);
      setRsvpMessage(existingRsvp.message ?? '');
    }
  }, [existingRsvp]);

  const handleRSVP = async () => {
    if (!guest) return;
    try {
      await upsertRSVP({
        guest_id: guest.id,
        status: rsvpStatus,
        plus_ones: plusOnes,
        message: rsvpMessage || null,
      });
      setRsvpSaved(true);
    } catch {
      // silently fail — toast not available on public page
    }
  };

  // --- Scroll-spy nav ---
  const [activeSection, setActiveSection] = useState('home');
  const navLinks = useRef<Record<string, HTMLElement | null>>({});
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({});

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

    Object.values(sectionsRef.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [effectiveSettings.enable_schedule, effectiveSettings.enable_gallery]);

  const scrollTo = useCallback((id: string) => {
    const el = sectionsRef.current[id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // --- Zoom / Pan venue viewer ---
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const venueRef = useRef<HTMLDivElement>(null);

  const zoomIn = () => setZoom((z) => Math.min(z + 0.25, 4));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.25, 1));
  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoom((z) => Math.min(Math.max(z + delta, 1), 4));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
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
    setPan({ x: dragStart.current.panX + dx, y: dragStart.current.panY + dy });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoom <= 1 || e.touches.length !== 1) return;
    const t = e.touches[0];
    setIsDragging(true);
    dragStart.current = { x: t.clientX, y: t.clientY, panX: pan.x, panY: pan.y };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const t = e.touches[0];
    const dx = t.clientX - dragStart.current.x;
    const dy = t.clientY - dragStart.current.y;
    setPan({ x: dragStart.current.panX + dx, y: dragStart.current.panY + dy });
  };

  const handleTouchEnd = () => setIsDragging(false);

  // --- Theme CSS vars ---
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
    '--gp-font-heading-size': `${effectiveSettings.font_heading_size}px`,
    '--gp-font-body-size': `${effectiveSettings.font_body_size}px`,
    '--gp-font-heading-weight': effectiveSettings.font_heading_weight,
    '--gp-font-body-weight': effectiveSettings.font_body_weight,
    '--gp-border-radius': `${effectiveSettings.border_radius}px`,
    '--gp-banner-height': `${effectiveSettings.banner_height}px`,
    '--gp-overlay-opacity': effectiveSettings.background_overlay_opacity,
    '--gp-logo-size': `${effectiveSettings.logo_size}px`,
  } as React.CSSProperties;

  if (eventLoading) {
    return (
      <div className="gp-loading" style={themeStyle}>
        <div className="gp-loading__spinner" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="gp-not-found" style={themeStyle}>
        <div className="gp-not-found__card">
          <h1 className="gp-not-found__title">Event not found</h1>
          <p className="gp-not-found__text">
            The event you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const hasCover = effectiveSettings.cover_image || event.cover_url;
  const coverSrc = (effectiveSettings.cover_image ?? event.cover_url) ?? undefined;
  const bgSrc = effectiveSettings.background_image ?? undefined;
  const venueSrc = effectiveSettings.venue_image_url ?? undefined;
  const logoSrc = (effectiveSettings.logo_url ?? event.logo_url) ?? undefined;
  const galleryImages = (effectiveSettings.gallery_images ?? []) as string[];
  const scheduleItems = (effectiveSettings.schedule_items ?? []) as { time?: string; title?: string; description?: string }[];

  const eventDate = event.date
    ? new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : 'TBA';

  const navItems: { id: string; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'find-seat', label: 'Find Seat' },
    { id: 'venue', label: 'Venue' },
    { id: 'details', label: 'Details' },
  ];
  if (effectiveSettings.enable_schedule) navItems.push({ id: 'schedule', label: 'Schedule' });
  if (effectiveSettings.enable_gallery) navItems.push({ id: 'gallery', label: 'Gallery' });
  navItems.push({ id: 'rsvp', label: 'RSVP' });

  return (
    <div className="gp-wrapper" style={themeStyle}>
      {/* === HERO === */}
      <section
        id="home"
        className="gp-hero"
        ref={(el) => { sectionsRef.current['home'] = el; }}
        style={{ minHeight: `var(--gp-banner-height)` }}
      >
        {hasCover ? (
          <img className="gp-hero__image" src={coverSrc} alt="" />
        ) : (
          <div className="gp-hero__gradient" />
        )}
        {bgSrc && <div className="gp-hero__overlay" />}
        <div className="gp-hero__content">
          {logoSrc && (
            <img
              className={`gp-hero__logo ${effectiveSettings.logo_rounded ? 'gp-hero__logo--rounded' : ''}`}
              src={logoSrc}
              alt={event.name}
              style={{ width: `var(--gp-logo-size)`, height: `var(--gp-logo-size)` }}
            />
          )}
          <h1 className="gp-hero__title">{event.name}</h1>
          {effectiveSettings.event_subtitle && (
            <p className="gp-hero__subtitle">{effectiveSettings.event_subtitle}</p>
          )}
          {effectiveSettings.welcome_message && (
            <p className="gp-hero__welcome">{effectiveSettings.welcome_message}</p>
          )}
          <div className="gp-hero__meta">
            <span className="gp-hero__meta-item">{eventDate}</span>
            {event.venue && <span className="gp-hero__meta-item">{event.venue}</span>}
          </div>
        </div>
      </section>

      {/* === STICKY NAV === */}
      <nav className="gp-nav">
        <div className="gp-nav__inner">
          {navItems.map((item) => (
            <button
              key={item.id}
              ref={(el) => { navLinks.current[item.id] = el; }}
              className={`gp-nav__link ${activeSection === item.id ? 'gp-nav__link--active' : ''}`}
              onClick={() => scrollTo(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* === FIND SEAT === */}
      <section
        id="find-seat"
        className="gp-section"
        ref={(el) => { sectionsRef.current['find-seat'] = el; }}
      >
        <div className="gp-section__inner">
          <h2 className="gp-section__title">Find Your Seat</h2>
          <p className="gp-section__desc">
            Type your name below to find your assigned table.
          </p>
          <input
            className="gp-search"
            type="text"
            placeholder="Enter your name…"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
          <div className="gp-search__result">
            {isFetching && <div className="gp-search__loading">Searching…</div>}
            {!isFetching && searchName.trim() && !guest && (
              <div className="gp-search__empty">
                No match found. Try a different spelling or check with the host.
              </div>
            )}
            {!isFetching && guest && (
              <div className="gp-search__card">
                <div className="gp-search__guest-name">{guest.name}</div>
                {guest.table ? (
                  <div className="gp-search__table">
                    <span className="gp-search__table-label">Your table</span>
                    <span className="gp-search__table-name">{guest.table.name}</span>
                    <span className="gp-search__table-number">Table {guest.table.number}</span>
                  </div>
                ) : (
                  <div className="gp-search__no-table">
                    You don't have a table assignment yet. Please check with the host.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* === VENUE (ZOOM/PAN) === */}
      <section
        id="venue"
        className="gp-section gp-section--alt"
        ref={(el) => { sectionsRef.current['venue'] = el; }}
      >
        <div className="gp-section__inner">
          <h2 className="gp-section__title">Venue Layout</h2>
          <p className="gp-section__desc">
            Zoom and pan to explore the seating arrangement.
          </p>
          {venueSrc ? (
            <div className="gp-venue-viewer">
              <div
                className="gp-venue-viewer__viewport"
                ref={venueRef}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  className="gp-venue-viewer__image"
                  src={venueSrc}
                  alt="Venue layout"
                  draggable={false}
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    cursor: isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default',
                  }}
                />
              </div>
              <div className="gp-venue-viewer__controls">
                <button className="gp-venue-viewer__btn" onClick={zoomIn} aria-label="Zoom in">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <button className="gp-venue-viewer__btn" onClick={zoomOut} aria-label="Zoom out">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <button className="gp-venue-viewer__btn" onClick={resetZoom} aria-label="Reset zoom">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9" />
                    <path d="M3 4v5h5" />
                  </svg>
                </button>
                <span className="gp-venue-viewer__zoom-label">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="gp-venue-placeholder">
              <div className="gp-venue-placeholder__icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
              <p className="gp-venue-placeholder__text">
                No venue layout image has been uploaded yet.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* === DETAILS === */}
      <section
        id="details"
        className="gp-section"
        ref={(el) => { sectionsRef.current['details'] = el; }}
      >
        <div className="gp-section__inner">
          <h2 className="gp-section__title">Event Details</h2>
          <div className="gp-details">
            <div className="gp-details__item">
              <span className="gp-details__label">Date</span>
              <span className="gp-details__value">{eventDate}</span>
            </div>
            {event.time && (
              <div className="gp-details__item">
                <span className="gp-details__label">Time</span>
                <span className="gp-details__value">{event.time}</span>
              </div>
            )}
            {event.venue && (
              <div className="gp-details__item">
                <span className="gp-details__label">Venue</span>
                <span className="gp-details__value">{event.venue}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* === SCHEDULE === */}
      {effectiveSettings.enable_schedule && scheduleItems.length > 0 && (
        <section
          id="schedule"
          className="gp-section gp-section--alt"
          ref={(el) => { sectionsRef.current['schedule'] = el; }}
        >
          <div className="gp-section__inner">
            <h2 className="gp-section__title">Schedule</h2>
            <div className="gp-schedule">
              {scheduleItems.map((item, i) => (
                <div key={i} className="gp-schedule__item">
                  {item.time && <span className="gp-schedule__time">{item.time}</span>}
                  <div className="gp-schedule__body">
                    {item.title && <span className="gp-schedule__title">{item.title}</span>}
                    {item.description && <span className="gp-schedule__desc">{item.description}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* === GALLERY === */}
      {effectiveSettings.enable_gallery && galleryImages.length > 0 && (
        <section
          id="gallery"
          className="gp-section"
          ref={(el) => { sectionsRef.current['gallery'] = el; }}
        >
          <div className="gp-section__inner">
            <h2 className="gp-section__title">Gallery</h2>
            <div className="gp-gallery">
              {galleryImages.map((img, i) => (
                <div key={i} className="gp-gallery__item">
                  <img src={img ?? undefined} alt="" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* === RSVP === */}
      <section
        id="rsvp"
        className="gp-section gp-section--alt"
        ref={(el) => { sectionsRef.current['rsvp'] = el; }}
      >
        <div className="gp-section__inner">
          <h2 className="gp-section__title">RSVP</h2>
          {!guest ? (
            <p className="gp-section__desc">
              Find your seat above first, then let us know if you'll be attending.
            </p>
          ) : (
            <div className="gp-rsvp">
              <div className="gp-rsvp__guest">
                <span className="gp-rsvp__guest-label">Responding for</span>
                <span className="gp-rsvp__guest-name">{guest.name}</span>
              </div>
              <div className="gp-rsvp__statuses">
                {(['yes', 'maybe', 'no'] as const).map((s) => (
                  <button
                    key={s}
                    className={`gp-rsvp__status ${rsvpStatus === s ? 'gp-rsvp__status--active' : ''}`}
                    onClick={() => setRsvpStatus(s)}
                  >
                    {s === 'yes' ? 'Joyfully Accept' : s === 'no' ? 'Regretfully Decline' : 'Maybe'}
                  </button>
                ))}
              </div>
              {rsvpStatus === 'yes' && (
                <div className="gp-rsvp__field">
                  <label className="gp-rsvp__label">Plus ones</label>
                  <div className="gp-rsvp__counter">
                    <button
                      className="gp-rsvp__counter-btn"
                      onClick={() => setPlusOnes((n) => Math.max(0, n - 1))}
                      aria-label="Decrease plus ones"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                    <span className="gp-rsvp__counter-value">{plusOnes}</span>
                    <button
                      className="gp-rsvp__counter-btn"
                      onClick={() => setPlusOnes((n) => Math.min(10, n + 1))}
                      aria-label="Increase plus ones"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              <div className="gp-rsvp__field">
                <label className="gp-rsvp__label">Message (optional)</label>
                <textarea
                  className="gp-rsvp__textarea"
                  rows={3}
                  placeholder="Leave a note for the host…"
                  value={rsvpMessage}
                  onChange={(e) => setRsvpMessage(e.target.value)}
                />
              </div>
              <button className="gp-rsvp__submit" onClick={handleRSVP}>
                {rsvpSaved ? 'Response Updated' : 'Send RSVP'}
              </button>
              {rsvpSaved && (
                <p className="gp-rsvp__saved">Thank you! Your response has been recorded.</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="gp-footer">
        <span className="gp-footer__event">{event.name}</span>
        <span className="gp-footer__brand">Seatly</span>
      </footer>
    </div>
  );
}
