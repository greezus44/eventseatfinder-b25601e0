import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useGuestPageSettings,
  useUpsertGuestPageSettings,
} from '@/hooks/use-guest-page-settings';
import { useEvent } from '@/hooks/use-events';
import { useToast } from '@/providers/toast-provider';
import {
  DEFAULT_SETTINGS,
  FONT_OPTIONS,
  COLOR_PRESETS,
} from '@/types/guest-page-settings';
import type { GuestPageSettingsInput } from '@/types/guest-page-settings';

type Section = 'branding' | 'colours' | 'typography' | 'appearance';
type PreviewMode = 'desktop' | 'mobile';

const COLOR_FIELDS: { key: keyof GuestPageSettingsInput; label: string }[] = [
  { key: 'color_primary', label: 'Primary / Accent' },
  { key: 'color_background', label: 'Background' },
  { key: 'color_card', label: 'Card' },
  { key: 'color_button', label: 'Button' },
  { key: 'color_button_text', label: 'Button Text' },
  { key: 'color_header', label: 'Header' },
  { key: 'color_text', label: 'Text' },
  { key: 'color_link', label: 'Link' },
];

const HEADING_WEIGHTS = [400, 500, 600, 700, 800];
const BODY_WEIGHTS = [400, 500, 600, 700];
const SHADOW_LEVELS: ('none' | 'sm' | 'md' | 'lg')[] = [
  'none',
  'sm',
  'md',
  'lg',
];

function shadowValue(level: string): string {
  switch (level) {
    case 'none':
      return 'none';
    case 'sm':
      return '0 1px 2px rgba(0,0,0,0.05)';
    case 'md':
      return '0 4px 12px rgba(0,0,0,0.08)';
    case 'lg':
      return '0 12px 32px rgba(0,0,0,0.12)';
    default:
      return '0 4px 12px rgba(0,0,0,0.08)';
  }
}

function buttonStyle(settings: GuestPageSettingsInput): CSSProperties {
  const base: CSSProperties = {
    fontFamily: settings.font_button,
    borderRadius:
      settings.button_style === 'rounded'
        ? '9999px'
        : `${settings.border_radius}px`,
  };
  if (settings.button_style === 'outlined') {
    return {
      ...base,
      background: 'transparent',
      border: `2px solid ${settings.color_button}`,
      color: settings.color_button,
    };
  }
  return {
    ...base,
    background: settings.color_button,
    color: settings.color_button_text,
    border: 'none',
  };
}

