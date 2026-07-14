import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useEvent, useUpdateEvent, useCheckSlugAvailability } from '@/hooks/use-events'
import { useGuests, useUpdateGuest, useDeleteGuest, useBulkCreateGuests } from '@/hooks/use-guests'
import { useTables, useBulkCreateTables, useDeleteTable } from '@/hooks/use-tables'
import { useGuestPageSettings, useUpsertGuestPageSettings } from '@/hooks/use-guest-page-settings'
import { useToast } from '@/providers/toast-provider'
import { useConfirmDialog } from '@/providers/confirm-dialog'
import { AppHeader } from '@/components/app-header'
import { FONTS, getFontCss, loadGoogleFonts, formatTime12 } from '@/lib/fonts'
import { parseFile, matchTableByName, classifyError, type ParsedGuest } from '@/lib/guest-import'
import { uploadEventImage } from '@/lib/storage'
import QRCode from 'qrcode'
import type { GuestInput } from '@/types'

type Tab = 'details' | 'guests' | 'tables' | 'layout' | 'theme' | 'share'

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

// Logo size presets — map to pixel widths
const LOGO_SIZES = [
  { label: 'Small', value: 80 },
  { label: 'Medium', value: 160 },
  { label: 'Large', value: 280 },
  { label: 'Extra Large', value: 420 },
]

function TimeSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const time24 = value || '09:00'; const [h, m] = time24.split(':')
  let hour = parseInt(h, 10); const period = hour >= 12 ? 'PM' : 'AM'
  if (hour === 0) hour = 12; else if (hour > 12) hour -= 12
  const handleHour = (n: number) => { let h24 = n; if (period === 'PM' && n !== 12) h24 += 12; if (period === 'AM' && n === 12) h24 = 0; onChange(`${String(h24).padStart(2, '0')}:${m}`) }
  const handleMinute = (n: string) => { let h24 = hour; if (period === 'PM' && hour !== 12) h24 = hour + 12; if (period === 'AM' && hour === 12) h24 = 0; onChange(`${String(h24).padStart(2, '0')}:${n}`) }
  const handlePeriod = (p: string) => { let h24 = hour; if (p === 'PM' && hour !== 12) h24 = hour + 12; if (p === 'AM' && hour === 12) h24 = 0; if (p === 'PM' && hour === 12) h24 = 12; onChange(`${String(h24).padStart(2, '0')}:${m}`) }
  return <div className="time-selector"><select className="select" value={hour} onChange={(e) => handleHour(Number(e.target.value))}>{HOURS.map((h) => <option key={h} value={h}>{h}</option>)}</select><select className="select" value={m} onChange={(e) => handleMinute(e.target.value)}>{MINUTES.map((mm) => <option key={mm} value={mm}>{mm}</option>)}</select><select className="select" value={period} onChange={(e) => handlePeriod(e.target.value)}><option value="AM">AM</option><option value="PM">PM</option></select></div>
}

function FontDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <select className="select font-dropdown" value={value} onChange={(e) => onChange(e.target.value)}>{FONTS.map((f) => <option key={f.name} value={f.name} style={{ fontFamily: `'${f.cssName}', sans-serif` }}>{f.name}</option>)}</select>
}

function TypoCard({ label, font, size, color, onFont, onSize, onColor, previewText, previewStyle }: { label: string; font: string; size: number; color: string; onFont: (v: string) => void; onSize: (v: number) => void; onColor: (v: string) => void; previewText: string; previewStyle: React.CSSProperties }) {
  return <div className="typo-card"><div className="typo-card-header">{label}</div><div className="typo-card-controls"><div className="typo-card-field"><span className="typo-card-label">Font</span><FontDropdown value={font} onChange={onFont} /></div><div className="typo-card-field"><span className="typo-card-label">Size</span><div className="typo-size-control"><input type="range" className="range" min={10} max={72} value={size} onChange={(e) => onSize(Number(e.target.value))} /><span className="typo-size-value">{size}px</span></div></div><div className="typo-card-field"><span className="typo-card-label">Colour</span><input type="color" className="color-picker-sm" value={color} onChange={(e) => onColor(e.target.value)} /></div></div><div className="typo-card-preview" style={previewStyle}>{previewText}</div></div>
}

