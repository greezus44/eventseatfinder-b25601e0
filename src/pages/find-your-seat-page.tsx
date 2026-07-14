import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useEventBySlug } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useGuestPageSettingsBySlug } from '@/hooks/use-guest-page-settings';
import { DEFAULT_SETTINGS } from '@/types/guest-page-settings';
import type { GuestPageSettings } from '@/types/guest-page-settings';
import type { GuestWithTable } from '@/types/guest';

type Lang = 'en' | 'ms';
type Tab = 'find' | 'venue';

const TRANSLATIONS: Record<Lang, {
  tabFind: string; tabVenue: string; searchPlaceholder: string;
  noResult: string; tableLabel: string; venueNoImage: string; reset: string;
}> = {
  en: { tabFind: 'FIND SEAT', tabVenue: 'VENUE LAYOUT', searchPlaceholder: 'SEARCH YOUR NAME',
    noResult: 'No guest found. Please check your name.', tableLabel: 'TABLE',
    venueNoImage: 'No venue layout has been uploaded yet.', reset: 'Reset' },
  ms: { tabFind: 'CARI TEMPAT', tabVenue: 'SUSUN ATUR', searchPlaceholder: 'CARI NAMA ANDA',
    noResult: 'Tetamu tidak ditemui. Sila semak nama anda.', tableLabel: 'MEJA',
    venueNoImage: 'Tiada imej susun atur tempat majlis.', reset: 'Reset' },
};

