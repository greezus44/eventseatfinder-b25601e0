import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { useEvent, useUpdateEvent, useDeleteEvent, useCheckSlugAvailability } from '@/hooks/use-events';
import { useGuests, useCreateGuest, useBulkCreateGuests, useDeleteGuest } from '@/hooks/use-guests';
import { useTables, useCreateTable, useDeleteTable, useBulkCreateTables } from '@/hooks/use-tables';
import { useGuestPageSettings, useUpsertGuestPageSettings } from '@/hooks/use-guest-page-settings';
import { useToast } from '@/providers/toast-provider';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DEFAULT_SETTINGS, FONT_OPTIONS, THEME_PRESETS } from '@/types/guest-page-settings';
import type { GuestPageSettingsInput, ScheduleItem } from '@/types/guest-page-settings';
import type { GuestPageSettings } from '@/types/guest-page-settings';
import type { TableInput } from '@/types/table';

type Tab = 'details' | 'guests' | 'tables' | 'venue' | 'schedule' | 'settings' | 'share';

const TABS: { id: Tab; label: string }[] = [
  { id: 'details', label: 'Event Details' },
  { id: 'guests', label: 'Guests' },
  { id: 'tables', label: 'Tables' },
  { id: 'venue', label: 'Venue Layout' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'settings', label: 'Settings' },
  { id: 'share', label: 'Share' },
];

