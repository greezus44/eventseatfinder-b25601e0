import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useGuestPageSettingsBySlug } from '@/hooks/use-guest-page-settings'
import { supabase } from '@/lib/supabase'
import { loadGoogleFonts, getFontCss, formatTime12 } from '@/lib/fonts'
import { searchGuests, type GuestSearchResult } from '@/lib/search'

type GuestTab = 'find' | 'layout'
type FindView = 'search' | 'table'

interface GuestWithTable {
  id: string
  name: string
  table_id: string | null
  tables: { name: string; number: number }[] | null
}

export function InvitationPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data, isLoading } = useGuestPageSettingsBySlug(slug ?? '')

  const [activeTab, setActiveTab] = useState<GuestTab>('find')
  const [findView, setFindView] = useState<FindView>('search')
  const [selectedGuest, setSelectedGuest] = useState<GuestSearchResult | null>(null)

  // Autocomplete search state
  const [searchText, setSearchText] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchWrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [loadingGuests, setLoadingGuests] = useState(false)
  const [guestsData, setGuestsData] = useState<GuestWithTable[]>([])

  // Zoom/pan for layout
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })

  const settings = data
  const event = data?.events

  const titleFont = settings?.font_title_family ?? 'Inter'
  const subtitleFont = settings?.font_subtitle_family ?? 'Inter'
  const datetimeFont = settings?.font_datetime_family ?? 'Inter'
  const venueFont = settings?.font_venue_family ?? 'Inter'
  const welcomeFont = settings?.font_welcome_family ?? 'Inter'

  useEffect(() => { loadGoogleFonts([titleFont, subtitleFont, datetimeFont, venueFont, welcomeFont]) }, [titleFont, subtitleFont, datetimeFont, venueFont, welcomeFont])

  // Fetch all guests once
  useEffect(() => {
    if (!data?.event_id) return
    let cancelled = false
    setLoadingGuests(true)
    supabase.from('guests').select('id, name, table_id, tables(name, number)').eq('event_id', data.event_id).order('name', { ascending: true }).then(({ data: guests, error }) => {
      if (cancelled) return
      if (error) { console.error('Failed to load guests:', error); setGuestsData([]) }
      else setGuestsData((guests ?? []) as unknown as GuestWithTable[])
      setLoadingGuests(false)
    })
    return () => { cancelled = true }
  }, [data?.event_id])

  // Filtered results — live as user types
  const filteredResults = useMemo(() => {
    if (!searchText.trim()) return []
    return searchGuests(guestsData, searchText, 50)
  }, [guestsData, searchText])

  // Reset highlight when search changes
  useEffect(() => { setHighlightIndex(-1) }, [searchText])

  // Auto-focus the input when the find tab is active and in search view
  useEffect(() => {
    if (activeTab === 'find' && findView === 'search') {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [activeTab, findView])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value)
    setShowDropdown(true)
  }

  const handleSelectGuest = (result: GuestSearchResult) => {
    setSelectedGuest(result)
    setFindView('table')
    setShowDropdown(false)
  }

  const handleBackToSearch = () => {
    setFindView('search')
    setSelectedGuest(null)
    setSearchText('')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setShowDropdown(true)
      setHighlightIndex((prev) => Math.min(prev + 1, filteredResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightIndex >= 0 && highlightIndex < filteredResults.length) {
        handleSelectGuest(filteredResults[highlightIndex])
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  // Click outside to close dropdown
  useEffect(() => {
    if (!showDropdown) return
    const handler = (e: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showDropdown])

  // Zoom/pan
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 4))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5))
  const handleZoomReset = () => { setZoom(1); setPanX(0); setPanY(0) }
  const handleMouseDown = (e: React.MouseEvent) => { if (zoom === 1) return; setIsDragging(true); dragStart.current = { x: e.clientX, y: e.clientY, panX, panY } }
  const handleMouseMove = useCallback((e: React.MouseEvent) => { if (!isDragging) return; setPanX(dragStart.current.panX + (e.clientX - dragStart.current.x)); setPanY(dragStart.current.panY + (e.clientY - dragStart.current.y)) }, [isDragging])
  const handleMouseUp = () => setIsDragging(false)

  if (isLoading) return <div className="gp-loading"><div className="spinner spinner-lg" /></div>
  if (!settings || !event) return <div className="gp-loading"><p>Event not found</p></div>

  const primary = settings.color_primary ?? '#0f766e'
  const bg = settings.color_background ?? '#f8fafc'
  const text = settings.color_text ?? '#0f172a'
  const cardBg = settings.color_card ?? '#ffffff'
  const radius = `${settings.border_radius ?? 16}px`
  const logoSize = settings.logo_size ?? 80
  const logoRounded = settings.logo_rounded ?? false
  const subtitle = settings.event_subtitle

  const formatDate = () => { if (!event.date) return ''; return new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }

  return (
    <div className="gp-page" style={{ background: bg, color: text }}>
      <div className="gp-container">
        {settings.logo_url && (
          <div className="gp-logo-wrapper">
            <img src={settings.logo_url} alt="Event logo" className="gp-logo" style={{ width: `${Math.min(logoSize, 500)}px`, height: 'auto', borderRadius: logoRounded ? '50%' : '0' }} />
          </div>
        )}
        <h1 className="gp-title" style={{ fontFamily: getFontCss(titleFont), fontSize: `${settings.font_title_size ?? 32}px`, color: settings.font_title_color ?? text }}>{event.name}</h1>
        {subtitle && subtitle.trim() && (
          <p className="gp-subtitle" style={{ fontFamily: getFontCss(subtitleFont), fontSize: `${settings.font_subtitle_size ?? 16}px`, color: settings.font_subtitle_color ?? text }}>{subtitle}</p>
        )}
        {event.date && <p className="gp-datetime" style={{ fontFamily: getFontCss(datetimeFont), fontSize: `${settings.font_datetime_size ?? 14}px`, color: settings.font_datetime_color ?? text }}>{formatDate()}</p>}
        {event.time && <p className="gp-datetime" style={{ fontFamily: getFontCss(datetimeFont), fontSize: `${settings.font_datetime_size ?? 14}px`, color: settings.font_datetime_color ?? text }}>{formatTime12(event.time)}</p>}
        {event.venue && <p className="gp-venue" style={{ fontFamily: getFontCss(venueFont), fontSize: `${settings.font_venue_size ?? 14}px`, color: settings.font_venue_color ?? text }}>{event.venue}</p>}

        {/* Segmented control */}
        <div className="gp-segmented" style={{ borderRadius: radius, border: `1px solid ${primary}` }}>
          <button className={`gp-segment ${activeTab === 'find' ? 'active' : ''}`} onClick={() => setActiveTab('find')} style={activeTab === 'find' ? { background: primary, color: '#fff' } : { background: bg, color: primary }}>Find Seat</button>
          <button className={`gp-segment ${activeTab === 'layout' ? 'active' : ''}`} onClick={() => setActiveTab('layout')} style={activeTab === 'layout' ? { background: primary, color: '#fff' } : { background: bg, color: primary }}>Venue Layout</button>
        </div>

        {activeTab === 'find' && (
          <div className="gp-find-seat">
            {findView === 'search' && (
              <div className="gp-search-section">
                {/* No heading above the search box — only the placeholder */}
                <div className="gp-autocomplete-wrapper" ref={searchWrapperRef}>
                  <input
                    ref={inputRef}
                    type="text"
                    className="gp-autocomplete-input"
                    placeholder="SEARCH YOUR NAME"
                    value={searchText}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => { if (searchText.trim()) setShowDropdown(true) }}
                    autoComplete="off"
                    style={{ background: bg, borderColor: primary, color: text, borderRadius: radius }}
                  />
                  {/* Live dropdown */}
                  {showDropdown && searchText.trim() && (
                    <div className="gp-autocomplete-dropdown" style={{ background: bg, borderColor: primary, borderRadius: radius }}>
                      {loadingGuests ? (
                        <div className="gp-autocomplete-empty">Loading guests…</div>
                      ) : filteredResults.length === 0 ? (
                        <div className="gp-autocomplete-empty">No matching guests found</div>
                      ) : (
                        filteredResults.map((g, i) => (
                          <button
                            key={g.id}
                            className={`gp-autocomplete-item ${i === highlightIndex ? 'highlighted' : ''}`}
                            onClick={() => handleSelectGuest(g)}
                            style={{ background: i === highlightIndex ? `${primary}15` : 'transparent' }}
                          >
                            <span className="gp-autocomplete-name" style={{ color: text }}>{g.name}</span>
                            <span className="gp-table-badge" style={{
                              background: bg,
                              borderColor: primary,
                              color: primary,
                              borderRadius: '11px',
                            }}>
                              {g.table_name}
                            </span>
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
                <h2 className="gp-table-info-title" style={{ color: text }}>This Is Your Table</h2>
                <div className="gp-table-info-card" style={{ background: cardBg, borderColor: primary, borderRadius: radius }}>
                  <div className="gp-table-info-left">
                    <p className="gp-table-info-name" style={{ color: text }}>{selectedGuest.name}</p>
                  </div>
                  <div className="gp-table-info-right">
                    <span className="gp-table-info-badge" style={{ background: primary, color: '#fff', borderRadius: radius }}>
                      {selectedGuest.table_name}
                    </span>
                  </div>
                </div>
                <button className="btn btn-ghost gp-back-btn" onClick={handleBackToSearch} style={{ borderColor: primary, color: primary, borderRadius: radius }}>← Search again</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'layout' && (
          <div className="gp-layout-section">
            {settings.venue_image_url ? (
              <>
                <div className="gp-layout-controls">
                  <button className="gp-zoom-btn" onClick={handleZoomOut} style={{ borderColor: primary, color: primary, borderRadius: radius }}>−</button>
                  <span className="gp-zoom-label" style={{ color: text }}>{Math.round(zoom * 100)}%</span>
                  <button className="gp-zoom-btn" onClick={handleZoomIn} style={{ borderColor: primary, color: primary, borderRadius: radius }}>+</button>
                  <button className="gp-zoom-btn" onClick={handleZoomReset} style={{ borderColor: primary, color: primary, borderRadius: radius }}>Reset</button>
                </div>
                <div className="gp-layout-viewport" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} style={{ cursor: isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default', borderColor: primary, borderRadius: radius }}>
                  <img src={settings.venue_image_url} alt="Venue layout" className="gp-venue-img" style={{ transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`, transformOrigin: 'center', transition: isDragging ? 'none' : 'transform 0.2s ease', borderRadius: radius }} draggable={false} />
                </div>
              </>
            ) : (
              <div className="gp-no-layout" style={{ color: text }}><p>No venue layout available.</p></div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
