import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useGuestPageSettingsBySlug } from '@/hooks/use-guest-page-settings'
import { supabase } from '@/lib/supabase'

export function FindYourSeatPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data, isLoading } = useGuestPageSettingsBySlug(slug ?? '')
  const [activeTab, setActiveTab] = useState<'find' | 'layout'>('find')
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<{ name: string; table_name: string; table_number: number }[]>([])
  const [searched, setSearched] = useState(false)

  const settings = data
  const event = data?.events

  const primary = settings?.color_primary ?? '#0f766e'
  const bg = settings?.color_background ?? '#f8fafc'
  const card = settings?.color_card ?? '#ffffff'
  const text = settings?.color_text ?? '#0f172a'
  const radius = `${settings?.border_radius ?? 16}px`

  const handleSearch = async () => {
    if (!search.trim() || !event) return
    setSearched(true)
    const { data: settingsData } = await supabase.from('guest_page_settings').select('event_id').eq('events.slug', slug!).maybeSingle()
    if (!settingsData) return
    const { data: guests } = await supabase.from('guests').select('name, table_id, tables!inner(name, number)').ilike('name', `%${search.trim()}%`).eq('event_id', settingsData.event_id)
    if (guests) setResults(guests.map((g: any) => ({ name: g.name, table_name: g.tables?.name ?? 'Unassigned', table_number: g.tables?.number ?? 0 })))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch() }

  if (isLoading) return <div className="gp-loading"><div className="spinner spinner-lg" /></div>
  if (!settings || !event) return <div className="gp-loading"><p>Event not found</p></div>

  return (
    <div className="gp-page" style={{ background: bg, color: text }}>
      <div className="gp-container">
        {settings.logo_url && (
          <div className="gp-logo-wrapper">
            <img src={settings.logo_url} alt="Event logo" className="gp-logo" style={{ width: `${Math.min(settings.logo_size ?? 80, 200)}px`, height: 'auto', borderRadius: settings.logo_rounded ? '50%' : '0' }} />
          </div>
        )}
        <h1 className="gp-title" style={{ fontSize: '1.75rem', fontWeight: 700 }}>{event.name}</h1>
        <div className="gp-tabs">
          <button className={`gp-tab ${activeTab === 'find' ? 'active' : ''}`} onClick={() => setActiveTab('find')} style={activeTab === 'find' ? { background: primary, color: '#fff' } : {}}>Find Seat</button>
          <button className={`gp-tab ${activeTab === 'layout' ? 'active' : ''}`} onClick={() => setActiveTab('layout')} style={activeTab === 'layout' ? { background: primary, color: '#fff' } : {}}>Venue Layout</button>
        </div>
        {activeTab === 'find' && (
          <div className="gp-find-seat">
            <div className="gp-search-box">
              <input type="text" className="input gp-search-input" placeholder="Enter your name…" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={handleKeyDown} autoFocus style={{ borderColor: primary }} />
              <button className="btn btn-primary" onClick={handleSearch} style={{ background: primary, borderRadius: radius }}>Search</button>
            </div>
            {searched && (
              <div className="gp-results">
                {results.length === 0 ? (
                  <div className="gp-no-results"><p>No guests found matching "{search}".</p><p className="form-hint">Try searching with just your first or last name.</p></div>
                ) : (
                  results.map((r, i) => (
                    <div key={i} className="gp-result-card" style={{ background: card, borderRadius: radius }}>
                      <p className="gp-result-name">{r.name}</p>
                      <p className="gp-result-table"><span className="gp-result-table-label">Your table:</span><span className="gp-result-table-value" style={{ color: primary }}>{r.table_name}</span></p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
        {activeTab === 'layout' && (
          <div className="gp-layout-section">
            {settings.venue_image_url ? <img src={settings.venue_image_url} alt="Venue layout" className="gp-venue-img" style={{ borderRadius: radius }} /> : <div className="gp-no-layout"><p>No venue layout available.</p></div>}
          </div>
        )}
      </div>
    </div>
  )
}