const LOGO_SIZE_PRESETS = [{ label: 'Small', value: 48 }, { label: 'Medium', value: 64 }, { label: 'Large', value: 96 }];
const ACCEPTED_FORMATS = '.png,.jpg,.jpeg,.svg,.webp';
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const EE_CSS = `
.ee-root { min-height: 100vh; background: #F8F8F8; font-family: 'Inter', sans-serif; }
.ee-header { background: #FFFFFF; border-bottom: 1px solid #EFEFEF; padding: 16px 32px; display: flex; align-items: center; gap: 16px; position: sticky; top: 0; z-index: 100; }
.ee-back-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border: 1px solid #DADADA; border-radius: 12px; font-size: 14px; font-weight: 500; color: #4A4A4A; transition: all 200ms ease; }
.ee-back-btn:hover { background: #EFEFEF; color: #1A1A1A; }
.ee-title { font-size: 18px; font-weight: 600; color: #1A1A1A; }
.ee-tabs { display: flex; gap: 4px; background: #FFFFFF; border-bottom: 1px solid #EFEFEF; padding: 0 32px; overflow-x: auto; }
.ee-tab { padding: 12px 20px; font-size: 14px; font-weight: 500; color: #B0B0B0; border-bottom: 2px solid transparent; transition: all 200ms ease; white-space: nowrap; }
.ee-tab:hover { color: #4A4A4A; }
.ee-tab--active { color: #1A1A1A; border-bottom-color: #1A1A1A; }
.ee-body { padding: 32px; max-width: 900px; margin: 0 auto; }
.ee-panel { animation: ee-fade 300ms ease; }
@keyframes ee-fade { from { opacity: 0; } to { opacity: 1; } }
.ee-field { margin-bottom: 16px; }
.ee-label { display: block; font-size: 13px; font-weight: 600; color: #4A4A4A; margin-bottom: 6px; }
.ee-input, .ee-select, .ee-textarea { width: 100%; height: 44px; padding: 10px 14px; border: 1px solid #DADADA; border-radius: 12px; background: #FFFFFF; font-size: 14px; color: #1A1A1A; outline: none; transition: border-color 200ms ease, box-shadow 200ms ease; }
.ee-input:focus, .ee-select:focus, .ee-textarea:focus { border-color: #1A1A1A; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }
.ee-textarea { height: auto; min-height: 80px; resize: vertical; line-height: 1.5; }
.ee-select { appearance: none; cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' stroke='%234A4A4A' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px; }
.ee-row { display: flex; gap: 16px; }
.ee-row > * { flex: 1; }
.ee-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 20px; height: 44px; border-radius: 12px; font-size: 14px; font-weight: 500; transition: all 200ms ease; white-space: nowrap; }
.ee-btn-primary { background: #1A1A1A; color: #FFFFFF; }
.ee-btn-primary:hover { background: #333333; }
.ee-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.ee-btn-secondary { background: #FFFFFF; color: #1A1A1A; border: 1px solid #DADADA; }
.ee-btn-secondary:hover { background: #EFEFEF; }
.ee-btn-danger { background: #FFFFFF; color: #C0392B; border: 1px solid #E5A29B; }
.ee-btn-danger:hover { background: #FDF2F1; }
.ee-btn-sm { height: 36px; padding: 6px 14px; font-size: 13px; }
.ee-card { background: #FFFFFF; border: 1px solid #EFEFEF; border-radius: 12px; padding: 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.ee-card-title { font-size: 15px; font-weight: 600; color: #1A1A1A; margin-bottom: 16px; }
.ee-logo-upload { display: flex; flex-direction: column; gap: 16px; }
.ee-logo-dropzone { border: 2px dashed #DADADA; border-radius: 12px; padding: 32px; text-align: center; cursor: pointer; transition: all 200ms ease; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.ee-logo-dropzone:hover { border-color: #1A1A1A; background: #FAFAFA; }
.ee-logo-dropzone--drag { border-color: #1A1A1A; background: #F8F8F8; }
.ee-dropzone-text { font-size: 14px; font-weight: 500; color: #4A4A4A; }
.ee-dropzone-hint { font-size: 12px; color: #B0B0B0; }
.ee-logo-preview { display: flex; align-items: center; gap: 16px; padding: 16px; border: 1px solid #EFEFEF; border-radius: 12px; background: #FAFAFA; }
.ee-logo-size-controls { display: flex; flex-direction: column; gap: 12px; }
.ee-logo-size-presets { display: flex; gap: 8px; }
.ee-logo-size-preset { padding: 8px 16px; border: 1px solid #DADADA; border-radius: 12px; font-size: 14px; font-weight: 500; color: #4A4A4A; transition: all 200ms ease; }
.ee-logo-size-preset--active { background: #1A1A1A; color: #FFFFFF; border-color: #1A1A1A; }
.ee-logo-size-slider-row { display: flex; align-items: center; gap: 12px; }
.ee-logo-size-slider { flex: 1; -webkit-appearance: none; appearance: none; height: 6px; background: #EFEFEF; border-radius: 3px; outline: none; }
.ee-logo-size-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #1A1A1A; cursor: pointer; }
.ee-logo-size-slider::-moz-range-thumb { width: 20px; height: 20px; border: none; border-radius: 50%; background: #1A1A1A; cursor: pointer; }
.ee-logo-size-value { font-size: 14px; font-weight: 600; color: #1A1A1A; min-width: 48px; text-align: right; }
.ee-logo-live-preview { display: flex; align-items: center; justify-content: center; padding: 24px; border: 1px solid #EFEFEF; border-radius: 12px; background: #FAFAFA; }
.ee-venue-dropzone { border: 2px dashed #DADADA; border-radius: 12px; padding: 48px; text-align: center; cursor: pointer; transition: all 200ms ease; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.ee-venue-dropzone:hover { border-color: #1A1A1A; background: #FAFAFA; }
.ee-venue-dropzone--drag { border-color: #1A1A1A; background: #F8F8F8; }
.ee-venue-preview { border: 1px solid #EFEFEF; border-radius: 12px; overflow: hidden; background: #FAFAFA; }
.ee-venue-preview-img { width: 100%; height: auto; display: block; }
.ee-venue-preview-actions { display: flex; gap: 8px; padding: 16px; border-top: 1px solid #EFEFEF; }
.ee-bulk-zone { border: 2px dashed #DADADA; border-radius: 12px; padding: 24px; text-align: center; cursor: pointer; transition: all 200ms ease; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.ee-bulk-zone:hover { border-color: #1A1A1A; background: #FAFAFA; }
.ee-bulk-zone--drag { border-color: #1A1A1A; background: #F8F8F8; }
.ee-bulk-textarea { width: 100%; min-height: 80px; padding: 10px 14px; border: 1px solid #DADADA; border-radius: 12px; background: #FFFFFF; font-size: 14px; color: #1A1A1A; outline: none; resize: vertical; line-height: 1.5; transition: border-color 200ms ease, box-shadow 200ms ease; }
.ee-bulk-textarea:focus { border-color: #1A1A1A; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }
.ee-guest-table { width: 100%; border-collapse: collapse; }
.ee-guest-table th { text-align: left; padding: 10px 14px; font-size: 12px; font-weight: 600; color: #B0B0B0; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #EFEFEF; }
.ee-guest-table td { padding: 12px 14px; font-size: 14px; color: #1A1A1A; border-bottom: 1px solid #F8F8F8; }
.ee-guest-table tr:hover { background: #FAFAFA; }
.ee-table-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.ee-table-card { background: #FFFFFF; border: 1px solid #EFEFEF; border-radius: 12px; padding: 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
.ee-table-card-num { font-size: 20px; font-weight: 700; color: #1A1A1A; }
.ee-table-card-name { font-size: 13px; color: #4A4A4A; margin-top: 2px; }
.ee-table-card-meta { font-size: 12px; color: #B0B0B0; margin-top: 8px; }
.ee-preset-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.ee-preset-card { border: 2px solid #EFEFEF; border-radius: 12px; padding: 12px; cursor: pointer; transition: all 200ms ease; text-align: center; }
.ee-preset-card:hover { border-color: #DADADA; }
.ee-preset-card--active { border-color: #1A1A1A; }
.ee-preset-swatch { display: flex; gap: 4px; justify-content: center; margin-bottom: 8px; }
.ee-preset-swatch span { width: 24px; height: 24px; border-radius: 6px; border: 1px solid #EFEFEF; }
.ee-preset-name { font-size: 12px; font-weight: 500; color: #4A4A4A; }
.ee-color-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.ee-color-input { width: 44px; height: 44px; border: 1px solid #DADADA; border-radius: 12px; cursor: pointer; padding: 4px; background: #FFFFFF; }
.ee-color-label { font-size: 14px; font-weight: 500; color: #4A4A4A; }
.ee-preview-wrap { position: sticky; top: 80px; background: #FFFFFF; border: 1px solid #EFEFEF; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
.ee-preview-device-toggle { display: flex; gap: 4px; margin-bottom: 16px; }
.ee-preview-device-btn { padding: 6px 12px; font-size: 12px; font-weight: 500; border: 1px solid #DADADA; border-radius: 12px; color: #4A4A4A; transition: all 200ms ease; }
.ee-preview-device-btn--active { background: #1A1A1A; color: #FFFFFF; border-color: #1A1A1A; }
.ee-preview-frame { border: 1px solid #EFEFEF; border-radius: 12px; overflow: hidden; margin: 0 auto; transition: max-width 200ms ease; }
.ee-preview-content { padding: 24px; text-align: center; }
.ee-schedule-item { display: flex; gap: 12px; margin-bottom: 12px; align-items: center; }
.ee-empty { text-align: center; padding: 48px; color: #B0B0B0; font-size: 14px; }
.ee-loading { display: flex; align-items: center; justify-content: center; min-height: 400px; }
.ee-spinner { width: 32px; height: 32px; border: 3px solid #EFEFEF; border-top-color: #1A1A1A; border-radius: 50%; animation: spin 0.8s linear infinite; }
.ee-danger-zone { border: 1px solid #E5A29B; border-radius: 12px; padding: 20px; background: #FDF2F1; }
.ee-danger-zone-title { font-size: 14px; font-weight: 600; color: #C0392B; margin-bottom: 8px; }
.ee-danger-zone-desc { font-size: 13px; color: #7A4A45; margin-bottom: 16px; }
.ee-bulk-result { padding: 12px 16px; border-radius: 12px; font-size: 14px; font-weight: 500; margin-top: 12px; }
.ee-bulk-result--success { background: #F0FDF4; color: #065F46; border: 1px solid #BBF7D0; }
.ee-bulk-result--warning { background: #FFF7ED; color: #9A3412; border: 1px solid #FED7AA; }
.ee-bulk-table-form { display: flex; gap: 16px; flex-wrap: wrap; }
.ee-bulk-table-form > .ee-field { flex: 1; min-width: 120px; margin-bottom: 0; }
/* Share tab styles */
.ee-share-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.ee-share-url-row { display: flex; gap: 12px; align-items: center; }
.ee-share-url-display { flex: 1; height: 44px; padding: 10px 14px; border: 1px solid #DADADA; border-radius: 12px; background: #F8F8F8; font-size: 14px; color: #1A1A1A; display: flex; align-items: center; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ee-share-qr-wrap { display: flex; flex-direction: column; align-items: center; gap: 16px; }
.ee-share-qr-canvas { border: 1px solid #EFEFEF; border-radius: 12px; padding: 16px; background: #FFFFFF; }
.ee-share-qr-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
.ee-share-slug-input { display: flex; align-items: center; gap: 0; }
.ee-share-slug-prefix { height: 44px; padding: 10px 14px; border: 1px solid #DADADA; border-right: none; border-radius: 12px 0 0 12px; background: #F8F8F8; font-size: 14px; color: #B0B0B0; display: flex; align-items: center; white-space: nowrap; }
.ee-share-slug-field { flex: 1; height: 44px; padding: 10px 14px; border: 1px solid #DADADA; border-radius: 0 12px 12px 0; background: #FFFFFF; font-size: 14px; color: #1A1A1A; outline: none; transition: border-color 200ms ease, box-shadow 200ms ease; }
.ee-share-slug-field:focus { border-color: #1A1A1A; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }
.ee-share-slug-field--error { border-color: #C0392B; }
.ee-share-slug-field--error:focus { border-color: #C0392B; box-shadow: 0 0 0 3px rgba(192,57,43,0.08); }
.ee-share-slug-field--valid { border-color: #059669; }
.ee-share-preview { padding: 12px 16px; border: 1px solid #EFEFEF; border-radius: 12px; background: #F8F8F8; font-size: 14px; color: #1A1A1A; word-break: break-all; }
.ee-share-error { font-size: 13px; color: #C0392B; margin-top: 6px; font-weight: 500; }
.ee-share-valid { font-size: 13px; color: #059669; margin-top: 6px; font-weight: 500; }
.ee-share-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.ee-share-tooltip { position: relative; }
.ee-share-tooltip::after { content: attr(data-tooltip); position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%); background: #1A1A1A; color: #fff; font-size: 12px; padding: 4px 10px; border-radius: 6px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 200ms ease; z-index: 10; }
.ee-share-tooltip:hover::after { opacity: 1; }
@media (max-width: 768px) { .ee-body { padding: 16px; } .ee-row { flex-direction: column; } .ee-preset-grid { grid-template-columns: repeat(2, 1fr); } .ee-bulk-table-form { flex-direction: column; } .ee-share-grid { grid-template-columns: 1fr; } .ee-share-url-row { flex-direction: column; } }
`;

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = reject; reader.readAsDataURL(file); });
}

