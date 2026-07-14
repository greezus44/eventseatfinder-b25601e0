import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useEventBySlug } from '@/hooks/use-events';
import { useSearchGuest } from '@/hooks/use-guests';
import { useGuestPageSettingsBySlug } from '@/hooks/use-guest-page-settings';
import { useRSVPByGuest, useUpsertRSVP } from '@/hooks/use-rsvps';
import { DEFAULT_SETTINGS } from '@/types/guest-page-settings';
import type { GuestPageSettings } from '@/types/guest-page-settings';

type RSVPStatus = 'yes' | 'no' | 'maybe';

interface ScheduleItem {
  time?: string;
  title?: string;
  description?: string;
}

const SECTION_IDS = ['home', 'find-seat', 'venue', 'details', 'schedule', 'gallery', 'rsvp'] as const;
type SectionId = (typeof SECTION_IDS)[number];

export function FindYourSeatPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: event, isLoading: eventLoading } = useEventBySlug(slug ?? '');
  const { data: settings } = useGuestPageSettingsBySlug(slug ?? '');

  const [searchName, setSearchName] = useState('');
  const [debouncedName, setDebouncedName] = useState('');
  const [activeSection, setActiveSection] = useState<SectionId>('home');
  const [navScrolled, setNavScrolled] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<RSVPStatus | null>(null);
  const [plusOnes, setPlusOnes] = useState(0);
  const [rsvpMessage, setRsvpMessage] = useState('');
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);

  const sectionRefs = useRef<Record<SectionId, HTMLElement | null>>({
    home: null,
    'find-seat': null,
    venue: null,
    details: null,
    schedule: null,
    gallery: null,
    rsvp: null,
  });

  // Debounce the search input
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedName(searchName.trim()), 350);
    return () => clearTimeout(handle);
  }, [searchName]);

  const eventId = event?.id ?? '';
  const { data: guest, isFetching: guestFetching } = useSearchGuest(eventId, debouncedName);
  const guestId = guest?.id ?? '';
  const { data: existingRsvp } = useRSVPByGuest(eventId, guestId);
  const { mutateAsync: upsertRSVP, isPending: rsvpPending } = useUpsertRSVP(eventId);

  // Sync existing RSVP into form state when loaded
  useEffect(() => {
    if (existingRsvp) {
      setRsvpStatus(existingRsvp.status);
      setPlusOnes(existingRsvp.plus_ones);
      setRsvpMessage(existingRsvp.message ?? '');
    }
  }, [existingRsvp]);

  // Scroll-spy with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const id = visible[0].target.id as SectionId;
          if (SECTION_IDS.includes(id)) {
            setActiveSection(id);
          }
        }
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.1, 0.25, 0.5, 1] }
    );

    SECTION_IDS.forEach((id) => {
      const el = sectionRefs.current[id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [settings, event]);

  // Track nav scroll state
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToSection = useCallback((id: SectionId) => {
    const el = sectionRefs.current[id];
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top, behavior: 'smooth' });
      setActiveSection(id);
    }
  }, []);

  const handleRSVPSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!guest || !rsvpStatus) return;
      setRsvpError(null);
      try {
        await upsertRSVP({
          guest_id: guest.id,
          status: rsvpStatus,
          plus_ones: plusOnes,
          message: rsvpMessage.trim() || null,
        });
        setRsvpSubmitted(true);
      } catch {
        setRsvpError('Something went wrong submitting your RSVP. Please try again.');
      }
    },
    [guest, rsvpStatus, plusOnes, rsvpMessage, upsertRSVP]
  );

  // ---- Loading state ----
  if (eventLoading) {
    return (
      <div className="gp-page gp-loading-state">
        <div className="gp-loader" />
        <p className="gp-loader-text">Loading your invitation…</p>
      </div>
    );
  }

  // ---- Not found state ----
  if (!event) {
    return (
      <div className="gp-page gp-not-found">
        <div className="gp-not-found-card">
          <h1 className="gp-not-found-title">Invitation not found</h1>
          <p className="gp-not-found-text">
            We couldn't find an event for this link. It may be incorrect or the event may have
            been removed.
          </p>
        </div>
      </div>
    );
  }

  // Merge settings with defaults
  const s: GuestPageSettings = {
    ...DEFAULT_SETTINGS,
    ...settings,
  } as GuestPageSettings;

  const enableSchedule = s.enable_schedule;
  const enableGallery = s.enable_gallery;
  const scheduleItems = (s.schedule_items ?? []) as ScheduleItem[];
  const galleryImages = s.gallery_images ?? [];

  const cssVars = {
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
  } as React.CSSProperties;

  const heroBg = s.cover_image ?? event.cover_url ?? null;
  const heroHeight = s.banner_height ?? 400;
  const heroSubtitle = s.event_subtitle ?? null;
  const welcomeMessage = s.welcome_message ?? null;

  const formattedDate = event.date
    ? new Date(`${event.date}T${event.time || '00:00'}`).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const formattedTime = event.time
    ? new Date(`${event.date || '1970-01-01'}T${event.time}`).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  const navItems: { id: SectionId; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'find-seat', label: 'Find Seat' },
    { id: 'venue', label: 'Venue' },
    { id: 'details', label: 'Details' },
  ];
  if (enableSchedule) navItems.push({ id: 'schedule', label: 'Schedule' });
  if (enableGallery) navItems.push({ id: 'gallery', label: 'Gallery' });
  navItems.push({ id: 'rsvp', label: 'RSVP' });

  const shadowClass =
    s.card_shadow === 'lg'
      ? 'gp-shadow-lg'
      : s.card_shadow === 'sm'
        ? 'gp-shadow-sm'
        : s.card_shadow === 'none'
          ? 'gp-shadow-none'
          : 'gp-shadow-md';

  const buttonClass =
    s.button_style === 'outline'
      ? 'gp-btn gp-btn-outline'
      : s.button_style === 'ghost'
        ? 'gp-btn gp-btn-ghost'
        : 'gp-btn gp-btn-filled';

  return (
    <div className="gp-page" style={cssVars}>
      {/* ===== Sticky Navigation ===== */}
      <nav className={`gp-nav${navScrolled ? ' gp-nav-scrolled' : ''}`}>
        <div className="gp-nav-inner">
          <button className="gp-nav-brand" onClick={() => scrollToSection('home')}>
            {s.logo_url ? (
              <img
                src={s.logo_url}
                alt={event.name}
                className="gp-nav-logo"
                style={{
                  width: s.logo_size ? Math.min(s.logo_size, 36) : 28,
                  height: s.logo_size ? Math.min(s.logo_size, 36) : 28,
                  borderRadius: s.logo_rounded ? '50%' : 0,
                }}
              />
            ) : null}
            <span className="gp-nav-brand-text">{event.name}</span>
          </button>
          <div className="gp-nav-links">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`gp-nav-link${activeSection === item.id ? ' gp-nav-link-active' : ''}`}
                onClick={() => scrollToSection(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ===== Hero / Home ===== */}
      <header
        id="home"
        ref={(el) => {
          sectionRefs.current.home = el;
        }}
        className="gp-hero"
        style={{
          minHeight: heroHeight,
          backgroundImage: heroBg ? `url(${heroBg})` : undefined,
          background: heroBg
            ? `linear-gradient(rgba(15,23,42,0.35), rgba(15,23,42,0.55)), url(${heroBg})`
            : `linear-gradient(135deg, ${s.color_primary}, ${s.color_secondary})`,
        }}
      >
        <div className="gp-hero-overlay" />
        <div className="gp-hero-content">
          {s.logo_url && (
            <img
              src={s.logo_url}
              alt={event.name}
              className="gp-hero-logo"
              style={{
                width: s.logo_size,
                height: s.logo_size,
                borderRadius: s.logo_rounded ? '50%' : 0,
              }}
            />
          )}
          {heroSubtitle && <p className="gp-hero-eyebrow">{heroSubtitle}</p>}
          <h1 className="gp-hero-title">{event.name}</h1>
          <div className="gp-hero-meta">
            {formattedDate && <span className="gp-hero-meta-item">{formattedDate}</span>}
            {formattedTime && <span className="gp-hero-meta-item">{formattedTime}</span>}
            {event.venue && <span className="gp-hero-meta-item">{event.venue}</span>}
          </div>
          {welcomeMessage && <p className="gp-hero-welcome">{welcomeMessage}</p>}
          <button className={buttonClass} onClick={() => scrollToSection('find-seat')}>
            Find Your Seat
          </button>
        </div>
        <button className="gp-hero-scroll" onClick={() => scrollToSection('find-seat')} aria-label="Scroll down">
            <span className="gp-hero-scroll-mouse" />
        </button>
      </header>

      {/* ===== Find Seat ===== */}
      <section
        id="find-seat"
        ref={(el) => {
          sectionRefs.current['find-seat'] = el;
        }}
        className="gp-section"
      >
        <div className="gp-container">
          <div className="gp-section-head">
            <span className="gp-section-label">Find Your Seat</span>
            <h2 className="gp-section-title">Where are you sitting?</h2>
            <p className="gp-section-subtitle">
              Type your name below and we'll show you your assigned table.
            </p>
          </div>

          <div className={`gp-card ${shadowClass}`}>
            <div className="gp-search-wrap">
              <svg className="gp-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                className="gp-search-input"
                placeholder="Enter your name…"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                autoComplete="off"
              />
              {guestFetching && <span className="gp-search-spinner" />}
            </div>

            <div className="gp-search-result">
              {!debouncedName && !guest && (
                <p className="gp-search-placeholder">Start typing to find your table assignment.</p>
              )}
              {debouncedName && guestFetching && (
                <p className="gp-search-placeholder">Searching…</p>
              )}
              {debouncedName && !guestFetching && !guest && (
                <p className="gp-search-placeholder">
                  We couldn't find a match for “{debouncedName}”. Please check the spelling or ask
                  the host for assistance.
                </p>
              )}
              {guest && !guestFetching && (
                <div className="gp-seat-result">
                  <div className="gp-seat-result-info">
                    <p className="gp-seat-greeting">Welcome,</p>
                    <p className="gp-seat-name">{guest.name}</p>
                  </div>
                  {guest.table ? (
                    <div className="gp-seat-table">
                      <span className="gp-seat-table-label">Your Table</span>
                      <span className="gp-seat-table-name">{guest.table.name}</span>
                      {guest.table.number != null && (
                        <span className="gp-seat-table-number">Table #{guest.table.number}</span>
                      )}
                    </div>
                  ) : (
                    <div className="gp-seat-table gp-seat-table-unassigned">
                      <span className="gp-seat-table-label">Your Table</span>
                      <span className="gp-seat-table-name">To be assigned</span>
                    </div>
                  )}
                  <button
                    className={`${buttonClass} gp-seat-rsvp-btn`}
                    onClick={() => scrollToSection('rsvp')}
                  >
                    RSVP Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Venue ===== */}
      <section
        id="venue"
        ref={(el) => {
          sectionRefs.current.venue = el;
        }}
        className="gp-section gp-section-alt"
      >
        <div className="gp-container">
          <div className="gp-section-head">
            <span className="gp-section-label">Venue</span>
            <h2 className="gp-section-title">The Location</h2>
          </div>
          <div className="gp-venue-layout">
            <div className={`gp-card gp-venue-card ${shadowClass}`}>
              <h3 className="gp-venue-name">{event.venue || 'Venue to be announced'}</h3>
              <p className="gp-venue-text">
                {event.venue
                  ? `Join us at ${event.venue} for a celebration to remember. We can't wait to share this special day with you.`
                  : 'The venue details will be shared soon. Please check back later for more information.'}
              </p>
              {formattedDate && (
                <div className="gp-venue-detail">
                  <span className="gp-venue-detail-icon">📅</span>
                  <span>{formattedDate}</span>
                </div>
              )}
              {formattedTime && (
                <div className="gp-venue-detail">
                  <span className="gp-venue-detail-icon">⏰</span>
                  <span>{formattedTime}</span>
                </div>
              )}
            </div>
            {s.venue_image_url && (
              <div className="gp-venue-image-wrap">
                <img src={s.venue_image_url} alt={event.venue || 'Venue'} className="gp-venue-image" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== Details ===== */}
      <section
        id="details"
        ref={(el) => {
          sectionRefs.current.details = el;
        }}
        className="gp-section"
      >
        <div className="gp-container">
          <div className="gp-section-head">
            <span className="gp-section-label">Details</span>
            <h2 className="gp-section-title">Event Details</h2>
            <p className="gp-section-subtitle">Everything you need to know before you arrive.</p>
          </div>
          <div className="gp-details-grid">
            <div className={`gp-card gp-detail-card ${shadowClass}`}>
              <span className="gp-detail-icon">📅</span>
              <span className="gp-detail-label">Date</span>
              <span className="gp-detail-value">{formattedDate ?? 'TBA'}</span>
            </div>
            <div className={`gp-card gp-detail-card ${shadowClass}`}>
              <span className="gp-detail-icon">⏰</span>
              <span className="gp-detail-label">Time</span>
              <span className="gp-detail-value">{formattedTime ?? 'TBA'}</span>
            </div>
            <div className={`gp-card gp-detail-card ${shadowClass}`}>
              <span className="gp-detail-icon">📍</span>
              <span className="gp-detail-label">Venue</span>
              <span className="gp-detail-value">{event.venue || 'TBA'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Schedule ===== */}
      {enableSchedule && (
        <section
          id="schedule"
          ref={(el) => {
            sectionRefs.current.schedule = el;
          }}
          className="gp-section gp-section-alt"
        >
          <div className="gp-container">
            <div className="gp-section-head">
              <span className="gp-section-label">Schedule</span>
              <h2 className="gp-section-title">Order of Events</h2>
              <p className="gp-section-subtitle">A timeline of the celebration.</p>
            </div>
            <div className="gp-timeline">
              {scheduleItems.length === 0 && (
                <p className="gp-search-placeholder">Schedule details coming soon.</p>
              )}
              {scheduleItems.map((item, idx) => (
                <div key={idx} className="gp-timeline-item">
                  <div className="gp-timeline-marker">
                    <span className="gp-timeline-dot" />
                    {idx < scheduleItems.length - 1 && <span className="gp-timeline-line" />}
                  </div>
                  <div className={`gp-card gp-timeline-card ${shadowClass}`}>
                    {item.time && <span className="gp-timeline-time">{item.time}</span>}
                    {item.title && <h3 className="gp-timeline-title">{item.title}</h3>}
                    {item.description && <p className="gp-timeline-desc">{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Gallery ===== */}
      {enableGallery && (
        <section
          id="gallery"
          ref={(el) => {
            sectionRefs.current.gallery = el;
          }}
          className="gp-section"
        >
          <div className="gp-container">
            <div className="gp-section-head">
              <span className="gp-section-label">Gallery</span>
              <h2 className="gp-section-title">Moments to Cherish</h2>
              <p className="gp-section-subtitle">A glimpse of what's to come.</p>
            </div>
            {galleryImages.length === 0 ? (
              <p className="gp-search-placeholder">Gallery photos coming soon.</p>
            ) : (
              <div className="gp-gallery-grid">
                {galleryImages.map((img, idx) => (
                  <div key={idx} className="gp-gallery-item">
                    <img src={img} alt={`Gallery image ${idx + 1}`} className="gp-gallery-img" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===== RSVP ===== */}
      <section
        id="rsvp"
        ref={(el) => {
          sectionRefs.current.rsvp = el;
        }}
        className="gp-section gp-section-alt"
      >
        <div className="gp-container">
          <div className="gp-section-head">
            <span className="gp-section-label">RSVP</span>
            <h2 className="gp-section-title">Will You Join Us?</h2>
            <p className="gp-section-subtitle">
              Please let us know if you'll be celebrating with us.
            </p>
          </div>

          {!guest ? (
            <div className={`gp-card gp-rsvp-locked ${shadowClass}`}>
              <span className="gp-rsvp-locked-icon">🔒</span>
              <p className="gp-rsvp-locked-text">
                Please find your seat first — type your name in the Find Seat section above to
                unlock RSVP.
              </p>
              <button
                className={buttonClass}
                onClick={() => scrollToSection('find-seat')}
              >
                Find Your Seat
              </button>
            </div>
          ) : rsvpSubmitted ? (
            <div className={`gp-card gp-rsvp-success ${shadowClass}`}>
              <span className="gp-rsvp-success-icon">✓</span>
              <h3 className="gp-rsvp-success-title">Thank you, {guest.name}!</h3>
              <p className="gp-rsvp-success-text">
                Your RSVP has been recorded. We can't wait to celebrate with you!
              </p>
              <button
                className="gp-btn gp-btn-ghost"
                onClick={() => {
                  setRsvpSubmitted(false);
                }}
              >
                Edit RSVP
              </button>
            </div>
          ) : (
            <form className={`gp-card gp-rsvp-form ${shadowClass}`} onSubmit={handleRSVPSubmit}>
              <p className="gp-rsvp-greeting">
                Hi <strong>{guest.name}</strong>, let us know your plans:
              </p>

              <div className="gp-rsvp-status-row">
                {(['yes', 'no', 'maybe'] as RSVPStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`gp-rsvp-chip${rsvpStatus === status ? ' gp-rsvp-chip-active' : ''}`}
                    onClick={() => setRsvpStatus(status)}
                  >
                    <span className="gp-rsvp-chip-icon">
                      {status === 'yes' ? '✓' : status === 'no' ? '✕' : '?'}
                    </span>
                    <span className="gp-rsvp-chip-label">
                      {status === 'yes' ? 'Joyfully Accepts' : status === 'no' ? 'Regretfully Declines' : 'Maybe'}
                    </span>
                  </button>
                ))}
              </div>

              {rsvpStatus === 'yes' && (
                <div className="gp-rsvp-field">
                  <label className="gp-rsvp-label">Number of plus-ones</label>
                  <div className="gp-rsvp-counter">
                    <button
                      type="button"
                      className="gp-rsvp-counter-btn"
                      onClick={() => setPlusOnes((n) => Math.max(0, n - 1))}
                      aria-label="Decrease plus-ones"
                    >
                      −
                    </button>
                    <span className="gp-rsvp-counter-value">{plusOnes}</span>
                    <button
                      type="button"
                      className="gp-rsvp-counter-btn"
                      onClick={() => setPlusOnes((n) => Math.min(10, n + 1))}
                      aria-label="Increase plus-ones"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <div className="gp-rsvp-field">
                <label className="gp-rsvp-label">Message to the host (optional)</label>
                <textarea
                  className="gp-rsvp-textarea"
                  rows={3}
                  placeholder="Share a note, dietary requirements, or a wish…"
                  value={rsvpMessage}
                  onChange={(e) => setRsvpMessage(e.target.value)}
                />
              </div>

              {rsvpError && <p className="gp-rsvp-error">{rsvpError}</p>}

              <button
                type="submit"
                className={`${buttonClass} gp-rsvp-submit`}
                disabled={!rsvpStatus || rsvpPending}
              >
                {rsvpPending ? 'Submitting…' : 'Submit RSVP'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="gp-footer">
        <div className="gp-container gp-footer-inner">
          {s.logo_url && (
            <img
              src={s.logo_url}
              alt={event.name}
              className="gp-footer-logo"
              style={{
                width: s.logo_size ? Math.min(s.logo_size, 40) : 32,
                height: s.logo_size ? Math.min(s.logo_size, 40) : 32,
                borderRadius: s.logo_rounded ? '50%' : 0,
              }}
            />
          )}
          <p className="gp-footer-name">{event.name}</p>
          <p className="gp-footer-tagline">
            {formattedDate ? formattedDate : "We can't wait to celebrate with you."}
          </p>
        </div>
      </footer>

      {/* ===== Scoped Styles ===== */}
      <style>{`
        .gp-page {
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
          background: var(--gp-background);
          color: var(--gp-text);
          font-family: var(--gp-font-body), 'Inter', sans-serif;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .gp-page * { box-sizing: border-box; }

        /* Loading */
        .gp-loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          gap: 20px;
        }
        .gp-loader {
          width: 44px;
          height: 44px;
          border: 3px solid var(--gp-primary, #0f766e);
          border-top-color: transparent;
          border-radius: 50%;
          animation: gp-spin 0.8s linear infinite;
        }
        @keyframes gp-spin { to { transform: rotate(360deg); } }
        .gp-loader-text {
          color: var(--gp-text, #0f172a);
          font-size: 16px;
          opacity: 0.7;
        }

        /* Not found */
        .gp-not-found {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 24px;
        }
        .gp-not-found-card {
          max-width: 460px;
          text-align: center;
          background: var(--gp-card, #fff);
          padding: 48px 32px;
          border-radius: var(--gp-radius, 16px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.08);
        }
        .gp-not-found-title {
          font-family: var(--gp-font-heading), serif;
          font-size: 28px;
          margin: 0 0 12px;
          color: var(--gp-text);
        }
        .gp-not-found-text {
          font-size: 15px;
          line-height: 1.6;
          color: var(--gp-text);
          opacity: 0.7;
          margin: 0;
        }

        /* Navigation */
        .gp-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(0,0,0,0.06);
          transition: box-shadow 0.3s ease, background 0.3s ease;
        }
        .gp-nav-scrolled {
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          background: rgba(255,255,255,0.95);
        }
        .gp-nav-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 24px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .gp-nav-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }
        .gp-nav-logo { object-fit: cover; }
        .gp-nav-brand-text {
          font-family: var(--gp-font-heading), serif;
          font-size: 18px;
          font-weight: 700;
          color: var(--gp-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }
        .gp-nav-links {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .gp-nav-link {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px 14px;
          font-size: 14px;
          font-weight: 500;
          color: var(--gp-text);
          opacity: 0.65;
          border-radius: 8px;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .gp-nav-link:hover { opacity: 1; background: rgba(0,0,0,0.04); }
        .gp-nav-link-active {
          opacity: 1;
          color: var(--gp-primary);
          background: color-mix(in srgb, var(--gp-primary) 10%, transparent);
        }

        /* Hero */
        .gp-hero {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          padding: 80px 24px 60px;
          overflow: hidden;
        }
        .gp-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.35) 100%);
        }
        .gp-hero-content {
          position: relative;
          z-index: 2;
          max-width: 720px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .gp-hero-logo {
          object-fit: cover;
          margin-bottom: 8px;
          box-shadow: 0 8px 28px rgba(0,0,0,0.2);
        }
        .gp-hero-eyebrow {
          font-family: var(--gp-font-body), sans-serif;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.85);
          margin: 0;
        }
        .gp-hero-title {
          font-family: var(--gp-font-heading), serif;
          font-size: clamp(36px, 6vw, 64px);
          font-weight: 700;
          line-height: 1.15;
          color: #fff;
          margin: 0;
          text-shadow: 0 2px 20px rgba(0,0,0,0.3);
        }
        .gp-hero-meta {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px 24px;
          margin-top: 4px;
        }
        .gp-hero-meta-item {
          font-size: 15px;
          color: rgba(255,255,255,0.9);
          display: flex;
          align-items: center;
        }
        .gp-hero-meta-item:not(:last-child)::after {
          content: '·';
          margin-left: 24px;
          opacity: 0.5;
        }
        .gp-hero-welcome {
          font-size: 17px;
          line-height: 1.6;
          color: rgba(255,255,255,0.92);
          max-width: 560px;
          margin: 8px 0 12px;
        }
        .gp-hero-scroll {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 2;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
        }
        .gp-hero-scroll-mouse {
          display: block;
          width: 24px;
          height: 40px;
          border: 2px solid rgba(255,255,255,0.6);
          border-radius: 12px;
          position: relative;
        }
        .gp-hero-scroll-mouse::after {
          content: '';
          position: absolute;
          top: 6px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 8px;
          background: rgba(255,255,255,0.7);
          border-radius: 2px;
          animation: gp-scroll-bob 1.6s ease-in-out infinite;
        }
        @keyframes gp-scroll-bob {
          0%, 100% { transform: translateX(-50%) translateY(0); opacity: 1; }
          50% { transform: translateX(-50%) translateY(8px); opacity: 0.4; }
        }

        /* Sections */
        .gp-section { padding: 80px 24px; }
        .gp-section-alt { background: color-mix(in srgb, var(--gp-primary) 4%, transparent); }
        .gp-container { max-width: 900px; margin: 0 auto; }
        .gp-section-head { text-align: center; margin-bottom: 48px; }
        .gp-section-label {
          display: inline-block;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--gp-primary);
          margin-bottom: 12px;
        }
        .gp-section-title {
          font-family: var(--gp-font-heading), serif;
          font-size: clamp(28px, 4vw, 40px);
          font-weight: 700;
          color: var(--gp-text);
          margin: 0 0 12px;
        }
        .gp-section-subtitle {
          font-size: 16px;
          line-height: 1.6;
          color: var(--gp-text);
          opacity: 0.65;
          max-width: 520px;
          margin: 0 auto;
        }

        /* Cards */
        .gp-card {
          background: var(--gp-card);
          border-radius: var(--gp-radius);
          padding: 32px;
        }
        .gp-shadow-sm { box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .gp-shadow-md { box-shadow: 0 8px 28px rgba(0,0,0,0.08); }
        .gp-shadow-lg { box-shadow: 0 16px 48px rgba(0,0,0,0.12); }
        .gp-shadow-none { box-shadow: none; border: 1px solid rgba(0,0,0,0.06); }

        /* Buttons */
        .gp-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: var(--gp-font-body), sans-serif;
          font-size: 15px;
          font-weight: 600;
          padding: 12px 28px;
          border-radius: var(--gp-radius);
          cursor: pointer;
          border: none;
          transition: transform 0.15s ease, box-shadow 0.2s ease, opacity 0.2s ease;
          text-decoration: none;
        }
        .gp-btn:active { transform: translateY(1px); }
        .gp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .gp-btn-filled {
          background: var(--gp-button);
          color: var(--gp-button-text);
          box-shadow: 0 4px 14px color-mix(in srgb, var(--gp-button) 30%, transparent);
        }
        .gp-btn-filled:hover:not(:disabled) {
          box-shadow: 0 6px 20px color-mix(in srgb, var(--gp-button) 40%, transparent);
          transform: translateY(-1px);
        }
        .gp-btn-outline {
          background: transparent;
          color: var(--gp-button);
          border: 2px solid var(--gp-button);
        }
        .gp-btn-outline:hover:not(:disabled) { background: color-mix(in srgb, var(--gp-button) 8%, transparent); }
        .gp-btn-ghost {
          background: transparent;
          color: var(--gp-text);
          opacity: 0.7;
        }
        .gp-btn-ghost:hover:not(:disabled) { opacity: 1; background: rgba(0,0,0,0.04); }

        /* Search */
        .gp-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .gp-search-icon {
          position: absolute;
          left: 16px;
          width: 20px;
          height: 20px;
          color: var(--gp-text);
          opacity: 0.4;
          pointer-events: none;
        }
        .gp-search-input {
          width: 100%;
          font-family: var(--gp-font-body), sans-serif;
          font-size: 16px;
          padding: 16px 48px 16px 48px;
          border: 2px solid rgba(0,0,0,0.08);
          border-radius: var(--gp-radius);
          background: var(--gp-background);
          color: var(--gp-text);
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .gp-search-input:focus {
          border-color: var(--gp-primary);
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--gp-primary) 12%, transparent);
        }
        .gp-search-spinner {
          position: absolute;
          right: 16px;
          width: 20px;
          height: 20px;
          border: 2px solid var(--gp-primary);
          border-top-color: transparent;
          border-radius: 50%;
          animation: gp-spin 0.7s linear infinite;
        }
        .gp-search-result { margin-top: 24px; }
        .gp-search-placeholder {
          text-align: center;
          font-size: 15px;
          color: var(--gp-text);
          opacity: 0.5;
          padding: 16px 0;
          margin: 0;
        }

        /* Seat result */
        .gp-seat-result {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 16px 0 8px;
          text-align: center;
        }
        .gp-seat-result-info { display: flex; flex-direction: column; gap: 2px; }
        .gp-seat-greeting { font-size: 14px; opacity: 0.5; margin: 0; }
        .gp-seat-name {
          font-family: var(--gp-font-heading), serif;
          font-size: 28px;
          font-weight: 700;
          color: var(--gp-text);
          margin: 0;
        }
        .gp-seat-table {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 20px 40px;
          background: color-mix(in srgb, var(--gp-primary) 8%, transparent);
          border-radius: var(--gp-radius);
        }
        .gp-seat-table-unassigned { background: color-mix(in srgb, var(--gp-text) 6%, transparent); }
        .gp-seat-table-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--gp-primary);
        }
        .gp-seat-table-unassigned .gp-seat-table-label { color: var(--gp-text); opacity: 0.5; }
        .gp-seat-table-name {
          font-family: var(--gp-font-heading), serif;
          font-size: 24px;
          font-weight: 700;
          color: var(--gp-text);
        }
        .gp-seat-table-number {
          font-size: 14px;
          color: var(--gp-text);
          opacity: 0.6;
        }
        .gp-seat-rsvp-btn { margin-top: 4px; }

        /* Venue */
        .gp-venue-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          align-items: center;
        }
        @media (min-width: 768px) {
          .gp-venue-layout { grid-template-columns: 1fr 1fr; }
        }
        .gp-venue-card { display: flex; flex-direction: column; gap: 12px; }
        .gp-venue-name {
          font-family: var(--gp-font-heading), serif;
          font-size: 24px;
          font-weight: 700;
          color: var(--gp-text);
          margin: 0;
        }
        .gp-venue-text { font-size: 15px; line-height: 1.7; color: var(--gp-text); opacity: 0.7; margin: 0; }
        .gp-venue-detail {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 15px;
          color: var(--gp-text);
          opacity: 0.8;
        }
        .gp-venue-detail-icon { font-size: 18px; }
        .gp-venue-image-wrap {
          border-radius: var(--gp-radius);
          overflow: hidden;
          box-shadow: 0 12px 36px rgba(0,0,0,0.1);
          aspect-ratio: 4 / 3;
        }
        .gp-venue-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        /* Details */
        .gp-details-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 640px) {
          .gp-details-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .gp-detail-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          text-align: center;
          padding: 36px 24px;
        }
        .gp-detail-icon { font-size: 32px; }
        .gp-detail-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--gp-primary);
        }
        .gp-detail-value {
          font-family: var(--gp-font-heading), serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--gp-text);
        }

        /* Schedule / Timeline */
        .gp-timeline { display: flex; flex-direction: column; gap: 0; }
        .gp-timeline-item {
          display: flex;
          gap: 20px;
          padding-bottom: 8px;
        }
        .gp-timeline-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
          padding-top: 18px;
        }
        .gp-timeline-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--gp-primary);
          border: 3px solid var(--gp-card);
          box-shadow: 0 0 0 2px var(--gp-primary);
          flex-shrink: 0;
        }
        .gp-timeline-line {
          width: 2px;
          flex: 1;
          background: color-mix(in srgb, var(--gp-primary) 25%, transparent);
          margin-top: 6px;
          min-height: 24px;
        }
        .gp-timeline-card { flex: 1; padding: 20px 24px; margin-bottom: 16px; }
        .gp-timeline-time {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--gp-primary);
        }
        .gp-timeline-title {
          font-family: var(--gp-font-heading), serif;
          font-size: 20px;
          font-weight: 700;
          color: var(--gp-text);
          margin: 4px 0 4px;
        }
        .gp-timeline-desc { font-size: 14px; line-height: 1.6; color: var(--gp-text); opacity: 0.65; margin: 0; }

        /* Gallery */
        .gp-gallery-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        @media (min-width: 640px) {
          .gp-gallery-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .gp-gallery-item {
          border-radius: var(--gp-radius);
          overflow: hidden;
          aspect-ratio: 1;
          box-shadow: 0 6px 20px rgba(0,0,0,0.08);
        }
        .gp-gallery-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.4s ease;
        }
        .gp-gallery-item:hover .gp-gallery-img { transform: scale(1.05); }

        /* RSVP */
        .gp-rsvp-locked, .gp-rsvp-success {
          max-width: 520px;
          margin: 0 auto;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 48px 32px;
        }
        .gp-rsvp-locked-icon, .gp-rsvp-success-icon {
          font-size: 40px;
          width: 72px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        .gp-rsvp-locked-icon { background: color-mix(in srgb, var(--gp-text) 6%, transparent); }
        .gp-rsvp-success-icon {
          background: color-mix(in srgb, var(--gp-primary) 15%, transparent);
          color: var(--gp-primary);
          font-size: 32px;
        }
        .gp-rsvp-locked-text { font-size: 15px; line-height: 1.6; color: var(--gp-text); opacity: 0.7; margin: 0; }
        .gp-rsvp-success-title {
          font-family: var(--gp-font-heading), serif;
          font-size: 26px;
          font-weight: 700;
          color: var(--gp-text);
          margin: 0;
        }
        .gp-rsvp-success-text { font-size: 15px; line-height: 1.6; color: var(--gp-text); opacity: 0.7; margin: 0; }

        .gp-rsvp-form {
          max-width: 560px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .gp-rsvp-greeting { font-size: 16px; color: var(--gp-text); margin: 0; text-align: center; }
        .gp-rsvp-status-row { display: flex; gap: 12px; flex-wrap: wrap; }
        .gp-rsvp-chip {
          flex: 1;
          min-width: 120px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 20px 12px;
          background: var(--gp-background);
          border: 2px solid rgba(0,0,0,0.08);
          border-radius: var(--gp-radius);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .gp-rsvp-chip:hover { border-color: var(--gp-primary); }
        .gp-rsvp-chip-active {
          border-color: var(--gp-primary);
          background: color-mix(in srgb, var(--gp-primary) 8%, transparent);
        }
        .gp-rsvp-chip-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 16px;
          font-weight: 700;
          background: var(--gp-primary);
          color: var(--gp-button-text);
        }
        .gp-rsvp-chip-active .gp-rsvp-chip-icon { background: var(--gp-primary); }
        .gp-rsvp-chip-label { font-size: 13px; font-weight: 600; color: var(--gp-text); text-align: center; }

        .gp-rsvp-field { display: flex; flex-direction: column; gap: 8px; }
        .gp-rsvp-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--gp-text);
        }
        .gp-rsvp-counter {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .gp-rsvp-counter-btn {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          border: 2px solid rgba(0,0,0,0.1);
          background: var(--gp-card);
          font-size: 22px;
          font-weight: 600;
          color: var(--gp-text);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.2s ease;
        }
        .gp-rsvp-counter-btn:hover { border-color: var(--gp-primary); color: var(--gp-primary); }
        .gp-rsvp-counter-value {
          font-family: var(--gp-font-heading), serif;
          font-size: 28px;
          font-weight: 700;
          min-width: 32px;
          text-align: center;
        }
        .gp-rsvp-textarea {
          width: 100%;
          font-family: var(--gp-font-body), sans-serif;
          font-size: 15px;
          padding: 14px 16px;
          border: 2px solid rgba(0,0,0,0.08);
          border-radius: var(--gp-radius);
          background: var(--gp-background);
          color: var(--gp-text);
          outline: none;
          resize: vertical;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .gp-rsvp-textarea:focus {
          border-color: var(--gp-primary);
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--gp-primary) 12%, transparent);
        }
        .gp-rsvp-error {
          color: #dc2626;
          font-size: 14px;
          margin: 0;
          text-align: center;
        }
        .gp-rsvp-submit { width: 100%; padding: 16px; font-size: 16px; }

        /* Footer */
        .gp-footer {
          background: var(--gp-footer);
          padding: 48px 24px;
          text-align: center;
        }
        .gp-footer-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .gp-footer-logo { object-fit: cover; }
        .gp-footer-name {
          font-family: var(--gp-font-heading), serif;
          font-size: 22px;
          font-weight: 700;
          color: rgba(255,255,255,0.95);
          margin: 0;
        }
        .gp-footer-tagline {
          font-size: 14px;
          color: rgba(255,255,255,0.6);
          margin: 0;
        }

        /* Mobile nav adjustments */
        @media (max-width: 640px) {
          .gp-nav-brand-text { display: none; }
          .gp-nav-link { padding: 8px 10px; font-size: 13px; }
          .gp-hero { padding: 60px 20px 50px; }
          .gp-section { padding: 56px 20px; }
          .gp-card { padding: 24px 20px; }
          .gp-rsvp-chip { min-width: 100%; }
        }
      `}</style>
    </div>
  );
}
