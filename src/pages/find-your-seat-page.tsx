import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useEventBySlug } from '@/hooks/use-events';
import { useGuestSearch } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { useGuestPageSettingsBySlug } from '@/hooks/use-guest-page-settings';
import type { GuestPageSettings } from '@/types/guest-page-settings';
import type { GuestWithTable } from '@/types/guest';

type Section =
  'home' | 'find-seat' | 'venue' | 'details' | 'schedule' | 'gallery' | 'rsvp';

interface ScheduleItem {
  time: string;
  title: string;
  description?: string;
}

function shadowValue(level: string): string {
  switch (level) {
    case 'none':
      return 'none';
    case 'sm':
      return '0 1px 3px rgba(0,0,0,0.06)';
    case 'lg':
      return '0 16px 48px rgba(0,0,0,0.12)';
    default:
      return '0 8px 24px rgba(0,0,0,0.08)';
  }
}

export function FindYourSeatPage() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const eventQuery = useEventBySlug(eventSlug ?? '');
  const settingsQuery = useGuestPageSettingsBySlug(eventSlug ?? '');
  const tablesQuery = useTables(eventQuery.data?.id ?? '');

  const event = eventQuery.data;
  const settings = settingsQuery.data;
  const tables = tablesQuery.data ?? [];

  const [activeSection, setActiveSection] = useState<Section>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<GuestWithTable | null>(
    null,
  );
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const sectionRefs = useRef<Record<Section, HTMLElement | null>>({
    home: null,
    'find-seat': null,
    venue: null,
    details: null,
    schedule: null,
    gallery: null,
    rsvp: null,
  });

  const searchResults = useGuestSearch(
    eventQuery.data?.id ?? '',
    searchQuery.length >= 2 ? searchQuery : '',
  );
  const suggestions = searchResults.data ?? [];

  const scheduleItems = useMemo<ScheduleItem[]>(() => {
    if (!settings?.schedule_items) return [];
    if (Array.isArray(settings.schedule_items)) {
      return settings.schedule_items as ScheduleItem[];
    }
    return [];
  }, [settings]);

  const galleryImages = useMemo<string[]>(() => {
    if (!settings?.gallery_images) return [];
    if (Array.isArray(settings.gallery_images)) {
      return settings.gallery_images as string[];
    }
    return [];
  }, [settings]);

  useEffect(() => {
    if (!settings) return;
    const fonts = new Set([
      settings.font_heading,
      settings.font_body,
      settings.font_button,
    ]);
    const fontList = Array.from(fonts);
    if (fontList.length > 0) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${fontList
        .map((f) => f.replace(/ /g, '+'))
        .join('&family=')}&display=swap`;
      document.head.appendChild(link);
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [settings]);

  const scrollToSection = useCallback((section: Section) => {
    const el = sectionRefs.current[section];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setActiveSection(section);
    setMobileNavOpen(false);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id as Section;
            if (id) setActiveSection(id);
          }
        }
      },
      { threshold: 0.3, rootMargin: '-80px 0px -60% 0px' },
    );

    for (const key of Object.keys(sectionRefs.current) as Section[]) {
      const el = sectionRefs.current[key];
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [settings]);

  useEffect(() => {
    setActiveSuggestion(-1);
  }, [searchQuery]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeSuggestion >= 0) {
      e.preventDefault();
      setSelectedGuest(suggestions[activeSuggestion]);
      setSearchQuery('');
    } else if (e.key === 'Escape') {
      setSearchQuery('');
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    panStart.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  useEffect(() => {
    if (!isPanning) return;
    const handleMove = (e: MouseEvent) => {
      setPan({
        x: panStart.current.panX + (e.clientX - panStart.current.x),
        y: panStart.current.panY + (e.clientY - panStart.current.y),
      });
    };
    const handleUp = () => setIsPanning(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isPanning]);

  if (eventQuery.isLoading) {
    return (
      <div className="gp-loading">
        <span
          className="spinner"
          style={{ width: 32, height: 32, borderWidth: 3 }}
        />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="gp-error-wrap">
        <div className="gp-error-card">
          <h1>Event Not Found</h1>
          <p>The event you're looking for doesn't exist or has ended.</p>
        </div>
      </div>
    );
  }

  const s = settings as GuestPageSettings | null;
  const accent = s?.color_primary ?? '#0f766e';
  const secondary = s?.color_secondary ?? '#14b8a6';
  const bg = s?.color_background ?? '#f8fafc';
  const cardBg = s?.color_card ?? '#ffffff';
  const text = s?.color_text ?? '#0f172a';
  const headerBg = s?.color_header ?? '#ffffff';
  const footerBg = s?.color_footer ?? '#0f172a';
  const btnBg = s?.color_button ?? accent;
  const btnText = s?.color_button_text ?? '#ffffff';
  const linkColor = s?.color_link ?? accent;
  const radius = s?.border_radius ?? 16;
  const shadow = s ? shadowValue(s.card_shadow) : '0 8px 24px rgba(0,0,0,0.08)';

  const themeStyle = {
    '--gp-accent': accent,
    '--gp-secondary': secondary,
    '--gp-bg': bg,
    '--gp-card': cardBg,
    '--gp-text': text,
    '--gp-header': headerBg,
    '--gp-footer': footerBg,
    '--gp-btn': btnBg,
    '--gp-btn-text': btnText,
    '--gp-link': linkColor,
    '--gp-radius': `${radius}px`,
    fontFamily: s?.font_body ?? 'Inter',
    fontSize: `${s?.font_body_size ?? 16}px`,
    color: text,
    lineHeight: s?.font_body_line_height ?? 1.5,
    letterSpacing: `${s?.font_body_spacing ?? 0}px`,
    background: bg,
  } as React.CSSProperties;

  const heroBg = s?.cover_image
    ? `url(${s.cover_image})`
    : s?.background_image
      ? `url(${s.background_image})`
      : `linear-gradient(135deg, ${accent}, ${secondary})`;

  const heroHeight = s?.banner_height ?? 240;

  const headingStyle: React.CSSProperties = {
    fontFamily: s?.font_heading ?? 'Inter',
    fontWeight: s?.font_heading_weight ?? 700,
    letterSpacing: `${s?.font_heading_spacing ?? 0}px`,
    lineHeight: s?.font_heading_line_height ?? 1.2,
  };

  const buttonStyle: React.CSSProperties = {
    fontFamily: s?.font_button ?? 'Inter',
    background: s?.button_style === 'outlined' ? 'transparent' : btnBg,
    color: s?.button_style === 'outlined' ? btnBg : btnText,
    border: s?.button_style === 'outlined' ? `2px solid ${btnBg}` : 'none',
    borderRadius: s?.button_style === 'rounded' ? '9999px' : `${radius}px`,
  };

  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const formattedTime = event.time
    ? new Date(`2000-01-01T${event.time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  const navSections: { id: Section; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'find-seat', label: 'Find Seat' },
    { id: 'venue', label: 'Venue Layout' },
    { id: 'details', label: 'Event Details' },
    ...(s?.enable_schedule
      ? [{ id: 'schedule' as Section, label: 'Schedule' }]
      : []),
    ...(s?.enable_gallery
      ? [{ id: 'gallery' as Section, label: 'Gallery' }]
      : []),
    ...(event.invitation_enabled
      ? [{ id: 'rsvp' as Section, label: 'RSVP' }]
      : []),
  ];

  return (
    <div className="gp-page" style={themeStyle}>
      <nav className={`gp-nav${mobileNavOpen ? ' gp-nav--open' : ''}`}>
        <div className="gp-nav__inner">
          <a
            href="#home"
            className="gp-nav__logo"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('home');
            }}
          >
            {s?.logo_url ? (
              <img
                src={s.logo_url}
                alt="Logo"
                style={{
                  height: `${Math.min(s.logo_size, 40)}px`,
                  borderRadius: s.logo_rounded ? '50%' : '6px',
                }}
              />
            ) : (
              <span
                style={{ color: accent, fontWeight: 700, fontSize: '1.25rem' }}
              >
                {event.name}
              </span>
            )}
          </a>
          <div
            className={`gp-nav__links${mobileNavOpen ? ' gp-nav__links--open' : ''}`}
          >
            {navSections.map((sec) => (
              <button
                key={sec.id}
                className={`gp-nav__link${activeSection === sec.id ? ' gp-nav__link--active' : ''}`}
                style={
                  activeSection === sec.id
                    ? { color: accent, borderBottomColor: accent }
                    : {}
                }
                onClick={() => scrollToSection(sec.id)}
              >
                {sec.label}
              </button>
            ))}
          </div>
          <button
            className="gp-nav__toggle"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label="Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      <section
        id="home"
        ref={(el) => {
          sectionRefs.current.home = el;
        }}
        className="gp-hero"
        style={{
          backgroundImage: `linear-gradient(rgba(15,23,42,${(s?.background_overlay_opacity ?? 30) / 100}), rgba(15,23,42,${(s?.background_overlay_opacity ?? 30) / 100}), ${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: `${heroHeight}px`,
        }}
      >
        <div className="gp-hero__inner">
          {s?.logo_url && (
            <img
              src={s.logo_url}
              alt="Event logo"
              className="gp-hero__logo"
              style={{
                height: `${s.logo_size}px`,
                borderRadius: s.logo_rounded ? '50%' : `${radius}px`,
              }}
            />
          )}
          <h1
            className="gp-hero__title"
            style={{
              ...headingStyle,
              fontSize: `${s?.font_heading_size ?? 48}px`,
              color: '#ffffff',
            }}
          >
            {event.name}
          </h1>
          {s?.event_subtitle && (
            <p
              className="gp-hero__subtitle"
              style={{ color: 'rgba(255,255,255,0.85)' }}
            >
              {s.event_subtitle}
            </p>
          )}
          {(formattedDate || event.venue) && (
            <div className="gp-hero__meta">
              {formattedDate && (
                <span className="gp-hero__meta-item">
                  <span className="gp-hero__meta-icon">📅</span>
                  {formattedDate}
                  {formattedTime && ` at ${formattedTime}`}
                </span>
              )}
              {event.venue && (
                <span className="gp-hero__meta-item">
                  <span className="gp-hero__meta-icon">📍</span>
                  {event.venue}
                </span>
              )}
            </div>
          )}
          {s?.welcome_message && (
            <p
              className="gp-hero__welcome"
              style={{ color: 'rgba(255,255,255,0.8)' }}
            >
              {s.welcome_message}
            </p>
          )}
          <button
            className="gp-hero__cta"
            style={buttonStyle}
            onClick={() => scrollToSection('find-seat')}
          >
            Find Your Seat
          </button>
        </div>
        <div
          className="gp-hero__scroll"
          onClick={() => scrollToSection('find-seat')}
        >
          <span></span>
        </div>
      </section>

      <section
        id="find-seat"
        ref={(el) => {
          sectionRefs.current['find-seat'] = el;
        }}
        className="gp-section"
      >
        <div className="gp-section__inner">
          <div className="gp-section__header">
            <span className="gp-section__eyebrow" style={{ color: accent }}>
              Find Your Seat
            </span>
            <h2 className="gp-section__title" style={headingStyle}>
              Search for Your Name
            </h2>
            <p className="gp-section__desc">
              Type your name below to find your assigned table and seat.
            </p>
          </div>

          {!selectedGuest ? (
            <div
              className="gp-search"
              style={{
                background: cardBg,
                borderRadius: `${radius}px`,
                boxShadow: shadow,
              }}
            >
              <div className="gp-search__wrap">
                <span className="gp-search__icon" style={{ color: accent }}>
                  ⌕
                </span>
                <input
                  type="text"
                  className="gp-search__input"
                  placeholder="Type your name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  style={{ color: text }}
                />
                {searchResults.isFetching && (
                  <span
                    className="spinner"
                    style={{
                      width: 18,
                      height: 18,
                      borderWidth: 2,
                      borderTopColor: accent,
                    }}
                  />
                )}
              </div>
              {suggestions.length > 0 && (
                <ul className="gp-search__suggestions">
                  {suggestions.map((g, i) => (
                    <li
                      key={g.id}
                      className={`gp-search__suggestion${i === activeSuggestion ? ' gp-search__suggestion--active' : ''}`}
                      style={
                        i === activeSuggestion
                          ? { background: `${accent}12` }
                          : {}
                      }
                      onClick={() => {
                        setSelectedGuest(g);
                        setSearchQuery('');
                      }}
                    >
                      <span
                        className="gp-search__suggestion-name"
                        style={{ color: text }}
                      >
                        {g.name}
                      </span>
                      {g.table ? (
                        <span
                          className="gp-search__suggestion-badge"
                          style={{ background: accent, color: btnText }}
                        >
                          Table {g.table.number}
                        </span>
                      ) : (
                        <span className="gp-search__suggestion-badge gp-search__suggestion-badge--unassigned">
                          Unassigned
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {searchQuery.length >= 2 &&
                !searchResults.isFetching &&
                suggestions.length === 0 && (
                  <div
                    className="gp-search__no-results"
                    style={{ color: text }}
                  >
                    <p>No guests found matching "{searchQuery}".</p>
                    <p style={{ opacity: 0.6 }}>
                      Check with the event organizer if you don't see your name.
                    </p>
                  </div>
                )}
            </div>
          ) : (
            <div
              className="gp-result"
              style={{
                background: cardBg,
                borderRadius: `${radius}px`,
                boxShadow: shadow,
              }}
            >
              <div
                className="gp-result__check"
                style={{ background: accent, color: btnText }}
              >
                ✓
              </div>
              <p className="gp-result__greeting" style={{ color: accent }}>
                Your Seat
              </p>
              <h3
                className="gp-result__name"
                style={{ ...headingStyle, color: text }}
              >
                {selectedGuest.name}
              </h3>
              {selectedGuest.table ? (
                <div
                  className="gp-result__table"
                  style={{
                    background: `${accent}10`,
                    borderColor: `${accent}30`,
                  }}
                >
                  <span
                    className="gp-result__table-label"
                    style={{ color: accent }}
                  >
                    Table Number
                  </span>
                  <span
                    className="gp-result__table-number"
                    style={{
                      color: accent,
                      fontFamily: s?.font_heading ?? 'Inter',
                    }}
                  >
                    {selectedGuest.table.number}
                  </span>
                  <span
                    className="gp-result__table-name"
                    style={{ color: text, opacity: 0.7 }}
                  >
                    {selectedGuest.table.name}
                  </span>
                </div>
              ) : (
                <div className="gp-result__table gp-result__table--unassigned">
                  <span className="gp-result__table-label">
                    Not Yet Assigned
                  </span>
                  <span className="gp-result__table-name">
                    Please see the event organizer for your seat.
                  </span>
                </div>
              )}
              <button
                className="gp-result__back"
                style={buttonStyle}
                onClick={() => setSelectedGuest(null)}
              >
                Search Again
              </button>
            </div>
          )}
        </div>
      </section>

      <section
        id="venue"
        ref={(el) => {
          sectionRefs.current.venue = el;
        }}
        className="gp-section gp-section--alt"
      >
        <div className="gp-section__inner">
          <div className="gp-section__header">
            <span className="gp-section__eyebrow" style={{ color: accent }}>
              Venue Layout
            </span>
            <h2 className="gp-section__title" style={headingStyle}>
              Explore the Venue
            </h2>
            <p className="gp-section__desc">
              Zoom and pan to find tables and navigate the floor plan.
            </p>
          </div>

          <div
            className="gp-venue"
            style={{
              background: cardBg,
              borderRadius: `${radius}px`,
              boxShadow: shadow,
            }}
          >
            <div className="gp-venue__controls">
              <button
                className="gp-venue__btn"
                style={{ borderColor: accent, color: accent }}
                onClick={() => setZoom((z) => Math.min(z + 0.2, 3))}
              >
                Zoom +
              </button>
              <button
                className="gp-venue__btn"
                style={{ borderColor: accent, color: accent }}
                onClick={() => setZoom((z) => Math.max(z - 0.2, 0.3))}
              >
                Zoom −
              </button>
              <button
                className="gp-venue__btn"
                style={{ borderColor: accent, color: accent }}
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
              >
                Reset
              </button>
            </div>
            <div className="gp-venue__canvas" onMouseDown={handleMouseDown}>
              {s?.venue_image_url ? (
                <img
                  src={s.venue_image_url}
                  alt="Venue layout"
                  className="gp-venue__image"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  }}
                  draggable={false}
                />
              ) : (
                <div
                  className="gp-venue__tables"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  }}
                >
                  {tables.length === 0 ? (
                    <p className="gp-venue__empty">
                      No venue layout available.
                    </p>
                  ) : (
                    tables.map((t) => (
                      <div
                        key={t.id}
                        className="gp-venue__table"
                        style={{
                          left: `${t.position_x ?? 50}px`,
                          top: `${t.position_y ?? 50}px`,
                          borderColor: accent,
                          borderRadius: `${radius}px`,
                          background: cardBg,
                          color: text,
                        }}
                      >
                        <span
                          className="gp-venue__table-number"
                          style={{ color: accent }}
                        >
                          #{t.number}
                        </span>
                        <span className="gp-venue__table-name">{t.name}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <p className="gp-venue__hint">
              Drag to pan · Use zoom buttons to adjust
            </p>
          </div>
        </div>
      </section>

      <section
        id="details"
        ref={(el) => {
          sectionRefs.current.details = el;
        }}
        className="gp-section"
      >
        <div className="gp-section__inner">
          <div className="gp-section__header">
            <span className="gp-section__eyebrow" style={{ color: accent }}>
              Event Details
            </span>
            <h2 className="gp-section__title" style={headingStyle}>
              About This Event
            </h2>
          </div>
          <div
            className="gp-details"
            style={{
              background: cardBg,
              borderRadius: `${radius}px`,
              boxShadow: shadow,
            }}
          >
            <div className="gp-details__row">
              <span
                className="gp-details__icon"
                style={{ background: `${accent}15`, color: accent }}
              >
                📅
              </span>
              <div className="gp-details__content">
                <span className="gp-details__label">Date & Time</span>
                <span className="gp-details__value" style={{ color: text }}>
                  {formattedDate ?? 'TBA'}
                  {formattedTime && ` at ${formattedTime}`}
                </span>
              </div>
            </div>
            {event.venue && (
              <div className="gp-details__row">
                <span
                  className="gp-details__icon"
                  style={{ background: `${accent}15`, color: accent }}
                >
                  📍
                </span>
                <div className="gp-details__content">
                  <span className="gp-details__label">Venue</span>
                  <span className="gp-details__value" style={{ color: text }}>
                    {event.venue}
                  </span>
                </div>
              </div>
            )}
            <div className="gp-details__row">
              <span
                className="gp-details__icon"
                style={{ background: `${accent}15`, color: accent }}
              >
                🎉
              </span>
              <div className="gp-details__content">
                <span className="gp-details__label">Event Name</span>
                <span className="gp-details__value" style={{ color: text }}>
                  {event.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {s?.enable_schedule && scheduleItems.length > 0 && (
        <section
          id="schedule"
          ref={(el) => {
            sectionRefs.current.schedule = el;
          }}
          className="gp-section gp-section--alt"
        >
          <div className="gp-section__inner">
            <div className="gp-section__header">
              <span className="gp-section__eyebrow" style={{ color: accent }}>
                Schedule
              </span>
              <h2 className="gp-section__title" style={headingStyle}>
                Program of Events
              </h2>
            </div>
            <div className="gp-schedule">
              {scheduleItems.map((item, i) => (
                <div
                  key={i}
                  className="gp-schedule__item"
                  style={{
                    background: cardBg,
                    borderRadius: `${radius}px`,
                    boxShadow: shadow,
                  }}
                >
                  <div className="gp-schedule__time" style={{ color: accent }}>
                    {item.time}
                  </div>
                  <div className="gp-schedule__body">
                    <h3
                      className="gp-schedule__title"
                      style={{
                        ...headingStyle,
                        color: text,
                        fontSize: '1.125rem',
                      }}
                    >
                      {item.title}
                    </h3>
                    {item.description && (
                      <p
                        className="gp-schedule__desc"
                        style={{ color: text, opacity: 0.7 }}
                      >
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {s?.enable_gallery && galleryImages.length > 0 && (
        <section
          id="gallery"
          ref={(el) => {
            sectionRefs.current.gallery = el;
          }}
          className="gp-section"
        >
          <div className="gp-section__inner">
            <div className="gp-section__header">
              <span className="gp-section__eyebrow" style={{ color: accent }}>
                Gallery
              </span>
              <h2 className="gp-section__title" style={headingStyle}>
                Event Gallery
              </h2>
            </div>
            <div className="gp-gallery">
              {galleryImages.map((img, i) => (
                <div
                  key={i}
                  className="gp-gallery__item"
                  style={{ borderRadius: `${radius}px` }}
                >
                  <img src={img} alt={`Gallery ${i + 1}`} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {event.invitation_enabled && (
        <section
          id="rsvp"
          ref={(el) => {
            sectionRefs.current.rsvp = el;
          }}
          className="gp-section gp-section--alt"
        >
          <div className="gp-section__inner">
            <div className="gp-section__header">
              <span className="gp-section__eyebrow" style={{ color: accent }}>
                RSVP
              </span>
              <h2 className="gp-section__title" style={headingStyle}>
                Respond to Invitation
              </h2>
              <p className="gp-section__desc">
                Search for your name and let us know if you'll be attending.
              </p>
            </div>
            <div
              className="gp-rsvp-cta"
              style={{
                background: cardBg,
                borderRadius: `${radius}px`,
                boxShadow: shadow,
              }}
            >
              <p style={{ color: text, opacity: 0.7 }}>
                Find your name and submit your RSVP response.
              </p>
              <Link
                to={`/invite/${event.slug}`}
                className="gp-rsvp-cta__btn"
                style={buttonStyle}
              >
                Go to RSVP
              </Link>
            </div>
          </div>
        </section>
      )}

      <footer className="gp-footer" style={{ background: footerBg }}>
        <p
          className="gp-footer__text"
          style={{ color: 'rgba(255,255,255,0.7)' }}
        >
          {event.name}
        </p>
        <Link
          to="/"
          className="gp-footer__link"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          Powered by Seatly
        </Link>
      </footer>
    </div>
  );
}