function sanitizeSlug(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export function EventEditorPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: event, isLoading: eventLoading } = useEvent(eventId ?? '');
  const { data: guests } = useGuests(eventId ?? '');
  const { data: tables } = useTables(eventId ?? '');
  const { data: settings } = useGuestPageSettings(eventId ?? '');

  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const createGuest = useCreateGuest();
  const bulkCreateGuests = useBulkCreateGuests();
  const deleteGuest = useDeleteGuest();
  const createTable = useCreateTable();
  const deleteTable = useDeleteTable();
  const bulkCreateTables = useBulkCreateTables();
  const upsertSettings = useUpsertGuestPageSettings();

  const [activeTab, setActiveTab] = useState<Tab>('details');

  // Event details form
  const [eventForm, setEventForm] = useState({ name: '', slug: '', date: '', time: '', venue: '', accent_color: '#1A1A1A' });

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

  // Bulk import
  const [bulkDragOver, setBulkDragOver] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const bulkFileRef = useRef<HTMLInputElement>(null);

  // Single table form
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('8');

  // Bulk table creator state
  const [bulkStart, setBulkStart] = useState('1');
  const [bulkCount, setBulkCount] = useState('10');
  const [bulkCapacity, setBulkCapacity] = useState('10');
  const [bulkPrefix, setBulkPrefix] = useState('Table');
  const [bulkTableResult, setBulkTableResult] = useState<{ created: number; skipped: number; total: number; duplicates: string[] } | null>(null);

  // Schedule
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);

  // Delete confirm
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Share tab state
  const [slugInput, setSlugInput] = useState('');
  const [slugSaved, setSlugSaved] = useState('');
  const [slugSaving, setSlugSaving] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSvg, setQrSvg] = useState<string>('');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/e/` : 'https://seatly.app/e/';
  const currentSlug = slugSaved || event?.slug || '';
  const fullUrl = `${baseUrl}${currentSlug}`;

  // Slug availability check
  const { data: slugCheck } = useCheckSlugAvailability(slugInput, eventId);

  // Sync state when data loads
  useEffect(() => {
    if (event) {
      setEventForm({ name: event.name, slug: event.slug, date: event.date ?? '', time: event.time ?? '', venue: event.venue ?? '', accent_color: event.accent_color ?? '#1A1A1A' });
      setSlugInput(event.slug);
      setSlugSaved(event.slug);
    }
  }, [event]);

  const effectiveSettings = { ...(DEFAULT_SETTINGS as GuestPageSettings), ...(settings ?? {}) } as GuestPageSettings;

  useEffect(() => {
    setLogoUrl(effectiveSettings.logo_url ?? null);
    setLogoSize(effectiveSettings.logo_size ?? 64);
    setVenueUrl(effectiveSettings.venue_image_url ?? null);
    setSettingsForm({ ...DEFAULT_SETTINGS, event_id: eventId ?? '', ...settings });
    const items = effectiveSettings.schedule_items;
    setScheduleItems(Array.isArray(items) ? items : []);
  }, [settings, eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  // QR code generation — updates automatically when URL changes
  useEffect(() => {
    if (!fullUrl) return;
    QRCode.toDataURL(fullUrl, { width: 320, margin: 2, color: { dark: '#1A1A1A', light: '#FFFFFF' }, errorCorrectionLevel: 'H' })
      .then((url) => setQrDataUrl(url))
      .catch(() => {});
    QRCode.toString(fullUrl, { type: 'svg', margin: 2, color: { dark: '#1A1A1A', light: '#FFFFFF' }, errorCorrectionLevel: 'H' })
      .then((svg) => setQrSvg(svg))
      .catch(() => {});
  }, [fullUrl]);

  // Logo upload handlers
  const handleLogoFile = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_SIZE) { toast('File too large (max 5MB)', 'error'); return; }
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) { toast('Unsupported format. Use PNG, JPG, SVG, or WebP.', 'error'); return; }
    const dataUrl = await readFileAsDataURL(file);
    setLogoUrl(dataUrl);
    await upsertSettings.mutateAsync({ event_id: eventId ?? '', logo_url: dataUrl, logo_size: logoSize });
    toast('Logo uploaded', 'success');
  }, [eventId, logoSize, upsertSettings, toast]);

  const handleLogoDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setLogoDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleLogoFile(file); }, [handleLogoFile]);
  const handleLogoRemove = useCallback(async () => { setLogoUrl(null); await upsertSettings.mutateAsync({ event_id: eventId ?? '', logo_url: null }); toast('Logo removed', 'success'); }, [eventId, upsertSettings, toast]);
  const handleLogoSizeChange = useCallback(async (size: number) => { setLogoSize(size); await upsertSettings.mutateAsync({ event_id: eventId ?? '', logo_size: size }); }, [eventId, upsertSettings]);

  // Venue upload handlers
  const handleVenueFile = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_SIZE) { toast('File too large (max 5MB)', 'error'); return; }
    if (!file.type.startsWith('image/')) { toast('Please upload an image file', 'error'); return; }
    const dataUrl = await readFileAsDataURL(file);
    setVenueUrl(dataUrl);
    await upsertSettings.mutateAsync({ event_id: eventId ?? '', venue_image_url: dataUrl });
    toast('Venue layout uploaded', 'success');
  }, [eventId, upsertSettings, toast]);

  const handleVenueDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setVenueDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleVenueFile(file); }, [handleVenueFile]);
  const handleVenueRemove = useCallback(async () => { setVenueUrl(null); await upsertSettings.mutateAsync({ event_id: eventId ?? '', venue_image_url: null }); toast('Venue layout removed', 'success'); }, [eventId, upsertSettings, toast]);

  // Event details save
  const handleSaveDetails = useCallback(async () => {
    if (!eventForm.name.trim()) { toast('Event name is required', 'error'); return; }
    await updateEvent.mutateAsync({ id: eventId ?? '', name: eventForm.name, slug: eventForm.slug, date: eventForm.date || null, time: eventForm.time || null, venue: eventForm.venue || null, accent_color: eventForm.accent_color || null });
    toast('Event details saved', 'success');
  }, [eventId, eventForm, updateEvent, toast]);

  // Guest handlers
  const handleAddGuest = useCallback(async () => {
    if (!newGuestName.trim()) { toast('Guest name is required', 'error'); return; }
    if (!eventId) { toast('Event not loaded', 'error'); return; }
    try {
      await createGuest.mutateAsync({ event_id: eventId, name: newGuestName.trim(), table_id: newGuestTable || null, party_size: 1 });
      setNewGuestName(''); setNewGuestTable('');
      toast('Guest added', 'success');
    } catch (err) { toast('Failed to add guest: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error'); }
  }, [eventId, newGuestName, newGuestTable, createGuest, toast]);

  // Bulk import
  const handleBulkImport = useCallback(async () => {
    const names = bulkText.split('\n').map(n => n.trim()).filter(Boolean);
    if (names.length === 0) { toast('Enter at least one guest name', 'error'); return; }
    if (!eventId) { toast('Event not loaded', 'error'); return; }
    try {
      await bulkCreateGuests.mutateAsync(names.map(name => ({ event_id: eventId, name, party_size: 1 })));
      setBulkText(''); toast(`${names.length} guests imported`, 'success');
    } catch (err) { toast('Failed to import guests: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error'); }
  }, [eventId, bulkText, bulkCreateGuests, toast]);

  const handleBulkFile = useCallback(async (file: File) => {
    if (!eventId) return;
    try {
      const text = await file.text();
      const names = text.split(/\r?\n/).map(n => n.trim()).filter(Boolean);
      const csvNames = names.map(n => n.split(',')[0]?.trim() ?? '').filter(Boolean);
      if (csvNames.length === 0) { toast('No names found in file', 'error'); return; }
      await bulkCreateGuests.mutateAsync(csvNames.map(name => ({ event_id: eventId, name, party_size: 1 })));
      toast(`${csvNames.length} guests imported`, 'success');
    } catch (err) { toast('Failed to import file: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error'); }
  }, [eventId, bulkCreateGuests, toast]);

  const handleBulkDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setBulkDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleBulkFile(file); }, [handleBulkFile]);

  // Single table handler
  const handleAddTable = useCallback(async () => {
    if (!newTableNumber.trim()) { toast('Table number is required', 'error'); return; }
    if (!eventId) { toast('Event not loaded', 'error'); return; }
    try {
      await createTable.mutateAsync({ event_id: eventId, number: newTableNumber.trim(), name: newTableName.trim() || newTableNumber.trim(), capacity: parseInt(newTableCapacity) || 8 });
      setNewTableNumber(''); setNewTableName(''); setNewTableCapacity('8');
      toast('Table added', 'success');
    } catch (err) { toast('Failed to add table: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error'); }
  }, [eventId, newTableNumber, newTableName, newTableCapacity, createTable, toast]);

  // Bulk table creator
  const handleBulkCreateTables = useCallback(async () => {
    if (!eventId) { toast('Event not loaded', 'error'); return; }
    const start = parseInt(bulkStart) || 1;
    const count = parseInt(bulkCount) || 0;
    const capacity = parseInt(bulkCapacity) || 8;
    const prefix = bulkPrefix.trim() || 'Table';
    if (count <= 0) { toast('Number of tables must be at least 1', 'error'); return; }
    if (count > 500) { toast('Maximum 500 tables at once', 'error'); return; }
    const newTables: TableInput[] = [];
    const duplicates: string[] = [];
    const existingNames = new Set((tables ?? []).map(t => `${t.number}`));
    const existingDisplayNames = new Set((tables ?? []).map(t => t.name));
    for (let i = 0; i < count; i++) {
      const num = String(start + i);
      const displayName = `${prefix} ${num}`;
      if (existingNames.has(num) || existingDisplayNames.has(displayName)) { duplicates.push(displayName); }
      else { newTables.push({ event_id: eventId, number: num, name: displayName, capacity }); }
    }
    if (newTables.length === 0) { setBulkTableResult({ created: 0, skipped: duplicates.length, total: tables?.length ?? 0, duplicates }); toast(`All ${duplicates.length} tables already exist — none created`, 'error'); return; }
    try {
      await bulkCreateTables.mutateAsync({ event_id: eventId, tables: newTables });
      const totalAfter = (tables?.length ?? 0) + newTables.length;
      setBulkTableResult({ created: newTables.length, skipped: duplicates.length, total: totalAfter, duplicates });
      toast(duplicates.length > 0 ? `${newTables.length} tables created, ${duplicates.length} duplicates skipped` : `${newTables.length} tables created`, 'success');
    } catch (err) { toast('Failed to create tables: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error'); }
  }, [eventId, bulkStart, bulkCount, bulkCapacity, bulkPrefix, tables, bulkCreateTables, toast]);

  // Settings save
  const handleSaveSettings = useCallback(async () => {
    try { await upsertSettings.mutateAsync(settingsForm); toast('Settings saved — guest page updated', 'success'); }
    catch (err) { toast('Failed to save settings: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error'); }
  }, [settingsForm, upsertSettings, toast]);

  // Schedule save
  const handleSaveSchedule = useCallback(async () => { await upsertSettings.mutateAsync({ event_id: eventId ?? '', schedule_items: scheduleItems }); toast('Schedule saved', 'success'); }, [eventId, scheduleItems, upsertSettings, toast]);

  // Delete event
  const handleDeleteEvent = useCallback(async () => { await deleteEvent.mutateAsync(eventId ?? ''); navigate('/'); }, [eventId, deleteEvent, navigate]);

  // ── Share tab handlers ──
  const handleSlugInput = useCallback((value: string) => {
    const sanitized = sanitizeSlug(value);
    setSlugInput(sanitized);
  }, []);

  const handleSaveSlug = useCallback(async () => {
    if (!eventId) return;
    const sanitized = sanitizeSlug(slugInput);
    if (!sanitized || sanitized.length < 2) { toast('Slug must be at least 2 characters', 'error'); return; }
    if (slugCheck && !slugCheck.available) { toast('This URL is already taken. Try another.', 'error'); return; }
    setSlugSaving(true);
    try {
      await updateEvent.mutateAsync({ id: eventId, name: eventForm.name, slug: sanitized, date: eventForm.date || null, time: eventForm.time || null, venue: eventForm.venue || null, accent_color: eventForm.accent_color || null });
      setSlugSaved(sanitized);
      setEventForm(f => ({ ...f, slug: sanitized }));
      toast('URL updated successfully', 'success');
    } catch (err) { toast('Failed to update URL: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error'); }
    setSlugSaving(false);
  }, [eventId, slugInput, slugCheck, updateEvent, eventForm, toast]);

  const handleCopyLink = useCallback(async () => {
    try { await navigator.clipboard.writeText(fullUrl); toast('Link copied to clipboard', 'success'); }
    catch { toast('Failed to copy link', 'error'); }
  }, [fullUrl, toast]);

  const handleOpenWebsite = useCallback(() => {
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  }, [fullUrl]);

  const handleDownloadPng = useCallback(() => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr-${currentSlug || 'event'}.png`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast('QR code downloaded as PNG', 'success');
  }, [qrDataUrl, currentSlug, toast]);

  const handleDownloadSvg = useCallback(() => {
    if (!qrSvg) return;
    const blob = new Blob([qrSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `qr-${currentSlug || 'event'}.svg`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('QR code downloaded as SVG', 'success');
  }, [qrSvg, currentSlug, toast]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try { await navigator.share({ title: event?.name || 'My Event', text: 'Find your seat at our event!', url: fullUrl }); }
      catch { /* user cancelled */ }
    } else { handleCopyLink(); }
  }, [event, fullUrl, handleCopyLink]);

  // Slug validation state
  const slugError = useMemo(() => {
    if (!slugInput) return null;
    if (slugInput.length < 2) return 'Slug must be at least 2 characters';
    if (slugInput !== slugSaved && slugCheck && !slugCheck.available) return 'This URL is already taken';
    return null;
  }, [slugInput, slugSaved, slugCheck]);

  const slugValid = slugInput && slugInput.length >= 2 && (!slugCheck || slugCheck.available) && slugInput !== slugSaved;
  const slugUnchanged = slugInput === slugSaved;

  if (eventLoading) return <div className="ee-root"><style>{EE_CSS}</style><div className="ee-loading"><div className="ee-spinner" /></div></div>;
  if (!event) return <div className="ee-root"><style>{EE_CSS}</style><div className="ee-empty">Event not found. <Link to="/">Back to dashboard</Link></div></div>;

  return (
    <div className="ee-root">
      <style>{EE_CSS}</style>
      <div className="ee-header">
        <Link to="/"><button className="ee-back-btn"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 4L6 8l4 4" strokeLinecap="round" strokeLinejoin="round" /></svg>Back</button></Link>
        <span className="ee-title">{event.name}</span>
      </div>
      <div className="ee-tabs">
        {TABS.map(tab => <button key={tab.id} className={`ee-tab${activeTab === tab.id ? ' ee-tab--active' : ''}`} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}
      </div>
      <div className="ee-body">

        {/* EVENT DETAILS */}
        <section className="ee-panel" style={{ display: activeTab === 'details' ? 'block' : 'none' }}>
          <div className="ee-card">
            <div className="ee-card-title">Event Information</div>
            <div className="ee-field"><label className="ee-label">Event Name</label><input className="ee-input" value={eventForm.name} onChange={e => setEventForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="ee-field"><label className="ee-label">Slug (URL)</label><input className="ee-input" value={eventForm.slug} onChange={e => setEventForm(f => ({ ...f, slug: e.target.value }))} /></div>
            <div className="ee-row">
              <div className="ee-field"><label className="ee-label">Date</label><input className="ee-input" type="date" value={eventForm.date} onChange={e => setEventForm(f => ({ ...f, date: e.target.value }))} /></div>
              <div className="ee-field"><label className="ee-label">Time</label><input className="ee-input" type="time" value={eventForm.time} onChange={e => setEventForm(f => ({ ...f, time: e.target.value }))} /></div>
            </div>
            <div className="ee-field"><label className="ee-label">Venue</label><input className="ee-input" value={eventForm.venue} onChange={e => setEventForm(f => ({ ...f, venue: e.target.value }))} /></div>
            <div className="ee-field"><label className="ee-label">Accent Color</label><div className="ee-color-row"><input className="ee-color-input" type="color" value={eventForm.accent_color} onChange={e => setEventForm(f => ({ ...f, accent_color: e.target.value }))} /><span className="ee-color-label">{eventForm.accent_color}</span></div></div>
            <button className="ee-btn ee-btn-primary" onClick={handleSaveDetails}>Save Changes</button>
          </div>
          <div className="ee-card">
            <div className="ee-card-title">Event Logo</div>
            <div className="ee-logo-upload">
              <input ref={logoFileRef} type="file" accept={ACCEPTED_FORMATS} hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoFile(f); e.target.value = ''; }} />
              {logoUrl ? (
                <div className="ee-logo-preview">
                  <img src={logoUrl} alt="Logo" style={{ width: `${logoSize}px`, height: `${logoSize}px`, objectFit: 'contain', borderRadius: '8px', background: '#FFFFFF', border: '1px solid #EFEFEF' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#1A1A1A' }}>Logo uploaded</div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button className="ee-btn ee-btn-secondary ee-btn-sm" onClick={() => logoFileRef.current?.click()}>Replace</button>
                      <button className="ee-btn ee-btn-danger ee-btn-sm" onClick={handleLogoRemove}>Remove</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`ee-logo-dropzone${logoDragOver ? ' ee-logo-dropzone--drag' : ''}`} onClick={() => logoFileRef.current?.click()} onDragOver={e => { e.preventDefault(); setLogoDragOver(true); }} onDragLeave={() => setLogoDragOver(false)} onDrop={handleLogoDrop}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#B0B0B0" strokeWidth="1.5"><path d="M12 16V4M8 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <span className="ee-dropzone-text">Drag & drop logo here, or click to browse</span>
                  <span className="ee-dropzone-hint">PNG, JPG, SVG, WebP — max 5MB</span>
                </div>
              )}
              <div className="ee-logo-size-controls">
                <label className="ee-label">Logo Size</label>
                <div className="ee-logo-size-presets">
                  {LOGO_SIZE_PRESETS.map(preset => <button key={preset.value} className={`ee-logo-size-preset${logoSize === preset.value ? ' ee-logo-size-preset--active' : ''}`} onClick={() => handleLogoSizeChange(preset.value)}>{preset.label}</button>)}
                </div>
                <div className="ee-logo-size-slider-row">
                  <input className="ee-logo-size-slider" type="range" min="32" max="128" step="4" value={logoSize} onChange={e => handleLogoSizeChange(parseInt(e.target.value))} />
                  <span className="ee-logo-size-value">{logoSize}px</span>
                </div>
                {logoUrl && <div className="ee-logo-live-preview"><img src={logoUrl} alt="Logo preview" style={{ width: `${logoSize}px`, height: `${logoSize}px`, objectFit: 'contain', borderRadius: '8px' }} /></div>}
              </div>
            </div>
          </div>
        </section>

        {/* GUESTS */}
        <section className="ee-panel" style={{ display: activeTab === 'guests' ? 'block' : 'none' }}>
          <div className="ee-card">
            <div className="ee-card-title">Bulk Import</div>
            <input ref={bulkFileRef} type="file" accept=".csv,.txt,.xlsx,.xls,.pdf" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleBulkFile(f); e.target.value = ''; }} />
            <div className={`ee-bulk-zone${bulkDragOver ? ' ee-bulk-zone--drag' : ''}`} onClick={() => bulkFileRef.current?.click()} onDragOver={e => { e.preventDefault(); setBulkDragOver(true); }} onDragLeave={() => setBulkDragOver(false)} onDrop={handleBulkDrop}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B0B0B0" strokeWidth="1.5"><path d="M12 16V4M8 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span className="ee-dropzone-text">Drag & Drop CSV / Excel / PDF Here</span>
              <span className="ee-dropzone-hint">or click to browse files</span>
            </div>
            <div style={{ marginTop: '12px' }}>
              <label className="ee-label">Or paste names (one per line)</label>
              <textarea className="ee-bulk-textarea" placeholder={'John Smith\nJane Doe\n...'} value={bulkText} onChange={e => setBulkText(e.target.value)} />
              <button className="ee-btn ee-btn-primary ee-btn-sm" style={{ marginTop: '8px' }} onClick={handleBulkImport}>Import Guests</button>
            </div>
          </div>
          <div className="ee-card">
            <div className="ee-card-title">Add Guest</div>
            <div className="ee-row">
              <div className="ee-field"><input className="ee-input" placeholder="Guest name" value={newGuestName} onChange={e => setNewGuestName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddGuest(); }} /></div>
              <div className="ee-field"><select className="ee-select" value={newGuestTable} onChange={e => setNewGuestTable(e.target.value)}><option value="">No table</option>{tables?.map(t => <option key={t.id} value={t.id}>Table {t.number}</option>)}</select></div>
            </div>
            <button className="ee-btn ee-btn-primary" onClick={handleAddGuest}>Add Guest</button>
          </div>
          <div className="ee-card">
            <div className="ee-card-title">Guest List ({guests?.length ?? 0})</div>
            {guests && guests.length > 0 ? (
              <table className="ee-guest-table"><thead><tr><th>Name</th><th>Table</th><th></th></tr></thead><tbody>
                {guests.map(g => <tr key={g.id}><td>{g.name}</td><td>{g.table ? `Table ${g.table.number}` : '—'}</td><td><button className="ee-btn ee-btn-danger ee-btn-sm" onClick={async () => { try { await deleteGuest.mutateAsync({ id: g.id, eventId: eventId ?? '' }); toast('Guest removed', 'success'); } catch { toast('Failed to remove guest', 'error'); } }}>Delete</button></td></tr>)}
              </tbody></table>
            ) : <div className="ee-empty">No guests yet</div>}
          </div>
        </section>

        {/* TABLES */}
        <section className="ee-panel" style={{ display: activeTab === 'tables' ? 'block' : 'none' }}>
          <div className="ee-card">
            <div className="ee-card-title">Bulk Create Tables</div>
            <div className="ee-bulk-table-form">
              <div className="ee-field"><label className="ee-label">Table Prefix</label><input className="ee-input" placeholder="Table" value={bulkPrefix} onChange={e => setBulkPrefix(e.target.value)} /></div>
              <div className="ee-field"><label className="ee-label">Starting Number</label><input className="ee-input" type="number" min="1" value={bulkStart} onChange={e => setBulkStart(e.target.value)} /></div>
              <div className="ee-field"><label className="ee-label">Number of Tables</label><input className="ee-input" type="number" min="1" max="500" value={bulkCount} onChange={e => setBulkCount(e.target.value)} /></div>
              <div className="ee-field"><label className="ee-label">Seats Per Table</label><input className="ee-input" type="number" min="1" value={bulkCapacity} onChange={e => setBulkCapacity(e.target.value)} /></div>
            </div>
            <div style={{ marginTop: '16px' }}><button className="ee-btn ee-btn-primary" onClick={handleBulkCreateTables} disabled={bulkCreateTables.isPending}>{bulkCreateTables.isPending ? 'Creating...' : 'Create Tables'}</button></div>
            {bulkTableResult && (
              <div className={`ee-bulk-result${bulkTableResult.skipped > 0 ? ' ee-bulk-result--warning' : ' ee-bulk-result--success'}`}>
                {bulkTableResult.created} table{bulkTableResult.created !== 1 ? 's' : ''} created{bulkTableResult.skipped > 0 && `, ${bulkTableResult.skipped} duplicate${bulkTableResult.skipped !== 1 ? 's' : ''} skipped`}{' — '}{bulkTableResult.total} total tables in event
                {bulkTableResult.duplicates.length > 0 && <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>Skipped: {bulkTableResult.duplicates.slice(0, 10).join(', ')}{bulkTableResult.duplicates.length > 10 ? ` ... and ${bulkTableResult.duplicates.length - 10} more` : ''}</div>}
              </div>
            )}
          </div>
          <div className="ee-card">
            <div className="ee-card-title">Add Single Table</div>
            <div className="ee-row">
              <div className="ee-field"><input className="ee-input" placeholder="Table number" value={newTableNumber} onChange={e => setNewTableNumber(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddTable(); }} /></div>
              <div className="ee-field"><input className="ee-input" placeholder="Table name (optional)" value={newTableName} onChange={e => setNewTableName(e.target.value)} /></div>
              <div className="ee-field"><input className="ee-input" type="number" placeholder="Capacity" value={newTableCapacity} onChange={e => setNewTableCapacity(e.target.value)} /></div>
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
                      <button className="ee-btn ee-btn-danger ee-btn-sm" style={{ marginTop: '8px', width: '100%' }} onClick={async () => { try { await deleteTable.mutateAsync({ id: t.id, eventId: eventId ?? '' }); toast('Table removed', 'success'); } catch { toast('Failed to remove table', 'error'); } }}>Delete</button>
                    </div>
                  );
                })}
              </div>
            ) : <div className="ee-empty">No tables yet</div>}
          </div>
        </section>

        {/* VENUE LAYOUT */}
        <section className="ee-panel" style={{ display: activeTab === 'venue' ? 'block' : 'none' }}>
          <div className="ee-card">
            <div className="ee-card-title">Venue Layout Image</div>
            <input ref={venueFileRef} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleVenueFile(f); e.target.value = ''; }} />
            {venueUrl ? (
              <div className="ee-venue-preview">
                <img className="ee-venue-preview-img" src={venueUrl} alt="Venue layout" />
                <div className="ee-venue-preview-actions">
                  <button className="ee-btn ee-btn-secondary ee-btn-sm" onClick={() => venueFileRef.current?.click()}>Replace</button>
                  <button className="ee-btn ee-btn-danger ee-btn-sm" onClick={handleVenueRemove}>Remove</button>
                </div>
              </div>
            ) : (
              <div className={`ee-venue-dropzone${venueDragOver ? ' ee-venue-dropzone--drag' : ''}`} onClick={() => venueFileRef.current?.click()} onDragOver={e => { e.preventDefault(); setVenueDragOver(true); }} onDragLeave={() => setVenueDragOver(false)} onDrop={handleVenueDrop}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#B0B0B0" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
                <span className="ee-dropzone-text">Drag & drop venue layout here, or click to browse</span>
                <span className="ee-dropzone-hint">PNG, JPG, SVG, WebP — max 5MB</span>
              </div>
            )}
          </div>
        </section>

        {/* SCHEDULE */}
        <section className="ee-panel" style={{ display: activeTab === 'schedule' ? 'block' : 'none' }}>
          <div className="ee-card">
            <div className="ee-card-title">Event Schedule</div>
            {scheduleItems.map((item, i) => (
              <div key={i} className="ee-schedule-item">
                <input className="ee-input" type="time" style={{ width: '120px' }} value={item.time} onChange={e => setScheduleItems(s => s.map((x, j) => j === i ? { ...x, time: e.target.value } : x))} />
                <input className="ee-input" placeholder="Label / description" value={item.label} onChange={e => setScheduleItems(s => s.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
                <button className="ee-btn ee-btn-danger ee-btn-sm" onClick={() => setScheduleItems(s => s.filter((_, j) => j !== i))}>Remove</button>
              </div>
            ))}
            <button className="ee-btn ee-btn-secondary" style={{ marginBottom: '16px' }} onClick={() => setScheduleItems(s => [...s, { time: '', label: '' }])}>+ Add Schedule Item</button>
            <div><button className="ee-btn ee-btn-primary" onClick={handleSaveSchedule}>Save Schedule</button></div>
          </div>
        </section>

        {/* SETTINGS */}
        <section className="ee-panel" style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            <div style={{ flex: '1', minWidth: 0 }}>
              <div className="ee-card">
                <div className="ee-card-title">Theme Presets</div>
                <div className="ee-preset-grid">
                  {THEME_PRESETS.map(preset => {
                    const isActive = settingsForm.color_primary === preset.color_primary && settingsForm.color_background === preset.color_background;
                    return (
                      <div key={preset.name} className={`ee-preset-card${isActive ? ' ee-preset-card--active' : ''}`} onClick={() => setSettingsForm(f => ({ ...f, color_primary: preset.color_primary, color_secondary: preset.color_secondary, color_background: preset.color_background, color_button: preset.color_button, color_button_text: preset.color_button_text, color_link: preset.color_link, color_footer: preset.color_footer }))}>
                        <div className="ee-preset-swatch"><span style={{ background: preset.color_primary }} /><span style={{ background: preset.color_background }} /><span style={{ background: preset.color_button }} /></div>
                        <div className="ee-preset-name">{preset.name}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="ee-card">
                <div className="ee-card-title">Colors</div>
                <div className="ee-color-row"><input className="ee-color-input" type="color" value={settingsForm.color_primary ?? '#1A1A1A'} onChange={e => setSettingsForm(f => ({ ...f, color_primary: e.target.value }))} /><span className="ee-color-label">Primary / Accent</span></div>
                <div className="ee-color-row"><input className="ee-color-input" type="color" value={settingsForm.color_background ?? '#FAF3E8'} onChange={e => setSettingsForm(f => ({ ...f, color_background: e.target.value }))} /><span className="ee-color-label">Background</span></div>
                <div className="ee-color-row"><input className="ee-color-input" type="color" value={settingsForm.color_button ?? '#1A1A1A'} onChange={e => setSettingsForm(f => ({ ...f, color_button: e.target.value }))} /><span className="ee-color-label">Button</span></div>
                <div className="ee-color-row"><input className="ee-color-input" type="color" value={settingsForm.color_button_text ?? '#FFFFFF'} onChange={e => setSettingsForm(f => ({ ...f, color_button_text: e.target.value }))} /><span className="ee-color-label">Button Text</span></div>
              </div>
              <div className="ee-card">
                <div className="ee-card-title">Fonts</div>
                <div className="ee-field"><label className="ee-label">Heading Font</label><select className="ee-select" value={settingsForm.font_heading ?? 'Inter'} onChange={e => setSettingsForm(f => ({ ...f, font_heading: e.target.value }))}>{FONT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div>
                <div className="ee-field"><label className="ee-label">Body Font</label><select className="ee-select" value={settingsForm.font_body ?? 'Inter'} onChange={e => setSettingsForm(f => ({ ...f, font_body: e.target.value }))}>{FONT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div>
              </div>
              <button className="ee-btn ee-btn-primary" onClick={handleSaveSettings}>Save Settings</button>
              <div className="ee-danger-zone" style={{ marginTop: '24px' }}>
                <div className="ee-danger-zone-title">Danger Zone</div>
                <div className="ee-danger-zone-desc">Permanently delete this event and all associated data.</div>
                <button className="ee-btn ee-btn-danger" onClick={() => setDeleteConfirmOpen(true)}>Delete Event</button>
              </div>
            </div>
            <div style={{ width: '340px', flexShrink: 0 }}>
              <div className="ee-preview-wrap">
                <div className="ee-preview-device-toggle">
                  <button className={`ee-preview-device-btn${previewDevice === 'desktop' ? ' ee-preview-device-btn--active' : ''}`} onClick={() => setPreviewDevice('desktop')}>Desktop</button>
                  <button className={`ee-preview-device-btn${previewDevice === 'mobile' ? ' ee-preview-device-btn--active' : ''}`} onClick={() => setPreviewDevice('mobile')}>Mobile</button>
                </div>
                <div className="ee-preview-frame" style={{ maxWidth: previewDevice === 'mobile' ? '280px' : '100%', background: settingsForm.color_background ?? '#FAF3E8' }}>
                  <div className="ee-preview-content" style={{ color: settingsForm.color_primary ?? '#1A1A1A' }}>
                    {logoUrl && <img src={logoUrl} alt="Logo" style={{ width: `${logoSize}px`, height: `${logoSize}px`, margin: '0 auto 12px', borderRadius: '50%', objectFit: 'contain' }} />}
                    <div style={{ fontFamily: settingsForm.font_heading ?? 'Inter', fontSize: '20px', fontWeight: 600, letterSpacing: '0.1em', marginBottom: '8px' }}>{eventForm.name.toUpperCase() || 'EVENT NAME'}</div>
                    <div style={{ fontSize: '11px', letterSpacing: '0.15em', opacity: 0.8 }}>{eventForm.date || 'DATE'} · {eventForm.venue?.toUpperCase() || 'VENUE'}</div>
                    <div style={{ marginTop: '16px', padding: '0 16px' }}><div style={{ border: `1.5px solid ${settingsForm.color_primary ?? '#1A1A1A'}`, borderRadius: '12px', padding: '12px 16px', fontSize: '14px', background: settingsForm.color_background ?? 'transparent', color: settingsForm.color_primary ?? '#1A1A1A' }}>SEARCH YOUR NAME</div></div>
                    <div style={{ marginTop: '12px' }}><div style={{ display: 'inline-block', padding: '8px 20px', borderRadius: '12px', background: settingsForm.color_button ?? '#1A1A1A', color: settingsForm.color_button_text ?? '#FFFFFF', fontSize: '14px', fontWeight: 500 }}>FIND SEAT</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SHARE */}
        <section className="ee-panel" style={{ display: activeTab === 'share' ? 'block' : 'none' }}>
          <div className="ee-card">
            <div className="ee-card-title">Share Your Event</div>
            <p style={{ fontSize: '14px', color: '#4A4A4A', marginBottom: '20px' }}>Share your guest website with attendees. They can search for their seat and view the venue layout.</p>

            {/* Guest Website URL */}
            <div style={{ marginBottom: '24px' }}>
              <label className="ee-label">Guest Website URL</label>
              <div className="ee-share-url-row">
                <div className="ee-share-url-display">{fullUrl}</div>
              </div>
              <div className="ee-share-actions" style={{ marginTop: '12px' }}>
                <button className="ee-btn ee-btn-primary ee-btn-sm ee-share-tooltip" data-tooltip="Copy link to clipboard" onClick={handleCopyLink}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="5" width="8" height="8" rx="2" /><path d="M11 5V3a2 2 0 00-2-2H3a2 2 0 00-2 2v6a2 2 0 002 2h2" /></svg>
                  Copy Link
                </button>
                <button className="ee-btn ee-btn-secondary ee-btn-sm ee-share-tooltip" data-tooltip="Open guest website in new tab" onClick={handleOpenWebsite}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 3h3v3M13 3L7 9M12 9v3a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Open Guest Website
                </button>
                <button className="ee-btn ee-btn-secondary ee-btn-sm ee-share-tooltip" data-tooltip="Share via browser" onClick={handleNativeShare}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="4" cy="8" r="2" /><circle cx="12" cy="4" r="2" /><circle cx="12" cy="12" r="2" /><path d="M6 7l4-2M6 9l4 2" /></svg>
                  Share
                </button>
              </div>
            </div>

            {/* QR Code */}
            <div style={{ marginBottom: '24px' }}>
              <label className="ee-label">QR Code</label>
              <div className="ee-share-grid">
                <div className="ee-share-qr-wrap">
                  {qrDataUrl ? (
                    <div className="ee-share-qr-canvas">
                      <img src={qrDataUrl} alt="QR Code" style={{ width: '240px', height: '240px' }} />
                    </div>
                  ) : (
                    <div className="ee-share-qr-canvas" style={{ width: '272px', height: '272px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="ee-spinner" />
                    </div>
                  )}
                  <div className="ee-share-qr-actions">
                    <button className="ee-btn ee-btn-secondary ee-btn-sm ee-share-tooltip" data-tooltip="Download as PNG image" onClick={handleDownloadPng} disabled={!qrDataUrl}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v8m0 0l-3-3m3 3l3-3M2 12v1a2 2 0 002 2h8a2 2 0 002-2v-1" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      Download PNG
                    </button>
                    <button className="ee-btn ee-btn-secondary ee-btn-sm ee-share-tooltip" data-tooltip="Download as SVG vector" onClick={handleDownloadSvg} disabled={!qrSvg}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v8m0 0l-3-3m3 3l3-3M2 12v1a2 2 0 002 2h8a2 2 0 002-2v-1" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      Download SVG
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <p style={{ fontSize: '13px', color: '#4A4A4A', lineHeight: 1.6 }}>The QR code automatically updates when you change the URL slug. Guests can scan this code with their phone to open the guest page directly.</p>
                    <p style={{ fontSize: '13px', color: '#4A4A4A', lineHeight: 1.6, marginTop: '8px' }}>Download the PNG for print materials or the SVG for digital use.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom URL */}
            <div>
              <label className="ee-label">Custom URL</label>
              <div className="ee-share-slug-input">
                <span className="ee-share-slug-prefix">{baseUrl}</span>
                <input
                  className={`ee-share-slug-field${slugError ? ' ee-share-slug-field--error' : slugValid ? ' ee-share-slug-field--valid' : ''}`}
                  placeholder="your-event-slug"
                  value={slugInput}
                  onChange={e => handleSlugInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && slugValid) handleSaveSlug(); }}
                />
              </div>
              {slugError && <div className="ee-share-error">{slugError}</div>}
              {slugValid && <div className="ee-share-valid">URL is available</div>}
              <div style={{ marginTop: '12px' }}>
                <label className="ee-label">Live Preview</label>
                <div className="ee-share-preview">{baseUrl}{slugInput || currentSlug || 'your-event-slug'}</div>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                <button className="ee-btn ee-btn-primary ee-btn-sm" onClick={handleSaveSlug} disabled={!slugValid || slugSaving || slugUnchanged}>
                  {slugSaving ? 'Saving...' : 'Save URL'}
                </button>
                <button className="ee-btn ee-btn-secondary ee-btn-sm ee-share-tooltip" data-tooltip="Open preview in new tab" onClick={handleOpenWebsite}>
                  Open Guest Website
                </button>
              </div>
            </div>
          </div>
        </section>

      </div>

      {deleteConfirmOpen && (
        <ConfirmDialog open={deleteConfirmOpen} title="Delete Event" message={`Are you sure you want to delete "${event.name}"? This cannot be undone.`} onConfirm={handleDeleteEvent} onCancel={() => setDeleteConfirmOpen(false)} />
      )}
    </div>
  );
}