export function GuestPageEditorPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { toast } = useToast();

  const { data: event, isLoading: eventLoading } = useEvent(eventId ?? '');
  const { data: existingSettings, isLoading: settingsLoading } =
    useGuestPageSettings(eventId ?? '');
  const { mutateAsync, isPending } = useUpsertGuestPageSettings(eventId ?? '');

  const [settings, setSettings] = useState<GuestPageSettingsInput>({
    ...DEFAULT_SETTINGS,
  });
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [activeSection, setActiveSection] = useState<Section>('branding');
  const [dirty, setDirty] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    if (!settingsLoading && existingSettings) {
      const input: GuestPageSettingsInput = {
        logo_url: existingSettings.logo_url,
        logo_size: existingSettings.logo_size,
        logo_position: existingSettings.logo_position,
        logo_rounded: existingSettings.logo_rounded,
        color_primary: existingSettings.color_primary,
        color_background: existingSettings.color_background,
        color_card: existingSettings.color_card,
        color_button: existingSettings.color_button,
        color_button_text: existingSettings.color_button_text,
        color_header: existingSettings.color_header,
        color_text: existingSettings.color_text,
        color_link: existingSettings.color_link,
        font_heading: existingSettings.font_heading,
        font_body: existingSettings.font_body,
        font_button: existingSettings.font_button,
        font_heading_size: existingSettings.font_heading_size,
        font_body_size: existingSettings.font_body_size,
        font_heading_weight: existingSettings.font_heading_weight,
        font_body_weight: existingSettings.font_body_weight,
        font_heading_spacing: existingSettings.font_heading_spacing,
        font_body_spacing: existingSettings.font_body_spacing,
        font_heading_line_height: existingSettings.font_heading_line_height,
        font_body_line_height: existingSettings.font_body_line_height,
        border_radius: existingSettings.border_radius,
        card_shadow: existingSettings.card_shadow,
        button_style: existingSettings.button_style,
        background_image: existingSettings.background_image,
        background_overlay_opacity: existingSettings.background_overlay_opacity,
        venue_image_url: existingSettings.venue_image_url,
      };
      setSettings(input);
      initializedRef.current = true;
    } else if (!settingsLoading && existingSettings === null) {
      initializedRef.current = true;
    }
  }, [settingsLoading, existingSettings]);

  useEffect(() => {
    const fonts = FONT_OPTIONS.map((f) => f.replace(/ /g, '+')).join(
      '&family=',
    );
    const href = `https://fonts.googleapis.com/css2?family=${fonts}&display=swap`;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  function updateSetting<K extends keyof GuestPageSettingsInput>(
    key: K,
    value: GuestPageSettingsInput[K],
  ) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  function applyPreset(colors: Record<string, string>) {
    setSettings((prev) => ({ ...prev, ...colors }));
    setDirty(true);
  }

  async function handleSave() {
    try {
      await mutateAsync(settings);
      toast('Guest page settings updated.', 'success');
      setDirty(false);
    } catch {
      toast('Could not save settings. Please try again.', 'error');
    }
  }

  if (eventLoading || settingsLoading) {
    return (
      <div className="gpe-page">
        <div className="gpe-header">
          <h1>Guest Page Editor</h1>
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="gpe-page">
        <div className="gpe-header">
          <h1>Guest Page Editor</h1>
          <p>Event not found.</p>
          <Link to="/events" className="btn btn--secondary btn--sm">
            Back to events
          </Link>
        </div>
      </div>
    );
  }

  const sections: { id: Section; label: string }[] = [
    { id: 'branding', label: 'Branding' },
    { id: 'colours', label: 'Colours' },
    { id: 'typography', label: 'Typography' },
    { id: 'appearance', label: 'Appearance' },
  ];

  return (
    <div className="gpe-page">
      <div className="gpe-header">
        <div>
          <h1>Guest Page Editor</h1>
          <p>{event.name}</p>
        </div>
        <div className="gpe-header__actions">
          <Link to={`/events/${eventId}`} className="btn btn--ghost btn--sm">
            Back
          </Link>
          <button
            className="btn btn--primary btn--sm"
            onClick={handleSave}
            disabled={!dirty || isPending}
          >
            {isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="gpe-layout">
        <div className="gpe-panels">
          <div className="gpe-tabs">
            {sections.map((s) => (
              <button
                key={s.id}
                className={`gpe-tab ${activeSection === s.id ? 'gpe-tab--active' : ''}`}
                onClick={() => setActiveSection(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>

          {activeSection === 'branding' && (
            <div className="gpe-panel">
              <div className="gpe-panel__title">Branding</div>

              <div className="gpe-panel__section">
                <div className="gpe-field">
                  <label className="gpe-field__label">Logo URL</label>
                  <div className="gpe-field__control">
                    <input
                      type="text"
                      value={settings.logo_url ?? ''}
                      onChange={(e) =>
                        updateSetting('logo_url', e.target.value || null)
                      }
                      placeholder="https://…"
                    />
                  </div>
                </div>

                {settings.logo_url && (
                  <div className="gpe-logo-thumb">
                    <img src={settings.logo_url} alt="Logo preview" />
                    <button
                      className="gpe-logo-thumb__remove btn btn--ghost btn--sm"
                      onClick={() => updateSetting('logo_url', null)}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="gpe-panel__section">
                <div className="gpe-slider-row">
                  <label className="gpe-field__label">Logo Size</label>
                  <input
                    className="gpe-slider"
                    type="range"
                    min={40}
                    max={200}
                    value={settings.logo_size}
                    onChange={(e) =>
                      updateSetting('logo_size', Number(e.target.value))
                    }
                  />
                  <span className="gpe-slider__value">
                    {settings.logo_size}px
                  </span>
                </div>
              </div>

              <div className="gpe-panel__section">
                <div className="gpe-field">
                  <label className="gpe-field__label">Logo Position</label>
                  <div className="gpe-field__control">
                    <div className="gpe-btn-group">
                      {(['left', 'center', 'right'] as const).map((pos) => (
                        <button
                          key={pos}
                          className={`gpe-btn-group__option ${settings.logo_position === pos ? 'gpe-btn-group__option--active' : ''}`}
                          onClick={() => updateSetting('logo_position', pos)}
                        >
                          {pos.charAt(0).toUpperCase() + pos.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="gpe-panel__section">
                <div className="gpe-field">
                  <label className="gpe-field__label">Logo Rounded</label>
                  <div className="gpe-field__control">
                    <button
                      className={`gpe-toggle ${settings.logo_rounded ? 'gpe-toggle--active' : ''}`}
                      onClick={() =>
                        updateSetting('logo_rounded', !settings.logo_rounded)
                      }
                    >
                      {settings.logo_rounded ? 'On' : 'Off'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'colours' && (
            <div className="gpe-panel">
              <div className="gpe-panel__title">Colours</div>

              <div className="gpe-panel__section">
                {COLOR_FIELDS.map((field) => (
                  <div className="gpe-color-row" key={field.key}>
                    <label className="gpe-field__label">{field.label}</label>
                    <input
                      className="gpe-color-picker"
                      type="color"
                      value={settings[field.key] as string}
                      onChange={(e) => updateSetting(field.key, e.target.value)}
                    />
                    <input
                      className="gpe-color-hex"
                      type="text"
                      value={settings[field.key] as string}
                      onChange={(e) => updateSetting(field.key, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <div className="gpe-panel__section">
                <label className="gpe-field__label">Preset Palettes</label>
                <div className="gpe-presets">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      className="gpe-preset"
                      onClick={() => applyPreset(preset.colors)}
                    >
                      <span className="gpe-preset__name">{preset.name}</span>
                      <span className="gpe-preset__swatches">
                        {Object.values(preset.colors).map((c, i) => (
                          <span
                            key={i}
                            className="gpe-preset__swatch"
                            style={{ background: c }}
                          />
                        ))}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'typography' && (
            <div className="gpe-panel">
              <div className="gpe-panel__title">Typography</div>

              <div className="gpe-panel__section">
                <div className="gpe-field">
                  <label className="gpe-field__label">Heading Font</label>
                  <div className="gpe-field__control">
                    <select
                      className="gpe-font-select"
                      value={settings.font_heading}
                      onChange={(e) =>
                        updateSetting('font_heading', e.target.value)
                      }
                    >
                      {FONT_OPTIONS.map((opt) => (
                        <option
                          key={opt}
                          value={opt}
                          style={{ fontFamily: opt }}
                        >
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="gpe-field">
                  <label className="gpe-field__label">Body Font</label>
                  <div className="gpe-field__control">
                    <select
                      className="gpe-font-select"
                      value={settings.font_body}
                      onChange={(e) =>
                        updateSetting('font_body', e.target.value)
                      }
                    >
                      {FONT_OPTIONS.map((opt) => (
                        <option
                          key={opt}
                          value={opt}
                          style={{ fontFamily: opt }}
                        >
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="gpe-field">
                  <label className="gpe-field__label">Button Font</label>
                  <div className="gpe-field__control">
                    <select
                      className="gpe-font-select"
                      value={settings.font_button}
                      onChange={(e) =>
                        updateSetting('font_button', e.target.value)
                      }
                    >
                      {FONT_OPTIONS.map((opt) => (
                        <option
                          key={opt}
                          value={opt}
                          style={{ fontFamily: opt }}
                        >
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="gpe-panel__section">
                <div className="gpe-slider-row">
                  <label className="gpe-field__label">Heading Font Size</label>
                  <input
                    className="gpe-slider"
                    type="range"
                    min={24}
                    max={72}
                    value={settings.font_heading_size}
                    onChange={(e) =>
                      updateSetting('font_heading_size', Number(e.target.value))
                    }
                  />
                  <span className="gpe-slider__value">
                    {settings.font_heading_size}px
                  </span>
                </div>

                <div className="gpe-slider-row">
                  <label className="gpe-field__label">Body Font Size</label>
                  <input
                    className="gpe-slider"
                    type="range"
                    min={12}
                    max={24}
                    value={settings.font_body_size}
                    onChange={(e) =>
                      updateSetting('font_body_size', Number(e.target.value))
                    }
                  />
                  <span className="gpe-slider__value">
                    {settings.font_body_size}px
                  </span>
                </div>
              </div>

              <div className="gpe-panel__section">
                <div className="gpe-field">
                  <label className="gpe-field__label">
                    Heading Font Weight
                  </label>
                  <div className="gpe-field__control">
                    <select
                      value={settings.font_heading_weight}
                      onChange={(e) =>
                        updateSetting(
                          'font_heading_weight',
                          Number(e.target.value),
                        )
                      }
                    >
                      {HEADING_WEIGHTS.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="gpe-field">
                  <label className="gpe-field__label">Body Font Weight</label>
                  <div className="gpe-field__control">
                    <select
                      value={settings.font_body_weight}
                      onChange={(e) =>
                        updateSetting(
                          'font_body_weight',
                          Number(e.target.value),
                        )
                      }
                    >
                      {BODY_WEIGHTS.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="gpe-panel__section">
                <div className="gpe-slider-row">
                  <label className="gpe-field__label">
                    Heading Letter Spacing
                  </label>
                  <input
                    className="gpe-slider"
                    type="range"
                    min={-2}
                    max={10}
                    value={settings.font_heading_spacing}
                    onChange={(e) =>
                      updateSetting(
                        'font_heading_spacing',
                        Number(e.target.value),
                      )
                    }
                  />
                  <span className="gpe-slider__value">
                    {settings.font_heading_spacing}px
                  </span>
                </div>

                <div className="gpe-slider-row">
                  <label className="gpe-field__label">
                    Body Letter Spacing
                  </label>
                  <input
                    className="gpe-slider"
                    type="range"
                    min={-2}
                    max={10}
                    value={settings.font_body_spacing}
                    onChange={(e) =>
                      updateSetting('font_body_spacing', Number(e.target.value))
                    }
                  />
                  <span className="gpe-slider__value">
                    {settings.font_body_spacing}px
                  </span>
                </div>
              </div>

              <div className="gpe-panel__section">
                <div className="gpe-slider-row">
                  <label className="gpe-field__label">
                    Heading Line Height
                  </label>
                  <input
                    className="gpe-slider"
                    type="range"
                    min={1.0}
                    max={2.0}
                    step={0.1}
                    value={settings.font_heading_line_height}
                    onChange={(e) =>
                      updateSetting(
                        'font_heading_line_height',
                        Number(e.target.value),
                      )
                    }
                  />
                  <span className="gpe-slider__value">
                    {settings.font_heading_line_height}
                  </span>
                </div>

                <div className="gpe-slider-row">
                  <label className="gpe-field__label">Body Line Height</label>
                  <input
                    className="gpe-slider"
                    type="range"
                    min={1.0}
                    max={2.0}
                    step={0.1}
                    value={settings.font_body_line_height}
                    onChange={(e) =>
                      updateSetting(
                        'font_body_line_height',
                        Number(e.target.value),
                      )
                    }
                  />
                  <span className="gpe-slider__value">
                    {settings.font_body_line_height}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="gpe-panel">
              <div className="gpe-panel__title">Appearance</div>

              <div className="gpe-panel__section">
                <div className="gpe-slider-row">
                  <label className="gpe-field__label">Border Radius</label>
                  <input
                    className="gpe-slider"
                    type="range"
                    min={0}
                    max={32}
                    value={settings.border_radius}
                    onChange={(e) =>
                      updateSetting('border_radius', Number(e.target.value))
                    }
                  />
                  <span className="gpe-slider__value">
                    {settings.border_radius}px
                  </span>
                </div>
              </div>

              <div className="gpe-panel__section">
                <div className="gpe-field">
                  <label className="gpe-field__label">Card Shadow</label>
                  <div className="gpe-field__control">
                    <select
                      value={settings.card_shadow}
                      onChange={(e) =>
                        updateSetting(
                          'card_shadow',
                          e.target
                            .value as GuestPageSettingsInput['card_shadow'],
                        )
                      }
                    >
                      {SHADOW_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="gpe-panel__section">
                <div className="gpe-field">
                  <label className="gpe-field__label">Button Style</label>
                  <div className="gpe-field__control">
                    <div className="gpe-btn-group">
                      {(['filled', 'outlined', 'rounded'] as const).map(
                        (style) => (
                          <button
                            key={style}
                            className={`gpe-btn-group__option ${settings.button_style === style ? 'gpe-btn-group__option--active' : ''}`}
                            onClick={() => updateSetting('button_style', style)}
                          >
                            {style.charAt(0).toUpperCase() + style.slice(1)}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="gpe-panel__section">
                <div className="gpe-field">
                  <label className="gpe-field__label">
                    Background Image URL
                  </label>
                  <div className="gpe-field__control">
                    <input
                      type="text"
                      value={settings.background_image ?? ''}
                      onChange={(e) =>
                        updateSetting(
                          'background_image',
                          e.target.value || null,
                        )
                      }
                      placeholder="https://…"
                    />
                  </div>
                </div>
              </div>

              <div className="gpe-panel__section">
                <div className="gpe-slider-row">
                  <label className="gpe-field__label">
                    Background Overlay Opacity
                  </label>
                  <input
                    className="gpe-slider"
                    type="range"
                    min={0}
                    max={100}
                    value={settings.background_overlay_opacity}
                    onChange={(e) =>
                      updateSetting(
                        'background_overlay_opacity',
                        Number(e.target.value),
                      )
                    }
                  />
                  <span className="gpe-slider__value">
                    {settings.background_overlay_opacity}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="gpe-preview">
          <div className="gpe-preview__toolbar">
            <button
              className={`gpe-tab ${previewMode === 'desktop' ? 'gpe-tab--active' : ''}`}
              onClick={() => setPreviewMode('desktop')}
            >
              Desktop
            </button>
            <button
              className={`gpe-tab ${previewMode === 'mobile' ? 'gpe-tab--active' : ''}`}
              onClick={() => setPreviewMode('mobile')}
            >
              Mobile
            </button>
          </div>

          <div
            className={`gpe-preview__viewport ${previewMode === 'mobile' ? 'gpe-preview__viewport--mobile' : ''}`}
            style={{
              background: settings.background_image
                ? `linear-gradient(rgba(0,0,0,${settings.background_overlay_opacity / 100}), rgba(0,0,0,${settings.background_overlay_opacity / 100})), url(${settings.background_image}) center/cover no-repeat`
                : settings.color_background,
            }}
          >
            <div
              className="gpe-preview-card"
              style={{
                background: settings.color_card,
                borderRadius: `${settings.border_radius}px`,
                boxShadow: shadowValue(settings.card_shadow),
              }}
            >
              {settings.logo_url && (
                <img
                  className="gpe-preview-logo"
                  src={settings.logo_url}
                  alt="Logo"
                  style={{
                    height: `${settings.logo_size}px`,
                    alignSelf:
                      settings.logo_position === 'left'
                        ? 'flex-start'
                        : settings.logo_position === 'right'
                          ? 'flex-end'
                          : 'center',
                    borderRadius: settings.logo_rounded ? '50%' : '0',
                  }}
                />
              )}

              <h1
                className="gpe-preview-title"
                style={{
                  fontFamily: settings.font_heading,
                  fontSize: `${settings.font_heading_size}px`,
                  fontWeight: settings.font_heading_weight,
                  color: settings.color_header,
                  letterSpacing: `${settings.font_heading_spacing}px`,
                  lineHeight: settings.font_heading_line_height,
                }}
              >
                {event.name}
              </h1>

              <p
                className="gpe-preview-venue"
                style={{
                  fontFamily: settings.font_body,
                  fontSize: `${settings.font_body_size}px`,
                  fontWeight: settings.font_body_weight,
                  color: settings.color_text,
                  letterSpacing: `${settings.font_body_spacing}px`,
                  lineHeight: settings.font_body_line_height,
                }}
              >
                {event.venue ?? 'Venue to be announced'}
              </p>

              <input
                className="gpe-preview-search"
                style={{
                  fontFamily: settings.font_body,
                  fontSize: `${settings.font_body_size}px`,
                  color: settings.color_text,
                  borderRadius: `${settings.border_radius}px`,
                }}
                placeholder="Search for your name…"
                readOnly
              />

              <button
                className="gpe-preview-button"
                style={buttonStyle(settings)}
              >
                Find My Seat
              </button>

              <a
                className="gpe-preview-link"
                style={{
                  fontFamily: settings.font_body,
                  color: settings.color_link,
                }}
              >
                View event details
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
