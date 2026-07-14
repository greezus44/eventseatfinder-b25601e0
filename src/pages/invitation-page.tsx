import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useGuestPageSettingsBySlug } from '@/hooks/use-guest-page-settings'
import { supabase } from '@/lib/supabase'
import { loadGoogleFonts, getFontCss, formatTime12 } from '@/lib/fonts'
import { normalizeName, searchGuests, type GuestSearchResult } from '@/lib/search'

type GuestTab = 'find' | 'layout'

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
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState<GuestSearchResult[]>([])
  const [selectedResult, setSelectedResult] = useState<GuestSearchResult | null>(null)
  const [searched, setSearched] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loadingGuests, setLoadingGuests] = useState(false)
  const [guestsData, setGuestsData] = useState<GuestWithTable[]>([])

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

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateSuggestions = useCallback((query: string) => {
    if (!query.trim()) { setSuggestions([]); return }
    setSuggestions(searchGuests(guestsData, query, 10))
  }, [guestsData])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value); setSelectedResult(null); setSearched(false); setShowSuggestions(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => updateSuggestions(value), 200)
  }

  const handleSearchSubmit = () => {
    if (!search.trim()) return
    setShowSuggestions(false); setSearched(true)
    const results = searchGuests(guestsData, search, 10)
    setSelectedResult(results.length > 0 ? results[0] : null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchSubmit() } }
  const handleSuggestionClick = (result: GuestSearchResult) => { setSearch(result.name); setSelectedResult(result); setShowSuggestions(false); setSearched(true) }
  const handleBlur = () => { setTimeout(() => setShowSuggestions(false), 150) }
  const handleFocus = () => { if (search.trim()) { setShowSuggestions(true); updateSuggestions(search) } }

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
  const welcomeMessage = settings.welcome_message ?? 'Welcome to our event! We look forward to celebrating with you.'

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
        {settings.event_subtitle && <p className="gp-subtitle" style={{ fontFamily: getFontCss(subtitleFont), fontSize: `${settings.font_subtitle_size ?? 16}px`, color: settings.font_subtitle_color ?? text }}>{settings.event_subtitle}</p>}
        {event.date && <p className="gp-datetime" style={{ fontFamily: getFontCss(datetimeFont), fontSize: `${settings.font_datetime_size ?? 14}px`, color: settings.font_datetime_color ?? text }}>{formatDate()}</p>}
        {event.time && <p className="gp-datetime" style={{ fontFamily: getFontCss(datetimeFont), fontSize: `${settings.font_datetime_size ?? 14}px`, color: settings.font_datetime_color ?? text }}>{formatTime12(event.time)}</p>}
        {event.venue && <p className="gp-venue" style={{ fontFamily: getFontCss(venueFont), fontSize: `${settings.font_venue_size ?? 14}px`, color: settings.font_venue_color ?? text }}>{event.venue}</p>}

        {/* Segmented control — one connected component, equal widths, rounded outer corners */}
        <div className="gp-segmented" style={{ borderRadius: radius, border: `1px solid ${primary}` }}>
          <button
            className={`gp-segment ${activeTab === 'find' ? 'active' : ''}`}
            onClick={() => setActiveTab('find')}
            style={activeTab === 'find'
              ? { background: primary, color: '#fff' }
              : { background: bg, color: primary }
            }
          >
            Find Seat
          </button>
          <button
            className={`gp-segment ${activeTab === 'layout' ? 'active' : ''}`}
            onClick={() => setActiveTab('layout')}
            style={activeTab === 'layout'
              ? { background: primary, color: '#fff' }
              : { background: bg, color: primary }
            }
          >
            Venue Layout
          </button>
        </div>

        {activeTab === 'find' && (
          <div className="gp-find-seat">
            <div className="gp-search-wrapper">
              <div className="gp-search-box">
                <input type="text" className="gp-search-input" placeholder="Search your name…" value={search} onChange={handleSearchChange} onKeyDown={handleKeyDown} onFocus={handleFocus} onBlur={handleBlur} autoFocus autoComplete="off" style={{ background: bg, borderColor: primary, color: text, borderRadius: radius }} />
                <button className="gp-search-btn" onClick={handleSearchSubmit} style={{ background: primary, color: '#fff', borderRadius: radius }}>Search</button>
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div className="gp-suggestions" style={{ background: bg, borderColor: primary, borderRadius: radius }}>
                  {suggestions.map((s) => (
                    <button key={s.id} className="gp-suggestion" onClick={() => handleSuggestionClick(s)} style={{ borderRadius: radius }}>
                      <span className="gp-suggestion-name" style={{ color: text }}>{s.name}</span>
                      <span className="gp-suggestion-table" style={{ color: primary }}>{s.table_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {searched && (
              <div className="gp-results">
                {loadingGuests ? (
                  <div className="gp-no-results"><p>Loading guests…</p></div>
                ) : selectedResult ? (
                  <div className="gp-result-card" style={{ background: cardBg, borderColor: primary, borderRadius: radius }}>
                    <div className="gp-result-left">
                      <p className="gp-result-name" style={{ color: text }}>{selectedResult.name}</p>
                    </div>
                    <div className="gp-result-right">
                      <span className="gp-result-badge" style={{ background: primary, color: '#fff', borderRadius: radius }}>{selectedResult.table_name}</span>
                    </div>
                  </div>
                ) : (
                  <div className="gp-no-results" style={{ color: text }}><p>No matching guest found. Please check the spelling of your name.</p></div>
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
