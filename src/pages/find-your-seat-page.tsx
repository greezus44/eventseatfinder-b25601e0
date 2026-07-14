import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useEventBySlug } from '@/hooks/use-events';
import { useGuestSearch } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { useGuestPageSettingsBySlug } from '@/hooks/use-guest-page-settings';
import type { GuestPageSettings } from '@/types/guest-page-settings';
import type { GuestWithTable } from '@/types/guest';

type Tab = 'find-seat' | 'venue-layout';

export function FindYourSeatPage() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const eventQuery = useEventBySlug(eventSlug ?? '');
  const settingsQuery = useGuestPageSettingsBySlug(eventSlug ?? '');
  const tablesQuery = useTables(eventQuery.data?.id ?? '');

  const event = eventQuery.data;
  const settings = settingsQuery.data;
  const tables = tablesQuery.data ?? [];

  const [tab, setTab] = useState<Tab>('find-seat');
  const [query, setQuery] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<GuestWithTable | null>(
    null,
  );
  const [activeIndex, setActiveIndex] = useState(-1);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const searchQuery = useGuestSearch(
    eventQuery.data?.id ?? '',
    query.length >= 2 ? query : '',
  );

  const suggestions = searchQuery.data ?? [];

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  useEffect(() => {
    if (settings) {
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
    }
  }, [settings]);

  const themeVars = useMemo(() => {
    if (!settings) return {} as React.CSSProperties;
    return {
      '--gp-primary': settings.color_primary,
      '--gp-background': settings.color_background,
      '--gp-card': settings.color_card,
      '--gp-button': settings.color_button,
      '--gp-button-text': settings.color_button_text,
      '--gp-header': settings.color_header,
      '--gp-text': settings.color_text,
      '--gp-link': settings.color_link,
      '--gp-radius': `${settings.border_radius}px`,
      fontFamily: settings.font_body,
      fontSize: `${settings.font_body_size}px`,
      color: settings.color_text,
      lineHeight: settings.font_body_line_height,
      letterSpacing: `${settings.font_body_spacing}px`,
    } as React.CSSProperties;
  }, [settings]);

  const shadowValue = (level: string) => {
    switch (level) {
      case 'none':
        return 'none';
      case 'sm':
        return '0 1px 2px rgba(0,0,0,0.05)';
      case 'lg':
        return '0 12px 32px rgba(0,0,0,0.12)';
      default:
        return '0 4px 12px rgba(0,0,0,0.08)';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      setSelectedGuest(suggestions[activeIndex]);
      setQuery('');
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
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
      <div className="fys-loading">
        <span
          className="spinner"
          style={{ width: 32, height: 32, borderWidth: 3 }}
        />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="fys-container">
        <div className="fys-card fys-card--error">
          <h1>Event Not Found</h1>
          <p>The event you're looking for doesn't exist or has ended.</p>
        </div>
      </div>
    );
  }

  const s = settings as GuestPageSettings | null;
  const bgStyle: React.CSSProperties = s?.background_image
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,${(s.background_overlay_opacity ?? 0) / 100}), rgba(0,0,0,${(s.background_overlay_opacity ?? 0) / 100})), url(${s.background_image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : { background: s?.color_background ?? 'var(--primary-50)' };

  const cardShadow = s
    ? shadowValue(s.card_shadow)
    : '0 4px 12px rgba(0,0,0,0.08)';

  const logoStyle: React.CSSProperties = s?.logo_url
    ? {
        height: `${s.logo_size}px`,
        borderRadius: s.logo_rounded ? '50%' : '8px',
      }
    : {};

  const headerStyle: React.CSSProperties = {
    fontFamily: s?.font_heading ?? 'Inter',
    fontSize: `${s?.font_heading_size ?? 48}px`,
    fontWeight: s?.font_heading_weight ?? 700,
    color: s?.color_header ?? '#0f172a',
    letterSpacing: `${s?.font_heading_spacing ?? 0}px`,
    lineHeight: s?.font_heading_line_height ?? 1.2,
  };

  const buttonStyle: React.CSSProperties = s
    ? {
        fontFamily: s.font_button,
        borderRadius:
          s.button_style === 'rounded' ? '9999px' : `${s.border_radius}px`,
        ...(s.button_style === 'outlined'
          ? {
              background: 'transparent',
              border: `2px solid ${s.color_button}`,
              color: s.color_button,
            }
          : {
              background: s.color_button,
              color: s.color_button_text,
              border: 'none',
            }),
      }
    : {};

  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="gp-guest-page" style={{ ...themeVars, ...bgStyle }}>
      <div className="gp-guest-page__inner">
        {s?.logo_url && (
          <div
            className="gp-guest-page__logo"
            style={{
              textAlign:
                s.logo_position === 'left'
                  ? 'left'
                  : s.logo_position === 'right'
                    ? 'right'
                    : 'center',
            }}
          >
            <img src={s.logo_url} alt="Event logo" style={logoStyle} />
          </div>
        )}

        <div className="gp-guest-page__header" style={{ textAlign: 'center' }}>
          {event.venue && (
            <p
              className="gp-guest-page__venue"
              style={{ color: s?.color_primary ?? 'var(--primary)' }}
            >
              {event.venue}
            </p>
          )}
          <h1 className="gp-guest-page__title" style={headerStyle}>
            {event.name}
          </h1>
          {formattedDate && (
            <p
              className="gp-guest-page__date"
              style={{ color: s?.color_text ?? 'var(--text-secondary)' }}
            >
              {formattedDate}
            </p>
          )}
        </div>

        <div
          className="gp-guest-page__card"
          style={{
            background: s?.color_card ?? '#ffffff',
            borderRadius: `${s?.border_radius ?? 16}px`,
            boxShadow: cardShadow,
          }}
        >
          <div className="gp-tabs">
            <button
              className={`gp-tab ${tab === 'find-seat' ? 'gp-tab--active' : ''}`}
              style={
                tab === 'find-seat'
                  ? {
                      background: s?.color_primary ?? 'var(--primary)',
                      color: s?.color_button_text ?? '#ffffff',
                    }
                  : { color: s?.color_text ?? 'var(--text)' }
              }
              onClick={() => setTab('find-seat')}
            >
              Find Seat
            </button>
            <button
              className={`gp-tab ${tab === 'venue-layout' ? 'gp-tab--active' : ''}`}
              style={
                tab === 'venue-layout'
                  ? {
                      background: s?.color_primary ?? 'var(--primary)',
                      color: s?.color_button_text ?? '#ffffff',
                    }
                  : { color: s?.color_text ?? 'var(--text)' }
              }
              onClick={() => setTab('venue-layout')}
            >
              Venue Layout
            </button>
          </div>

          {tab === 'find-seat' && (
            <div className="gp-tab-content">
              {!selectedGuest ? (
                <div className="gp-find-seat">
                  <p
                    className="gp-find-seat__prompt"
                    style={{ color: s?.color_text ?? 'var(--text-secondary)' }}
                  >
                    Search for your name to find your assigned seat
                  </p>
                  <div className="gp-find-seat__search-wrap">
                    <input
                      type="text"
                      className="gp-find-seat__input"
                      style={{
                        borderColor: s?.color_primary ?? 'var(--border)',
                        borderRadius: `${s?.border_radius ?? 16}px`,
                      }}
                      placeholder="Type your name..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    {searchQuery.isFetching && (
                      <span className="gp-find-seat__spinner">
                        <span
                          className="spinner"
                          style={{ width: 20, height: 20, borderWidth: 2 }}
                        />
                      </span>
                    )}
                  </div>
                  {suggestions.length > 0 && (
                    <ul className="gp-find-seat__suggestions">
                      {suggestions.map((g, i) => (
                        <li
                          key={g.id}
                          className={`gp-find-seat__suggestion ${i === activeIndex ? 'gp-find-seat__suggestion--active' : ''}`}
                          style={
                            i === activeIndex
                              ? {
                                  background:
                                    s?.color_primary ?? 'var(--primary-50)',
                                }
                              : {}
                          }
                          onClick={() => {
                            setSelectedGuest(g);
                            setQuery('');
                          }}
                        >
                          <span
                            className="gp-find-seat__suggestion__name"
                            style={{ color: s?.color_text ?? 'var(--text)' }}
                          >
                            {g.name}
                          </span>
                          {g.table ? (
                            <span
                              className="gp-find-seat__suggestion__table"
                              style={{
                                background:
                                  s?.color_primary ?? 'var(--primary)',
                                color: s?.color_button_text ?? '#fff',
                              }}
                            >
                              Table {g.table.number}
                            </span>
                          ) : (
                            <span className="gp-find-seat__suggestion__table gp-find-seat__suggestion__table--unassigned">
                              Unassigned
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {query.length >= 2 &&
                    !searchQuery.isFetching &&
                    suggestions.length === 0 && (
                      <div
                        className="gp-find-seat__no-results"
                        style={{
                          color: s?.color_text ?? 'var(--text-secondary)',
                        }}
                      >
                        <p>No guests found matching "{query}".</p>
                        <p>
                          Check with the event organizer if you don't see your
                          name.
                        </p>
                      </div>
                    )}
                </div>
              ) : (
                <div className="gp-find-seat__result">
                  <p
                    className="gp-find-seat__result__greeting"
                    style={{ color: s?.color_primary ?? 'var(--primary)' }}
                  >
                    Your Seat
                  </p>
                  <p
                    className="gp-find-seat__result__name"
                    style={{
                      color: s?.color_text ?? 'var(--text)',
                      fontFamily: s?.font_heading ?? 'Inter',
                    }}
                  >
                    {selectedGuest.name}
                  </p>
                  {selectedGuest.table ? (
                    <div
                      className="gp-find-seat__table-card"
                      style={{
                        background: s?.color_primary ?? 'var(--primary-50)',
                        borderColor: s?.color_primary ?? 'var(--primary-100)',
                        borderRadius: `${s?.border_radius ?? 16}px`,
                      }}
                    >
                      <span
                        className="gp-find-seat__table-card__label"
                        style={{ color: s?.color_primary ?? 'var(--primary)' }}
                      >
                        Table Number
                      </span>
                      <span
                        className="gp-find-seat__table-card__number"
                        style={{ color: s?.color_primary ?? 'var(--primary)' }}
                      >
                        {selectedGuest.table.number}
                      </span>
                      <span
                        className="gp-find-seat__table-card__name"
                        style={{
                          color: s?.color_text ?? 'var(--text-secondary)',
                        }}
                      >
                        {selectedGuest.table.name}
                      </span>
                    </div>
                  ) : (
                    <div
                      className="gp-find-seat__table-card gp-find-seat__table-card--unassigned"
                      style={{ borderRadius: `${s?.border_radius ?? 16}px` }}
                    >
                      <span className="gp-find-seat__table-card__label">
                        Not Yet Assigned
                      </span>
                      <span className="gp-find-seat__table-card__name">
                        Please see the event organizer for your seat.
                      </span>
                    </div>
                  )}
                  <button
                    className="gp-find-seat__back-btn"
                    style={buttonStyle}
                    onClick={() => setSelectedGuest(null)}
                  >
                    Search Again
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'venue-layout' && (
            <div className="gp-tab-content">
              <div className="gp-venue-layout">
                <div className="gp-venue-layout__controls">
                  <button
                    className="gp-venue-layout__btn"
                    style={{
                      borderColor: s?.color_primary ?? 'var(--border)',
                      color: s?.color_primary ?? 'var(--primary)',
                    }}
                    onClick={() => setZoom((z) => Math.min(z + 0.2, 3))}
                  >
                    Zoom +
                  </button>
                  <button
                    className="gp-venue-layout__btn"
                    style={{
                      borderColor: s?.color_primary ?? 'var(--border)',
                      color: s?.color_primary ?? 'var(--primary)',
                    }}
                    onClick={() => setZoom((z) => Math.max(z - 0.2, 0.3))}
                  >
                    Zoom −
                  </button>
                  <button
                    className="gp-venue-layout__btn"
                    style={{
                      borderColor: s?.color_primary ?? 'var(--border)',
                      color: s?.color_primary ?? 'var(--primary)',
                    }}
                    onClick={() => {
                      setZoom(1);
                      setPan({ x: 0, y: 0 });
                    }}
                  >
                    Reset
                  </button>
                </div>
                <div
                  className="gp-venue-layout__canvas"
                  onMouseDown={handleMouseDown}
                >
                  {s?.venue_image_url ? (
                    <img
                      src={s.venue_image_url}
                      alt="Venue layout"
                      className="gp-venue-layout__image"
                      style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                      }}
                      draggable={false}
                    />
                  ) : (
                    <div
                      className="gp-venue-layout__tables"
                      style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                      }}
                    >
                      {tables.length === 0 ? (
                        <p
                          className="gp-venue-layout__empty"
                          style={{
                            color: s?.color_text ?? 'var(--text-muted)',
                          }}
                        >
                          No venue layout available.
                        </p>
                      ) : (
                        tables.map((t) => (
                          <div
                            key={t.id}
                            className="gp-venue-layout__table"
                            style={{
                              left: `${t.position_x ?? 50}px`,
                              top: `${t.position_y ?? 50}px`,
                              borderColor: s?.color_primary ?? 'var(--border)',
                              borderRadius: `${s?.border_radius ?? 16}px`,
                              background: s?.color_card ?? '#fff',
                              color: s?.color_text ?? 'var(--text)',
                            }}
                          >
                            <span
                              className="gp-venue-layout__table__number"
                              style={{
                                color: s?.color_primary ?? 'var(--primary)',
                              }}
                            >
                              #{t.number}
                            </span>
                            <span className="gp-venue-layout__table__name">
                              {t.name}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <p
                  className="gp-venue-layout__hint"
                  style={{ color: s?.color_text ?? 'var(--text-muted)' }}
                >
                  Drag to pan · Use zoom buttons to adjust
                </p>
              </div>
            </div>
          )}
        </div>

        <p
          className="gp-guest-page__footer"
          style={{ color: s?.color_link ?? 'var(--primary)' }}
        >
          Powered by Seatly
        </p>
      </div>
    </div>
  );
}
