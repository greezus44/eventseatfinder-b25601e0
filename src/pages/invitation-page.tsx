import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useGuestPageSettingsBySlug } from '@/hooks/use-guest-page-settings'
import { supabase } from '@/lib/supabase'
import { loadGoogleFonts, getFontCss, formatTime12 } from '@/lib/fonts'

type GuestTab = 'find' | 'layout'

export function InvitationPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data, isLoading } = useGuestPageSettingsBySlug(slug ?? '')

  const [activeTab, setActiveTab] = useState<GuestTab>('find')
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<{ name: string; table_name: string; table_number: number }[]>([])
  const [searched, setSearched] = useState(false)

  // Venue layout zoom/pan state
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const layoutRef = useRef<HTMLDivElement>(null)

  const settings = data
  const event = data?.events

  const titleFont = settings?.font_title_family ?? 'Inter'
  const subtitleFont = settings?.font_subtitle_family ?? 'Inter'
  const datetimeFont = settings?.font_datetime_family ?? 'Inter'
  const venueFont = settings?.font_venue_family ?? 'Inter'
  const welcomeFont = settings?.font_welcome_family ?? 'Inter'

  useEffect(() => { loadGoogleFonts([titleFont, subtitleFont, datetimeFont, venueFont, welcomeFont]) }, [titleFont, subtitleFont, datetimeFont, venueFont, welcomeFont])

  const handleSearch = async () => {
    if (!search.trim() || !event) return
    setSearched(true)
    const { data: settingsData } = await supabase.from('guest_page_settings').select('event_id').eq('events.slug', slug!).maybeSingle()
    if (!settingsData) return
    const { data: guests } = await supabase.from('guests').select('name, table_id, tables!inner(name, number)').ilike('name', `%${search.trim()}%`).eq('event_id', settingsData.event_id)
    if (guests) setResults(guests.map((g: any) => ({ name: g.name, table_name: g.tables?.name ?? 'Unassigned', table_number: g.tables?.number ?? 0 })))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch() }

  // Zoom/pan handlers
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 4))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5))
  const handleZoomReset = () => { setZoom(1); setPanX(0); setPanY(0) }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom === 1) return
    setIsDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY, panX, panY }
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    setPanX(dragStart.current.panX + dx)
    setPanY(dragStart.current.panY + dy)
  }, [isDragging])

  const handleMouseUp = () => setIsDragging(false)

  if (isLoading) return <div className="gp-loading"><div className="spinner spinner-lg" /></div>
  if (!settings || !event) return <div className="gp-loading"><p>Event not found</p></div>

  const primary = settings.color_primary ?? '#0f766e'
  const bg = settings.color_background ?? '#f8fafc'
  const text = settings.color_text ?? '#0f172a'
  const radius = `${settings.border_radius ?? 16}px`
  const logoSize = settings.logo_size ?? 80
  const logoRounded = settings.logo_rounded ?? false
  const welcomeMessage = settings.welcome_message ?? 'Welcome to our event! We look forward to celebrating with you.'

  const formatDate = () => {
    if (!event.date) return ''
    return new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div className="gp-page" style={{ background: bg, color: text }}>
      <div className="gp-container">
        {/* Event Logo */}
        {settings.logo_url && (
          <div className="gp-logo-wrapper">
            <img src={settings.logo_url} alt="Event logo" className="gp-logo" style={{ width: `${Math.min(logoSize, 500)}px`, height: 'auto', borderRadius: logoRounded ? '50%' : '0' }} />
          </div>
        )}

        {/* Event Name */}
        <h1 className="gp-title" style={{ fontFamily: getFontCss(titleFont), fontSize: `${settings.font_title_size ?? 32}px`, color: settings.font_title_color ?? text }}>{event.name}</h1>

        {/* Subtitle */}
        {settings.event_subtitle && (
          <p className="gp-subtitle" style={{ fontFamily: getFontCss(subtitleFont), fontSize: `${settings.font_subtitle_size ?? 16}px`, color: settings.font_subtitle_color ?? text }}>{settings.event_subtitle}</p>
        )}

        {/* Date */}
        {event.date && (
          <p className="gp-datetime" style={{ fontFamily: getFontCss(datetimeFont), fontSize: `${settings.font_datetime_size ?? 14}px`, color: settings.font_datetime_color ?? text }}>{formatDate()}</p>
        )}

        {/* Time */}
        {event.time && (
          <p className="gp-datetime" style={{ fontFamily: getFontCss(datetimeFont), fontSize: `${settings.font_datetime_size ?? 14}px`, color: settings.font_datetime_color ?? text }}>{formatTime12(event.time)}</p>
        )}

        {/* Venue */}
        {event.venue && (
          <p className="gp-venue" style={{ fontFamily: getFontCss(venueFont), fontSize: `${settings.font_venue_size ?? 14}px`, color: settings.font_venue_color ?? text }}>{event.venue}</p>
        )}

        {/* Welcome Message */}
        <p className="gp-welcome" style={{ fontFamily: getFontCss(welcomeFont), fontSize: `${settings.font_welcome_size ?? 16}px`, color: settings.font_welcome_color ?? text }}>{welcomeMessage}</p>

        {/* Navigation Tabs */}
        <div className="gp-tabs">
          <button className={`gp-tab ${activeTab === 'find' ? 'active' : ''}`} onClick={() => setActiveTab('find')} style={activeTab === 'find' ? { background: primary, color: '#fff' } : {}}>Find Seat</button>
          <button className={`gp-tab ${activeTab === 'layout' ? 'active' : ''}`} onClick={() => setActiveTab('layout')} style={activeTab === 'layout' ? { background: primary, color: '#fff' } : {}}>Venue Layout</button>
        </div>

        {/* Tab Content */}
        {activeTab === 'find' && (
          <div className="gp-find-seat">
            <div className="gp-search-box">
              <input type="text" className="input gp-search-input" placeholder="Search your name…" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={handleKeyDown} autoFocus style={{ borderColor: primary }} />
              <button className="btn btn-primary" onClick={handleSearch} style={{ background: primary, borderRadius: radius }}>Search</button>
            </div>
            {searched && (
              <div className="gp-results">
                {results.length === 0 ? (
                  <div className="gp-no-results">
                    <p>No guests found matching "{search}".</p>
                    <p className="form-hint">Try searching with just your first or last name.</p>
                  </div>
                ) : (
                  results.map((r, i) => (
                    <div key={i} className="gp-result-card" style={{ borderRadius: radius }}>
                      <p className="gp-result-name">{r.name}</p>
                      <p className="gp-result-table">
                        <span className="gp-result-table-label">Your table:</span>
                        <span className="gp-result-table-value" style={{ color: primary }}>{r.table_name}</span>
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'layout' && (
          <div className="gp-layout-section">
            {settings.venue_image_url ? (
              <>
                <div className="gp-layout-controls">
                  <button className="btn btn-ghost btn-sm" onClick={handleZoomOut}>−</button>
                  <span className="gp-zoom-label">{Math.round(zoom * 100)}%</span>
                  <button className="btn btn-ghost btn-sm" onClick={handleZoomIn}>+</button>
                  <button className="btn btn-ghost btn-sm" onClick={handleZoomReset}>Reset</button>
                </div>
                <div
                  className="gp-layout-viewport"
                  ref={layoutRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{ cursor: isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default' }}
                >
                  <img
                    src={settings.venue_image_url}
                    alt="Venue layout"
                    className="gp-venue-img"
                    style={{
                      transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`,
                      transformOrigin: 'center',
                      transition: isDragging ? 'none' : 'transform 0.2s ease',
                      borderRadius: radius,
                    }}
                    draggable={false}
                  />
                </div>
              </>
            ) : (
              <div className="gp-no-layout"><p>No venue layout available.</p></div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
