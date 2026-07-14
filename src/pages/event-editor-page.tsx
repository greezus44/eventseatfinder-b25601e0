import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/use-events';
import { useGuests, useCreateGuest, useBulkCreateGuests, useUpdateGuest, useDeleteGuest } from '@/hooks/use-guests';
import { useTables, useCreateTable, useDeleteTable } from '@/hooks/use-tables';
import { useGuestPageSettings, useUpsertGuestPageSettings } from '@/hooks/use-guest-page-settings';
import { useToast } from '@/providers/toast-provider';
import { ConfirmDialog, Modal } from '@/components/ui/confirm-dialog';
import { DEFAULT_SETTINGS, FONT_OPTIONS, THEME_PRESETS } from '@/types/guest-page-settings';
import type { GuestPageSettingsInput } from '@/types/guest-page-settings';
import type { GuestPageSettings } from '@/types/guest-page-settings';
import type { GuestWithTable } from '@/types/guest';

type Tab = 'details' | 'guests' | 'tables' | 'venue' | 'schedule' | 'settings';

const TABS: { id: Tab; label: string }[] = [
  { id: 'details', label: 'Event Details' },
  { id: 'guests', label: 'Guests' },
  { id: 'tables', label: 'Tables' },
  { id: 'venue', label: 'Venue Layout' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'settings', label: 'Settings' },
];

const LOGO_SIZE_PRESETS = [
  { label: 'Small', value: 48 },
  { label: 'Medium', value: 64 },
  { label: 'Large', value: 96 },
];

