import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useEventBySlug } from '@/hooks/use-events';
import { useSearchGuest } from '@/hooks/use-guests';
import { useGuestPageSettingsBySlug } from '@/hooks/use-guest-page-settings';
import { useRSVPByGuest, useUpsertRSVP } from '@/hooks/use-rsvps';
import { DEFAULT_SETTINGS } from '@/types/guest-page-settings';
import type { GuestPageSettings } from '@/types/guest-page-settings';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

type RsvpStatus = 'yes' | 'no' | 'maybe';

interface ScheduleItem {
  time?: string;
  title?: string;
  description?: string;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'Date TBD';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m || 0, 0, 0);
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  } catch {
    return timeStr;
  }
}

/** Merge saved settings with defaults so every themeable key exists. */
function resolveSettings(settings: GuestPageSettings | null | undefined) {
  return { ...DEFAULT_SETTINGS, ...(settings ?? {}) } as GuestPageSettings;
}

/** Build the CSS-custom-property style object for the wrapper div. */
function buildThemeVars(s: GuestPageSettings): React.CSSProperties {
  return {
    '--gp-primary': s.color_primary,
    '--gp-secondary': s.color_secondary,
    '--gp-background': s.color_background,
    '--gp-card': s.color_card,
    '--gp-text': s.color_text,
    '--gp-header': s.color_header,
    '--gp-button': s.color_button,
    '--gp-button-text': s.color_button_text,
    '--gp-link': s.color_link,
    '--gp-footer': s.color_footer,
    '--gp-radius': `${s.border_radius}px`,
    '--gp-font-heading': s.font_heading,
    '--gp-font-body': s.font_body,
    '--gp-font-button': s.font_button,
    '--gp-heading-size': `${s.font_heading_size}px`,
    '--gp-body-size': `${s.font_body_size}px`,
    '--gp-heading-weight': String(s.font_heading_weight),
    '--gp-body-weight': String(s.font_body_weight),
    '--gp-heading-spacing': `${s.font_heading_spacing}px`,
    '--gp-body-spacing': `${s.font_body_spacing}px`,
    '--gp-heading-line-height': String(s.font_heading_line_height),
    '--gp-body-line-height': String(s.font_body_line_height),
    '--gp-banner-height': `${s.banner_height}px`,
    '--gp-overlay-opacity': String(s.background_overlay_opacity),
  } as React.CSSProperties;
}

const SHADOW_MAP: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.08)',
  md: '0 4px 12px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.06)',
  lg: '0 12px 32px rgba(0,0,0,.12), 0 6px 16px rgba(0,0,0,.08)',
  xl: '0 24px 56px rgba(0,0,0,.16), 0 12px 24px rgba(0,0,0,.10)',
};

