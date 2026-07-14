import { useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/use-events';
import { useGuests, useCreateGuest, useBulkCreateGuests, useUpdateGuest, useDeleteGuest } from '@/hooks/use-guests';
import { useTables, useCreateTable, useDeleteTable } from '@/hooks/use-tables';
import { useGuestPageSettings, useUpsertGuestPageSettings } from '@/hooks/use-guest-page-settings';
import { useToast } from '@/providers/toast-provider';
import { ConfirmDialog, Modal } from '@/components/ui/confirm-dialog';
import { DEFAULT_SETTINGS, FONT_OPTIONS, THEME_PRESETS } from '@/types/guest-page-settings';
import type { GuestPageSettingsInput } from '@/types/guest-page-settings';
import type { GuestWithTable } from '@/types/guest';

const EE_CSS = `
.ee-root {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #1A1A1A;
}
.ee-topbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 32px;
  background: #FFFFFF;
  border-bottom: 1px solid #E5E5E5;
  position: sticky;
  top: 0;
  z-index: 100;
}
.ee-back {
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  color: #4A4A4A;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.2s ease;
}
.ee-back:hover { background: #F8F8F8; color: #1A1A1A; }
.ee-event-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  letter-spacing: -0.01em;
}
.ee-topbar-spacer { flex: 1; }
.ee-topbar-btn {
  padding: 8px 16px;
  border: 1px solid #D5D5D5;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #1A1A1A;
  background: #FFFFFF;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
}
.ee-topbar-btn:hover { background: #F8F8F8; }
.ee-topbar-btn--danger {
  color: #6A6A6A;
}
.ee-topbar-btn--danger:hover { background: #F0F0F0; }
.ee-tabs {
  display: flex;
  gap: 0;
  padding: 0 32px;
  background: #FFFFFF;
  border-bottom: 1px solid #E5E5E5;
  overflow-x: auto;
}
.ee-tab {
  padding: 14px 20px;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: #8A8A8A;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.ee-tab:hover { color: #4A4A4A; }
.ee-tab--active {
  color: #1A1A1A;
  border-bottom-color: #1A1A1A;
}
.ee-content {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
}
.ee-panel {
  display: none;
}
.ee-panel--active {
  display: block;
}
.ee-section-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 24px 0;
  letter-spacing: -0.01em;
}
.ee-field {
  margin-bottom: 20px;
}
.ee-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #4A4A4A;
  margin-bottom: 6px;
}
.ee-input {
  width: 100%;
  max-width: 480px;
  padding: 11px 14px;
  border: 1px solid #D5D5D5;
  border-radius: 10px;
  font-size: 14px;
  color: #1A1A1A;
  background: #FFFFFF;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}
.ee-input:focus { border-color: #1A1A1A; }
.ee-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.ee-row > .ee-field { flex: 1; min-width: 200px; }
.ee-btn {
  padding: 11px 24px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.ee-btn--primary {
  background: #1A1A1A;
  color: #FFFFFF;
}
.ee-btn--primary:hover { background: #2A2A2A; }
.ee-btn--primary:disabled { opacity: 0.6; cursor: not-allowed; }
.ee-btn--secondary {
  background: #F8F8F8;
  color: #1A1A1A;
  border: 1px solid #D5D5D5;
}
.ee-btn--secondary:hover { background: #F0F0F0; }
.ee-btn--danger {
  background: #FFFFFF;
  color: #6A6A6A;
  border: 1px solid #D5D5D5;
}
.ee-btn--danger:hover { background: #F0F0F0; color: #1A1A1A; }

/* Guests tab */
.ee-guest-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.ee-guest-list {
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  overflow: hidden;
}
.ee-guest-row {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid #F0F0F0;
  gap: 12px;
}
.ee-guest-row:last-child { border-bottom: none; }
.ee-guest-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}
.ee-guest-table-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 100px;
  background: #F8F8F8;
  border: 1px solid #E5E5E5;
  color: #4A4A4A;
}
.ee-guest-table-badge--none {
  color: #8A8A8A;
  font-style: italic;
}
.ee-guest-action {
  padding: 6px 10px;
  border: 1px solid #D5D5D5;
  border-radius: 6px;
  font-size: 12px;
  background: #FFFFFF;
  cursor: pointer;
  color: #4A4A4A;
}
.ee-guest-action:hover { background: #F8F8F8; }
.ee-guest-select {
  padding: 6px 10px;
  border: 1px solid #D5D5D5;
  border-radius: 6px;
  font-size: 13px;
  background: #FFFFFF;
  cursor: pointer;
  outline: none;
}

/* Tables tab */
.ee-table-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ee-table-card {
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}
.ee-table-num {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #1A1A1A;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
}
.ee-table-info {
  flex: 1;
}
.ee-table-name {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 2px 0;
}
.ee-table-meta {
  font-size: 13px;
  color: #8A8A8A;
  margin: 0;
}

/* Venue layout tab */
.ee-dropzone {
  border: 2px dashed #D5D5D5;
  border-radius: 16px;
  padding: 48px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #F8F8F8;
}
.ee-dropzone:hover, .ee-dropzone--drag {
  border-color: #1A1A1A;
  background: #F0F0F0;
}
.ee-dropzone-icon {
  color: #8A8A8A;
  margin-bottom: 12px;
}
.ee-dropzone-text {
  font-size: 15px;
  font-weight: 500;
  color: #4A4A4A;
  margin: 0 0 4px 0;
}
.ee-dropzone-hint {
  font-size: 13px;
  color: #8A8A8A;
  margin: 0;
}
.ee-venue-preview {
  margin-top: 24px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #E5E5E5;
  background: #FFFFFF;
}
.ee-venue-preview img {
  width: 100%;
  display: block;
}

/* Settings tab */
.ee-settings-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 32px;
  align-items: start;
}
.ee-presets {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}
.ee-preset {
  border: 2px solid #E5E5E5;
  border-radius: 12px;
  padding: 14px;
  cursor: pointer;
  transition: border-color 0.2s ease;
  text-align: center;
}
.ee-preset:hover { border-color: #B5B5B5; }
.ee-preset--active { border-color: #1A1A1A; }
.ee-preset-swatch {
  width: 100%;
  height: 40px;
  border-radius: 8px;
  margin-bottom: 8px;
}
.ee-preset-name {
  font-size: 12px;
  font-weight: 600;
  color: #4A4A4A;
}
.ee-color-row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.ee-color-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ee-color-input {
  width: 48px;
  height: 48px;
  border: 1px solid #D5D5D5;
  border-radius: 10px;
  cursor: pointer;
  padding: 4px;
  background: #FFFFFF;
}
.ee-preview-wrap {
  position: sticky;
  top: 80px;
}
.ee-preview-toggle {
  display: flex;
  gap: 4px;
  background: #F8F8F8;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 12px;
  width: fit-content;
}
.ee-preview-toggle-btn {
  padding: 6px 14px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #8A8A8A;
  cursor: pointer;
}
.ee-preview-toggle-btn--active {
  background: #1A1A1A;
  color: #FFFFFF;
}
.ee-preview-frame {
  border: 1px solid #E5E5E5;
  border-radius: 16px;
  overflow: hidden;
  background: #F8F8F8;
  transition: max-width 0.3s ease;
}
.ee-preview-frame--mobile {
  max-width: 390px;
  margin: 0 auto;
}
.ee-preview-content {
  padding: 32px 24px;
  text-align: center;
}
.ee-preview-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}
.ee-preview-subtitle {
  font-size: 14px;
  margin: 0 0 20px 0;
}
.ee-preview-btn {
  display: inline-block;
  padding: 12px 28px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}
.ee-danger-zone {
  margin-top: 32px;
  padding: 20px;
  border: 1px solid #D5D5D5;
  border-radius: 12px;
  background: #F8F8F8;
}
.ee-danger-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 4px 0;
}
.ee-danger-text {
  font-size: 13px;
  color: #8A8A8A;
  margin: 0 0 12px 0;
}

/* Schedule tab */
.ee-schedule-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ee-schedule-item {
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}
.ee-schedule-time {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A1A;
  min-width: 80px;
}
.ee-schedule-desc {
  flex: 1;
  font-size: 14px;
  color: #4A4A4A;
}

/* Invitation tab */
.ee-invite-card {
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 16px;
  padding: 28px;
  max-width: 560px;
}
.ee-invite-url {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 16px;
}
.ee-invite-url input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #D5D5D5;
  border-radius: 8px;
  font-size: 13px;
  color: #4A4A4A;
  background: #F8F8F8;
  outline: none;
}
.ee-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.ee-toggle-switch {
  width: 44px;
  height: 24px;
  border-radius: 100px;
  background: #D5D5D5;
  border: none;
  cursor: pointer;
  position: relative;
  transition: background 0.2s ease;
}
.ee-toggle-switch--on { background: #1A1A1A; }
.ee-toggle-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #FFFFFF;
  transition: transform 0.2s ease;
}
.ee-toggle-switch--on::after { transform: translateX(20px); }
.ee-toggle-label {
  font-size: 14px;
  font-weight: 500;
}

.ee-loading {
  padding: 80px 32px;
  text-align: center;
  color: #8A8A8A;
  font-size: 15px;
}
.ee-empty {
  text-align: center;
  padding: 48px;
  color: #8A8A8A;
  font-size: 14px;
}
.ee-modal-field {
  margin-bottom: 16px;
}
.ee-modal-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #4A4A4A;
  margin-bottom: 6px;
}
.ee-modal-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #D5D5D5;
  border-radius: 8px;
  font-size: 14px;
  color: #1A1A1A;
  background: #FFFFFF;
  outline: none;
  box-sizing: border-box;
}
.ee-modal-input:focus { border-color: #1A1A1A; }
.ee-modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}
.ee-modal-actions .ee-btn { flex: 1; }
.ee-textarea {
  width: 100%;
  max-width: 480px;
  min-height: 120px;
  padding: 11px 14px;
  border: 1px solid #D5D5D5;
  border-radius: 10px;
  font-size: 14px;
  color: #1A1A1A;
  background: #FFFFFF;
  outline: none;
  box-sizing: border-box;
  resize: vertical;
  font-family: inherit;
}
.ee-textarea:focus { border-color: #1A1A1A; }
`;

type Tab = 'details' | 'guests' | 'tables' | 'venue' | 'invitation' | 'schedule' | 'settings';

const TABS: { key: Tab; label: string }[] = [
  { key: 'details', label: 'Event Details' },
  { key: 'guests', label: 'Guests' },
  { key: 'tables', label: 'Tables' },
  { key: 'venue', label: 'Venue Layout' },
  { key: 'invitation', label: 'Invitation' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'settings', label: 'Settings' },
];

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function EventEditorPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const id = eventId ?? '';
  const { data: event, isLoading: eventLoading } = useEvent(id);
  const updateEvent = useUpdateEvent(id);
  const deleteEvent = useDeleteEvent();

  const { data: guests } = useGuests(id);
  const createGuest = useCreateGuest(id);
  const bulkCreateGuests = useBulkCreateGuests(id);
  const updateGuest = useUpdateGuest(id);
  const deleteGuest = useDeleteGuest(id);

  const { data: tables } = useTables(id);
  const createTable = useCreateTable(id);
  const deleteTable = useDeleteTable(id);

  const { data: settings } = useGuestPageSettings(id);
  const upsertSettings = useUpsertGuestPageSettings(id);

  const [activeTab, setActiveTab] = useState<Tab>('details');

  // Details form
  const [detName, setDetName] = useState('');
  const [detDate, setDetDate] = useState('');
  const [detTime, setDetTime] = useState('');
  const [detVenue, setDetVenue] = useState('');
  const [detSlug, setDetSlug] = useState('');
  const [detSaving, setDetSaving] = useState(false);

  // Guest form
  const [guestName, setGuestName] = useState('');
  const [guestTable, setGuestTable] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(false);

  // Table form
  const [tableName, setTableName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [tableCapacity, setTableCapacity] = useState('');

  // Venue layout
  const [venueDragging, setVenueDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings
  const [settingsForm, setSettingsForm] = useState<GuestPageSettingsInput>(DEFAULT_SETTINGS);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Sync form state when event loads
  const eventSynced = useRef(false);
  if (event && !eventSynced.current) {
    eventSynced.current = true;
    setDetName(event.name);
    setDetDate(event.date);
    setDetTime(event.time);
    setDetVenue(event.venue);
    setDetSlug(event.slug);
  }

  // Sync settings form when settings load
  const settingsSynced = useRef(false);
  if (settings && !settingsSynced.current) {
    settingsSynced.current = true;
    const { id: _id, event_id: _eventId, created_at: _ca, updated_at: _ua, ...rest } = settings;
    void _id; void _eventId; void _ca; void _ua;
    setSettingsForm({
      ...DEFAULT_SETTINGS,
      ...rest,
      schedule_items: rest.schedule_items ?? [],
      gallery_images: rest.gallery_images ?? [],
    });
  }
  // Also sync if settings become null after being loaded (e.g., new event)
  if (!settings && !settingsSynced.current && !eventLoading && event) {
    settingsSynced.current = true;
    setSettingsForm(DEFAULT_SETTINGS);
  }

  // ── Handlers ──

  const handleSaveDetails = async () => {
    if (!detName.trim()) {
      toast('Event name is required', 'error');
      return;
    }
    setDetSaving(true);
    try {
      await updateEvent.mutateAsync({
        name: detName.trim(),
        date: detDate,
        time: detTime,
        venue: detVenue.trim(),
        slug: detSlug.trim(),
      });
      toast('Event details saved', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally {
      setDetSaving(false);
    }
  };

  const handleAddGuest = async () => {
    if (!guestName.trim()) {
      toast('Guest name is required', 'error');
      return;
    }
    try {
      await createGuest.mutateAsync({
        name: guestName.trim(),
        table_id: guestTable || null,
      });
      setGuestName('');
      setGuestTable('');
      toast('Guest added', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to add guest', 'error');
    }
  };

  const handleBulkAdd = async () => {
    const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      toast('Enter at least one guest name', 'error');
      return;
    }
    try {
      await bulkCreateGuests.mutateAsync(lines.map((name) => ({ name })));
      setBulkText('');
      setShowBulk(false);
      toast(`${lines.length} guests added`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to add guests', 'error');
    }
  };

  const handleAssignTable = async (guestId: string, tableId: string) => {
    try {
      await updateGuest.mutateAsync({ id: guestId, table_id: tableId || null });
      toast('Table assigned', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to assign', 'error');
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    try {
      await deleteGuest.mutateAsync(guestId);
      toast('Guest removed', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to remove guest', 'error');
    }
  };

  const handleAddTable = async () => {
    const num = parseInt(tableNumber, 10);
    if (!tableName.trim() || isNaN(num)) {
      toast('Table name and number are required', 'error');
      return;
    }
    const cap = parseInt(tableCapacity, 10) || 8;
    try {
      await createTable.mutateAsync({ name: tableName.trim(), number: num, capacity: cap });
      setTableName('');
      setTableNumber('');
      setTableCapacity('');
      toast('Table added', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to add table', 'error');
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    try {
      await deleteTable.mutateAsync(tableId);
      toast('Table deleted', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete table', 'error');
    }
  };

  // Venue image upload
  const handleVenueFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast('Please upload an image file', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('Image must be under 5MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        await upsertSettings.mutateAsync({ ...settingsForm, venue_image_url: dataUrl });
        setSettingsForm((prev) => ({ ...prev, venue_image_url: dataUrl }));
        toast('Venue layout uploaded', 'success');
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Failed to upload', 'error');
      }
    };
    reader.readAsDataURL(file);
  }, [settingsForm, upsertSettings, toast]);

  const handleVenueDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setVenueDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleVenueFile(file);
  }, [handleVenueFile]);

  const handleVenueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleVenueFile(file);
  }, [handleVenueFile]);

  // Settings handlers
  const applyPreset = (presetIndex: number) => {
    const preset = THEME_PRESETS[presetIndex];
    setSettingsForm((prev) => ({
      ...prev,
      color_primary: preset.color_primary,
      color_background: preset.color_background,
      color_card: preset.color_card,
      color_text: preset.color_text,
      color_button: preset.color_button,
      color_button_text: preset.color_button_text,
      color_link: preset.color_link,
      color_footer: preset.color_footer,
      font_heading: preset.font_heading,
      font_body: preset.font_body,
    }));
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      await upsertSettings.mutateAsync(settingsForm);
      toast('Settings saved', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save settings', 'error');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    try {
      await deleteEvent.mutateAsync(id);
      toast('Event deleted', 'success');
      navigate('/');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete event', 'error');
    }
  };

  if (eventLoading) {
    return (
      <>
        <style>{EE_CSS}</style>
        <div className="ee-root">
          <div className="ee-loading">Loading event…</div>
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <style>{EE_CSS}</style>
        <div className="ee-root">
          <div className="ee-loading">Event not found.</div>
        </div>
      </>
    );
  }

  const venueImage = settingsForm.venue_image_url;
  const inviteUrl = `${window.location.origin}/invite/${event.slug}`;

  return (
    <>
      <style>{EE_CSS}</style>
      <div className="ee-root">
        {/* Top bar */}
        <div className="ee-topbar">
          <Link className="ee-back" to="/">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Dashboard
          </Link>
          <h1 className="ee-event-name">{event.name}</h1>
          <div className="ee-topbar-spacer" />
          <Link className="ee-topbar-btn" to={`/events/${event.id}/print/seating`}>Print Seating</Link>
          <Link className="ee-topbar-btn" to={`/events/${event.id}/print/guests`}>Print Guest List</Link>
          <Link className="ee-topbar-btn" to={`/e/${event.slug}`} target="_blank">View Guest Page</Link>
        </div>

        {/* Tabs */}
        <div className="ee-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`ee-tab${activeTab === tab.key ? ' ee-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content — all panels mounted, inactive hidden */}
        <div className="ee-content">
          {/* ── EVENT DETAILS ── */}
          <div className={`ee-panel${activeTab === 'details' ? ' ee-panel--active' : ''}`}>
            <h2 className="ee-section-title">Event Details</h2>
            <div className="ee-field">
              <label className="ee-label">Event Name</label>
              <input className="ee-input" value={detName} onChange={(e) => setDetName(e.target.value)} />
            </div>
            <div className="ee-row">
              <div className="ee-field">
                <label className="ee-label">Date</label>
                <input className="ee-input" type="date" value={detDate} onChange={(e) => setDetDate(e.target.value)} />
              </div>
              <div className="ee-field">
                <label className="ee-label">Time</label>
                <input className="ee-input" type="time" value={detTime} onChange={(e) => setDetTime(e.target.value)} />
              </div>
            </div>
            <div className="ee-field">
              <label className="ee-label">Venue</label>
              <input className="ee-input" value={detVenue} onChange={(e) => setDetVenue(e.target.value)} />
            </div>
            <div className="ee-field">
              <label className="ee-label">Slug</label>
              <input className="ee-input" value={detSlug} onChange={(e) => setDetSlug(e.target.value)} />
            </div>
            <button className="ee-btn ee-btn--primary" onClick={handleSaveDetails} disabled={detSaving}>
              {detSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>

          {/* ── GUESTS ── */}
          <div className={`ee-panel${activeTab === 'guests' ? ' ee-panel--active' : ''}`}>
            <h2 className="ee-section-title">Guests ({guests?.length ?? 0})</h2>
            <div className="ee-guest-toolbar">
              <input
                className="ee-input"
                style={{ maxWidth: 260 }}
                placeholder="Guest name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddGuest(); }}
              />
              <select
                className="ee-input"
                style={{ maxWidth: 200 }}
                value={guestTable}
                onChange={(e) => setGuestTable(e.target.value)}
              >
                <option value="">No table</option>
                {tables?.map((t) => (
                  <option key={t.id} value={t.id}>Table {t.number} — {t.name}</option>
                ))}
              </select>
              <button className="ee-btn ee-btn--primary" onClick={handleAddGuest}>Add Guest</button>
              <button className="ee-btn ee-btn--secondary" onClick={() => setShowBulk(true)}>Bulk Add</button>
            </div>
            {(!guests || guests.length === 0) ? (
              <div className="ee-empty">No guests yet. Add your first guest above.</div>
            ) : (
              <div className="ee-guest-list">
                {guests.map((g: GuestWithTable) => (
                  <div key={g.id} className="ee-guest-row">
                    <span className="ee-guest-name">{g.name}</span>
                    {g.table ? (
                      <span className="ee-guest-table-badge">Table {g.table.number}</span>
                    ) : (
                      <span className="ee-guest-table-badge ee-guest-table-badge--none">Unassigned</span>
                    )}
                    <select
                      className="ee-guest-select"
                      value={g.table_id ?? ''}
                      onChange={(e) => handleAssignTable(g.id, e.target.value)}
                    >
                      <option value="">No table</option>
                      {tables?.map((t) => (
                        <option key={t.id} value={t.id}>Table {t.number} — {t.name}</option>
                      ))}
                    </select>
                    <button className="ee-guest-action" onClick={() => handleDeleteGuest(g.id)}>Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── TABLES ── */}
          <div className={`ee-panel${activeTab === 'tables' ? ' ee-panel--active' : ''}`}>
            <h2 className="ee-section-title">Tables ({tables?.length ?? 0})</h2>
            <div className="ee-guest-toolbar">
              <input
                className="ee-input"
                style={{ maxWidth: 200 }}
                placeholder="Table name"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
              />
              <input
                className="ee-input"
                style={{ maxWidth: 120 }}
                type="number"
                placeholder="Number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
              />
              <input
                className="ee-input"
                style={{ maxWidth: 120 }}
                type="number"
                placeholder="Capacity"
                value={tableCapacity}
                onChange={(e) => setTableCapacity(e.target.value)}
              />
              <button className="ee-btn ee-btn--primary" onClick={handleAddTable}>Add Table</button>
            </div>
            {(!tables || tables.length === 0) ? (
              <div className="ee-empty">No tables yet. Add your first table above.</div>
            ) : (
              <div className="ee-table-list">
                {tables.map((t) => {
                  const assigned = guests?.filter((g) => g.table_id === t.id).length ?? 0;
                  return (
                    <div key={t.id} className="ee-table-card">
                      <div className="ee-table-num">{t.number}</div>
                      <div className="ee-table-info">
                        <p className="ee-table-name">{t.name}</p>
                        <p className="ee-table-meta">Capacity: {t.capacity} · Assigned: {assigned}</p>
                      </div>
                      <button className="ee-btn ee-btn--danger" onClick={() => handleDeleteTable(t.id)}>Delete</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── VENUE LAYOUT ── */}
          <div className={`ee-panel${activeTab === 'venue' ? ' ee-panel--active' : ''}`}>
            <h2 className="ee-section-title">Venue Layout</h2>
            <p style={{ fontSize: 14, color: '#8A8A8A', marginBottom: 20 }}>
              Upload a floor plan or venue layout image. Guests will see this on the guest page.
            </p>
            <div
              className={`ee-dropzone${venueDragging ? ' ee-dropzone--drag' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setVenueDragging(true); }}
              onDragLeave={() => setVenueDragging(false)}
              onDrop={handleVenueDrop}
            >
              <div className="ee-dropzone-icon">
                <svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="6" y="6" width="36" height="36" rx="4" />
                  <path d="M6 30l10-10 8 8 6-6 12 12" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="18" cy="18" r="3" />
                </svg>
              </div>
              <p className="ee-dropzone-text">Click to upload or drag & drop</p>
              <p className="ee-dropzone-hint">PNG, JPG up to 5MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleVenueChange}
              />
            </div>
            {venueImage && (
              <div className="ee-venue-preview">
                <img src={venueImage} alt="Venue layout" />
              </div>
            )}
          </div>

          {/* ── INVITATION ── */}
          <div className={`ee-panel${activeTab === 'invitation' ? ' ee-panel--active' : ''}`}>
            <h2 className="ee-section-title">Invitation</h2>
            <div className="ee-invite-card">
              <div className="ee-toggle">
                <button
                  className={`ee-toggle-switch${event.invitation_enabled ? ' ee-toggle-switch--on' : ''}`}
                  onClick={async () => {
                    try {
                      await updateEvent.mutateAsync({ invitation_enabled: !event.invitation_enabled });
                      toast(event.invitation_enabled ? 'Invitation disabled' : 'Invitation enabled', 'success');
                    } catch (err) {
                      toast(err instanceof Error ? err.message : 'Failed to toggle', 'error');
                    }
                  }}
                />
                <span className="ee-toggle-label">
                  {event.invitation_enabled ? 'Invitation page is live' : 'Invitation page is disabled'}
                </span>
              </div>
              <p style={{ fontSize: 14, color: '#4A4A4A', margin: 0 }}>
                Share this link with your guests so they can find their seat.
              </p>
              <div className="ee-invite-url">
                <input readOnly value={inviteUrl} onFocus={(e) => e.currentTarget.select()} />
                <button
                  className="ee-btn ee-btn--secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteUrl);
                    toast('Link copied!', 'success');
                  }}
                >
                  Copy
                </button>
              </div>
              <div style={{ marginTop: 20 }}>
                <Link className="ee-btn ee-btn--primary" to={`/invite/${event.slug}`} target="_blank" style={{ textDecoration: 'none', display: 'inline-block' }}>
                  Preview Invitation
                </Link>
              </div>
            </div>
          </div>

          {/* ── SCHEDULE ── */}
          <div className={`ee-panel${activeTab === 'schedule' ? ' ee-panel--active' : ''}`}>
            <h2 className="ee-section-title">Schedule</h2>
            <p style={{ fontSize: 14, color: '#8A8A8A', marginBottom: 20 }}>
              Add a timeline of event activities for your guests.
            </p>
            {event.date && (
              <div className="ee-schedule-list">
                <div className="ee-schedule-item">
                  <span className="ee-schedule-time">{event.time || 'TBD'}</span>
                  <span className="ee-schedule-desc">Event starts at {event.venue || 'venue TBD'}</span>
                </div>
                <div className="ee-schedule-item">
                  <span className="ee-schedule-time">—</span>
                  <span className="ee-schedule-desc">Add custom schedule items via the guest page settings.</span>
                </div>
              </div>
            )}
            {!event.date && (
              <div className="ee-empty">Set an event date in Event Details to build your schedule.</div>
            )}
          </div>

          {/* ── SETTINGS ── */}
          <div className={`ee-panel${activeTab === 'settings' ? ' ee-panel--active' : ''}`}>
            <h2 className="ee-section-title">Guest Page Settings</h2>
            <div className="ee-settings-grid">
              <div>
                <label className="ee-label">Theme Presets</label>
                <div className="ee-presets">
                  {THEME_PRESETS.map((preset, i) => (
                    <div
                      key={preset.name}
                      className={`ee-preset${settingsForm.color_primary === preset.color_primary && settingsForm.color_background === preset.color_background ? ' ee-preset--active' : ''}`}
                      onClick={() => applyPreset(i)}
                    >
                      <div
                        className="ee-preset-swatch"
                        style={{ background: `linear-gradient(135deg, ${preset.color_button} 0%, ${preset.color_background} 100%)` }}
                      />
                      <div className="ee-preset-name">{preset.name}</div>
                    </div>
                  ))}
                </div>

                <label className="ee-label">Colors</label>
                <div className="ee-color-row">
                  <div className="ee-color-field">
                    <label style={{ fontSize: 12, color: '#8A8A8A' }}>Primary</label>
                    <input
                      type="color"
                      className="ee-color-input"
                      value={settingsForm.color_primary ?? '#1A1A1A'}
                      onChange={(e) => setSettingsForm((prev) => ({ ...prev, color_primary: e.target.value }))}
                    />
                  </div>
                  <div className="ee-color-field">
                    <label style={{ fontSize: 12, color: '#8A8A8A' }}>Background</label>
                    <input
                      type="color"
                      className="ee-color-input"
                      value={settingsForm.color_background ?? '#F8F8F8'}
                      onChange={(e) => setSettingsForm((prev) => ({ ...prev, color_background: e.target.value }))}
                    />
                  </div>
                  <div className="ee-color-field">
                    <label style={{ fontSize: 12, color: '#8A8A8A' }}>Button</label>
                    <input
                      type="color"
                      className="ee-color-input"
                      value={settingsForm.color_button ?? '#1A1A1A'}
                      onChange={(e) => setSettingsForm((prev) => ({ ...prev, color_button: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="ee-row">
                  <div className="ee-field">
                    <label className="ee-label">Heading Font</label>
                    <select
                      className="ee-input"
                      value={settingsForm.font_heading ?? 'Inter'}
                      onChange={(e) => setSettingsForm((prev) => ({ ...prev, font_heading: e.target.value }))}
                    >
                      {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="ee-field">
                    <label className="ee-label">Body Font</label>
                    <select
                      className="ee-input"
                      value={settingsForm.font_body ?? 'Inter'}
                      onChange={(e) => setSettingsForm((prev) => ({ ...prev, font_body: e.target.value }))}
                    >
                      {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>

                <button className="ee-btn ee-btn--primary" onClick={handleSaveSettings} disabled={settingsSaving}>
                  {settingsSaving ? 'Saving…' : 'Save Settings'}
                </button>

                <div className="ee-danger-zone">
                  <p className="ee-danger-title">Danger Zone</p>
                  <p className="ee-danger-text">Permanently delete this event and all associated data.</p>
                  <button className="ee-btn ee-btn--danger" onClick={handleDeleteEvent}>Delete Event</button>
                </div>
              </div>

              {/* Live Preview */}
              <div className="ee-preview-wrap">
                <div className="ee-preview-toggle">
                  <button
                    className={`ee-preview-toggle-btn${previewDevice === 'desktop' ? ' ee-preview-toggle-btn--active' : ''}`}
                    onClick={() => setPreviewDevice('desktop')}
                  >Desktop</button>
                  <button
                    className={`ee-preview-toggle-btn${previewDevice === 'mobile' ? ' ee-preview-toggle-btn--active' : ''}`}
                    onClick={() => setPreviewDevice('mobile')}
                  >Mobile</button>
                </div>
                <div className={`ee-preview-frame${previewDevice === 'mobile' ? ' ee-preview-frame--mobile' : ''}`}>
                  <div
                    className="ee-preview-content"
                    style={{
                      background: settingsForm.color_background ?? '#F8F8F8',
                      color: settingsForm.color_text ?? '#1A1A1A',
                      fontFamily: settingsForm.font_body ?? 'Inter',
                    }}
                  >
                    <h3
                      className="ee-preview-title"
                      style={{
                        color: settingsForm.color_primary ?? '#1A1A1A',
                        fontFamily: settingsForm.font_heading ?? 'Inter',
                      }}
                    >
                      {event.name}
                    </h3>
                    <p className="ee-preview-subtitle" style={{ color: settingsForm.color_text ?? '#1A1A1A' }}>
                      {formatDate(event.date)}{event.venue ? ` · ${event.venue}` : ''}
                    </p>
                    <div
                      className="ee-preview-btn"
                      style={{
                        background: settingsForm.color_button ?? '#1A1A1A',
                        color: settingsForm.color_button_text ?? '#FFFFFF',
                        borderRadius: (settingsForm.border_radius ?? 16) / 2,
                        fontFamily: settingsForm.font_button ?? 'Inter',
                      }}
                    >
                      Find Your Seat
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Add Modal */}
      <Modal open={showBulk} onClose={() => setShowBulk(false)} title="Bulk Add Guests">
        <div className="ee-modal-field">
          <label className="ee-modal-label">Enter one guest name per line</label>
          <textarea
            className="ee-textarea"
            style={{ maxWidth: '100%' }}
            placeholder={'John Doe\nJane Smith\nBob Johnson'}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
          />
        </div>
        <div className="ee-modal-actions">
          <button className="ee-btn ee-btn--secondary" onClick={() => setShowBulk(false)}>Cancel</button>
          <button className="ee-btn ee-btn--primary" onClick={handleBulkAdd} disabled={bulkCreateGuests.isPending}>
            {bulkCreateGuests.isPending ? 'Adding…' : 'Add Guests'}
          </button>
        </div>
      </Modal>

      {/* Delete event confirm */}
      <ConfirmDialog
        open={false}
        title="Delete Event"
        message="Are you sure?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    </>
  );
}
