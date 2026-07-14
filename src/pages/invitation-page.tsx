import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useGuestPageSettingsBySlug } from '@/hooks/use-guest-page-settings'
import { supabase } from '@/lib/supabase'
import { loadGoogleFonts, getFontCss, formatTime12 } from '@/lib/fonts'
import { searchGuests, type GuestSearchResult } from '@/lib/search'

type Lang = 'en' | 'ms'
type GuestTab = 'find' | 'layout'

interface GuestWithTable {
  id: string
  name: string
  table_id: string | null
  tables: { name: string; number: number }[] | null
}

const T = {
  en: {
    findSeat: 'Find Seat',
    venueLayout: 'Venue Layout',
    searchPlaceholder: 'SEARCH YOUR NAME',
    loading: 'Loading guests\u2026',
    noGuests: 'No matching guests found',
    thisIsYourTable: 'This Is Your Table',
    searchAgain: '\u2190 Search again',
    noVenueLayout: 'No venue layout available.',
    eventNotFound: 'Event not found',
    english: 'English',
    bahasaMelayu: 'Bahasa Melayu',
  },
  ms: {
    findSeat: 'Cari Tempat Duduk',
    venueLayout: 'Pelan Tempat Majlis',
    searchPlaceholder: 'CARI NAMA ANDA',
    loading: 'Memuatkan tetamu\u2026',
    noGuests: 'Tiada tetamu yang sepadan',
    thisIsYourTable: 'Ini Meja Anda',
    searchAgain: '\u2190 Cari semula',
    noVenueLayout: 'Tiada pelan tempat duduk tersedia.',
    eventNotFound: 'Majlis tidak dijumpai',
    english: 'English',
    bahasaMelayu: 'Bahasa Melayu',
  },
} as const

