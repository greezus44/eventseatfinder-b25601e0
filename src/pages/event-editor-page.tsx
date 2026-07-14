import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { uploadLogo, uploadVenueLayout } from '@/lib/storage'
import { useGuests } from '@/hooks/use-guests'
import { useTables } from '@/hooks/use-tables'
import { useGuestPageSettings } from '@/hooks/use-guest-page-settings'
import { useToast } from '@/providers/toast-provider'
import { useConfirm } from '@/providers/confirm-dialog'
import { parseGuestList, parseCSV } from '@/lib/guest-import'
import type { Event, Guest, Table } from '@/types'

type Tab = 'details' | 'guests' | 'tables' | 'layout' | 'share'

export default function EventEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const [event, setEvent] = useState<Event | null>(null)
  const [tab, setTab] = useState<Tab>('details')
  const [saving, setSaving] = useState(false)
  const [loadingEvent, setLoadingEvent] = useState(true)

  const { guests, loading: guestsLoading, refetch: refetchGuests } = useGuests(id)
  const { tables, loading: tablesLoading, refetch: refetchTables } = useTables(id)
  const { settings, refetch: refetchSettings } = useGuestPageSettings(id)

  useEffect(() => {
    if (!id) return
    supabase.from('events').select('*').eq('id', id).maybeSingle().then(({ data, error }) => {
      if (error || !data) {
        toast('Event not found', 'error')
        navigate('/')
        return
      }
      setEvent(data as Event)
      setLoadingEvent(false)
    })
  }, [id, navigate, toast])

  const updateEvent = useCallback((patch: Partial<Event>) => {
    setEvent(prev => prev ? { ...prev, ...patch } : prev)
  }, [])

  const handleSave = async () => {
    if (!event || !id) return
    setSaving(true)
    const { error } = await supabase.from('events').update({
      name: event.name,
      date: event.date,
      time: event.time,
      venue: event.venue,
      venue_layout_url: event.venue_layout_url,
      logo_url: event.logo_url,
      logo_size: event.logo_size,
      title_text: event.title_text,
      title_size: event.title_size,
      title_color: event.title_color,
      subtitle_text: event.subtitle_text,
      subtitle_size: event.subtitle_size,
      subtitle_color: event.subtitle_color,
      datetime_size: event.datetime_size,
      datetime_color: event.datetime_color,
      venue_text_size: event.venue_text_size,
      venue_text_color: event.venue_text_color,
      background_color: event.background_color,
      accent_color: event.accent_color,
      text_color: event.text_color,
    }).eq('id', id)
    if (error) {
      toast('Failed to save', 'error')
    } else {
      toast('Saved')
    }
    setSaving(false)
  }

  if (loadingEvent || !event) {
    return <div className="spinner-container"><div className="spinner spinner-lg" /></div>
  }

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">{event.name}</h1>
          <p className="page-subtitle">Edit your event details</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      <div className="tabs">
        <button className={`tab ${tab === 'details' ? 'active' : ''}`} onClick={() => setTab('details')}>Details</button>
        <button className={`tab ${tab === 'guests' ? 'active' : ''}`} onClick={() => setTab('guests')}>Guests</button>
        <button className={`tab ${tab === 'tables' ? 'active' : ''}`} onClick={() => setTab('tables')}>Tables</button>
        <button className={`tab ${tab === 'layout' ? 'active' : ''}`} onClick={() => setTab('layout')}>Layout</button>
        <button className={`tab ${tab === 'share' ? 'active' : ''}`} onClick={() => setTab('share')}>Share</button>
      </div>
      {tab === 'details' && <DetailsTab event={event} updateEvent={updateEvent} />}
      {tab === 'guests' && (
        <GuestsTab eventId={id!} guests={guests} tables={tables} loading={guestsLoading} refetch={refetchGuests} toast={toast} confirm={confirm} />
      )}
      {tab === 'tables' && (
        <TablesTab eventId={id!} tables={tables} loading={tablesLoading} refetch={refetchTables} toast={toast} confirm={confirm} />
      )}
      {tab === 'layout' && <LayoutTab event={event} updateEvent={updateEvent} toast={toast} />}
      {tab === 'share' && <ShareTab eventId={id!} settings={settings} refetchSettings={refetchSettings} toast={toast} />}
    </div>
  )
}