const ACCEPTED_FORMATS = '.png,.jpg,.jpeg,.svg,.webP';
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const EE_CSS = `
.ee-root { min-height: 100vh; background: #F8F8F8; font-family: 'Inter', sans-serif; }
.ee-header {
  background: #FFFFFF; border-bottom: 1px solid #EFEFEF; padding: 16px 32px;
  display: flex; align-items: center; gap: 16px; position: sticky; top: 0; z-index: 100;
}
.ee-back-btn {
  display: flex; align-items: center; gap: 6px; padding: 8px 14px;
  border: 1px solid #DADADA; border-radius: 10px; font-size: 13px; font-weight: 500;
  color: #4A4A4A; transition: all 200ms ease;
}
.ee-back-btn:hover { background: #EFEFEF; color: #1A1A1A; }
.ee-title { font-size: 18px; font-weight: 600; color: #1A1A1A; }
.ee-tabs {
  display: flex; gap: 4px; background: #FFFFFF; border-bottom: 1px solid #EFEFEF;
  padding: 0 32px; overflow-x: auto;
}
.ee-tab {
  padding: 12px 20px; font-size: 13px; font-weight: 500; color: #B0B0B0;
  border-bottom: 2px solid transparent; transition: all 200ms ease; white-space: nowrap;
}
.ee-tab:hover { color: #4A4A4A; }
.ee-tab--active { color: #1A1A1A; border-bottom-color: #1A1A1A; }
.ee-body { padding: 32px; max-width: 900px; margin: 0 auto; }
.ee-panel { animation: ee-fade 300ms ease; }
@keyframes ee-fade { from { opacity: 0; } to { opacity: 1; } }

/* Form elements — consistent rectangular with 12px radius */
.ee-field { margin-bottom: 20px; }
.ee-label { display: block; font-size: 13px; font-weight: 600; color: #4A4A4A; margin-bottom: 6px; }
.ee-input, .ee-select, .ee-textarea {
  width: 100%; height: 44px; padding: 10px 14px;
  border: 1px solid #DADADA; border-radius: 12px;
  background: #FFFFFF; font-size: 14px; color: #1A1A1A;
  outline: none; transition: border-color 200ms ease, box-shadow 200ms ease;
}
.ee-input:focus, .ee-select:focus, .ee-textarea:focus {
  border-color: #1A1A1A; box-shadow: 0 0 0 3px rgba(0,0,0,0.06);
}
.ee-textarea { height: auto; min-height: 100px; resize: vertical; line-height: 1.5; }
.ee-select { appearance: none; cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' stroke='%234A4A4A' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px;
}
.ee-row { display: flex; gap: 16px; }
.ee-row > * { flex: 1; }

/* Buttons */
.ee-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px 20px; height: 44px; border-radius: 12px;
  font-size: 14px; font-weight: 600; transition: all 200ms ease; white-space: nowrap;
}
.ee-btn-primary { background: #1A1A1A; color: #FFFFFF; }
.ee-btn-primary:hover { background: #333333; }
.ee-btn-secondary { background: #FFFFFF; color: #1A1A1A; border: 1px solid #DADADA; }
.ee-btn-secondary:hover { background: #EFEFEF; }
.ee-btn-danger { background: #FFFFFF; color: #C0392B; border: 1px solid #E5A29B; }
.ee-btn-danger:hover { background: #FDF2F1; }
.ee-btn-sm { height: 36px; padding: 6px 14px; font-size: 13px; }

/* Cards */
.ee-card {
  background: #FFFFFF; border: 1px solid #EFEFEF; border-radius: 16px;
  padding: 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.ee-card-title { font-size: 15px; font-weight: 600; color: #1A1A1A; margin-bottom: 16px; }

/* Logo upload */
.ee-logo-upload { display: flex; flex-direction: column; gap: 16px; }
.ee-logo-dropzone {
  border: 2px dashed #DADADA; border-radius: 12px;
  padding: 32px; text-align: center; cursor: pointer; transition: all 200ms ease;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}
.ee-logo-dropzone:hover { border-color: #1A1A1A; background: #FAFAFA; }
.ee-logo-dropzone--drag { border-color: #1A1A1A; background: #F8F8F8; }
.ee-logo-dropzone-icon { color: #B0B0B0; }
.ee-logo-dropzone-text { font-size: 14px; font-weight: 500; color: #4A4A4A; }
.ee-logo-dropzone-hint { font-size: 12px; color: #B0B0B0; }
.ee-logo-preview {
  display: flex; align-items: center; gap: 16px; padding: 16px;
  border: 1px solid #EFEFEF; border-radius: 12px; background: #FAFAFA;
}
.ee-logo-preview-img {
  object-fit: contain; border-radius: 8px; background: #FFFFFF;
  border: 1px solid #EFEFEF;
}
.ee-logo-preview-info { flex: 1; }
.ee-logo-preview-name { font-size: 13px; font-weight: 500; color: #1A1A1A; }
.ee-logo-preview-actions { display: flex; gap: 8px; }

/* Logo size controls */
.ee-logo-size-controls { display: flex; flex-direction: column; gap: 12px; }
.ee-logo-size-presets { display: flex; gap: 8px; }
.ee-logo-size-preset {
  padding: 8px 16px; border: 1px solid #DADADA; border-radius: 10px;
  font-size: 13px; font-weight: 500; color: #4A4A4A; transition: all 200ms ease;
}
.ee-logo-size-preset--active { background: #1A1A1A; color: #FFFFFF; border-color: #1A1A1A; }
.ee-logo-size-slider-row { display: flex; align-items: center; gap: 12px; }
.ee-logo-size-slider {
  flex: 1; -webkit-appearance: none; appearance: none; height: 6px;
  background: #EFEFEF; border-radius: 3px; outline: none;
}
.ee-logo-size-slider::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none; width: 20px; height: 20px;
  border-radius: 50%; background: #1A1A1A; cursor: pointer;
}
.ee-logo-size-slider::-moz-range-thumb {
  width: 20px; height: 20px; border: none; border-radius: 50%;
  background: #1A1A1A; cursor: pointer;
}
.ee-logo-size-value { font-size: 13px; font-weight: 600; color: #1A1A1A; min-width: 48px; text-align: right; }
.ee-logo-live-preview {
  display: flex; align-items: center; justify-content: center;
  padding: 24px; border: 1px solid #EFEFEF; border-radius: 12px; background: #FAFAFA;
}
.ee-logo-live-preview-img { object-fit: contain; border-radius: 8px; }

/* Venue layout upload */
.ee-venue-dropzone {
  border: 2px dashed #DADADA; border-radius: 16px;
  padding: 48px; text-align: center; cursor: pointer; transition: all 200ms ease;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.ee-venue-dropzone:hover { border-color: #1A1A1A; background: #FAFAFA; }
.ee-venue-dropzone--drag { border-color: #1A1A1A; background: #F8F8F8; }
.ee-venue-preview {
  border: 1px solid #EFEFEF; border-radius: 16px; overflow: hidden; background: #FAFAFA;
}
.ee-venue-preview-img { width: 100%; height: auto; display: block; }
.ee-venue-preview-actions { display: flex; gap: 8px; padding: 16px; border-top: 1px solid #EFEFEF; }

/* Guest table */
.ee-guest-table { width: 100%; border-collapse: collapse; }
.ee-guest-table th {
  text-align: left; padding: 10px 14px; font-size: 12px; font-weight: 600;
  color: #B0B0B0; text-transform: uppercase; letter-spacing: 0.05em;
  border-bottom: 1px solid #EFEFEF;
}
.ee-guest-table td {
  padding: 12px 14px; font-size: 14px; color: #1A1A1A; border-bottom: 1px solid #F8F8F8;
}
.ee-guest-table tr:hover { background: #FAFAFA; }

/* Table cards */
.ee-table-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.ee-table-card {
  background: #FFFFFF; border: 1px solid #EFEFEF; border-radius: 12px;
  padding: 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.ee-table-card-num { font-size: 20px; font-weight: 700; color: #1A1A1A; }
.ee-table-card-name { font-size: 13px; color: #4A4A4A; margin-top: 2px; }
.ee-table-card-meta { font-size: 12px; color: #B0B0B0; margin-top: 8px; }

/* Theme presets */
.ee-preset-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.ee-preset-card {
  border: 2px solid #EFEFEF; border-radius: 12px; padding: 12px; cursor: pointer;
  transition: all 200ms ease; text-align: center;
}
.ee-preset-card:hover { border-color: #DADADA; }
.ee-preset-card--active { border-color: #1A1A1A; }
.ee-preset-swatch { display: flex; gap: 4px; justify-content: center; margin-bottom: 8px; }
.ee-preset-swatch span { width: 24px; height: 24px; border-radius: 6px; border: 1px solid #EFEFEF; }
.ee-preset-name { font-size: 12px; font-weight: 500; color: #4A4A4A; }

/* Color picker */
.ee-color-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.ee-color-input { width: 44px; height: 44px; border: 1px solid #DADADA; border-radius: 10px; cursor: pointer; padding: 4px; background: #FFFFFF; }
.ee-color-label { font-size: 13px; font-weight: 500; color: #4A4A4A; }

/* Live preview */
.ee-preview-wrap {
  position: sticky; top: 80px; background: #FFFFFF; border: 1px solid #EFEFEF;
  border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}
.ee-preview-device-toggle { display: flex; gap: 4px; margin-bottom: 16px; }
.ee-preview-device-btn {
  padding: 6px 12px; font-size: 12px; font-weight: 500; border: 1px solid #DADADA;
  border-radius: 8px; color: #4A4A4A; transition: all 200ms ease;
}
.ee-preview-device-btn--active { background: #1A1A1A; color: #FFFFFF; border-color: #1A1A1A; }
.ee-preview-frame {
  border: 1px solid #EFEFEF; border-radius: 12px; overflow: hidden; margin: 0 auto;
  transition: max-width 200ms ease;
}
.ee-preview-content { padding: 24px; text-align: center; }

/* Schedule */
.ee-schedule-item { display: flex; gap: 12px; margin-bottom: 12px; align-items: center; }

/* Misc */
.ee-empty { text-align: center; padding: 48px; color: #B0B0B0; font-size: 14px; }
.ee-loading { display: flex; align-items: center; justify-content: center; min-height: 400px; }
.ee-spinner {
  width: 32px; height: 32px; border: 3px solid #EFEFEF;
  border-top-color: #1A1A1A; border-radius: 50%; animation: spin 0.8s linear infinite;
}
.ee-danger-zone { border: 1px solid #E5A29B; border-radius: 12px; padding: 20px; background: #FDF2F1; }
.ee-danger-zone-title { font-size: 14px; font-weight: 600; color: #C0392B; margin-bottom: 8px; }
.ee-danger-zone-desc { font-size: 13px; color: #7A4A45; margin-bottom: 16px; }
@media (max-width: 768px) {
  .ee-body { padding: 16px; }
  .ee-row { flex-direction: column; }
  .ee-preset-grid { grid-template-columns: repeat(2, 1fr); }
}
`;

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function EventEditorPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: event, isLoading: eventLoading } = useEvent(eventId ?? '');
  const { data: guests } = useGuests(eventId ?? '');
  const { data: tables } = useTables(eventId ?? '');
  const { data: settings } = useGuestPageSettings(eventId ?? '');

  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const createGuest = useCreateGuest();
  const bulkCreateGuests = useBulkCreateGuests();
  const updateGuest = useUpdateGuest();
  const deleteGuest = useDeleteGuest();
  const createTable = useCreateTable();
  const deleteTable = useDeleteTable();
  const upsertSettings = useUpsertGuestPageSettings();

  const [activeTab, setActiveTab] = useState<Tab>('details');

  // Event details form
  const [eventForm, setEventForm] = useState({
    name: '', slug: '', date: '', time: '', venue: '', accent_color: '#1A1A1A',
  });

  // Logo upload state
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(64);
  const [logoDragOver, setLogoDragOver] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);

  // Venue upload state
  const [venueUrl, setVenueUrl] = useState<string | null>(null);
  const [venueDragOver, setVenueDragOver] = useState(false);
  const venueFileRef = useRef<HTMLInputElement>(null);

  // Settings state
  const [settingsForm, setSettingsForm] = useState<GuestPageSettingsInput>({ ...DEFAULT_SETTINGS, event_id: eventId ?? '' });
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Guest form
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestTable, setNewGuestTable] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Table form
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('8');

  // Schedule
  const [scheduleItems, setScheduleItems] = useState<{ time: string; title: string }[]>([]);

  // Delete confirm
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Sync state when data loads
  useEffect(() => {
    if (event) {
      setEventForm({
        name: event.name, slug: event.slug,
        date: event.date ?? '', time: event.time ?? '',
        venue: event.venue ?? '', accent_color: event.accent_color ?? '#1A1A1A',
      });
    }
  }, [event]);

  const effectiveSettings = {
    ...(DEFAULT_SETTINGS as GuestPageSettings),
    ...(settings ?? {}),
  } as GuestPageSettings;

  useEffect(() => {
    setLogoUrl(effectiveSettings.logo_url ?? null);
    setLogoSize(effectiveSettings.logo_size ?? 64);
    setVenueUrl(effectiveSettings.venue_image_url ?? null);
    setSettingsForm({ ...DEFAULT_SETTINGS, event_id: eventId ?? '', ...settings });
    const items = effectiveSettings.schedule_items as { time: string; title: string }[] | null;
    setScheduleItems(Array.isArray(items) ? items : []);
  }, [settings, eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Logo upload handlers
  const handleLogoFile = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_SIZE) { toast('File too large (max 5MB)', 'error'); return; }
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) { toast('Unsupported format. Use PNG, JPG, SVG, or WebP.', 'error'); return; }
    const dataUrl = await readFileAsDataURL(file);
    setLogoUrl(dataUrl);
    const input: GuestPageSettingsInput = { event_id: eventId ?? '', logo_url: dataUrl, logo_size: logoSize };
    await upsertSettings.mutateAsync(input);
    toast('Logo uploaded', 'success');
  }, [eventId, logoSize, upsertSettings, toast]);

  const handleLogoDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setLogoDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleLogoFile(file);
  }, [handleLogoFile]);

  const handleLogoRemove = useCallback(async () => {
    setLogoUrl(null);
    const input: GuestPageSettingsInput = { event_id: eventId ?? '', logo_url: null };
    await upsertSettings.mutateAsync(input);
    toast('Logo removed', 'success');
  }, [eventId, upsertSettings, toast]);

  const handleLogoSizeChange = useCallback(async (size: number) => {
    setLogoSize(size);
    const input: GuestPageSettingsInput = { event_id: eventId ?? '', logo_size: size };
    await upsertSettings.mutateAsync(input);
  }, [eventId, upsertSettings]);

  // Venue upload handlers
  const handleVenueFile = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_SIZE) { toast('File too large (max 5MB)', 'error'); return; }
    if (!file.type.startsWith('image/')) { toast('Please upload an image file', 'error'); return; }
    const dataUrl = await readFileAsDataURL(file);
    setVenueUrl(dataUrl);
    const input: GuestPageSettingsInput = { event_id: eventId ?? '', venue_image_url: dataUrl };
    await upsertSettings.mutateAsync(input);
    toast('Venue layout uploaded', 'success');
  }, [eventId, upsertSettings, toast]);

  const handleVenueDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setVenueDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleVenueFile(file);
  }, [handleVenueFile]);

  const handleVenueRemove = useCallback(async () => {
    setVenueUrl(null);
    const input: GuestPageSettingsInput = { event_id: eventId ?? '', venue_image_url: null };
    await upsertSettings.mutateAsync(input);
    toast('Venue layout removed', 'success');
  }, [eventId, upsertSettings, toast]);

  // Event details save
  const handleSaveDetails = useCallback(async () => {
    if (!eventForm.name.trim()) { toast('Event name is required', 'error'); return; }
    await updateEvent.mutateAsync({
      id: eventId ?? '',
      name: eventForm.name, slug: eventForm.slug,
      date: eventForm.date || null, time: eventForm.time || null,
      venue: eventForm.venue || null, accent_color: eventForm.accent_color || null,
    });
    toast('Event details saved', 'success');
  }, [eventId, eventForm, updateEvent, toast]);

  // Guest handlers
  const handleAddGuest = useCallback(async () => {
    if (!newGuestName.trim()) return;
    await createGuest.mutateAsync({
      event_id: eventId ?? '', name: newGuestName,
      table_id: newGuestTable || null, party_size: 1,
    });
    setNewGuestName(''); setNewGuestTable('');
    toast('Guest added', 'success');
  }, [eventId, newGuestName, newGuestTable, createGuest, toast]);

  const handleBulkAdd = useCallback(async () => {
    const names = bulkText.split('\n').map(n => n.trim()).filter(Boolean);
    if (names.length === 0) return;
    await bulkCreateGuests.mutateAsync(names.map(name => ({
      event_id: eventId ?? '', name, party_size: 1,
    })));
    setBulkText(''); setBulkOpen(false);
    toast(`${names.length} guests added`, 'success');
  }, [eventId, bulkText, bulkCreateGuests, toast]);

  // Table handlers
  const handleAddTable = useCallback(async () => {
    if (!newTableNumber.trim()) return;
    await createTable.mutateAsync({
      event_id: eventId ?? '', number: newTableNumber,
      name: newTableName || newTableNumber,
      capacity: parseInt(newTableCapacity) || 8,
    });
    setNewTableNumber(''); setNewTableName(''); setNewTableCapacity('8');
    toast('Table added', 'success');
  }, [eventId, newTableNumber, newTableName, newTableCapacity, createTable, toast]);

  // Settings save
  const handleSaveSettings = useCallback(async () => {
    await upsertSettings.mutateAsync(settingsForm);
    toast('Settings saved', 'success');
  }, [settingsForm, upsertSettings, toast]);

  // Schedule save
  const handleSaveSchedule = useCallback(async () => {
    const input: GuestPageSettingsInput = { event_id: eventId ?? '', schedule_items: scheduleItems };
    await upsertSettings.mutateAsync(input);
    toast('Schedule saved', 'success');
  }, [eventId, scheduleItems, upsertSettings, toast]);

  // Delete event
  const handleDeleteEvent = useCallback(async () => {
    await deleteEvent.mutateAsync(eventId ?? '');
    navigate('/');
  }, [eventId, deleteEvent, navigate]);

  if (eventLoading) {
    return (
      <div className="ee-root">
        <style>{EE_CSS}</style>
        <div className="ee-loading"><div className="ee-spinner" /></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="ee-root">
        <style>{EE_CSS}</style>
        <div className="ee-empty">Event not found. <Link to="/">Back to dashboard</Link></div>
      </div>
    );
  }

  return (
    <div className="ee-root">
      <style>{EE_CSS}</style>

      {/* Header */}
      <div className="ee-header">
        <Link to="/">
          <button className="ee-back-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 4L6 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
        </Link>
        <span className="ee-title">{event.name}</span>
      </div>

      {/* Tabs */}
      <div className="ee-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`ee-tab${activeTab === tab.id ? ' ee-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="ee-body">

        {/* ── EVENT DETAILS ── */}
        <section className="ee-panel" style={{ display: activeTab === 'details' ? 'block' : 'none' }}>
          <div className="ee-card">
            <div className="ee-card-title">Event Information</div>
            <div className="ee-field">
              <label className="ee-label">Event Name</label>
              <input className="ee-input" value={eventForm.name}
                onChange={e => setEventForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="ee-field">
              <label className="ee-label">Slug (URL)</label>
              <input className="ee-input" value={eventForm.slug}
                onChange={e => setEventForm(f => ({ ...f, slug: e.target.value }))} />
            </div>
            <div className="ee-row">
              <div className="ee-field">
                <label className="ee-label">Date</label>
                <input className="ee-input" type="date" value={eventForm.date}
                  onChange={e => setEventForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="ee-field">
                <label className="ee-label">Time</label>
                <input className="ee-input" type="time" value={eventForm.time}
                  onChange={e => setEventForm(f => ({ ...f, time: e.target.value }))} />
              </div>
            </div>
            <div className="ee-field">
              <label className="ee-label">Venue</label>
              <input className="ee-input" value={eventForm.venue}
                onChange={e => setEventForm(f => ({ ...f, venue: e.target.value }))} />
            </div>
            <div className="ee-field">
              <label className="ee-label">Accent Color</label>
              <div className="ee-color-row">
                <input className="ee-color-input" type="color" value={eventForm.accent_color}
                  onChange={e => setEventForm(f => ({ ...f, accent_color: e.target.value }))} />
                <span className="ee-color-label">{eventForm.accent_color}</span>
              </div>
            </div>
            <button className="ee-btn ee-btn-primary" onClick={handleSaveDetails}>Save Changes</button>
          </div>

          {/* Logo Upload */}
          <div className="ee-card">
            <div className="ee-card-title">Event Logo</div>
            <div className="ee-logo-upload">
              <input ref={logoFileRef} type="file" accept={ACCEPTED_FORMATS} hidden
                onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoFile(f); e.target.value = ''; }} />

              {logoUrl ? (
                <>
                  <div className="ee-logo-preview">
                    <img className="ee-logo-preview-img" src={logoUrl} alt="Logo"
                      style={{ width: `${logoSize}px`, height: `${logoSize}px` }} />
                    <div className="ee-logo-preview-info">
                      <div className="ee-logo-preview-name">Logo uploaded</div>
                      <div className="ee-logo-preview-actions" style={{ marginTop: '8px' }}>
                        <button className="ee-btn ee-btn-secondary ee-btn-sm"
                          onClick={() => logoFileRef.current?.click()}>Replace</button>
                        <button className="ee-btn ee-btn-danger ee-btn-sm"
                          onClick={handleLogoRemove}>Remove</button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div
                  className={`ee-logo-dropzone${logoDragOver ? ' ee-logo-dropzone--drag' : ''}`}
                  onClick={() => logoFileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setLogoDragOver(true); }}
                  onDragLeave={() => setLogoDragOver(false)}
                  onDrop={handleLogoDrop}
                >
                  <svg className="ee-logo-dropzone-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 16V4M8 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="ee-logo-dropzone-text">Drag & drop logo here, or click to browse</span>
                  <span className="ee-logo-dropzone-hint">PNG, JPG, SVG, WebP — max 5MB</span>
                </div>
              )}

              {/* Logo Size Controls */}
              <div className="ee-logo-size-controls">
                <label className="ee-label">Logo Size</label>
                <div className="ee-logo-size-presets">
                  {LOGO_SIZE_PRESETS.map(preset => (
                    <button
                      key={preset.value}
                      className={`ee-logo-size-preset${logoSize === preset.value ? ' ee-logo-size-preset--active' : ''}`}
                      onClick={() => handleLogoSizeChange(preset.value)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="ee-logo-size-slider-row">
                  <input
                    className="ee-logo-size-slider"
                    type="range" min="32" max="128" step="4"
                    value={logoSize}
                    onChange={e => handleLogoSizeChange(parseInt(e.target.value))}
                  />
                  <span className="ee-logo-size-value">{logoSize}px</span>
                </div>
                {/* Live preview */}
                {logoUrl && (
                  <div className="ee-logo-live-preview">
                    <img className="ee-logo-live-preview-img" src={logoUrl} alt="Logo preview"
                      style={{ width: `${logoSize}px`, height: `${logoSize}px` }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── GUESTS ── */}
        <section className="ee-panel" style={{ display: activeTab === 'guests' ? 'block' : 'none' }}>
          <div className="ee-card">
            <div className="ee-card-title">Add Guest</div>
            <div className="ee-row">
              <div className="ee-field">
                <input className="ee-input" placeholder="Guest name"
                  value={newGuestName} onChange={e => setNewGuestName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddGuest(); }} />
              </div>
              <div className="ee-field">
                <select className="ee-select" value={newGuestTable}
                  onChange={e => setNewGuestTable(e.target.value)}>
                  <option value="">No table</option>
                  {tables?.map(t => <option key={t.id} value={t.id}>Table {t.number}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="ee-btn ee-btn-primary" onClick={handleAddGuest}>Add Guest</button>
              <button className="ee-btn ee-btn-secondary" onClick={() => setBulkOpen(true)}>Bulk Add</button>
            </div>
          </div>

          <div className="ee-card">
            <div className="ee-card-title">Guest List ({guests?.length ?? 0})</div>
            {guests && guests.length > 0 ? (
              <table className="ee-guest-table">
                <thead><tr><th>Name</th><th>Table</th><th></th></tr></thead>
                <tbody>
                  {guests.map(g => (
                    <tr key={g.id}>
                      <td>{g.name}</td>
                      <td>{g.table ? `Table ${g.table.number}` : '—'}</td>
                      <td>
                        <button className="ee-btn ee-btn-danger ee-btn-sm"
                          onClick={async () => { await deleteGuest.mutateAsync({ id: g.id, eventId: eventId ?? '' }); toast('Guest removed', 'success'); }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="ee-empty">No guests yet</div>}
          </div>
        </section>

        {/* ── TABLES ── */}
        <section className="ee-panel" style={{ display: activeTab === 'tables' ? 'block' : 'none' }}>
          <div className="ee-card">
            <div className="ee-card-title">Add Table</div>
            <div className="ee-row">
              <div className="ee-field">
                <input className="ee-input" placeholder="Table number" value={newTableNumber}
                  onChange={e => setNewTableNumber(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddTable(); }} />
              </div>
              <div className="ee-field">
                <input className="ee-input" placeholder="Table name (optional)" value={newTableName}
                  onChange={e => setNewTableName(e.target.value)} />
              </div>
              <div className="ee-field">
                <input className="ee-input" type="number" placeholder="Capacity" value={newTableCapacity}
                  onChange={e => setNewTableCapacity(e.target.value)} />
              </div>
            </div>
            <button className="ee-btn ee-btn-primary" onClick={handleAddTable}>Add Table</button>
          </div>
          <div className="ee-card">
            <div className="ee-card-title">Tables ({tables?.length ?? 0})</div>
            {tables && tables.length > 0 ? (
              <div className="ee-table-grid">
                {tables.map(t => {
                  const count = guests?.filter(g => g.table_id === t.id).length ?? 0;
                  return (
                    <div key={t.id} className="ee-table-card">
                      <div className="ee-table-card-num">{t.number}</div>
                      <div className="ee-table-card-name">{t.name}</div>
                      <div className="ee-table-card-meta">{count} / {t.capacity} guests</div>
                      <button className="ee-btn ee-btn-danger ee-btn-sm" style={{ marginTop: '8px', width: '100%' }}
                        onClick={async () => { await deleteTable.mutateAsync({ id: t.id, eventId: eventId ?? '' }); toast('Table removed', 'success'); }}>
                        Delete
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : <div className="ee-empty">No tables yet</div>}
          </div>
        </section>

        {/* ── VENUE LAYOUT ── */}
        <section className="ee-panel" style={{ display: activeTab === 'venue' ? 'block' : 'none' }}>
          <div className="ee-card">
            <div className="ee-card-title">Venue Layout Image</div>
            <input ref={venueFileRef} type="file" accept="image/*" hidden
              onChange={e => { const f = e.target.files?.[0]; if (f) handleVenueFile(f); e.target.value = ''; }} />
            {venueUrl ? (
              <>
                <div className="ee-venue-preview">
                  <img className="ee-venue-preview-img" src={venueUrl} alt="Venue layout" />
                  <div className="ee-venue-preview-actions">
                    <button className="ee-btn ee-btn-secondary ee-btn-sm"
                      onClick={() => venueFileRef.current?.click()}>Replace</button>
                    <button className="ee-btn ee-btn-danger ee-btn-sm"
                      onClick={handleVenueRemove}>Remove</button>
                  </div>
                </div>
              </>
            ) : (
              <div
                className={`ee-venue-dropzone${venueDragOver ? ' ee-venue-dropzone--drag' : ''}`}
                onClick={() => venueFileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setVenueDragOver(true); }}
                onDragLeave={() => setVenueDragOver(false)}
                onDrop={handleVenueDrop}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#B0B0B0" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
                <span className="ee-logo-dropzone-text">Drag & drop venue layout here, or click to browse</span>
                <span className="ee-logo-dropzone-hint">PNG, JPG, SVG, WebP — max 5MB</span>
              </div>
            )}
          </div>
        </section>

        {/* ── SCHEDULE ── */}
        <section className="ee-panel" style={{ display: activeTab === 'schedule' ? 'block' : 'none' }}>
          <div className="ee-card">
            <div className="ee-card-title">Event Schedule</div>
            {scheduleItems.map((item, i) => (
              <div key={i} className="ee-schedule-item">
                <input className="ee-input" type="time" style={{ width: '120px' }}
                  value={item.time} onChange={e => setScheduleItems(s => s.map((x, j) => j === i ? { ...x, time: e.target.value } : x))} />
                <input className="ee-input" placeholder="Title / description"
                  value={item.title} onChange={e => setScheduleItems(s => s.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} />
                <button className="ee-btn ee-btn-danger ee-btn-sm"
                  onClick={() => setScheduleItems(s => s.filter((_, j) => j !== i))}>Remove</button>
              </div>
            ))}
            <button className="ee-btn ee-btn-secondary" style={{ marginBottom: '16px' }}
              onClick={() => setScheduleItems(s => [...s, { time: '', title: '' }])}>+ Add Schedule Item</button>
            <div>
              <button className="ee-btn ee-btn-primary" onClick={handleSaveSchedule}>Save Schedule</button>
            </div>
          </div>
        </section>

        {/* ── SETTINGS ── */}
        <section className="ee-panel" style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            <div style={{ flex: '1', minWidth: 0 }}>
              <div className="ee-card">
                <div className="ee-card-title">Theme Presets</div>
                <div className="ee-preset-grid">
                  {THEME_PRESETS.map(preset => {
                    const isActive = settingsForm.color_primary === preset.color_primary &&
                      settingsForm.color_background === preset.color_background;
                    return (
                      <div key={preset.name}
                        className={`ee-preset-card${isActive ? ' ee-preset-card--active' : ''}`}
                        onClick={() => setSettingsForm(f => ({
                          ...f,
                          color_primary: preset.color_primary,
                          color_secondary: preset.color_secondary,
                          color_background: preset.color_background,
                          color_button: preset.color_button,
                          color_button_text: preset.color_button_text,
                          color_link: preset.color_link,
                          color_footer: preset.color_footer,
                        }))}
                      >
                        <div className="ee-preset-swatch">
                          <span style={{ background: preset.color_primary }} />
                          <span style={{ background: preset.color_background }} />
                          <span style={{ background: preset.color_button }} />
                        </div>
                        <div className="ee-preset-name">{preset.name}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="ee-card">
                <div className="ee-card-title">Colors</div>
                <div className="ee-color-row">
                  <input className="ee-color-input" type="color" value={settingsForm.color_primary ?? '#1A1A1A'}
                    onChange={e => setSettingsForm(f => ({ ...f, color_primary: e.target.value }))} />
                  <span className="ee-color-label">Primary</span>
                </div>
                <div className="ee-color-row">
                  <input className="ee-color-input" type="color" value={settingsForm.color_background ?? '#FAF3E8'}
                    onChange={e => setSettingsForm(f => ({ ...f, color_background: e.target.value }))} />
                  <span className="ee-color-label">Background</span>
                </div>
                <div className="ee-color-row">
                  <input className="ee-color-input" type="color" value={settingsForm.color_button ?? '#1A1A1A'}
                    onChange={e => setSettingsForm(f => ({ ...f, color_button: e.target.value }))} />
                  <span className="ee-color-label">Button</span>
                </div>
              </div>

              <div className="ee-card">
                <div className="ee-card-title">Fonts</div>
                <div className="ee-field">
                  <label className="ee-label">Heading Font</label>
                  <select className="ee-select" value={settingsForm.font_heading ?? 'Inter'}
                    onChange={e => setSettingsForm(f => ({ ...f, font_heading: e.target.value }))}>
                    {FONT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="ee-field">
                  <label className="ee-label">Body Font</label>
                  <select className="ee-select" value={settingsForm.font_body ?? 'Inter'}
                    onChange={e => setSettingsForm(f => ({ ...f, font_body: e.target.value }))}>
                    {FONT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </div>

              <button className="ee-btn ee-btn-primary" onClick={handleSaveSettings}>Save Settings</button>

              <div className="ee-danger-zone" style={{ marginTop: '24px' }}>
                <div className="ee-danger-zone-title">Danger Zone</div>
                <div className="ee-danger-zone-desc">Permanently delete this event and all associated data.</div>
                <button className="ee-btn ee-btn-danger" onClick={() => setDeleteConfirmOpen(true)}>Delete Event</button>
              </div>
            </div>

            {/* Live Preview */}
            <div style={{ width: '340px', flexShrink: 0 }}>
              <div className="ee-preview-wrap">
                <div className="ee-preview-device-toggle">
                  <button className={`ee-preview-device-btn${previewDevice === 'desktop' ? ' ee-preview-device-btn--active' : ''}`}
                    onClick={() => setPreviewDevice('desktop')}>Desktop</button>
                  <button className={`ee-preview-device-btn${previewDevice === 'mobile' ? ' ee-preview-device-btn--active' : ''}`}
                    onClick={() => setPreviewDevice('mobile')}>Mobile</button>
                </div>
                <div className="ee-preview-frame" style={{
                  maxWidth: previewDevice === 'mobile' ? '280px' : '100%',
                  background: settingsForm.color_background ?? '#FAF3E8',
                }}>
                  <div className="ee-preview-content" style={{ color: settingsForm.color_primary ?? '#1A1A1A' }}>
                    {logoUrl && (
                      <img src={logoUrl} alt="Logo" style={{ width: `${logoSize}px`, height: `${logoSize}px`, margin: '0 auto 12px', borderRadius: '50%', objectFit: 'contain' }} />
                    )}
                    <div style={{ fontFamily: settingsForm.font_heading ?? 'Inter', fontSize: '20px', fontWeight: 600, letterSpacing: '0.1em', marginBottom: '8px' }}>
                      {eventForm.name.toUpperCase() || 'EVENT NAME'}
                    </div>
                    <div style={{ fontSize: '11px', letterSpacing: '0.15em', opacity: 0.8 }}>
                      {eventForm.date || 'DATE'} · {eventForm.venue?.toUpperCase() || 'VENUE'}
                    </div>
                    <div style={{ marginTop: '16px', padding: '0 16px' }}>
                      <div style={{
                        border: `1.5px solid ${settingsForm.color_primary ?? '#1A1A1A'}`,
                        borderRadius: '12px', padding: '12px 16px', fontSize: '12px',
                        background: settingsForm.color_background ?? 'transparent',
                        color: settingsForm.color_primary ?? '#1A1A1A',
                      }}>
                        SEARCH YOUR NAME
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Bulk Add Modal */}
      {bulkOpen && (
        <Modal open={bulkOpen} onClose={() => setBulkOpen(false)}>
          <div style={{ padding: '24px' }}>
            <div className="ee-card-title">Bulk Add Guests</div>
            <p style={{ fontSize: '13px', color: '#B0B0B0', marginBottom: '12px' }}>One name per line</p>
            <textarea className="ee-textarea" rows={8} value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder={'John Smith\nJane Doe\n...'} />
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button className="ee-btn ee-btn-primary" onClick={handleBulkAdd}>Add All</button>
              <button className="ee-btn ee-btn-secondary" onClick={() => setBulkOpen(false)}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteConfirmOpen && (
        <ConfirmDialog
          open={deleteConfirmOpen}
          title="Delete Event"
          message={`Are you sure you want to delete "${event.name}"? This cannot be undone.`}
          onConfirm={handleDeleteEvent}
          onCancel={() => setDeleteConfirmOpen(false)}
        />
      )}
    </div>
  );
}
