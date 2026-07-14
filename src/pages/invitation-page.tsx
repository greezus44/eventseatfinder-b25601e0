import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { searchGuests } from '@/lib/search'
import { getFontStack } from '@/lib/fonts'
import type { Event, Guest, Table, GuestPageSettings } from '@/types'

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
    venueLayout: 'Pelan Dewan',
    searchPlaceholder: 'TAIP NAMA ANDA',
    loading: 'Sedang muatkan\u2026',
    noGuests: 'Tiada nama yang sepadan',
    thisIsYourTable: 'Ini Meja Anda',
    searchAgain: '\u2190 Cari Lagi',
    noVenueLayout: 'Pelan dewan belum tersedia.',
    eventNotFound: 'Majlis tidak dijumpai',
    english: 'English',
    bahasaMelayu: 'Bahasa Melayu',
  },
} as const

type Lang = keyof typeof T

export default function InvitationPage() {
  const { id } = useParams<{ id: string }>()
  const [event, setEvent] = useState<Event | null>(null)
  const [guests, setGuests] = useState<Guest[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [settings, setSettings] = useState<GuestPageSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [lang, setLang] = useState<Lang>('en')
  const [search, setSearch] = useState('')
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [lightbox, setLightbox] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const t = T[lang]

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      supabase.from('events').select('*').eq('id', id).maybeSingle(),
      supabase.from('guests').select('*').eq('event_id', id),
      supabase.from('tables').select('*').eq('event_id', id),
      supabase.from('guest_page_settings').select('*').eq('event_id', id).maybeSingle(),
    ]).then(([evRes, guestRes, tableRes, settingsRes]) => {
      if (evRes.error || !evRes.data) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setEvent(evRes.data as Event)
      setGuests((guestRes.data || []) as Guest[])
      setTables((tableRes.data || []) as Table[])
      setSettings((settingsRes.data || null) as GuestPageSettings | null)
      setLoading(false)
    })
  }, [id])

  const results = useMemo(() => searchGuests(search, guests), [search, guests])

  const handleSelectGuest = (g: Guest) => {
    setSelectedGuest(g)
    setSearch('')
    setShowDropdown(false)
  }

  const tableForGuest = (g: Guest | null) => {
    if (!g || !g.table_id) return null
    return tables.find(t => t.id === g.table_id) || null
  }

  const dateLocale = lang === 'ms' ? 'ms-BN' : 'en-US'

  if (loading) {
    return (
      <div className="gp-loading">
        <div className="spinner spinner-lg" />
      </div>
    )
  }

  if (notFound || !event) {
    return (
      <div className="gp-page">
        <div className="gp-container">
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-muted)' }}>{t.eventNotFound}</p>
        </div>
      </div>
    )
  }

  const bg = event.background_color || '#fafafa'
  const textColor = event.text_color || '#1a1a1a'
  const fontStack = getFontStack('Inter')

  const showFindSeat = settings?.show_find_seat ?? true
  const showVenueLayout = settings?.show_venue_layout ?? true

  return (
    <div className="gp-page" style={{ background: bg, color: textColor, fontFamily: fontStack }}>
      <div className="gp-lang-switcher">
        <button
          className="gp-lang-btn"
          style={lang === 'en' ? { background: 'var(--gp-accent)', color: 'var(--gp-bg)' } : { background: 'transparent', color: 'var(--gp-accent)' }}
          onClick={() => setLang('en')}
        >
          {t.english}
        </button>
        <button
          className="gp-lang-btn"
          style={lang === 'ms' ? { background: 'var(--gp-accent)', color: 'var(--gp-bg)' } : { background: 'transparent', color: 'var(--gp-accent)' }}
          onClick={() => setLang('ms')}
        >
          {t.bahasaMelayu}
        </button>
      </div>

      <div className="gp-container">
        {event.logo_url && (
          <div className="gp-logo-wrapper">
            <img src={event.logo_url} alt="Logo" className="gp-logo" style={{ height: `${event.logo_size}px` }} />
          </div>
        )}
        {event.title_text && (
          <h1 className="gp-title" style={{ fontSize: `${event.title_size}px`, color: event.title_color }}>{event.title_text}</h1>
        )}
        {event.subtitle_text && (
          <p className="gp-subtitle" style={{ fontSize: `${event.subtitle_size}px`, color: event.subtitle_color }}>{event.subtitle_text}</p>
        )}
        {event.date && (
          <p className="gp-datetime" style={{ fontSize: `${event.datetime_size}px`, color: event.datetime_color }}>
            {new Date(event.date + (event.time ? `T${event.time}` : '')).toLocaleDateString(dateLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {event.time && ` ${new Date(`2000-01-01T${event.time}`).toLocaleTimeString(dateLocale, { hour: 'numeric', minute: '2-digit' })}`}
          </p>
        )}
        {event.venue && (
          <p className="gp-venue" style={{ fontSize: `${event.venue_text_size}px`, color: event.venue_text_color }}>{event.venue}</p>
        )}

        {(showFindSeat || showVenueLayout) && (
          <div className="gp-segmented">
            {showFindSeat && (
              <button
                className="gp-segment"
                style={selectedGuest || !showVenueLayout ? { background: 'var(--gp-accent)', color: 'var(--gp-bg)' } : { background: 'transparent', color: 'var(--gp-accent)' }}
                onClick={() => { setSelectedGuest(null); setSearch('') }}
              >
                {t.findSeat}
              </button>
            )}
            {showVenueLayout && (
              <button
                className="gp-segment"
                style={!selectedGuest || !showFindSeat ? { background: 'var(--gp-accent)', color: 'var(--gp-bg)' } : { background: 'transparent', color: 'var(--gp-accent)' }}
                onClick={() => setSelectedGuest(null)}
              >
                {t.venueLayout}
              </button>
            )}
          </div>
        )}

        {showFindSeat && !selectedGuest && (
          <div className="gp-find-seat">
            <div className="gp-search-section">
              <div className="gp-autocomplete-wrapper">
                <input
                  ref={searchRef}
                  className="gp-autocomplete-input"
                  style={{ color: textColor }}
                  placeholder={t.searchPlaceholder}
                  value={search}
                  onChange={e => { setSearch(e.target.value); setShowDropdown(true) }}
                  onFocus={() => setShowDropdown(true) }
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200) }
                />
                {showDropdown && search && (
                  <div className="gp-autocomplete-dropdown" style={{ background: bg }}>
                    {results.length === 0 ? (
                      <div className="gp-autocomplete-empty" style={{ color: textColor }}>{search.length > 1 ? t.noGuests : t.loading}</div>
                    ) : (
                      results.map(g => {
                        const tbl = tableForGuest(g)
                        return (
                          <button
                            key={g.id}
                            className="gp-autocomplete-item"
                            style={{ color: textColor, background: 'transparent' }}
                            onMouseDown={() => handleSelectGuest(g)}
                          >
                            <span className="gp-autocomplete-name">{g.name}</span>
                            {tbl && (
                              <span className="gp-table-badge" style={{ borderColor: 'var(--gp-accent)', color: 'var(--gp-accent)' }}>{tbl.name}</span>
                            )}
                          </button>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showFindSeat && selectedGuest && (
          <div className="gp-table-info">
            <h2 className="gp-table-info-title" style={{ color: textColor }}>{t.thisIsYourTable}</h2>
            {(() => {
              const tbl = tableForGuest(selectedGuest)
              return (
                <div className="gp-table-info-card">
                  <div className="gp-table-info-left">
                    <div className="gp-table-info-name" style={{ color: textColor }}>{selectedGuest.name}</div>
                  </div>
                  <div className="gp-table-info-right">
                    {tbl ? (
                      <span className="gp-table-info-badge" style={{ borderColor: 'var(--gp-accent)', color: 'var(--gp-accent)' }}>{tbl.name}</span>
                    ) : (
                      <span style={{ color: textColor, opacity: .6 }}>—</span>
                    )}
                  </div>
                </div>
              )
            })()}
            <button
              className="btn gp-back-btn"
              style={{ borderColor: 'var(--gp-accent)', color: 'var(--gp-accent)' }}
              onClick={() => { setSelectedGuest(null); setSearch('') }}
            >
              {t.searchAgain}
            </button>
          </div>
        )}

        {showVenueLayout && !selectedGuest && (
          <div className="gp-layout-section">
            {event.venue_layout_url ? (
              <div className="gp-layout-viewport" onClick={() => setLightbox(true)}>
                <img src={event.venue_layout_url} alt="Venue Layout" className="gp-venue-img" />
              </div>
            ) : (
              <div className="gp-no-layout" style={{ color: textColor }}>{t.noVenueLayout}</div>
            )}
          </div>
        )}
      </div>

      {lightbox && event.venue_layout_url && (
        <div className="lightbox-overlay" onClick={() => setLightbox(false)}>
          <button className="lightbox-close" onClick={() => setLightbox(false)}>×</button>
          <div className="lightbox-content">
            <img src={event.venue_layout_url} alt="Venue Layout" className="lightbox-img" />
          </div>
        </div>
      )}
    </div>
  )
}