export function EventEditorPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const toast = useToast(); const { confirm } = useConfirmDialog()
  const { data: event, isLoading: eventLoading } = useEvent(eventId ?? '')
  const { data: guests } = useGuests(eventId ?? '')
  const { data: tables } = useTables(eventId ?? '')
  const { data: settings } = useGuestPageSettings(eventId ?? '')
  const updateEvent = useUpdateEvent(); const upsertSettings = useUpsertGuestPageSettings()
  const [activeTab, setActiveTab] = useState<Tab>('details')
  if (eventLoading || !event) return <><AppHeader /><div className="spinner-container"><div className="spinner spinner-lg" /></div></>
  const tabs: { id: Tab; label: string }[] = [{ id: 'details', label: 'Details' }, { id: 'guests', label: 'Guests' }, { id: 'tables', label: 'Tables' }, { id: 'layout', label: 'Layout' }, { id: 'theme', label: 'Theme' }, { id: 'share', label: 'Share' }]
  return <><AppHeader /><div className="page"><div className="page-header"><h1 className="page-title">{event.name}</h1><p className="page-subtitle">Manage your event details, guests, tables, and appearance</p></div><div className="tabs">{tabs.map((t) => <button key={t.id} className={`tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>)}</div>{activeTab === 'details' && <DetailsTab event={event} settings={settings} eventId={eventId!} updateEvent={updateEvent} upsertSettings={upsertSettings} toast={toast} />}{activeTab === 'guests' && <GuestsTab eventId={eventId!} guests={guests ?? []} tables={tables ?? []} toast={toast} confirm={confirm} />}{activeTab === 'tables' && <TablesTab eventId={eventId!} tables={tables ?? []} guests={guests ?? []} toast={toast} confirm={confirm} />}{activeTab === 'layout' && <LayoutTab eventId={eventId!} settings={settings} upsertSettings={upsertSettings} toast={toast} />}{activeTab === 'theme' && <ThemeTab eventId={eventId!} settings={settings} upsertSettings={upsertSettings} toast={toast} />}{activeTab === 'share' && <ShareTab event={event} eventId={eventId!} settings={settings} upsertSettings={upsertSettings} toast={toast} />}</div></>
}

function DetailsTab({ event, settings, eventId, updateEvent, upsertSettings, toast }: any) {
  const [name, setName] = useState(event.name)
  const [subtitle, setSubtitle] = useState(settings?.event_subtitle ?? '')
  const [date, setDate] = useState(event.date ?? '')
  const [time, setTime] = useState(event.time ?? '09:00')
  const [venue, setVenue] = useState(event.venue ?? '')
  const [detailsDirty, setDetailsDirty] = useState(false)

  // Logo state — restored logo management
  const [logoUrl, setLogoUrl] = useState<string | null>(settings?.logo_url ?? null)
  const [logoSize, setLogoSize] = useState<number>(settings?.logo_size ?? 80)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoDragOver, setLogoDragOver] = useState(false)
  const logoFileRef = useRef<HTMLInputElement>(null)

  // Typography state
  const [titleFont, setTitleFont] = useState('Inter'); const [titleSize, setTitleSize] = useState(32); const [titleColor, setTitleColor] = useState('#0f172a')
  const [subtitleFont, setSubtitleFont] = useState('Inter'); const [subtitleSize, setSubtitleSize] = useState(16); const [subtitleColor, setSubtitleColor] = useState('#64748b')
  const [datetimeFont, setDatetimeFont] = useState('Inter'); const [datetimeSize, setDatetimeSize] = useState(14); const [datetimeColor, setDatetimeColor] = useState('#64748b')
  const [venueFont, setVenueFont] = useState('Inter'); const [venueSize, setVenueSize] = useState(14); const [venueColor, setVenueColor] = useState('#64748b')
  const [typoDirty, setTypoDirty] = useState(false)

  // Sync state when settings arrive from server
  useEffect(() => {
    if (!settings) return
    setTitleFont(settings.font_title_family ?? 'Inter'); setTitleSize(settings.font_title_size ?? 32); setTitleColor(settings.font_title_color ?? '#0f172a')
    setSubtitleFont(settings.font_subtitle_family ?? 'Inter'); setSubtitleSize(settings.font_subtitle_size ?? 16); setSubtitleColor(settings.font_subtitle_color ?? '#64748b')
    setDatetimeFont(settings.font_datetime_family ?? 'Inter'); setDatetimeSize(settings.font_datetime_size ?? 14); setDatetimeColor(settings.font_datetime_color ?? '#64748b')
    setVenueFont(settings.font_venue_family ?? 'Inter'); setVenueSize(settings.font_venue_size ?? 14); setVenueColor(settings.font_venue_color ?? '#64748b')
    setSubtitle(settings.event_subtitle ?? '')
    setLogoUrl(settings.logo_url ?? null)
    setLogoSize(settings.logo_size ?? 80)
  }, [settings])

  useEffect(() => {
    setDetailsDirty(
      name !== event.name ||
      subtitle !== (settings?.event_subtitle ?? '') ||
      date !== (event.date ?? '') ||
      time !== (event.time ?? '09:00') ||
      venue !== (event.venue ?? '') ||
      logoUrl !== (settings?.logo_url ?? null) ||
      logoSize !== (settings?.logo_size ?? 80)
    )
  }, [name, subtitle, date, time, venue, logoUrl, logoSize, event, settings])

  const allFonts = [titleFont, subtitleFont, datetimeFont, venueFont]
  useEffect(() => { loadGoogleFonts(allFonts) }, allFonts)

  useEffect(() => {
    if (!settings) { setTypoDirty(false); return }
    setTypoDirty(
      titleFont !== (settings.font_title_family ?? 'Inter') || titleSize !== (settings.font_title_size ?? 32) || titleColor !== (settings.font_title_color ?? '#0f172a') ||
      subtitleFont !== (settings.font_subtitle_family ?? 'Inter') || subtitleSize !== (settings.font_subtitle_size ?? 16) || subtitleColor !== (settings.font_subtitle_color ?? '#64748b') ||
      datetimeFont !== (settings.font_datetime_family ?? 'Inter') || datetimeSize !== (settings.font_datetime_size ?? 14) || datetimeColor !== (settings.font_datetime_color ?? '#64748b') ||
      venueFont !== (settings.font_venue_family ?? 'Inter') || venueSize !== (settings.font_venue_size ?? 14) || venueColor !== (settings.font_venue_color ?? '#64748b')
    )
  }, [titleFont, titleSize, titleColor, subtitleFont, subtitleSize, subtitleColor, datetimeFont, datetimeSize, datetimeColor, venueFont, venueSize, venueColor, settings])

  // Logo upload handler — supports drag & drop and browse
  const handleLogoFile = async (file: File) => {
    if (!file.type.match(/image\/(png|jpe?g|svg\+xml|webp)/)) {
      toast('Please use PNG, JPG, SVG, or WebP', 'error')
      return
    }
    setLogoUploading(true)
    try {
      // Read as data URL for immediate preview
      const reader = new FileReader()
      reader.onload = () => {
        setLogoUrl(reader.result as string)
        setLogoUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load image', 'error')
      setLogoUploading(false)
    }
  }

  const handleLogoUpload = async (): Promise<string | null> => {
    if (!logoUrl) return null
    // If it's a data URL, upload to storage
    if (logoUrl.startsWith('data:')) {
      try {
        const response = await fetch(logoUrl)
        const blob = await response.blob()
        const file = new File([blob], `logo-${Date.now()}.png`, { type: blob.type || 'image/png' })
        const publicUrl = await uploadEventImage(eventId, file, 'logo')
        setLogoUrl(publicUrl)
        return publicUrl
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Failed to upload logo', 'error')
        throw err
      }
    }
    return logoUrl
  }

  const handleRemoveLogo = () => {
    setLogoUrl(null)
  }

  const handleSaveDetails = async () => {
    try {
      // Upload logo to storage if it's a data URL
      let finalLogoUrl: string | null = logoUrl
      if (logoUrl && logoUrl.startsWith('data:')) {
        finalLogoUrl = await handleLogoUpload()
      }

      await updateEvent.mutateAsync({ id: eventId, name, slug: event.slug, date: date || null, time: time || null, venue: venue || null })
      await upsertSettings.mutateAsync({
        event_id: eventId,
        event_subtitle: subtitle || null,
        logo_url: finalLogoUrl,
        logo_size: logoSize,
      })
      toast('Event details saved'); setDetailsDirty(false)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save', 'error')
    }
  }

  const handleSaveTypography = async () => {
    try {
      await upsertSettings.mutateAsync({
        event_id: eventId,
        font_title_family: titleFont, font_title_size: titleSize, font_title_color: titleColor,
        font_subtitle_family: subtitleFont, font_subtitle_size: subtitleSize, font_subtitle_color: subtitleColor,
        font_datetime_family: datetimeFont, font_datetime_size: datetimeSize, font_datetime_color: datetimeColor,
        font_venue_family: venueFont, font_venue_size: venueSize, font_venue_color: venueColor,
      })
      toast('Typography saved'); setTypoDirty(false)
    } catch (err) { toast(err instanceof Error ? err.message : 'Failed to save', 'error') }
  }

  const logoSizeLabel = LOGO_SIZES.find((s) => s.value === logoSize)?.label ?? 'Custom'

  return (
    <div className="section">
      <div className="card section">
        <div className="card-header"><h3 className="card-title">Event Details</h3><p className="card-subtitle">Basic information about your event</p></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Event Name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Wedding" /></div>
          <div className="form-group"><label className="form-label">Subtitle (optional)</label><input className="input" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Together With Our Families" /></div>
        </div>
        <div className="form-row" style={{ marginTop: 'var(--space-4)' }}>
          <div className="form-group"><label className="form-label">Venue</label><input className="input" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Grand Hotel" /></div>
        </div>
        <div className="form-row" style={{ marginTop: 'var(--space-4)' }}>
          <div className="form-group"><label className="form-label">Date</label><input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Time</label><TimeSelector value={time} onChange={setTime} /></div>
        </div>

        {/* Logo Management Section — restored */}
        <div className="logo-section" style={{ marginTop: 'var(--space-5)' }}>
          <label className="form-label">Logo</label>
          {logoUrl ? (
            <div className="logo-preview-area">
              <div className="logo-preview-box">
                <img src={logoUrl} alt="Event logo preview" style={{ maxWidth: '100%', maxHeight: '120px', objectFit: 'contain' }} />
              </div>
              <div className="logo-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => logoFileRef.current?.click()} disabled={logoUploading}>Replace</button>
                <button className="btn btn-ghost btn-sm" onClick={handleRemoveLogo} disabled={logoUploading}>Remove</button>
              </div>
            </div>
          ) : (
            <div
              className={`dropzone ${logoDragOver ? 'dropzone-active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setLogoDragOver(true) }}
              onDragLeave={() => setLogoDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setLogoDragOver(false); if (e.dataTransfer.files[0]) handleLogoFile(e.dataTransfer.files[0]) }}
              onClick={() => logoFileRef.current?.click()}
            >
              <p className="dropzone-text">{logoUploading ? 'Uploading…' : 'Drop logo here or click to browse'}</p>
              <p className="dropzone-hint">PNG, JPG, SVG, or WebP</p>
            </div>
          )}
          <input ref={logoFileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && handleLogoFile(e.target.files[0])} />

          {/* Logo Size Controls — preset buttons */}
          <div className="logo-size-controls" style={{ marginTop: 'var(--space-4)' }}>
            <label className="form-label">Logo Size</label>
            <div className="logo-size-presets">
              {LOGO_SIZES.map((s) => (
                <button
                  key={s.value}
                  className={`btn btn-sm ${logoSize === s.value ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setLogoSize(s.value)}
                >{s.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-5)' }}><button className="btn btn-primary" onClick={handleSaveDetails} disabled={!detailsDirty || updateEvent.isPending || upsertSettings.isPending || logoUploading}>{updateEvent.isPending || upsertSettings.isPending ? 'Saving…' : 'Save Changes'}</button></div>
      </div>

      {/* Live Preview — shows logo, title, subtitle, date, venue */}
      <div className="card section">
        <div className="card-header"><h3 className="card-title">Live Preview</h3><p className="card-subtitle">See how your guest page will look</p></div>
        <div className="gp-preview-container">
          {logoUrl && (
            <div className="gp-preview-logo-wrapper">
              <img src={logoUrl} alt="Logo preview" style={{ width: `${Math.min(logoSize, 500)}px`, maxWidth: '100%', height: 'auto', objectFit: 'contain' }} />
            </div>
          )}
          <h3 className="gp-preview-title" style={{ fontFamily: getFontCss(titleFont), fontSize: `${titleSize}px`, color: titleColor }}>{name || 'Event Name'}</h3>
          {subtitle && subtitle.trim() && (
            <p className="gp-preview-subtitle" style={{ fontFamily: getFontCss(subtitleFont), fontSize: `${subtitleSize}px`, color: subtitleColor }}>{subtitle}</p>
          )}
          {date && <p className="gp-preview-datetime" style={{ fontFamily: getFontCss(datetimeFont), fontSize: `${datetimeSize}px`, color: datetimeColor }}>{new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>}
          {time && <p className="gp-preview-datetime" style={{ fontFamily: getFontCss(datetimeFont), fontSize: `${datetimeSize}px`, color: datetimeColor }}>{formatTime12(time)}</p>}
          {venue && <p className="gp-preview-venue" style={{ fontFamily: getFontCss(venueFont), fontSize: `${venueSize}px`, color: venueColor }}>{venue}</p>}
        </div>
      </div>

      <div className="card section">
        <div className="card-header"><h3 className="card-title">Typography</h3><p className="card-subtitle">Fonts, sizes, and colours for each text element. Preview updates live.</p></div>
        <div className="typo-cards">
          <TypoCard label="Event Title" font={titleFont} size={titleSize} color={titleColor} onFont={setTitleFont} onSize={setTitleSize} onColor={setTitleColor} previewText={name || 'Event Name'} previewStyle={{ fontFamily: getFontCss(titleFont), fontSize: `${titleSize}px`, color: titleColor }} />
          <TypoCard label="Event Subtitle" font={subtitleFont} size={subtitleSize} color={subtitleColor} onFont={setSubtitleFont} onSize={setSubtitleSize} onColor={setSubtitleColor} previewText={subtitle || 'Event Subtitle'} previewStyle={{ fontFamily: getFontCss(subtitleFont), fontSize: `${subtitleSize}px`, color: subtitleColor }} />
          <TypoCard label="Date & Time" font={datetimeFont} size={datetimeSize} color={datetimeColor} onFont={setDatetimeFont} onSize={setDatetimeSize} onColor={setDatetimeColor} previewText={date && time ? `${new Date(date).toLocaleDateString()} at ${formatTime12(time)}` : 'Date & Time'} previewStyle={{ fontFamily: getFontCss(datetimeFont), fontSize: `${datetimeSize}px`, color: datetimeColor }} />
          <TypoCard label="Venue" font={venueFont} size={venueSize} color={venueColor} onFont={setVenueFont} onSize={setVenueSize} onColor={setVenueColor} previewText={venue || 'Venue Name'} previewStyle={{ fontFamily: getFontCss(venueFont), fontSize: `${venueSize}px`, color: venueColor }} />
        </div>
        <div style={{ marginTop: 'var(--space-5)' }}><button className="btn btn-primary" onClick={handleSaveTypography} disabled={!typoDirty || upsertSettings.isPending}>{upsertSettings.isPending ? 'Saving…' : 'Save Typography'}</button></div>
      </div>
    </div>
  )
}

function GuestsTab({ eventId, guests, tables, toast, confirm }: any) {
  const [search, setSearch] = useState(''); const [sortBy, setSortBy] = useState<'name'|'table'|'created'>('name'); const [filterTable, setFilterTable] = useState('')
  const [editingId, setEditingId] = useState<string|null>(null); const [editName, setEditName] = useState(''); const [editTable, setEditTable] = useState('')
  const [bulkText, setBulkText] = useState(''); const [bulkTable, setBulkTable] = useState('')
  const [parsedGuests, setParsedGuests] = useState<ParsedGuest[]>([]); const [importFile, setImportFile] = useState<File|null>(null)
  const [importing, setImporting] = useState(false); const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const updateGuest = useUpdateGuest(); const deleteGuest = useDeleteGuest(); const bulkCreateGuests = useBulkCreateGuests()
  const tableMap: Map<string, { id: string; name: string }> = new Map(tables.map((t: any) => [t.id, t] as [string, { id: string; name: string }]))
  const filtered = guests.filter((g: any) => { if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false; if (filterTable && g.table_id !== filterTable) return false; return true }).sort((a: any, b: any) => { if (sortBy === 'name') return a.name.localeCompare(b.name); if (sortBy === 'table') return (tableMap.get(a.table_id ?? '')?.name ?? '').localeCompare(tableMap.get(b.table_id ?? '')?.name ?? ''); return new Date(b.created_at).getTime() - new Date(a.created_at).getTime() })
  const handleEdit = (g: any) => { setEditingId(g.id); setEditName(g.name); setEditTable(g.table_id ?? '') }
  const handleSaveEdit = async () => { if (!editingId || !editName.trim()) return; try { await updateGuest.mutateAsync({ id: editingId, event_id: eventId, name: editName.trim(), table_id: editTable || null }); toast('Guest updated'); setEditingId(null) } catch (err) { toast(err instanceof Error ? err.message : 'Failed to update guest', 'error') } }
  const handleDelete = async (id: string, name: string) => { const confirmed = await confirm({ title: 'Delete Guest', message: `Remove "${name}" from the guest list?`, confirmText: 'Delete' }); if (!confirmed) return; try { await deleteGuest.mutateAsync(id); toast('Guest removed') } catch (err) { toast(err instanceof Error ? err.message : 'Failed to delete guest', 'error') } }
  const handleBulkAdd = async () => { const lines = bulkText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean); if (lines.length === 0) { toast('Enter at least one guest name', 'error'); return } try { const guestsInput: GuestInput[] = lines.map((n: string) => ({ name: n, event_id: eventId, table_id: bulkTable || null })); await bulkCreateGuests.mutateAsync({ event_id: eventId, guests: guestsInput }); toast(`Added ${lines.length} guests`); setBulkText('') } catch (err) { toast(classifyError(err), 'error') } }
  const handleFileSelect = async (file: File) => { setImportFile(file); setImporting(true); try { const result = await parseFile(file); if (result.guests.length === 0) { toast('No guests found in file', 'error'); return } setParsedGuests(result.guests); toast(`Found ${result.guests.length} guests in ${result.format} file`) } catch (err) { toast(classifyError(err), 'error') } finally { setImporting(false) } }
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f) }
  const handleParsedGuestChange = (i: number, field: 'name'|'tableName', value: string) => { const u = [...parsedGuests]; u[i][field] = value; setParsedGuests(u) }
  const handleConfirmImport = async () => { const valid = parsedGuests.filter((g) => g.name.trim()); if (valid.length === 0) return; setImporting(true); try { const guestsInput: GuestInput[] = valid.map((g) => ({ name: g.name.trim(), event_id: eventId, table_id: g.tableName.trim() ? matchTableByName(g.tableName, tables) : null })); await bulkCreateGuests.mutateAsync({ event_id: eventId, guests: guestsInput }); toast(`Imported ${valid.length} guests`); setParsedGuests([]); setImportFile(null) } catch (err) { toast(classifyError(err), 'error') } finally { setImporting(false) } }
  return <div className="two-col"><div className="card"><div className="card-header"><h3 className="card-title">Guest List</h3><p className="card-subtitle">{guests.length} guest{guests.length !== 1 ? 's' : ''} total</p></div><div className="guest-filters"><input className="input" placeholder="Search guests…" value={search} onChange={(e) => setSearch(e.target.value)} /><select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}><option value="name">Sort by Name</option><option value="table">Sort by Table</option><option value="created">Sort by Recent</option></select><select className="select" value={filterTable} onChange={(e) => setFilterTable(e.target.value)}><option value="">All Tables</option>{tables.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div><div className="guest-list">{filtered.length === 0 ? <div className="empty-state" style={{ padding: 'var(--space-7)' }}><p>{search || filterTable ? 'No guests match your filters' : 'No guests yet. Add some from the panel on the right.'}</p></div> : filtered.map((g: any) => <div key={g.id} className="guest-row">{editingId === g.id ? <div className="guest-row-edit"><input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" autoFocus /><select className="select" value={editTable} onChange={(e) => setEditTable(e.target.value)}><option value="">No Table</option>{tables.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}</select><button className="btn btn-primary btn-sm" onClick={handleSaveEdit}>Save</button><button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button></div> : <><span className="guest-name">{g.name}</span><span className="guest-table">{g.table_id ? tableMap.get(g.table_id)?.name ?? 'Unknown' : 'No table'}</span><div className="guest-row-actions"><button className="btn btn-ghost btn-sm" onClick={() => handleEdit(g)}>Edit</button><button className="btn btn-ghost btn-sm" onClick={() => handleDelete(g.id, g.name)}>Delete</button></div></>}</div>)}</div></div><div className="guest-mgmt-panel"><div className="card card-sm section"><div className="card-header"><h3 className="card-title">Manual Bulk Add</h3><p className="card-subtitle">One guest per line. Paste from Excel or type manually.</p></div><textarea className="textarea bulk-textarea" placeholder={'John Tan\nSarah Lee\nAhmad Bin Ali\nLim Wei Jie\nNur Aisyah'} value={bulkText} onChange={(e) => setBulkText(e.target.value)} rows={10} /><div className="form-group" style={{ marginTop: 'var(--space-3)' }}><label className="form-label">Assign to Table (optional)</label><select className="select" value={bulkTable} onChange={(e) => setBulkTable(e.target.value)}><option value="">No Table</option>{tables.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div><div className="manual-actions" style={{ marginTop: 'var(--space-4)' }}><span className="form-hint">{bulkText.split(/\r?\n/).filter((l) => l.trim()).length} guests</span><button className="btn btn-primary btn-sm" onClick={handleBulkAdd} disabled={bulkCreateGuests.isPending}>{bulkCreateGuests.isPending ? 'Adding…' : 'Add Guests'}</button></div></div><div className="card card-sm section"><div className="card-header"><h3 className="card-title">Import Guest List</h3><p className="card-subtitle">CSV, Excel, or PDF</p></div>{!parsedGuests.length ? <div className={`dropzone ${dragOver ? 'dropzone-active' : ''}`} onDragOver={(e) => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}><p className="dropzone-text">{importing ? 'Parsing…' : 'Drop file here or click to browse'}</p><p className="dropzone-hint">Supports CSV, XLSX, XLS, PDF</p><input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.pdf" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} /></div> : <div className="import-review"><div className="import-review-header"><span>{parsedGuests.length} guests found in {importFile?.name}</span><button className="btn btn-ghost btn-sm" onClick={() => { setParsedGuests([]); setImportFile(null) }}>Cancel</button></div><div className="import-review-list">{parsedGuests.map((g, i) => <div key={i} className="import-review-row"><input className="input" value={g.name} onChange={(e) => handleParsedGuestChange(i, 'name', e.target.value)} /><input className="input" placeholder="Table" value={g.tableName} onChange={(e) => handleParsedGuestChange(i, 'tableName', e.target.value)} /><button className="btn btn-ghost btn-sm" onClick={() => setParsedGuests(parsedGuests.filter((_, idx) => idx !== i))}>Remove</button></div>)}</div><button className="btn btn-primary btn-block" onClick={handleConfirmImport} disabled={importing}>{importing ? 'Importing…' : `Confirm Import (${parsedGuests.filter((g) => g.name.trim()).length})`}</button></div>}</div></div></div>
}

function TablesTab({ eventId, tables, guests, toast, confirm }: any) {
  const [mode, setMode] = useState<'sequential'|'custom'>('sequential')
  const [prefix, setPrefix] = useState('Table'); const [startNum, setStartNum] = useState(1); const [count, setCount] = useState(10); const [seats, setSeats] = useState(8)
  const [customRows, setCustomRows] = useState<{ name: string; capacity: number }[]>([{ name: '', capacity: 8 }])
  const bulkCreateTables = useBulkCreateTables(); const deleteTable = useDeleteTable()
  const guestCount = (tableId: string) => guests.filter((g: any) => g.table_id === tableId).length
  const handleSequentialCreate = async () => { const newTables = []; for (let i = 0; i < count; i++) { const num = startNum + i; newTables.push({ name: `${prefix} ${num}`, number: num, capacity: seats }) } try { await bulkCreateTables.mutateAsync({ event_id: eventId, tables: newTables }); toast(`Created ${count} tables`) } catch (err) { toast(err instanceof Error ? err.message : 'Failed to create tables', 'error') } }
  const handleCustomRowChange = (index: number, field: 'name'|'capacity', value: string|number) => { const updated = [...customRows]; if (field === 'name') updated[index].name = value as string; else updated[index].capacity = value as number; setCustomRows(updated) }
  const handleCustomCreate = async () => { const valid = customRows.filter((r) => r.name.trim()); if (valid.length === 0) { toast('Enter at least one table name', 'error'); return } const names = valid.map((r) => r.name.trim()); const dupes = names.filter((n, i) => names.indexOf(n) !== i); if (dupes.length > 0) { toast(`Duplicate table names: ${dupes.join(', ')}`, 'error'); return } const existingNames = tables.map((t: any) => t.name.toLowerCase()); const conflicts = names.filter((n) => existingNames.includes(n.toLowerCase())); if (conflicts.length > 0) { toast(`Tables already exist: ${conflicts.join(', ')}`, 'error'); return } const newTables = valid.map((r, i) => ({ name: r.name.trim(), number: tables.length + i + 1, capacity: r.capacity })); try { await bulkCreateTables.mutateAsync({ event_id: eventId, tables: newTables }); toast(`Created ${valid.length} tables`); setCustomRows([{ name: '', capacity: 8 }]) } catch (err) { toast(err instanceof Error ? err.message : 'Failed to create tables', 'error') } }
  const handleDeleteTable = async (id: string, name: string) => { const confirmed = await confirm({ title: 'Delete Table', message: `Delete "${name}"? Guests at this table will be unassigned.`, confirmText: 'Delete' }); if (!confirmed) return; try { await deleteTable.mutateAsync(id); toast('Table deleted') } catch (err) { toast(err instanceof Error ? err.message : 'Failed to delete table', 'error') } }
  return <div className="section"><div className="card section"><div className="card-header"><h3 className="card-title">Bulk Create Tables</h3><p className="card-subtitle">Create multiple tables at once</p></div><div className="mode-toggle"><button className={`btn btn-sm ${mode === 'sequential' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('sequential')}>Sequential Numbering</button><button className={`btn btn-sm ${mode === 'custom' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('custom')}>Custom Names</button></div>{mode === 'sequential' ? <div className="bulk-form"><div className="form-row"><div className="form-group"><label className="form-label">Prefix</label><input className="input" value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="Table" /></div><div className="form-group"><label className="form-label">Start Number</label><input type="number" className="input" value={startNum} min={1} onChange={(e) => setStartNum(Number(e.target.value))} /></div><div className="form-group"><label className="form-label">Count</label><input type="number" className="input" value={count} min={1} max={100} onChange={(e) => setCount(Number(e.target.value))} /></div><div className="form-group"><label className="form-label">Seats per Table</label><input type="number" className="input" value={seats} min={1} onChange={(e) => setSeats(Number(e.target.value))} /></div></div><div className="bulk-preview"><span className="form-hint">Will create: {prefix} {startNum}, {prefix} {startNum + 1}, … {prefix} {startNum + count - 1}</span></div><button className="btn btn-primary" onClick={handleSequentialCreate} disabled={bulkCreateTables.isPending}>{bulkCreateTables.isPending ? 'Creating…' : `Create ${count} Tables`}</button></div> : <div className="bulk-form"><div className="custom-rows">{customRows.map((row, i) => <div key={i} className="custom-row"><input className="input" placeholder="Table name" value={row.name} onChange={(e) => handleCustomRowChange(i, 'name', e.target.value)} /><input type="number" className="input" placeholder="Capacity" value={row.capacity} min={1} onChange={(e) => handleCustomRowChange(i, 'capacity', Number(e.target.value))} style={{ maxWidth: '120px' }} /><button className="btn btn-ghost btn-sm" onClick={() => setCustomRows(customRows.filter((_, idx) => idx !== i))}>Remove</button></div>)}</div><div className="manual-actions"><button className="btn btn-ghost btn-sm" onClick={() => setCustomRows([...customRows, { name: '', capacity: 8 }])}>+ Add Row</button><button className="btn btn-primary btn-sm" onClick={handleCustomCreate} disabled={bulkCreateTables.isPending}>{bulkCreateTables.isPending ? 'Creating…' : 'Create Tables'}</button></div></div>}</div>{tables.length > 0 && <div className="card section"><div className="card-header"><h3 className="card-title">Existing Tables</h3><p className="card-subtitle">{tables.length} table{tables.length !== 1 ? 's' : ''}</p></div><div className="grid grid-3">{tables.map((t: any) => <div key={t.id} className="card card-sm table-card"><div className="table-card-header"><h4 className="table-card-name">{t.name}</h4><span className="badge">{guestCount(t.id)} / {t.capacity}</span></div><button className="btn btn-ghost btn-sm" onClick={() => handleDeleteTable(t.id, t.name)}>Delete</button></div>)}</div></div>}</div>
}

function LayoutTab({ eventId, settings, upsertSettings, toast }: any) {
  const [image, setImage] = useState<string|null>(settings?.venue_image_url ?? null)
  const [dragOver, setDragOver] = useState(false); const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const handleFile = (file: File) => { if (!file.type.match(/image\/(png|jpe?g|svg|webp)/)) { toast('Please use PNG, JPG, SVG, or WebP', 'error'); return } const reader = new FileReader(); reader.onload = () => setImage(reader.result as string); reader.readAsDataURL(file) }
  const handleSave = async () => { setSaving(true); try { await upsertSettings.mutateAsync({ event_id: eventId, venue_image_url: image }); toast('Venue layout saved') } catch (err) { toast(err instanceof Error ? err.message : 'Failed to save', 'error') } finally { setSaving(false) } }
  return <div className="section"><div className="card"><div className="card-header"><h3 className="card-title">Venue Layout</h3><p className="card-subtitle">Upload a floor plan or seating chart image</p></div>{image ? <div className="venue-preview"><img src={image} alt="Venue layout" className="venue-preview-img" /><div className="venue-preview-actions"><button className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()}>Replace</button><button className="btn btn-ghost btn-sm" onClick={() => setImage(null)}>Remove</button></div></div> : <div className={`dropzone dropzone-lg ${dragOver ? 'dropzone-active' : ''}`} onDragOver={(e) => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]) }} onClick={() => fileInputRef.current?.click()}><p className="dropzone-text">Drop image here or click to browse</p><p className="dropzone-hint">PNG, JPG, SVG, or WebP</p></div>}<input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />{image && <div style={{ marginTop: 'var(--space-5)' }}><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Layout'}</button></div>}</div></div>
}

function ThemeTab({ eventId, settings, upsertSettings, toast }: any) {
  const [primary, setPrimary] = useState(settings?.color_primary ?? '#0f766e'); const [background, setBackground] = useState(settings?.color_background ?? '#f8fafc'); const [card, setCard] = useState(settings?.color_card ?? '#ffffff'); const [text, setText] = useState(settings?.color_text ?? '#0f172a'); const [header, setHeader] = useState(settings?.color_header ?? '#ffffff'); const [radius, setRadius] = useState(settings?.border_radius ?? 16); const [logoSize, setLogoSize] = useState(settings?.logo_size ?? 80); const [logoRounded, setLogoRounded] = useState(settings?.logo_rounded ?? false); const [dirty, setDirty] = useState(false); const [saving, setSaving] = useState(false)
  useEffect(() => { setDirty(primary !== (settings?.color_primary ?? '#0f766e') || background !== (settings?.color_background ?? '#f8fafc') || card !== (settings?.color_card ?? '#ffffff') || text !== (settings?.color_text ?? '#0f172a') || header !== (settings?.color_header ?? '#ffffff') || radius !== (settings?.border_radius ?? 16) || logoSize !== (settings?.logo_size ?? 80) || logoRounded !== (settings?.logo_rounded ?? false)) }, [primary, background, card, text, header, radius, logoSize, logoRounded, settings])
  const handleSave = async () => { setSaving(true); try { await upsertSettings.mutateAsync({ event_id: eventId, color_primary: primary, color_background: background, color_card: card, color_text: text, color_header: header, border_radius: radius, logo_size: logoSize, logo_rounded: logoRounded }); toast('Theme saved'); setDirty(false) } catch (err) { toast(err instanceof Error ? err.message : 'Failed to save', 'error') } finally { setSaving(false) } }
  const colorFields = [{ label: 'Primary', value: primary, setter: setPrimary }, { label: 'Background', value: background, setter: setBackground }, { label: 'Card', value: card, setter: setCard }, { label: 'Text', value: text, setter: setText }, { label: 'Header', value: header, setter: setHeader }]
  const logoSizeLabel = logoSize <= 80 ? 'Small' : logoSize <= 160 ? 'Medium' : logoSize <= 300 ? 'Large' : 'Extra Large'
  return <div className="section"><div className="card section"><div className="card-header"><h3 className="card-title">Colors</h3><p className="card-subtitle">Customise your guest website color scheme</p></div><div className="grid grid-3">{colorFields.map((f) => <div key={f.label} className="form-group"><label className="form-label">{f.label}</label><div className="color-field"><input type="color" className="color-picker" value={f.value} onChange={(e) => f.setter(e.target.value)} /><input className="input" value={f.value} onChange={(e) => f.setter(e.target.value)} style={{ flex: 1 }} /></div></div>)}</div></div><div className="card section"><div className="card-header"><h3 className="card-title">Layout</h3></div><div className="form-row"><div className="form-group"><label className="form-label">Border Radius ({radius}px)</label><input type="range" className="range" min={0} max={32} value={radius} onChange={(e) => setRadius(Number(e.target.value))} /></div><div className="form-group"><label className="form-label">Logo Size ({logoSize}px — {logoSizeLabel})</label><input type="range" className="range" min={40} max={500} step={10} value={logoSize} onChange={(e) => setLogoSize(Number(e.target.value))} /></div></div><div className="form-group" style={{ marginTop: 'var(--space-4)' }}><label className="checkbox-label"><input type="checkbox" checked={logoRounded} onChange={(e) => setLogoRounded(e.target.checked)} /> Rounded logo corners</label></div></div><button className="btn btn-primary" onClick={handleSave} disabled={!dirty || saving}>{saving ? 'Saving…' : 'Save Theme'}</button></div>
}

function ShareTab({ event, eventId, settings, upsertSettings, toast }: any) {
  const [slug, setSlug] = useState(event.slug); const [slugCheck, setSlugCheck] = useState(''); const [qrUrl, setQrUrl] = useState('')
  const baseUrl = window.location.origin; const guestUrl = `${baseUrl}/e/${slug}`
  const { data: slugResult, refetch, isFetching } = useCheckSlugAvailability({ slug: slugCheck, eventId })
  useEffect(() => { QRCode.toDataURL(guestUrl, { width: 256, margin: 2 }).then(setQrUrl).catch(() => {}) }, [guestUrl])
  const handleCheckSlug = async () => { if (!slug.trim()) return; setSlugCheck(slug.trim()); await refetch() }
  const handleSaveSlug = async () => { if (!slug.trim()) return; try { await upsertSettings.mutateAsync({ event_id: eventId }); toast('URL updated') } catch (err) { toast(err instanceof Error ? err.message : 'Failed to update URL', 'error') } }
  const handleCopy = (text: string) => { navigator.clipboard.writeText(text); toast('Copied to clipboard') }
  const handleDownloadQR = (format: 'png'|'svg') => { if (format === 'png' && qrUrl) { const a = document.createElement('a'); a.href = qrUrl; a.download = `${slug}-qr.png`; a.click() } else if (format === 'svg') { QRCode.toString(guestUrl, { type: 'svg', margin: 2 }).then((svg) => { const blob = new Blob([svg], { type: 'image/svg+xml' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${slug}-qr.svg`; a.click(); URL.revokeObjectURL(url) }) } }
  return <div className="section"><div className="card section"><div className="card-header"><h3 className="card-title">Guest Website URL</h3><p className="card-subtitle">Share this link with your guests</p></div><div className="share-url"><input className="input" value={guestUrl} readOnly /><button className="btn btn-ghost" onClick={() => handleCopy(guestUrl)}>Copy</button><button className="btn btn-primary" onClick={() => window.open(guestUrl, '_blank')}>Open</button></div></div><div className="card section"><div className="card-header"><h3 className="card-title">Custom URL Slug</h3><p className="card-subtitle">Change the URL for your guest page</p></div><div className="form-row"><div className="form-group"><label className="form-label">Slug</label><input className="input" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugCheck('') }} placeholder="my-event" /></div><div className="form-group" style={{ flex: '0 0 auto', alignSelf: 'flex-end' }}><button className="btn btn-ghost" onClick={handleCheckSlug} disabled={isFetching}>Check</button></div></div>{slugResult && slugCheck && <p className={`form-hint ${slugResult.available ? 'hint-success' : 'hint-error'}`}>{slugResult.available ? 'URL is available!' : 'URL is already taken'}</p>}<div style={{ marginTop: 'var(--space-4)' }}><button className="btn btn-primary" onClick={handleSaveSlug} disabled={!slug.trim()}>Save URL</button></div></div><div className="card section"><div className="card-header"><h3 className="card-title">QR Code</h3><p className="card-subtitle">Download a QR code for printed materials</p></div><div className="qr-section">{qrUrl && <img src={qrUrl} alt="QR Code" className="qr-preview" />}<div className="qr-actions"><button className="btn btn-ghost" onClick={() => handleDownloadQR('png')}>Download PNG</button><button className="btn btn-ghost" onClick={() => handleDownloadQR('svg')}>Download SVG</button></div></div></div></div>
}