export function InvitationPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data, isLoading } = useGuestPageSettingsBySlug(slug ?? '')
  const [lang, setLang] = useState<Lang>('en')
  const [activeTab, setActiveTab] = useState<GuestTab>('find')
  const [findView, setFindView] = useState<'search' | 'table'>('search')
  const [selectedGuest, setSelectedGuest] = useState<GuestSearchResult | null>(null)
  const [searchText, setSearchText] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchWrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [loadingGuests, setLoadingGuests] = useState(false)
  const [guestsData, setGuestsData] = useState<GuestWithTable[]>([])
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const t = T[lang]
  const settings = data
  const event = data?.events

  const titleFont = settings?.font_title_family ?? 'Inter'
  const subtitleFont = settings?.font_subtitle_family ?? 'Inter'
  const datetimeFont = settings?.font_datetime_family ?? 'Inter'
  const venueFont = settings?.font_venue_family ?? 'Inter'
  const welcomeFont = settings?.font_welcome_family ?? 'Inter'
  useEffect(() => { loadGoogleFonts([titleFont, subtitleFont, datetimeFont, venueFont, welcomeFont]) }, [titleFont, subtitleFont, datetimeFont, venueFont, welcomeFont])

  useEffect(() => {
    if (!data?.event_id) return
    let cancelled = false
    setLoadingGuests(true)
    supabase
      .from('guests')
      .select('id, name, table_id, tables(name, number)')
      .eq('event_id', data.event_id)
      .order('name', { ascending: true })
      .then(({ data: guests, error }) => {
        if (cancelled) return
        if (error) { console.error('Failed to load guests:', error); setGuestsData([]) }
        else setGuestsData((guests ?? []) as unknown as GuestWithTable[])
        setLoadingGuests(false)
      })
    return () => { cancelled = true }
  }, [data?.event_id])

  const filteredResults = useMemo(() => {
    if (!searchText.trim()) return []
    return searchGuests(guestsData, searchText, 50)
  }, [guestsData, searchText])

  useEffect(() => { setHighlightIndex(-1) }, [searchText])

  useEffect(() => {
    if (activeTab === 'find' && findView === 'search') setTimeout(() => inputRef.current?.focus(), 100)
  }, [activeTab, findView])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value); setShowDropdown(true)
  }
  const handleSelectGuest = (result: GuestSearchResult) => {
    setSelectedGuest(result); setFindView('table'); setShowDropdown(false)
  }
  const handleBackToSearch = () => {
    setFindView('search'); setSelectedGuest(null); setSearchText('')
    setTimeout(() => inputRef.current?.focus(), 100)
  }
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setShowDropdown(true); setHighlightIndex((prev) => Math.min(prev + 1, filteredResults.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIndex((prev) => Math.max(prev - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (highlightIndex >= 0 && highlightIndex < filteredResults.length) handleSelectGuest(filteredResults[highlightIndex]) }
    else if (e.key === 'Escape') setShowDropdown(false)
  }
  useEffect(() => {
    if (!showDropdown) return
    const handler = (e: MouseEvent) => { if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) setShowDropdown(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showDropdown])

  if (isLoading) return <div className="gp-loading"><div className="spinner spinner-lg" /></div>
  if (!settings || !event) return <div className="gp-loading"><p>{t.eventNotFound}</p></div>

  const primary = settings.color_primary ?? '#0f766e'
  const bg = settings.color_background ?? '#f8fafc'
  const text = settings.color_text ?? '#0f172a'
  const radius = `${settings.border_radius ?? 16}px`
  const logoSize = settings.logo_size ?? 80
  const logoRounded = settings.logo_rounded ?? false
  const subtitle = settings.event_subtitle
  const logoUrl = settings.logo_url
  const venueImageUrl = settings.venue_image_url

  const formatDate = () => {
    if (!event.date) return ''
    return new Date(event.date).toLocaleDateString(lang === 'ms' ? 'ms-MY' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div className="gp-page" style={{ background: bg, color: text, position: 'relative' }}>
      {/* Language switcher — top-right corner */}
      <div
        className="gp-lang-switcher"
        style={{ borderColor: primary }}
      >
        <button
          className="gp-lang-btn"
          onClick={() => setLang('en')}
          style={
            lang === 'en'
              ? { background: primary, color: '#fff' }
              : { background: bg, color: primary }
          }
        >
          {t.english}
        </button>
        <button
          className="gp-lang-btn"
          onClick={() => setLang('ms')}
          style={
            lang === 'ms'
              ? { background: primary, color: '#fff' }
              : { background: bg, color: primary }
          }
        >
          {t.bahasaMelayu}
        </button>
      </div>

      <div className="gp-container">
        {logoUrl && (
          <div className="gp-logo-wrapper">
            <img
              src={logoUrl}
              alt="Event logo"
              className="gp-logo"
              style={{ width: `${Math.min(logoSize, 500)}px`, maxWidth: '100%', height: 'auto', borderRadius: logoRounded ? '50%' : '0' }}
            />
          </div>
        )}
        <h1
          className="gp-title"
          style={{ fontFamily: getFontCss(titleFont), fontSize: `${settings.font_title_size ?? 32}px`, color: settings.font_title_color ?? text }}
        >
          {event.name}
        </h1>
        {subtitle && subtitle.trim() && (
          <p
            className="gp-subtitle"
            style={{ fontFamily: getFontCss(subtitleFont), fontSize: `${settings.font_subtitle_size ?? 16}px`, color: settings.font_subtitle_color ?? text }}
          >
            {subtitle}
          </p>
        )}
        {event.date && (
          <p
            className="gp-datetime"
            style={{ fontFamily: getFontCss(datetimeFont), fontSize: `${settings.font_datetime_size ?? 14}px`, color: settings.font_datetime_color ?? text }}
          >
            {formatDate()}
          </p>
        )}
        {event.time && (
          <p
            className="gp-datetime"
            style={{ fontFamily: getFontCss(datetimeFont), fontSize: `${settings.font_datetime_size ?? 14}px`, color: settings.font_datetime_color ?? text }}
          >
            {formatTime12(event.time)}
          </p>
        )}
        {event.venue && (
          <p
            className="gp-venue"
            style={{ fontFamily: getFontCss(venueFont), fontSize: `${settings.font_venue_size ?? 14}px`, color: settings.font_venue_color ?? text }}
          >
            {event.venue}
          </p>
        )}

        {/* Tab switcher */}
        <div className="gp-segmented" style={{ borderRadius: radius, border: `1px solid ${primary}` }}>
          <button
            className={`gp-segment ${activeTab === 'find' ? 'active' : ''}`}
            onClick={() => setActiveTab('find')}
            style={activeTab === 'find' ? { background: primary, color: '#fff' } : { background: bg, color: primary }}
          >
            {t.findSeat}
          </button>
          <button
            className={`gp-segment ${activeTab === 'layout' ? 'active' : ''}`}
            onClick={() => setActiveTab('layout')}
            style={activeTab === 'layout' ? { background: primary, color: '#fff' } : { background: bg, color: primary }}
          >
            {t.venueLayout}
          </button>
        </div>

        {activeTab === 'find' && (
          <div className="gp-find-seat">
            {findView === 'search' && (
              <div className="gp-search-section">
                <div className="gp-autocomplete-wrapper" ref={searchWrapperRef}>
                  <input
                    ref={inputRef}
                    type="text"
                    className="gp-autocomplete-input"
                    placeholder={t.searchPlaceholder}
                    value={searchText}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => { if (searchText.trim()) setShowDropdown(true) }}
                    autoComplete="off"
                    style={{ background: bg, borderColor: primary, color: text, borderRadius: radius }}
                  />
                  {showDropdown && searchText.trim() && (
                    <div className="gp-autocomplete-dropdown" style={{ background: bg, borderColor: primary, borderRadius: radius }}>
                      {loadingGuests ? (
                        <div className="gp-autocomplete-empty">{t.loading}</div>
                      ) : filteredResults.length === 0 ? (
                        <div className="gp-autocomplete-empty">{t.noGuests}</div>
                      ) : (
                        filteredResults.map((g, i) => (
                          <button
                            key={g.id}
                            className={`gp-autocomplete-item ${i === highlightIndex ? 'highlighted' : ''}`}
                            onClick={() => handleSelectGuest(g)}
                            style={{ background: i === highlightIndex ? `${primary}15` : 'transparent' }}
                          >
                            <span className="gp-autocomplete-name" style={{ color: text }}>{g.name}</span>
                            <span className="gp-table-badge" style={{ background: bg, borderColor: primary, color: primary, borderRadius: '11px' }}>{g.table_name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            {findView === 'table' && selectedGuest && (
              <div className="gp-table-info">
                <h2 className="gp-table-info-title" style={{ color: text }}>{t.thisIsYourTable}</h2>
                <div className="gp-table-info-card" style={{ background: bg, borderColor: primary, borderRadius: radius }}>
                  <div className="gp-table-info-left">
                    <p className="gp-table-info-name" style={{ color: text, fontSize: '22.5px' }}>{selectedGuest.name}</p>
                  </div>
                  <div className="gp-table-info-right">
                    <span className="gp-table-info-badge" style={{ background: bg, borderColor: primary, color: primary, borderRadius: radius, fontSize: '18px' }}>
                      {selectedGuest.table_name}
                    </span>
                  </div>
                </div>
                <button
                  className="btn btn-ghost gp-back-btn"
                  onClick={handleBackToSearch}
                  style={{ borderColor: primary, color: primary, borderRadius: radius }}
                >
                  {t.searchAgain}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'layout' && (
          <div className="gp-layout-section">
            {venueImageUrl ? (
              <div
                className="gp-layout-viewport"
                style={{ borderColor: primary, borderRadius: radius }}
                onClick={() => setLightboxOpen(true)}
              >
                <img src={venueImageUrl} alt="Venue layout" className="gp-venue-img" style={{ borderRadius: radius }} draggable={false} />
              </div>
            ) : (
              <div className="gp-no-layout" style={{ color: text }}>
                <p>{t.noVenueLayout}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {lightboxOpen && venueImageUrl && (
        <VenueLightbox src={venueImageUrl} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  )
}

function VenueLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [closing, setClosing] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const pinchStart = useRef({ dist: 0, zoom: 1 })
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClose = useCallback(() => { setClosing(true); setTimeout(onClose, 200) }, [onClose])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [handleClose])
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = '' } }, [])

  const clampZoom = (z: number) => Math.max(1, Math.min(z, 8))
  const handleWheel = (e: React.WheelEvent) => { e.preventDefault(); setZoom((prev) => clampZoom(prev + (-e.deltaY * 0.001) * prev)) }
  const handleDoubleClick = () => { setZoom((prev) => prev >= 2 ? 1 : 2); if (zoom < 2) { setPanX(0); setPanY(0) } }
  const handleMouseDown = (e: React.MouseEvent) => { if (zoom <= 1) return; setIsDragging(true); dragStart.current = { x: e.clientX, y: e.clientY, panX, panY } }
  const handleMouseMove = useCallback((e: React.MouseEvent) => { if (!isDragging) return; setPanX(dragStart.current.panX + (e.clientX - dragStart.current.x)); setPanY(dragStart.current.panY + (e.clientY - dragStart.current.y)) }, [isDragging])
  const handleMouseUp = () => setIsDragging(false)
  const handleBackdropClick = (e: React.MouseEvent) => { if (e.target === e.currentTarget) handleClose() }
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) { const dx = e.touches[0].clientX - e.touches[1].clientX; const dy = e.touches[0].clientY - e.touches[1].clientY; pinchStart.current = { dist: Math.sqrt(dx * dx + dy * dy), zoom }; setIsDragging(false) }
    else if (e.touches.length === 1 && zoom > 1) { setIsDragging(true); dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, panX, panY } }
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) { e.preventDefault(); const dx = e.touches[0].clientX - e.touches[1].clientX; const dy = e.touches[0].clientY - e.touches[1].clientY; const dist = Math.sqrt(dx * dx + dy * dy); if (pinchStart.current.dist > 0) setZoom(clampZoom(pinchStart.current.zoom * (dist / pinchStart.current.dist))) }
    else if (e.touches.length === 1 && isDragging) { e.preventDefault(); setPanX(dragStart.current.panX + (e.touches[0].clientX - dragStart.current.x)); setPanY(dragStart.current.panY + (e.touches[0].clientY - dragStart.current.y)) }
  }
  const handleTouchEnd = () => setIsDragging(false)

  return (
    <div className={`lightbox-overlay ${closing ? 'lightbox-closing' : ''}`} onClick={handleBackdropClick} style={{ touchAction: 'none' }}>
      <button className="lightbox-close" onClick={handleClose} aria-label="Close">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <div
        className="lightbox-content"
        ref={containerRef}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default' }}
      >
        <img
          src={src}
          alt="Venue layout"
          className="lightbox-img"
          style={{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})`, transformOrigin: 'center', transition: isDragging ? 'none' : 'transform 0.15s ease-out' }}
          draggable={false}
        />
      </div>
    </div>
  )
}