export function FindYourSeatPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: eventData, isLoading: eventLoading } = useGuestPageSettingsBySlug(slug ?? '');
  const { data: allGuests } = useGuests(eventData?.id ?? '');

  const [lang, setLang] = useState<Lang>('en');
  const [activeTab, setActiveTab] = useState<Tab>('find');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<GuestWithTable[]>([]);
  const [searched, setSearched] = useState(false);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const t = TRANSLATIONS[lang];

  // The event data comes from the joined query that includes guest_page_settings
  // This query uses staleTime: 0 so it always fetches fresh data from the DB
  const event = eventData ? {
    id: eventData.id, name: eventData.name, slug: eventData.slug,
    date: eventData.date, time: eventData.time, venue: eventData.venue,
    logo_url: eventData.logo_url, accent_color: eventData.accent_color,
  } : null;

  const settings = eventData?.guest_page_settings ?? null;

  const effectiveSettings = {
    ...(DEFAULT_SETTINGS as GuestPageSettings),
    ...(settings ?? {}),
  } as GuestPageSettings;

  // Apply theme from DB — these come fresh every render due to staleTime: 0
  const accent = event?.accent_color ?? effectiveSettings.color_primary ?? '#1A1A1A';
  const bg = effectiveSettings.color_background ?? '#FAF3E8';
  const logoSize = effectiveSettings.logo_size ?? 64;
  const headingFont = effectiveSettings.font_heading ?? 'Inter';
  const bodyFont = effectiveSettings.font_body ?? 'Inter';

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    if (!value.trim()) { setResults([]); setSearched(false); return; }
    setSearched(true);
    if (!allGuests) return;
    const q = value.trim().toLowerCase();
    setResults(allGuests.filter((g) => g.name.toLowerCase().includes(q)));
  }, [allGuests]);

  useEffect(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, [activeTab]);

  const clampZoom = (z: number) => Math.min(5, Math.max(0.5, z));
  const handleWheel = useCallback((e: React.WheelEvent) => { e.preventDefault(); setZoom((z) => clampZoom(z + (e.deltaY > 0 ? -0.15 : 0.15))); }, []);
  const handleMouseDown = useCallback((e: React.MouseEvent) => { setIsDragging(true); dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }; }, [pan]);
  const handleMouseMove = useCallback((e: React.MouseEvent) => { if (!isDragging) return; setPan({ x: dragStart.current.panX + e.clientX - dragStart.current.x, y: dragStart.current.panY + e.clientY - dragStart.current.y }); }, [isDragging]);
  const handleMouseUp = useCallback(() => setIsDragging(false), []);
  const handleTouchStart = useCallback((e: React.TouchEvent) => { const t0 = e.touches[0]; setIsDragging(true); dragStart.current = { x: t0.clientX, y: t0.clientY, panX: pan.x, panY: pan.y }; }, [pan]);
  const handleTouchMove = useCallback((e: React.TouchEvent) => { if (!isDragging) return; const t0 = e.touches[0]; setPan({ x: dragStart.current.panX + t0.clientX - dragStart.current.x, y: dragStart.current.panY + t0.clientY - dragStart.current.y }); }, [isDragging]);
  const handleTouchEnd = useCallback(() => setIsDragging(false), []);

  const venueImageUrl = effectiveSettings.venue_image_url;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try { const d = new Date(dateStr + 'T00:00:00'); return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase(); }
    catch { return dateStr.toUpperCase(); }
  };
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    try { const [h, m] = timeStr.split(':'); const hour = parseInt(h, 10); const ampm = hour >= 12 ? 'PM' : 'AM'; const h12 = hour % 12 || 12; return `${h12}:${m} ${ampm}`; }
    catch { return timeStr; }
  };

  if (eventLoading) {
    return <div className="gp-loading-screen" style={{ background: bg }}><div className="gp-spinner" style={{ borderTopColor: accent }} /></div>;
  }
  if (!event) {
    return <div className="gp-loading-screen" style={{ background: bg }}><p className="gp-not-found-text" style={{ color: accent }}>EVENT NOT FOUND</p></div>;
  }

  return (
    <div className="gp-root" style={{ '--accent': accent, '--bg': bg, fontFamily: bodyFont } as React.CSSProperties}>
      <div className="gp-lang-switcher">
        <button className={`gp-lang-btn${lang === 'en' ? ' gp-lang-btn--active' : ''}`} onClick={() => setLang('en')}>ENGLISH</button>
        <button className={`gp-lang-btn${lang === 'ms' ? ' gp-lang-btn--active' : ''}`} onClick={() => setLang('ms')}>BAHASA MELAYU</button>
      </div>

      <div className="gp-hero">
        {effectiveSettings.logo_url ? (
          <img className="gp-logo" src={effectiveSettings.logo_url} alt={event.name} style={{ width: `${logoSize}px`, height: `${logoSize}px` }} />
        ) : (
          <div className="gp-monogram" style={{ color: accent, width: `${logoSize}px`, height: `${logoSize}px`, fontSize: `${logoSize / 2}px` }}>{event.name.charAt(0)}</div>
        )}
        <h1 className="gp-event-name" style={{ color: accent, fontFamily: headingFont }}>{event.name.toUpperCase()}</h1>
        {event.date && <p className="gp-event-date" style={{ color: accent }}>{formatDate(event.date)}</p>}
        {event.time && <p className="gp-event-time" style={{ color: accent }}>{formatTime(event.time)}</p>}
        {event.venue && <p className="gp-event-venue" style={{ color: accent }}>{event.venue.toUpperCase()}</p>}
      </div>

      <div className="gp-tabs-wrap">
        <div className="gp-tabs" style={{ borderColor: accent }}>
          <button className={`gp-tab${activeTab === 'find' ? ' gp-tab--active' : ''}`} style={activeTab === 'find' ? { background: accent, color: '#fff', borderColor: accent } : { color: accent, borderColor: 'transparent' }} onClick={() => setActiveTab('find')}>{t.tabFind}</button>
          <div className="gp-tab-divider" style={{ background: accent }} />
          <button className={`gp-tab${activeTab === 'venue' ? ' gp-tab--active' : ''}`} style={activeTab === 'venue' ? { background: accent, color: '#fff', borderColor: accent } : { color: accent, borderColor: 'transparent' }} onClick={() => setActiveTab('venue')}>{t.tabVenue}</button>
        </div>
      </div>

      <div className="gp-content">
        <div className={`gp-tab-panel${activeTab === 'find' ? ' gp-tab-panel--active' : ''}`}>
          <div className="gp-search-wrap">
            <div className="gp-search-box" style={{ borderColor: accent, background: bg }}>
              <svg className="gp-search-icon" style={{ color: accent }} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8.5" cy="8.5" r="5.5" /><path d="M15 15l-3-3" strokeLinecap="round" /></svg>
              <input className="gp-search-input" style={{ color: accent }} placeholder={t.searchPlaceholder} value={searchQuery} onChange={(e) => handleSearch(e.target.value)} autoComplete="off" spellCheck={false} />
            </div>
          </div>
          {searched && (
            <div className="gp-results-wrap">
              {results.length === 0 ? (
                <div className="gp-no-result" style={{ color: accent }}>{t.noResult}</div>
              ) : (
                <div className="gp-results-list" style={{ borderColor: accent }}>
                  {results.map((guest) => (
                    <div key={guest.id} className="gp-result-row" style={{ borderBottomColor: accent }}>
                      <span className="gp-result-name" style={{ color: accent }}>{guest.name.toUpperCase()}</span>
                      <div className="gp-result-badges">
                        {guest.table && <span className="gp-badge" style={{ borderColor: accent, color: accent }}>{`${t.tableLabel} ${guest.table.number}${guest.table.name !== String(guest.table.number) ? ` — ${guest.table.name}` : ''}`.toUpperCase()}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={`gp-tab-panel${activeTab === 'venue' ? ' gp-tab-panel--active' : ''}`}>
          {venueImageUrl ? (
            <div className="gp-venue-wrap">
              <div className={`gp-venue-viewport${isDragging ? ' gp-venue-viewport--dragging' : ''}`} style={{ borderColor: accent }}
                onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                <img src={venueImageUrl} alt="Venue Layout" className="gp-venue-image" draggable={false} style={{ transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})` }} />
              </div>
              <div className="gp-venue-controls">
                <button className="gp-venue-ctrl-btn" style={{ borderColor: accent, color: accent }} onClick={() => setZoom((z) => clampZoom(z + 0.2))}>+</button>
                <button className="gp-venue-ctrl-btn" style={{ borderColor: accent, color: accent }} onClick={() => setZoom((z) => clampZoom(z - 0.2))}>−</button>
                <button className="gp-venue-ctrl-btn gp-venue-ctrl-btn--reset" style={{ borderColor: accent, color: accent }} onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>{t.reset}</button>
                <span className="gp-venue-zoom-pct" style={{ color: accent }}>{Math.round(zoom * 100)}%</span>
              </div>
            </div>
          ) : (
            <div className="gp-venue-empty">
              <div className="gp-venue-empty-icon" style={{ borderColor: accent, color: accent }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" width="40" height="40"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
              </div>
              <p style={{ color: accent }}>{t.venueNoImage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