function DetailsTab({ event, updateEvent }: { event: Event; updateEvent: (p: Partial<Event>) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadLogo(file)
      updateEvent({ logo_url: url })
      toast('Logo uploaded')
    } catch {
      toast('Logo upload failed', 'error')
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="details-layout">
      <div className="details-main">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Event Information</h2>
          </div>
          <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="form-label">Event Name</label>
            <input className="input" value={event.name} onChange={e => updateEvent({ name: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="input" type="date" value={event.date || ''} onChange={e => updateEvent({ date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Time</label>
              <input className="input" type="time" value={event.time || ''} onChange={e => updateEvent({ time: e.target.value })} />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
            <label className="form-label">Venue</label>
            <input className="input" value={event.venue || ''} onChange={e => updateEvent({ venue: e.target.value })} placeholder="Venue name" />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Logo</h2>
            <p className="card-subtitle">Upload a logo to display on the guest page</p>
          </div>
          <div className="logo-preview-area">
            <div className="logo-preview-box">
              {event.logo_url ? (
                <img src={event.logo_url} alt="Logo" style={{ maxHeight: '100px', maxWidth: '100%' }} />
              ) : (
                <span style={{ color: 'var(--color-muted)', fontSize: 'var(--text-sm)' }}>No logo uploaded</span>
              )}
            </div>
            <div className="logo-actions">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoSelect} style={{ display: 'none' }} />
              <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? 'Uploading…' : 'Upload Logo'}
              </button>
              {event.logo_url && (
                <button className="btn btn-ghost" onClick={() => updateEvent({ logo_url: null })}>Remove</button>
              )}
            </div>
            <div className="logo-size-controls">
              <label className="form-label">Logo Size: {event.logo_size}px</label>
              <input className="range" type="range" min="40" max="200" value={event.logo_size} onChange={e => updateEvent({ logo_size: Number(e.target.value) })} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Typography</h2>
          </div>
          <div className="typo-cards">
            <TypoCard label="Title" text={event.title_text} size={event.title_size} color={event.title_color}
              onText={v => updateEvent({ title_text: v })} onSize={v => updateEvent({ title_size: v })} onColor={v => updateEvent({ title_color: v })} />
            <TypoCard label="Subtitle" text={event.subtitle_text} size={event.subtitle_size} color={event.subtitle_color}
              onText={v => updateEvent({ subtitle_text: v })} onSize={v => updateEvent({ subtitle_size: v })} onColor={v => updateEvent({ subtitle_color: v })} />
            <TypoCard label="Date/Time" text="" size={event.datetime_size} color={event.datetime_color}
              onText={() => {}} onSize={v => updateEvent({ datetime_size: v })} onColor={v => updateEvent({ datetime_color: v })} />
            <TypoCard label="Venue" text="" size={event.venue_text_size} color={event.venue_text_color}
              onText={() => {}} onSize={v => updateEvent({ venue_text_size: v })} onColor={v => updateEvent({ venue_text_color: v })} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Colors</h2>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Background</label>
              <div className="color-field">
                <input className="color-picker" type="color" value={event.background_color} onChange={e => updateEvent({ background_color: e.target.value })} />
                <input className="input" value={event.background_color} onChange={e => updateEvent({ background_color: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Accent</label>
              <div className="color-field">
                <input className="color-picker" type="color" value={event.accent_color} onChange={e => updateEvent({ accent_color: e.target.value })} />
                <input className="input" value={event.accent_color} onChange={e => updateEvent({ accent_color: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="form-row" style={{ marginTop: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Text Color</label>
              <div className="color-field">
                <input className="color-picker" type="color" value={event.text_color} onChange={e => updateEvent({ text_color: e.target.value })} />
                <input className="input" value={event.text_color} onChange={e => updateEvent({ text_color: e.target.value })} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="details-preview">
        <div className="card preview-sticky">
          <div className="card-header">
            <h2 className="card-title">Live Preview</h2>
          </div>
          <div className="gp-preview-container" style={{ background: event.background_color, color: event.text_color, borderRadius: 'var(--radius-md)', padding: 'var(--space-6)' }}>
            {event.logo_url && (
              <div className="gp-preview-logo-wrapper">
                <img src={event.logo_url} alt="Logo" style={{ height: `${event.logo_size}px`, maxWidth: '100%' }} />
              </div>
            )}
            <div className="gp-preview-title" style={{ fontSize: `${event.title_size}px`, color: event.title_color }}>{event.title_text}</div>
            {event.subtitle_text && <div className="gp-preview-subtitle" style={{ fontSize: `${event.subtitle_size}px`, color: event.subtitle_color }}>{event.subtitle_text}</div>}
            {event.date && (
              <div className="gp-preview-datetime" style={{ fontSize: `${event.datetime_size}px`, color: event.datetime_color }}>
                {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                {event.time && ` at ${event.time}`}
              </div>
            )}
            {event.venue && <div className="gp-preview-venue" style={{ fontSize: `${event.venue_text_size}px`, color: event.venue_text_color }}>{event.venue}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

function TypoCard({ label, text, size, color, onText, onSize, onColor }: {
  label: string; text: string; size: number; color: string
  onText: (v: string) => void; onSize: (v: number) => void; onColor: (v: string) => void
}) {
  return (
    <div className="typo-card">
      <div className="typo-card-header">{label}</div>
      <div className="typo-card-controls">
        {text !== undefined && label !== 'Date/Time' && label !== 'Venue' && (
          <div className="typo-card-field">
            <label className="typo-card-label">Text</label>
            <input className="input" value={text} onChange={e => onText(e.target.value)} />
          </div>
        )}
        <div className="typo-card-field">
          <label className="typo-card-label">Size</label>
          <div className="typo-size-control">
            <input className="range" type="range" min="10" max="48" value={size} onChange={e => onSize(Number(e.target.value))} />
            <span className="typo-size-value">{size}px</span>
          </div>
        </div>
        <div className="typo-card-field">
          <label className="typo-card-label">Color</label>
          <div className="color-field">
            <input className="color-picker-sm" type="color" value={color} onChange={e => onColor(e.target.value)} />
            <input className="input" value={color} onChange={e => onColor(e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  )
}

function GuestsTab({ eventId, guests, tables, loading, refetch, toast, confirm }: {
  eventId: string; guests: Guest[]; tables: Table[]; loading: boolean
  refetch: () => void; toast: (m: string, t?: 'success' | 'error') => void
  confirm: (o: { message: string; onConfirm: () => void }) => void
}) {
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editTable, setEditTable] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [showBulk, setShowBulk] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualTable, setManualTable] = useState('')
  const [importData, setImportData] = useState<{ name: string; table: string }[] | null>(null)
  const [sortByTable, setSortByTable] = useState(false)

  const filtered = guests.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
  const sorted = sortByTable
    ? [...filtered].sort((a, b) => {
        const ta = tables.find(t => t.id === a.table_id)?.name || 'ZZZ'
        const tb = tables.find(t => t.id === b.table_id)?.name || 'ZZZ'
        return ta.localeCompare(tb)
      })
    : filtered

  const handleAddManual = async () => {
    if (!manualName.trim()) return
    let tableId: string | null = null
    if (manualTable.trim()) {
      const existing = tables.find(t => t.name.toLowerCase() === manualTable.trim().toLowerCase())
      if (existing) {
        tableId = existing.id
      } else {
        const { data } = await supabase.from('tables').insert({ event_id: eventId, name: manualTable.trim(), capacity: 8 }).select().single()
        if (data) tableId = data.id
      }
    }
    const { error } = await supabase.from('guests').insert({ event_id: eventId, name: manualName.trim(), table_id: tableId })
    if (error) {
      toast('Failed to add guest', 'error')
    } else {
      toast('Guest added')
      setManualName('')
      setManualTable('')
      refetch()
    }
  }

  const handleBulkImport = async () => {
    if (!importData || importData.length === 0) return
    let success = 0
    for (const g of importData) {
      let tableId: string | null = null
      if (g.table) {
        const existing = tables.find(t => t.name.toLowerCase() === g.table.toLowerCase())
        if (existing) {
          tableId = existing.id
        } else {
          const { data } = await supabase.from('tables').insert({ event_id: eventId, name: g.table, capacity: 8 }).select().single()
          if (data) tableId = data.id
        }
      }
      const { error } = await supabase.from('guests').insert({ event_id: eventId, name: g.name, table_id: tableId })
      if (!error) success++
    }
    toast(`${success} guests imported`)
    setImportData(null)
    setBulkText('')
    refetch()
  }

  const handleParseBulk = () => {
    const parsed = parseGuestList(bulkText)
    setImportData(parsed)
  }

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const parsed = file.name.endsWith('.csv') ? parseCSV(text) : parseGuestList(text)
    setImportData(parsed)
  }

  const handleUpdateGuest = async (guestId: string) => {
    let tableId: string | null = null
    if (editTable.trim()) {
      const existing = tables.find(t => t.name.toLowerCase() === editTable.trim().toLowerCase())
      if (existing) {
        tableId = existing.id
      } else {
        const { data } = await supabase.from('tables').insert({ event_id: eventId, name: editTable.trim(), capacity: 8 }).select().single()
        if (data) tableId = data.id
      }
    }
    const { error } = await supabase.from('guests').update({ name: editName.trim(), table_id: tableId }).eq('id', guestId)
    if (error) {
      toast('Failed to update guest', 'error')
    } else {
      toast('Guest updated')
      setEditingId(null)
      refetch()
    }
  }

  const handleDeleteGuest = (guestId: string) => {
    confirm({
      message: 'Delete this guest?',
      onConfirm: async () => {
        const { error } = await supabase.from('guests').delete().eq('id', guestId)
        if (error) {
          toast('Failed to delete guest', 'error')
        } else {
          toast('Guest deleted')
          refetch()
        }
      },
    })
  }

  if (loading) {
    return <div className="spinner-container"><div className="spinner" /></div>
  }

  return (
    <div className="guest-mgmt-panel">
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title">Guests ({guests.length})</h2>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setShowManual(!showManual); setShowBulk(false) }}>Add Guest</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setShowBulk(!showBulk); setShowManual(false) }}>Bulk Import</button>
          </div>
        </div>

        {showManual && (
          <div className="guest-row-edit" style={{ marginBottom: 'var(--space-4)' }}>
            <input className="input" placeholder="Guest name" value={manualName} onChange={e => setManualName(e.target.value)} />
            <input className="input" placeholder="Table (optional)" value={manualTable} onChange={e => setManualTable(e.target.value)} style={{ flex: '0 0 140px' }} />
            <button className="btn btn-primary btn-sm" onClick={handleAddManual}>Add</button>
          </div>
        )}

        {showBulk && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <textarea className="textarea bulk-textarea" placeholder="One guest per line. Use Tab or comma to separate table name:&#10;John Doe\tTable 1&#10;Jane Smith, Table 2" value={bulkText} onChange={e => setBulkText(e.target.value)} rows={6} />
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
              <button className="btn btn-primary btn-sm" onClick={handleParseBulk}>Preview Import</button>
              <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                Upload File
                <input type="file" accept=".txt,.csv" onChange={handleFileImport} style={{ display: 'none' }} />
              </label>
            </div>
            {importData && (
              <div className="import-review" style={{ marginTop: 'var(--space-4)' }}>
                <div className="import-review-header">
                  <span>{importData.length} guests to import</span>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button className="btn btn-primary btn-sm" onClick={handleBulkImport}>Confirm Import</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setImportData(null)}>Cancel</button>
                  </div>
                </div>
                <div className="import-review-list">
                  {importData.map((g, i) => (
                    <div key={i} className="import-review-row">
                      <input className="input" value={g.name} onChange={e => { const d = [...importData]; d[i] = { ...d[i], name: e.target.value }; setImportData(d) }} />
                      <input className="input" value={g.table} onChange={e => { const d = [...importData]; d[i] = { ...d[i], table: e.target.value }; setImportData(d) }} style={{ flex: '0 0 120px' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="guest-filters">
          <input className="input" placeholder="Search guests…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="sort-toggle">
          <button className={`sort-toggle-btn ${!sortByTable ? 'active' : ''}`} onClick={() => setSortByTable(false)}>Sort by Name</button>
          <button className={`sort-toggle-btn ${sortByTable ? 'active' : ''}`} onClick={() => setSortByTable(true)}>Sort by Table</button>
        </div>
        <div className="guest-list">
          {sorted.map(g => {
            const tableName = tables.find(t => t.id === g.table_id)?.name || '—'
            return (
              <div key={g.id} className="guest-row">
                {editingId === g.id ? (
                  <div className="guest-row-edit">
                    <input className="input" value={editName} onChange={e => setEditName(e.target.value)} />
                    <input className="input" value={editTable} onChange={e => setEditTable(e.target.value)} placeholder="Table" style={{ flex: '0 0 140px' }} />
                    <button className="btn btn-primary btn-sm" onClick={() => handleUpdateGuest(g.id)}>Save</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <span className="guest-name">{g.name}</span>
                    <span className="guest-table">{tableName}</span>
                    <div className="guest-row-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditingId(g.id); setEditName(g.name); setEditTable(tables.find(t => t.id === g.table_id)?.name || '') }}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteGuest(g.id)}>Delete</button>
                    </div>
                  </>
                )}
              </div>
            )
          })}
          {sorted.length === 0 && (
            <div className="empty-state"><p>No guests found. Add guests or bulk import.</p></div>
          )}
        </div>
      </div>
    </div>
  )
}

function TablesTab({ eventId, tables, loading, refetch, toast, confirm }: {
  eventId: string; tables: Table[]; loading: boolean
  refetch: () => void; toast: (m: string, t?: 'success' | 'error') => void
  confirm: (o: { message: string; onConfirm: () => void }) => void
}) {
  const [showBulk, setShowBulk] = useState(false)
  const [bulkNames, setBulkNames] = useState('')
  const [bulkCapacity, setBulkCapacity] = useState(8)
  const [customRows, setCustomRows] = useState<{ name: string; capacity: number }[]>([])

  const handleBulkCreate = async () => {
    const names = bulkNames.split('\n').map(n => n.trim()).filter(Boolean)
    if (names.length === 0) return
    const inserts = names.map(name => ({ event_id: eventId, name, capacity: bulkCapacity }))
    const { error } = await supabase.from('tables').insert(inserts)
    if (error) {
      toast('Failed to create tables', 'error')
    } else {
      toast(`${names.length} tables created`)
      setBulkNames('')
      refetch()
    }
  }

  const handleCustomAdd = () => {
    setCustomRows(prev => [...prev, { name: '', capacity: 8 }])
  }

  const handleCustomCreate = async () => {
    const valid = customRows.filter(r => r.name.trim())
    if (valid.length === 0) return
    const inserts = valid.map(r => ({ event_id: eventId, name: r.name.trim(), capacity: r.capacity }))
    const { error } = await supabase.from('tables').insert(inserts)
    if (error) {
      toast('Failed to create tables', 'error')
    } else {
      toast(`${valid.length} tables created`)
      setCustomRows([])
      refetch()
    }
  }

  const handleDeleteTable = (tableId: string) => {
    confirm({
      message: 'Delete this table? Guests at this table will be unassigned.',
      onConfirm: async () => {
        await supabase.from('guests').update({ table_id: null }).eq('table_id', tableId)
        const { error } = await supabase.from('tables').delete().eq('id', tableId)
        if (error) {
          toast('Failed to delete table', 'error')
        } else {
          toast('Table deleted')
          refetch()
        }
      },
    })
  }

  if (loading) {
    return <div className="spinner-container"><div className="spinner" /></div>
  }

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="card-title">Tables ({tables.length})</h2>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowBulk(!showBulk)}>Add Tables</button>
      </div>
      {showBulk && (
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <div className="mode-toggle">
            <button className="btn btn-ghost btn-sm" onClick={handleCustomAdd}>Add Custom Row</button>
          </div>
          {customRows.length > 0 && (
            <div className="custom-rows" style={{ marginBottom: 'var(--space-4)' }}>
              {customRows.map((row, i) => (
                <div key={i} className="custom-row">
                  <input className="input" placeholder="Table name" value={row.name} onChange={e => { const r = [...customRows]; r[i] = { ...r[i], name: e.target.value }; setCustomRows(r) }} />
                  <input className="input" type="number" min="1" value={row.capacity} onChange={e => { const r = [...customRows]; r[i] = { ...r[i], capacity: Number(e.target.value) }; setCustomRows(r) }} style={{ flex: '0 0 80px' }} />
                  <button className="btn btn-ghost btn-sm" onClick={() => setCustomRows(prev => prev.filter((_, j) => j !== i))}>×</button>
                </div>
              ))}
              <button className="btn btn-primary btn-sm" onClick={handleCustomCreate}>Create Custom Tables</button>
            </div>
          )}
          <div className="bulk-form">
            <div className="form-group">
              <label className="form-label">Table Names (one per line)</label>
              <textarea className="textarea" placeholder="Table 1&#10;Table 2&#10;Table 3" value={bulkNames} onChange={e => setBulkNames(e.target.value)} rows={5} />
            </div>
            <div className="form-group" style={{ flex: '0 0 120px' }}>
              <label className="form-label">Capacity</label>
              <input className="input" type="number" min="1" value={bulkCapacity} onChange={e => setBulkCapacity(Number(e.target.value))} />
            </div>
            <button className="btn btn-primary" onClick={handleBulkCreate}>Create Tables</button>
          </div>
        </div>
      )}
      <div className="grid grid-3">
        {tables.map(t => {
          return (
            <div key={t.id} className="card card-sm table-card">
              <div className="table-card-header">
                <span className="table-card-name">{t.name}</span>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTable(t.id)}>Delete</button>
              </div>
              <span className="badge">Capacity: {t.capacity}</span>
            </div>
          )
        })}
        {tables.length === 0 && (
          <div className="empty-state"><p>No tables yet. Add tables to assign guests.</p></div>
        )}
      </div>
    </div>
  )
}

function LayoutTab({ event, updateEvent, toast }: {
  event: Event; updateEvent: (p: Partial<Event>) => void; toast: (m: string, t?: 'success' | 'error') => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadVenueLayout(file)
      updateEvent({ venue_layout_url: url })
      toast('Layout uploaded')
    } catch {
      toast('Layout upload failed', 'error')
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Venue Layout</h2>
        <p className="card-subtitle">Upload a floor plan or seating layout image for guests to view</p>
      </div>
      <div className="venue-preview">
        {event.venue_layout_url ? (
          <img src={event.venue_layout_url} alt="Venue Layout" className="venue-preview-img" />
        ) : (
          <div className="empty-state"><p>No venue layout uploaded yet.</p></div>
        )}
        <div className="venue-preview-actions">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading…' : 'Upload Layout'}
          </button>
          {event.venue_layout_url && (
            <button className="btn btn-ghost" onClick={() => updateEvent({ venue_layout_url: null })}>Remove</button>
          )}
        </div>
      </div>
    </div>
  )
}

function ShareTab({ eventId, settings, refetchSettings, toast }: {
  eventId: string; settings: any; refetchSettings: () => void; toast: (m: string, t?: 'success' | 'error') => void
}) {
  const [copied, setCopied] = useState(false)
  const guestUrl = `${window.location.origin}/invite/${eventId}`

  const handleCopy = () => {
    navigator.clipboard.writeText(guestUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleSetting = async (key: string, value: boolean) => {
    if (settings) {
      const { error } = await supabase.from('guest_page_settings').update({ [key]: value }).eq('id', settings.id)
      if (error) { toast('Failed to update setting', 'error'); return }
    } else {
      const { error } = await supabase.from('guest_page_settings').insert({ event_id: eventId, [key]: value })
      if (error) { toast('Failed to create setting', 'error'); return }
    }
    refetchSettings()
    toast('Setting updated')
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Share Guest Page</h2>
        <p className="card-subtitle">Share this URL with your guests so they can find their seats</p>
      </div>
      <div className="share-url" style={{ marginBottom: 'var(--space-5)' }}>
        <input className="input" readOnly value={guestUrl} />
        <button className="btn btn-primary" onClick={handleCopy}>{copied ? 'Copied!' : 'Copy'}</button>
      </div>
      <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
        <label className="checkbox-label">
          <input type="checkbox" checked={settings?.show_find_seat ?? true} onChange={e => toggleSetting('show_find_seat', e.target.checked)} />
          Show "Find Seat" section
        </label>
      </div>
      <div className="form-group">
        <label className="checkbox-label">
          <input type="checkbox" checked={settings?.show_venue_layout ?? true} onChange={e => toggleSetting('show_venue_layout', e.target.checked)} />
          Show "Venue Layout" section
        </label>
      </div>
    </div>
  )
}