function shadowFor(style: string): string {
  return SHADOW_MAP[style] ?? SHADOW_MAP.md;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export function FindYourSeatPage() {
  const { slug = '' } = useParams<{ slug: string }>();

  const { data: event, isLoading: eventLoading } = useEventBySlug(slug);
  const { data: rawSettings } = useGuestPageSettingsBySlug(slug);
  const settings = resolveSettings(rawSettings);

  /* --- Find Seat --- */
  const [searchName, setSearchName] = useState('');
  const [debouncedName, setDebouncedName] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const eventId = event?.id ?? '';
  const { data: guest, isFetching: searching } = useSearchGuest(eventId, debouncedName);

  const { data: existingRsvp } = useRSVPByGuest(eventId, guest?.id ?? '');
  const upsertRsvp = useUpsertRSVP(eventId);

  /* --- RSVP form --- */
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus | ''>('');
  const [plusOnes, setPlusOnes] = useState(0);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  /* --- Scroll-spy --- */
  const [activeSection, setActiveSection] = useState('home');
  const navRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  /* --- Mobile nav --- */
  const [menuOpen, setMenuOpen] = useState(false);

  /* ------------------------------------------------------------------ */
  /*  Debounce search                                                   */
  /* ------------------------------------------------------------------ */
  const handleSearchChange = useCallback((value: string) => {
    setSearchName(value);
    setHasSearched(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedName(value.trim()), 400);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Pre-fill RSVP form when guest / existing RSVP loads                */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (existingRsvp) {
      setRsvpStatus(existingRsvp.status);
      setPlusOnes(existingRsvp.plus_ones ?? 0);
      setMessage(existingRsvp.message ?? '');
    }
  }, [existingRsvp]);

  /* ------------------------------------------------------------------ */
  /*  Scroll-spy via IntersectionObserver                                */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const sections = ['home', 'find-seat', 'venue', 'details', 'schedule', 'gallery', 'rsvp'].filter(
      (id) => {
        if (id === 'schedule') return settings.enable_schedule;
        if (id === 'gallery') return settings.enable_gallery;
        return true;
      },
    );

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry closest to the top that is intersecting.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        rootMargin: '-30% 0px -60% 0px',
        threshold: 0,
      },
    );

    sections.forEach((id) => {
      const el = sectionRefs.current[id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [settings.enable_schedule, settings.enable_gallery, eventLoading]);

  /* ------------------------------------------------------------------ */
  /*  Smooth scroll to section                                           */
  /* ------------------------------------------------------------------ */
  const scrollToSection = useCallback((id: string) => {
    const el = sectionRefs.current[id];
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    setMenuOpen(false);
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Submit RSVP                                                        */
  /* ------------------------------------------------------------------ */
  const handleSubmitRsvp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!guest || !rsvpStatus) return;
      setSubmitting(true);
      try {
        await upsertRsvp.mutateAsync({
          guest_id: guest.id,
          status: rsvpStatus,
          plus_ones: plusOnes,
          message: message.trim() || null,
        });
        setSubmitted(true);
      } catch {
        // silently fail — could add toast if provider is available
      } finally {
        setSubmitting(false);
      }
    },
    [guest, rsvpStatus, plusOnes, message, upsertRsvp],
  );

  /* ------------------------------------------------------------------ */
  /*  Derived values                                                     */
  /* ------------------------------------------------------------------ */
  const navLinks: { id: string; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'find-seat', label: 'Find Seat' },
    { id: 'venue', label: 'Venue' },
    { id: 'details', label: 'Details' },
    ...(settings.enable_schedule ? [{ id: 'schedule', label: 'Schedule' }] : []),
    ...(settings.enable_gallery ? [{ id: 'gallery', label: 'Gallery' }] : []),
    { id: 'rsvp', label: 'RSVP' },
  ];

  const themeVars = buildThemeVars(settings);
  const coverImage = settings.cover_image ?? event?.cover_url ?? null;
  const logoUrl = settings.logo_url ?? event?.logo_url ?? null;
  const subtitle = settings.event_subtitle ?? '';
  const welcome = settings.welcome_message ?? '';
  const overlay = settings.background_overlay_opacity;
  const scheduleItems = (settings.schedule_items ?? []) as ScheduleItem[];
  const galleryImages = settings.gallery_images ?? [];

  /* ------------------------------------------------------------------ */
  /*  Loading state                                                      */
  /* ------------------------------------------------------------------ */
  if (eventLoading) {
    return (
      <div className="gp-loading-screen">
        <div className="gp-loading-spinner" />
        <p className="gp-loading-text">Loading your invitation…</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="gp-loading-screen">
        <div className="gp-loading-icon">♡</div>
        <h2 className="gp-loading-title">Invitation not found</h2>
        <p className="gp-loading-text">
          We couldn't find an event for this link. Please check your URL and try again.
        </p>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <div className="gp-wrapper" style={themeVars}>
      {/* ============================================================ */}
      {/* Sticky navigation                                             */}
      {/* ============================================================ */}
      <nav ref={navRef} className="gp-nav">
        <div className="gp-nav-inner">
          <button
            className="gp-nav-brand"
            onClick={() => scrollToSection('home')}
            type="button"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={event.name}
                className="gp-nav-logo"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: settings.logo_rounded ? '50%' : '8px',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <span className="gp-nav-brand-text">{event.name}</span>
            )}
          </button>

          <div className={`gp-nav-links ${menuOpen ? 'gp-nav-links--open' : ''}`}>
            {navLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                className={`gp-nav-link ${activeSection === link.id ? 'gp-nav-link--active' : ''}`}
                onClick={() => scrollToSection(link.id)}
              >
                {link.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="gp-nav-toggle"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            <span className="gp-nav-toggle-bar" />
            <span className="gp-nav-toggle-bar" />
            <span className="gp-nav-toggle-bar" />
          </button>
        </div>
      </nav>

      {/* ============================================================ */}
      {/* Hero                                                          */}
      {/* ============================================================ */}
      <section
        id="home"
        ref={(el) => { sectionRefs.current['home'] = el; }}
        className="gp-hero"
        style={{
          minHeight: `var(--gp-banner-height)`,
          backgroundImage: coverImage
            ? `linear-gradient(180deg, rgba(0,0,0,${overlay * 0.5}) 0%, rgba(0,0,0,${overlay * 0.7}) 100%), url(${coverImage})`
            : `linear-gradient(135deg, var(--gp-primary) 0%, var(--gp-secondary) 100%)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="gp-hero-content">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={event.name}
              className="gp-hero-logo"
              style={{
                width: settings.logo_size,
                height: settings.logo_size,
                borderRadius: settings.logo_rounded ? '50%' : `${settings.border_radius}px`,
                objectFit: 'cover',
                boxShadow: '0 8px 32px rgba(0,0,0,.25)',
              }}
            />
          )}

          <p className="gp-hero-eyebrow">
            {subtitle || 'You are cordially invited'}
          </p>

          <h1 className="gp-hero-title">{event.name}</h1>

          {welcome && <p className="gp-hero-welcome">{welcome}</p>}

          <div className="gp-hero-meta">
            {event.date && (
              <span className="gp-hero-meta-item">
                <span className="gp-hero-meta-icon">📅</span>
                {formatDate(event.date)}
              </span>
            )}
            {event.venue && (
              <span className="gp-hero-meta-item">
                <span className="gp-hero-meta-icon">📍</span>
                {event.venue}
              </span>
            )}
          </div>

          <button
            type="button"
            className="gp-hero-cta"
            onClick={() => scrollToSection('find-seat')}
          >
            Find Your Seat
          </button>
        </div>

        <div className="gp-hero-scroll" onClick={() => scrollToSection('find-seat')}>
          <span className="gp-hero-scroll-dot" />
        </div>
      </section>

      {/* ============================================================ */}
      {/* Find Seat                                                     */}
      {/* ============================================================ */}
      <section
        id="find-seat"
        ref={(el) => { sectionRefs.current['find-seat'] = el; }}
        className="gp-section gp-section--find-seat"
      >
        <div className="gp-container gp-container--narrow">
          <div className="gp-section-head">
            <span className="gp-section-eyebrow">Your Seat</span>
            <h2 className="gp-section-title">Find Your Seat</h2>
            <p className="gp-section-subtitle">
              Type your name below to discover your assigned table for the celebration.
            </p>
          </div>

          <div className="gp-search-card" style={{ boxShadow: shadowFor(settings.card_shadow) }}>
            <div className="gp-search-input-wrap">
              <span className="gp-search-icon">🔍</span>
              <input
                type="text"
                className="gp-search-input"
                placeholder="Enter your full name…"
                value={searchName}
                onChange={(e) => handleSearchChange(e.target.value)}
                autoComplete="off"
              />
              {searching && <span className="gp-search-spinner" />}
            </div>

            {/* Results */}
            {hasSearched && !searching && debouncedName && (
              <div className="gp-search-result">
                {guest ? (
                  <div className="gp-seat-result">
                    <div className="gp-seat-result-icon">🪑</div>
                    <div className="gp-seat-result-body">
                      <p className="gp-seat-result-greeting">
                        Welcome, <strong>{guest.name}</strong>!
                      </p>
                      {guest.table ? (
                        <p className="gp-seat-result-table">
                          You are seated at{' '}
                          <span className="gp-seat-result-table-name">
                            Table {guest.table.name}
                          </span>
                          {guest.table.number != null && (
                            <span className="gp-seat-result-table-number">
                              {' '}(#{guest.table.number})
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="gp-seat-result-table gp-seat-result-table--unassigned">
                          Your table assignment is pending. Please check with the host upon arrival.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="gp-search-empty">
                    <p>
                      We couldn't find a match for <strong>"{debouncedName}"</strong>.
                    </p>
                    <p className="gp-search-empty-hint">
                      Try a different spelling or contact your host for assistance.
                    </p>
                  </div>
                )}
              </div>
            )}

            {!hasSearched && (
              <p className="gp-search-placeholder">
                Your table assignment will appear here once you search.
              </p>
            )}
          </div>

          {/* Quick RSVP link after finding seat */}
          {guest && (
            <button
              type="button"
              className="gp-inline-link"
              onClick={() => scrollToSection('rsvp')}
            >
              Great — now let us know you're coming →
            </button>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* Venue                                                         */}
      {/* ============================================================ */}
      <section
        id="venue"
        ref={(el) => { sectionRefs.current['venue'] = el; }}
        className="gp-section gp-section--venue"
      >
        <div className="gp-container">
          <div className="gp-section-head">
            <span className="gp-section-eyebrow">Location</span>
            <h2 className="gp-section-title">Venue</h2>
          </div>

          <div className={`gp-venue-grid ${settings.venue_image_url ? 'gp-venue-grid--with-image' : ''}`}>
            <div className="gp-venue-info">
              {event.venue ? (
                <h3 className="gp-venue-name">{event.venue}</h3>
              ) : (
                <h3 className="gp-venue-name gp-venue-name--tbd">Venue to be announced</h3>
              )}

              {event.date && (
                <div className="gp-venue-detail-row">
                  <span className="gp-venue-detail-label">Date</span>
                  <span className="gp-venue-detail-value">{formatDate(event.date)}</span>
                </div>
              )}
              {event.time && (
                <div className="gp-venue-detail-row">
                  <span className="gp-venue-detail-label">Time</span>
                  <span className="gp-venue-detail-value">{formatTime(event.time)}</span>
                </div>
              )}
              {event.venue && (
                <div className="gp-venue-detail-row">
                  <span className="gp-venue-detail-label">Address</span>
                  <span className="gp-venue-detail-value">{event.venue}</span>
                </div>
              )}
            </div>

            {settings.venue_image_url && (
              <div className="gp-venue-image-wrap" style={{ boxShadow: shadowFor(settings.card_shadow) }}>
                <img
                  src={settings.venue_image_url}
                  alt={event.venue || 'Venue'}
                  className="gp-venue-image"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Details                                                       */}
      {/* ============================================================ */}
      <section
        id="details"
        ref={(el) => { sectionRefs.current['details'] = el; }}
        className="gp-section gp-section--details"
      >
        <div className="gp-container">
          <div className="gp-section-head">
            <span className="gp-section-eyebrow">The Particulars</span>
            <h2 className="gp-section-title">Event Details</h2>
          </div>

          <div className="gp-details-grid">
            <div className="gp-details-card" style={{ boxShadow: shadowFor(settings.card_shadow) }}>
              <div className="gp-details-card-icon">📅</div>
              <h3 className="gp-details-card-label">Date</h3>
              <p className="gp-details-card-value">{formatDate(event.date)}</p>
            </div>

            <div className="gp-details-card" style={{ boxShadow: shadowFor(settings.card_shadow) }}>
              <div className="gp-details-card-icon">⏰</div>
              <h3 className="gp-details-card-label">Time</h3>
              <p className="gp-details-card-value">
                {event.time ? formatTime(event.time) : 'TBD'}
              </p>
            </div>

            <div className="gp-details-card" style={{ boxShadow: shadowFor(settings.card_shadow) }}>
              <div className="gp-details-card-icon">📍</div>
              <h3 className="gp-details-card-label">Venue</h3>
              <p className="gp-details-card-value">{event.venue || 'To be announced'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Schedule (conditional)                                       */}
      {/* ============================================================ */}
      {settings.enable_schedule && (
        <section
          id="schedule"
          ref={(el) => { sectionRefs.current['schedule'] = el; }}
          className="gp-section gp-section--schedule"
        >
          <div className="gp-container gp-container--narrow">
            <div className="gp-section-head">
              <span className="gp-section-eyebrow">Timeline</span>
              <h2 className="gp-section-title">Schedule</h2>
              <p className="gp-section-subtitle">
                A timeline of the celebration so you don't miss a moment.
              </p>
            </div>

            {scheduleItems.length > 0 ? (
              <div className="gp-schedule-timeline">
                {scheduleItems.map((item, idx) => (
                  <div key={idx} className="gp-schedule-item">
                    <div className="gp-schedule-dot" />
                    {item.time && <span className="gp-schedule-time">{item.time}</span>}
                    <div className="gp-schedule-content">
                      {item.title && <h3 className="gp-schedule-title">{item.title}</h3>}
                      {item.description && <p className="gp-schedule-desc">{item.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="gp-schedule-empty">
                <p>Schedule details will be posted soon. Check back later!</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* Gallery (conditional)                                        */}
      {/* ============================================================ */}
      {settings.enable_gallery && (
        <section
          id="gallery"
          ref={(el) => { sectionRefs.current['gallery'] = el; }}
          className="gp-section gp-section--gallery"
        >
          <div className="gp-container">
            <div className="gp-section-head">
              <span className="gp-section-eyebrow">Moments</span>
              <h2 className="gp-section-title">Gallery</h2>
              <p className="gp-section-subtitle">
                A glimpse of the moments that make this occasion special.
              </p>
            </div>

            {galleryImages.length > 0 ? (
              <div className="gp-gallery-grid">
                {galleryImages.map((src, idx) => (
                  <div
                    key={idx}
                    className="gp-gallery-item"
                    style={{ boxShadow: shadowFor(settings.card_shadow) }}
                  >
                    <img src={src} alt={`Gallery image ${idx + 1}`} className="gp-gallery-img" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="gp-gallery-empty">
                <p>Gallery photos coming soon.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* RSVP                                                          */}
      {/* ============================================================ */}
      <section
        id="rsvp"
        ref={(el) => { sectionRefs.current['rsvp'] = el; }}
        className="gp-section gp-section--rsvp"
      >
        <div className="gp-container gp-container--narrow">
          <div className="gp-section-head">
            <span className="gp-section-eyebrow">Will you join us?</span>
            <h2 className="gp-section-title">RSVP</h2>
            <p className="gp-section-subtitle">
              Please let us know if you'll be celebrating with us.
            </p>
          </div>

          {!guest ? (
            <div className="gp-rsvp-locked" style={{ boxShadow: shadowFor(settings.card_shadow) }}>
              <div className="gp-rsvp-locked-icon">🔒</div>
              <h3 className="gp-rsvp-locked-title">Find your seat first</h3>
              <p className="gp-rsvp-locked-text">
                Please use the search above to find your name, then return here to submit your RSVP.
              </p>
              <button
                type="button"
                className="gp-btn gp-btn--primary"
                onClick={() => scrollToSection('find-seat')}
              >
                Find Your Seat
              </button>
            </div>
          ) : submitted ? (
            <div className="gp-rsvp-success" style={{ boxShadow: shadowFor(settings.card_shadow) }}>
              <div className="gp-rsvp-success-icon">✓</div>
              <h3 className="gp-rsvp-success-title">Thank you, {guest.name}!</h3>
              <p className="gp-rsvp-success-text">
                Your RSVP has been received. We can't wait to celebrate with you!
              </p>
              <button
                type="button"
                className="gp-btn gp-btn--ghost"
                onClick={() => {
                  setSubmitted(false);
                  setRsvpStatus(existingRsvp?.status ?? '');
                  setPlusOnes(existingRsvp?.plus_ones ?? 0);
                  setMessage(existingRsvp?.message ?? '');
                }}
              >
                Edit my response
              </button>
            </div>
          ) : (
            <form
              className="gp-rsvp-form"
              style={{ boxShadow: shadowFor(settings.card_shadow) }}
              onSubmit={handleSubmitRsvp}
            >
              <div className="gp-rsvp-greeting">
                <p>
                  Hi <strong>{guest.name}</strong>, will you be attending?
                </p>
              </div>

              {/* Status buttons */}
              <div className="gp-rsvp-status-group">
                {(['yes', 'no', 'maybe'] as RsvpStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`gp-rsvp-status-btn ${rsvpStatus === status ? 'gp-rsvp-status-btn--active' : ''}`}
                    onClick={() => setRsvpStatus(status)}
                  >
                    <span className="gp-rsvp-status-emoji">
                      {status === 'yes' ? '✓' : status === 'no' ? '✕' : '?'}
                    </span>
                    <span className="gp-rsvp-status-label">
                      {status === 'yes' ? 'Joyfully Accepts' : status === 'no' ? 'Regretfully Declines' : 'Maybe'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Plus ones (only when attending) */}
              {rsvpStatus === 'yes' && (
                <div className="gp-rsvp-field">
                  <label className="gp-rsvp-label">Number of plus-ones</label>
                  <div className="gp-rsvp-counter">
                    <button
                      type="button"
                      className="gp-rsvp-counter-btn"
                      onClick={() => setPlusOnes((n) => Math.max(0, n - 1))}
                      disabled={plusOnes <= 0}
                    >
                      −
                    </button>
                    <span className="gp-rsvp-counter-value">{plusOnes}</span>
                    <button
                      type="button"
                      className="gp-rsvp-counter-btn"
                      onClick={() => setPlusOnes((n) => Math.min(10, n + 1))}
                      disabled={plusOnes >= 10}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Message */}
              <div className="gp-rsvp-field">
                <label className="gp-rsvp-label">Message for the host (optional)</label>
                <textarea
                  className="gp-rsvp-textarea"
                  rows={3}
                  placeholder="Share your excitement or a note for the couple…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="gp-btn gp-btn--primary gp-rsvp-submit"
                disabled={!rsvpStatus || submitting}
              >
                {submitting ? 'Sending…' : 'Send RSVP'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* Footer                                                        */}
      {/* ============================================================ */}
      <footer className="gp-footer">
        <div className="gp-container">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={event.name}
              className="gp-footer-logo"
              style={{
                width: 48,
                height: 48,
                borderRadius: settings.logo_rounded ? '50%' : '8px',
                objectFit: 'cover',
              }}
            />
          )}
          <p className="gp-footer-name">{event.name}</p>
          <p className="gp-footer-tagline">
            {event.date ? formatDate(event.date) : ''}
            {event.venue ? ` · ${event.venue}` : ''}
          </p>
          <p className="gp-footer-copy">
            With love · {new Date().getFullYear()}
          </p>
        </div>
      </footer>

      {/* ============================================================ */}
      {/* Scoped styles                                                 */}
      {/* ============================================================ */}
      <style>{`
        /* ---- Base reset scoped to wrapper ---- */
        .gp-wrapper {
          --gp-primary: #0f766e;
          --gp-secondary: #115e59;
          --gp-background: #f8fafc;
          --gp-card: #ffffff;
          --gp-text: #0f172a;
          --gp-header: #ffffff;
          --gp-button: #0f766e;
          --gp-button-text: #ffffff;
          --gp-link: #0f766e;
          --gp-footer: #0f172a;
          --gp-radius: 16px;
          --gp-font-heading: 'Playfair Display', serif;
          --gp-font-body: 'Inter', sans-serif;
          --gp-font-button: 'Inter', sans-serif;
          --gp-heading-size: 48px;
          --gp-body-size: 16px;
          --gp-heading-weight: 700;
          --gp-body-weight: 400;
          --gp-heading-spacing: 0px;
          --gp-body-spacing: 0px;
          --gp-heading-line-height: 1.2;
          --gp-body-line-height: 1.6;
          --gp-banner-height: 400px;
          --gp-overlay-opacity: 0;

          background: var(--gp-background);
          color: var(--gp-text);
          font-family: var(--gp-font-body);
          font-size: var(--gp-body-size);
          font-weight: var(--gp-body-weight);
          line-height: var(--gp-body-line-height);
          letter-spacing: var(--gp-body-spacing);
          min-height: 100vh;
        }
        .gp-wrapper * {
          box-sizing: border-box;
        }
        .gp-wrapper h1, .gp-wrapper h2, .gp-wrapper h3 {
          font-family: var(--gp-font-heading);
          font-weight: var(--gp-heading-weight);
          line-height: var(--gp-heading-line-height);
          letter-spacing: var(--gp-heading-spacing);
          margin: 0;
        }

        /* ---- Loading / not found ---- */
        .gp-loading-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #0f766e 0%, #115e59 100%);
          color: #fff;
          text-align: center;
          padding: 2rem;
          font-family: 'Inter', sans-serif;
        }
        .gp-loading-spinner {
          width: 48px; height: 48px;
          border: 3px solid rgba(255,255,255,.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: gp-spin 0.8s linear infinite;
          margin-bottom: 1.5rem;
        }
        @keyframes gp-spin { to { transform: rotate(360deg); } }
        .gp-loading-icon {
          font-size: 3rem; margin-bottom: 1rem;
        }
        .gp-loading-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.75rem; margin-bottom: .5rem;
        }
        .gp-loading-text {
          opacity: .85; font-size: 1rem;
        }

        /* ---- Navigation ---- */
        .gp-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255,255,255,.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(0,0,0,.06);
          box-shadow: 0 1px 8px rgba(0,0,0,.04);
        }
        .gp-nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        .gp-nav-brand {
          background: none; border: none; cursor: pointer;
          display: flex; align-items: center; gap: .5rem;
          padding: 0;
        }
        .gp-nav-brand-text {
          font-family: var(--gp-font-heading);
          font-weight: 600;
          font-size: 1.1rem;
          color: var(--gp-text);
          white-space: nowrap;
        }
        .gp-nav-logo { display: block; }
        .gp-nav-links {
          display: flex;
          align-items: center;
          gap: .25rem;
        }
        .gp-nav-link {
          background: none; border: none; cursor: pointer;
          padding: .5rem .85rem;
          border-radius: 8px;
          font-family: var(--gp-font-body);
          font-size: .9rem;
          font-weight: 500;
          color: var(--gp-text);
          opacity: .65;
          transition: all .2s ease;
          white-space: nowrap;
        }
        .gp-nav-link:hover {
          opacity: 1;
          background: rgba(0,0,0,.04);
        }
        .gp-nav-link--active {
          opacity: 1;
          color: var(--gp-primary);
          background: color-mix(in srgb, var(--gp-primary) 10%, transparent);
        }
        .gp-nav-toggle {
          display: none;
          flex-direction: column;
          gap: 5px;
          background: none; border: none; cursor: pointer;
          padding: 8px;
        }
        .gp-nav-toggle-bar {
          width: 22px; height: 2px;
          background: var(--gp-text);
          border-radius: 2px;
          transition: .3s;
        }

        /* ---- Hero ---- */
        .gp-hero {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 4rem 1.5rem 5rem;
          overflow: hidden;
          background-repeat: no-repeat;
        }
        .gp-hero-content {
          position: relative;
          z-index: 2;
          max-width: 720px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .gp-hero-logo {
          margin-bottom: .5rem;
        }
        .gp-hero-eyebrow {
          font-family: var(--gp-font-body);
          font-size: clamp(.8rem, 2vw, 1rem);
          font-weight: 500;
          letter-spacing: .15em;
          text-transform: uppercase;
          color: rgba(255,255,255,.85);
          margin: 0;
        }
        .gp-hero-title {
          font-size: clamp(2.5rem, 7vw, var(--gp-heading-size));
          color: #fff;
          text-shadow: 0 2px 24px rgba(0,0,0,.3);
          margin: 0;
        }
        .gp-hero-welcome {
          font-size: clamp(1rem, 2.5vw, 1.25rem);
          color: rgba(255,255,255,.9);
          max-width: 560px;
          margin: .5rem 0 0;
          line-height: 1.7;
        }
        .gp-hero-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          margin-top: 1.5rem;
          justify-content: center;
        }
        .gp-hero-meta-item {
          display: inline-flex;
          align-items: center;
          gap: .5rem;
          color: rgba(255,255,255,.95);
          font-size: .95rem;
          font-weight: 500;
        }
        .gp-hero-meta-icon { font-size: 1.1rem; }
        .gp-hero-cta {
          margin-top: 2rem;
          padding: .85rem 2.5rem;
          background: rgba(255,255,255,.18);
          backdrop-filter: blur(8px);
          border: 1.5px solid rgba(255,255,255,.4);
          border-radius: var(--gp-radius);
          color: #fff;
          font-family: var(--gp-font-button);
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: .05em;
          cursor: pointer;
          transition: all .3s ease;
        }
        .gp-hero-cta:hover {
          background: rgba(255,255,255,.28);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,.2);
        }
        .gp-hero-scroll {
          position: absolute;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          width: 28px; height: 44px;
          border: 2px solid rgba(255,255,255,.5);
          border-radius: 14px;
          cursor: pointer;
          display: flex;
          justify-content: center;
          padding-top: 8px;
          z-index: 2;
        }
        .gp-hero-scroll-dot {
          width: 4px; height: 8px;
          background: rgba(255,255,255,.7);
          border-radius: 2px;
          animation: gp-scroll-bounce 1.5s ease-in-out infinite;
        }
        @keyframes gp-scroll-bounce {
          0%, 100% { transform: translateY(0); opacity: .7; }
          50% { transform: translateY(8px); opacity: .3; }
        }

        /* ---- Sections ---- */
        .gp-section {
          padding: 5rem 1.5rem;
        }
        .gp-container {
          max-width: 1100px;
          margin: 0 auto;
        }
        .gp-container--narrow {
          max-width: 720px;
        }
        .gp-section-head {
          text-align: center;
          margin-bottom: 3rem;
        }
        .gp-section-eyebrow {
          display: inline-block;
          font-family: var(--gp-font-body);
          font-size: .8rem;
          font-weight: 600;
          letter-spacing: .2em;
          text-transform: uppercase;
          color: var(--gp-primary);
          margin-bottom: .75rem;
        }
        .gp-section-title {
          font-size: clamp(2rem, 5vw, 2.75rem);
          color: var(--gp-text);
        }
        .gp-section-subtitle {
          font-size: 1.05rem;
          color: var(--gp-text);
          opacity: .65;
          max-width: 520px;
          margin: 1rem auto 0;
          line-height: 1.7;
        }

        /* ---- Find Seat ---- */
        .gp-section--find-seat {
          background: var(--gp-background);
        }
        .gp-search-card {
          background: var(--gp-card);
          border-radius: var(--gp-radius);
          padding: 2rem;
          border: 1px solid rgba(0,0,0,.05);
        }
        .gp-search-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .gp-search-icon {
          position: absolute;
          left: 1rem;
          font-size: 1.2rem;
          opacity: .4;
          pointer-events: none;
        }
        .gp-search-input {
          width: 100%;
          padding: 1rem 1rem 1rem 2.75rem;
          font-family: var(--gp-font-body);
          font-size: 1.05rem;
          color: var(--gp-text);
          background: var(--gp-background);
          border: 2px solid rgba(0,0,0,.08);
          border-radius: var(--gp-radius);
          outline: none;
          transition: border-color .2s, box-shadow .2s;
        }
        .gp-search-input:focus {
          border-color: var(--gp-primary);
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--gp-primary) 12%, transparent);
        }
        .gp-search-input::placeholder {
          color: var(--gp-text);
          opacity: .35;
        }
        .gp-search-spinner {
          position: absolute;
          right: 1rem;
          width: 20px; height: 20px;
          border: 2.5px solid rgba(0,0,0,.1);
          border-top-color: var(--gp-primary);
          border-radius: 50%;
          animation: gp-spin .7s linear infinite;
        }
        .gp-search-result {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(0,0,0,.06);
        }
        .gp-seat-result {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }
        .gp-seat-result-icon {
          font-size: 2rem;
          flex-shrink: 0;
          line-height: 1;
        }
        .gp-seat-result-greeting {
          margin: 0 0 .25rem;
          font-size: 1.05rem;
          color: var(--gp-text);
        }
        .gp-seat-result-table {
          margin: 0;
          font-size: 1rem;
          color: var(--gp-text);
          opacity: .75;
        }
        .gp-seat-result-table-name {
          font-weight: 600;
          color: var(--gp-primary);
        }
        .gp-seat-result-table-number {
          opacity: .55;
        }
        .gp-seat-result-table--unassigned {
          font-style: italic;
          opacity: .6;
        }
        .gp-search-empty {
          text-align: center;
          padding: 1rem 0;
        }
        .gp-search-empty p { margin: .25rem 0; color: var(--gp-text); }
        .gp-search-empty-hint {
          opacity: .55;
          font-size: .9rem;
        }
        .gp-search-placeholder {
          text-align: center;
          margin: 1.5rem 0 0;
          opacity: .4;
          font-style: italic;
        }
        .gp-inline-link {
          display: block;
          margin: 1.5rem auto 0;
          background: none; border: none;
          color: var(--gp-link);
          font-family: var(--gp-font-body);
          font-size: .95rem;
          font-weight: 500;
          cursor: pointer;
          transition: opacity .2s;
        }
        .gp-inline-link:hover { opacity: .7; }

        /* ---- Venue ---- */
        .gp-section--venue {
          background: color-mix(in srgb, var(--gp-primary) 4%, var(--gp-background));
        }
        .gp-venue-grid {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
          align-items: stretch;
        }
        .gp-venue-grid--with-image {
          flex-direction: row;
          align-items: center;
        }
        .gp-venue-info { flex: 1; }
        .gp-venue-name {
          font-size: 1.75rem;
          color: var(--gp-text);
          margin-bottom: 1.5rem;
        }
        .gp-venue-name--tbd { opacity: .5; }
        .gp-venue-detail-row {
          display: flex;
          flex-direction: column;
          gap: .15rem;
          padding: 1rem 0;
          border-bottom: 1px solid rgba(0,0,0,.06);
        }
        .gp-venue-detail-row:last-child { border-bottom: none; }
        .gp-venue-detail-label {
          font-size: .75rem;
          font-weight: 600;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: var(--gp-primary);
          opacity: .7;
        }
        .gp-venue-detail-value {
          font-size: 1.05rem;
          color: var(--gp-text);
        }
        .gp-venue-image-wrap {
          flex: 1;
          border-radius: var(--gp-radius);
          overflow: hidden;
          min-height: 280px;
        }
        .gp-venue-image {
          width: 100%; height: 100%;
          object-fit: cover;
          display: block;
          min-height: 280px;
        }

        /* ---- Details ---- */
        .gp-section--details {
          background: var(--gp-background);
        }
        .gp-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
        }
        .gp-details-card {
          background: var(--gp-card);
          border-radius: var(--gp-radius);
          padding: 2.5rem 1.5rem;
          text-align: center;
          border: 1px solid rgba(0,0,0,.04);
        }
        .gp-details-card-icon {
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        .gp-details-card-label {
          font-size: .75rem;
          font-weight: 600;
          letter-spacing: .15em;
          text-transform: uppercase;
          color: var(--gp-primary);
          margin-bottom: .5rem;
        }
        .gp-details-card-value {
          font-size: 1.1rem;
          color: var(--gp-text);
          margin: 0;
          line-height: 1.5;
        }

        /* ---- Schedule ---- */
        .gp-section--schedule {
          background: color-mix(in srgb, var(--gp-primary) 4%, var(--gp-background));
        }
        .gp-schedule-timeline {
          position: relative;
          padding-left: 2rem;
        }
        .gp-schedule-timeline::before {
          content: '';
          position: absolute;
          left: 6px; top: 8px; bottom: 8px;
          width: 2px;
          background: color-mix(in srgb, var(--gp-primary) 25%, transparent);
        }
        .gp-schedule-item {
          position: relative;
          padding-bottom: 2rem;
          display: flex;
          align-items: flex-start;
          gap: 1.5rem;
        }
        .gp-schedule-item:last-child { padding-bottom: 0; }
        .gp-schedule-dot {
          position: absolute;
          left: -2rem;
          top: 6px;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: var(--gp-primary);
          border: 3px solid var(--gp-card);
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--gp-primary) 30%, transparent);
        }
        .gp-schedule-time {
          font-family: var(--gp-font-body);
          font-weight: 600;
          font-size: .9rem;
          color: var(--gp-primary);
          white-space: nowrap;
          min-width: 80px;
        }
        .gp-schedule-content { flex: 1; }
        .gp-schedule-title {
          font-size: 1.15rem;
          color: var(--gp-text);
          margin-bottom: .25rem;
        }
        .gp-schedule-desc {
          font-size: .95rem;
          color: var(--gp-text);
          opacity: .65;
          margin: 0;
        }
        .gp-schedule-empty {
          text-align: center;
          padding: 2rem;
          opacity: .5;
        }

        /* ---- Gallery ---- */
        .gp-section--gallery {
          background: var(--gp-background);
        }
        .gp-gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1rem;
        }
        .gp-gallery-item {
          border-radius: var(--gp-radius);
          overflow: hidden;
          aspect-ratio: 4 / 3;
          cursor: pointer;
          transition: transform .3s ease;
        }
        .gp-gallery-item:hover { transform: scale(1.02); }
        .gp-gallery-img {
          width: 100%; height: 100%;
          object-fit: cover;
          display: block;
        }
        .gp-gallery-empty {
          text-align: center;
          padding: 2rem;
          opacity: .5;
        }

        /* ---- RSVP ---- */
        .gp-section--rsvp {
          background: color-mix(in srgb, var(--gp-primary) 4%, var(--gp-background));
        }
        .gp-rsvp-locked,
        .gp-rsvp-success,
        .gp-rsvp-form {
          background: var(--gp-card);
          border-radius: var(--gp-radius);
          padding: 2.5rem;
          text-align: center;
          border: 1px solid rgba(0,0,0,.04);
        }
        .gp-rsvp-locked-icon,
        .gp-rsvp-success-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }
        .gp-rsvp-success-icon {
          width: 64px; height: 64px;
          line-height: 64px;
          border-radius: 50%;
          background: color-mix(in srgb, var(--gp-primary) 15%, transparent);
          color: var(--gp-primary);
          font-size: 2rem;
          font-weight: 700;
          margin: 0 auto 1.5rem;
        }
        .gp-rsvp-locked-title,
        .gp-rsvp-success-title {
          font-size: 1.5rem;
          color: var(--gp-text);
          margin-bottom: .5rem;
        }
        .gp-rsvp-locked-text,
        .gp-rsvp-success-text {
          color: var(--gp-text);
          opacity: .65;
          margin-bottom: 1.5rem;
        }
        .gp-rsvp-form { text-align: left; }
        .gp-rsvp-greeting {
          text-align: center;
          margin-bottom: 2rem;
          font-size: 1.1rem;
          color: var(--gp-text);
        }
        .gp-rsvp-status-group {
          display: flex;
          gap: .75rem;
          margin-bottom: 2rem;
        }
        .gp-rsvp-status-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: .5rem;
          padding: 1.25rem .5rem;
          background: var(--gp-background);
          border: 2px solid rgba(0,0,0,.06);
          border-radius: var(--gp-radius);
          cursor: pointer;
          transition: all .2s ease;
          font-family: var(--gp-font-body);
        }
        .gp-rsvp-status-btn:hover {
          border-color: color-mix(in srgb, var(--gp-primary) 40%, transparent);
        }
        .gp-rsvp-status-btn--active {
          border-color: var(--gp-primary);
          background: color-mix(in srgb, var(--gp-primary) 8%, transparent);
        }
        .gp-rsvp-status-emoji {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--gp-primary);
        }
        .gp-rsvp-status-label {
          font-size: .85rem;
          font-weight: 500;
          color: var(--gp-text);
        }
        .gp-rsvp-field {
          margin-bottom: 1.5rem;
        }
        .gp-rsvp-label {
          display: block;
          font-size: .85rem;
          font-weight: 600;
          color: var(--gp-text);
          margin-bottom: .5rem;
        }
        .gp-rsvp-counter {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .gp-rsvp-counter-btn {
          width: 40px; height: 40px;
          border-radius: 50%;
          border: 2px solid rgba(0,0,0,.1);
          background: var(--gp-card);
          font-size: 1.25rem;
          font-weight: 600;
          cursor: pointer;
          color: var(--gp-text);
          transition: all .2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .gp-rsvp-counter-btn:hover:not(:disabled) {
          border-color: var(--gp-primary);
          color: var(--gp-primary);
        }
        .gp-rsvp-counter-btn:disabled {
          opacity: .35;
          cursor: not-allowed;
        }
        .gp-rsvp-counter-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--gp-text);
          min-width: 32px;
          text-align: center;
        }
        .gp-rsvp-textarea {
          width: 100%;
          padding: .85rem 1rem;
          font-family: var(--gp-font-body);
          font-size: 1rem;
          color: var(--gp-text);
          background: var(--gp-background);
          border: 2px solid rgba(0,0,0,.08);
          border-radius: var(--gp-radius);
          outline: none;
          resize: vertical;
          transition: border-color .2s, box-shadow .2s;
        }
        .gp-rsvp-textarea:focus {
          border-color: var(--gp-primary);
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--gp-primary) 12%, transparent);
        }
        .gp-rsvp-submit {
          width: 100%;
          margin-top: .5rem;
        }

        /* ---- Buttons ---- */
        .gp-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: .5rem;
          padding: .85rem 2rem;
          font-family: var(--gp-font-button);
          font-size: 1rem;
          font-weight: 600;
          border-radius: var(--gp-radius);
          border: none;
          cursor: pointer;
          transition: all .2s ease;
          text-decoration: none;
        }
        .gp-btn--primary {
          background: var(--gp-button);
          color: var(--gp-button-text);
        }
        .gp-btn--primary:hover:not(:disabled) {
          filter: brightness(1.08);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px color-mix(in srgb, var(--gp-button) 35%, transparent);
        }
        .gp-btn--primary:disabled {
          opacity: .5;
          cursor: not-allowed;
        }
        .gp-btn--ghost {
          background: transparent;
          color: var(--gp-text);
          border: 1.5px solid rgba(0,0,0,.12);
        }
        .gp-btn--ghost:hover {
          background: rgba(0,0,0,.04);
        }

        /* ---- Footer ---- */
        .gp-footer {
          background: var(--gp-footer);
          color: rgba(255,255,255,.9);
          padding: 3rem 1.5rem;
          text-align: center;
        }
        .gp-footer-logo {
          margin-bottom: 1rem;
        }
        .gp-footer-name {
          font-family: var(--gp-font-heading);
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 .5rem;
          color: #fff;
        }
        .gp-footer-tagline {
          opacity: .6;
          font-size: .9rem;
          margin: 0 0 1.5rem;
        }
        .gp-footer-copy {
          opacity: .4;
          font-size: .8rem;
          margin: 0;
        }

        /* ---- Responsive ---- */
        @media (max-width: 768px) {
          .gp-nav-toggle {
            display: flex;
          }
          .gp-nav-links {
            position: absolute;
            top: 64px;
            left: 0; right: 0;
            flex-direction: column;
            align-items: stretch;
            gap: 0;
            background: rgba(255,255,255,.98);
            backdrop-filter: blur(16px);
            padding: .5rem 1rem 1rem;
            border-bottom: 1px solid rgba(0,0,0,.06);
            box-shadow: 0 8px 24px rgba(0,0,0,.08);
            transform: translateY(-100%);
            opacity: 0;
            pointer-events: none;
            transition: transform .3s, opacity .3s;
          }
          .gp-nav-links--open {
            transform: translateY(0);
            opacity: 1;
            pointer-events: auto;
          }
          .gp-nav-link {
            text-align: left;
            padding: .75rem 1rem;
            border-radius: 8px;
          }
          .gp-venue-grid--with-image {
            flex-direction: column;
          }
          .gp-rsvp-status-group {
            flex-direction: column;
          }
          .gp-section {
            padding: 3.5rem 1.5rem;
          }
          .gp-schedule-item {
            flex-direction: column;
            gap: .25rem;
          }
          .gp-schedule-time {
            min-width: auto;
          }
        }
      `}</style>
    </div>
  );
}
