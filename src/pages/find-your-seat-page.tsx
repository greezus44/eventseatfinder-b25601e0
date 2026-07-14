import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useGuestPageSettingsBySlug } from '@/hooks/use-guest-page-settings';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { GOOGLE_FONTS, getFontCss, getFontSize, getFontWeight } from '@/lib/fonts';

type Tab = 'find-seat' | 'venue-layout';

export function FindYourSeatPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: settings, isLoading } = useGuestPageSettingsBySlug(slug ?? '');
  const [activeTab, setActiveTab] = useState<Tab>('find-seat');

  const eventId = settings?.event?.id ?? '';
  const { data: guests } = useGuests(eventId);
  const { data: tables } = useTables(eventId);

  const fontsNeeded = useMemo(() => {
    const s = new Set<string>();
    if (settings) {
      s.add(settings.font_title_family || 'Inter');
      s.add(settings.font_subtitle_family || 'Inter');
      s.add(settings.font_datetime_family || 'Inter');
      s.add(settings.font_venue_family || 'Inter');
    }
    return Array.from(s);
  }, [settings]);

  useEffect(() => {
    const links: HTMLLinkElement[] = [];
    fontsNeeded.forEach((f) => {
      const fontDef = GOOGLE_FONTS.find((ft) => ft.name === f);
      if (!fontDef) return;
      const id = `fys-font-${f.replace(/\s+/g, '-').toLowerCase()}`;
      if (document.getElementById(id)) return;
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${fontDef.cssName.replace(/ /g, '+')}:wght@300;400;500;600;700;800&display=swap`;
      document.head.appendChild(link);
      links.push(link);
    });
    return () => { links.forEach((l) => l.remove()); };
  }, [fontsNeeded]);

  if (isLoading) {
    return (
      <div className="full-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!settings || !settings.event) {
    return (
      <div className="guest-page">
        <div className="guest-page-card">
          <h1 style={{ fontSize: '24px', marginBottom: '12px' }}>Event Not Found</h1>
          <p style={{ color: '#4A4A4A' }}>The event you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const event = settings.event;
  const accentColor = settings.color_primary || '#1A1A1A';
  const bgColor = settings.color_background || '#FFFFFF';
  const cardColor = settings.color_card || '#FFFFFF';
  const textColor = settings.color_text || '#1A1A1A';
  const headerColor = settings.color_header || '#1A1A1A';
  const borderRadius = settings.border_radius ?? 12;
  const logoSize = settings.logo_size ?? 80;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: bgColor,
        color: textColor,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 24px' }}>
        {settings.logo_url && (
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <img
              src={settings.logo_url}
              alt="Event logo"
              style={{
                maxWidth: '100%',
                maxHeight: `${logoSize}px`,
                width: 'auto',
                borderRadius: settings.logo_rounded ? '50%' : `${borderRadius}px`,
                objectFit: 'contain',
              }}
            />
          </div>
        )}

        <h1
          style={{
            fontFamily: getFontCss(settings.font_title_family),
            fontSize: getFontSize(settings.font_title_size),
            fontWeight: getFontWeight(settings.font_title_weight),
            color: headerColor,
            textAlign: 'center',
            marginBottom: '8px',
          }}
        >
          {event.name}
        </h1>

        {settings.event_subtitle && (
          <p
            style={{
              fontFamily: getFontCss(settings.font_subtitle_family),
              fontSize: getFontSize(settings.font_subtitle_size),
              fontWeight: getFontWeight(settings.font_subtitle_weight),
              color: textColor,
              textAlign: 'center',
              marginBottom: '8px',
              opacity: 0.85,
            }}
          >
            {settings.event_subtitle}
          </p>
        )}

        {(event.date || event.time) && (
          <p
            style={{
              fontFamily: getFontCss(settings.font_datetime_family),
              fontSize: getFontSize(settings.font_datetime_size),
              fontWeight: getFontWeight(settings.font_datetime_weight),
              color: textColor,
              textAlign: 'center',
              marginBottom: '4px',
              opacity: 0.75,
            }}
          >
            {event.date ? new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
            {event.time ? ` at ${event.time}` : ''}
          </p>
        )}

        {event.venue && (
          <p
            style={{
              fontFamily: getFontCss(settings.font_venue_family),
              fontSize: getFontSize(settings.font_venue_size),
              fontWeight: getFontWeight(settings.font_venue_weight),
              color: textColor,
              textAlign: 'center',
              marginBottom: '24px',
              opacity: 0.75,
            }}
          >
            {event.venue}
          </p>
        )}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button
            onClick={() => setActiveTab('find-seat')}
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: `${borderRadius}px`,
              border: '1px solid',
              borderColor: activeTab === 'find-seat' ? accentColor : '#DADADA',
              background: activeTab === 'find-seat' ? accentColor : '#FFFFFF',
              color: activeTab === 'find-seat' ? '#FFFFFF' : '#4A4A4A',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Find Seat
          </button>
          <button
            onClick={() => setActiveTab('venue-layout')}
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: `${borderRadius}px`,
              border: '1px solid',
              borderColor: activeTab === 'venue-layout' ? accentColor : '#DADADA',
              background: activeTab === 'venue-layout' ? accentColor : '#FFFFFF',
              color: activeTab === 'venue-layout' ? '#FFFFFF' : '#4A4A4A',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Venue Layout
          </button>
        </div>

        {activeTab === 'find-seat' && (
          <FindSeatTab
            guests={guests ?? []}
            tables={tables ?? []}
            accentColor={accentColor}
            cardColor={cardColor}
            textColor={textColor}
            borderRadius={borderRadius}
          />
        )}

        {activeTab === 'venue-layout' && (
          <VenueLayoutTab
            settings={settings}
            cardColor={cardColor}
            borderRadius={borderRadius}
            textColor={textColor}
          />
        )}
      </div>
    </div>
  );
}

function FindSeatTab({
  guests,
  tables,
  accentColor,
  cardColor,
  textColor,
  borderRadius,
}: {
  guests: { id: string; name: string; table_id: string | null }[];
  tables: { id: string; name: string; capacity: number }[];
  accentColor: string;
  cardColor: string;
  textColor: string;
  borderRadius: number;
}) {
  const [searchName, setSearchName] = useState('');
  const [searched, setSearched] = useState(false);

  const tableMap = new Map<string, { name: string }>();
  tables.forEach((t) => tableMap.set(t.id, { name: t.name }));

  const suggestions = searchName.trim()
    ? guests.filter((g) => g.name.toLowerCase().includes(searchName.toLowerCase().trim())).slice(0, 8)
    : [];

  const matchedGuest = searched
    ? guests.find((g) => g.name.toLowerCase().trim() === searchName.toLowerCase().trim())
    : undefined;

  return (
    <div
      style={{
        background: cardColor,
        borderRadius: `${borderRadius}px`,
        padding: '32px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        border: '1px solid #EFEFEF',
      }}
    >
      <h2
        style={{
          fontSize: '20px',
          fontWeight: 600,
          color: textColor,
          marginBottom: '16px',
          textAlign: 'center',
        }}
      >
        Search Your Name
      </h2>

      <input
        type="text"
        placeholder="Search Your Name"
        value={searchName}
        onChange={(e) => { setSearchName(e.target.value); setSearched(false); }}
        onKeyDown={(e) => { if (e.key === 'Enter') setSearched(true); }}
        style={{
          width: '100%',
          height: '52px',
          padding: '0 20px',
          borderRadius: `${borderRadius}px`,
          border: `2px solid ${accentColor}`,
          background: '#FFFFFF',
          fontSize: '16px',
          color: textColor,
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />

      {suggestions.length > 0 && !searched && (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {suggestions.map((g) => (
            <button
              key={g.id}
              onClick={() => { setSearchName(g.name); setSearched(true); }}
              style={{
                textAlign: 'left',
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid #EFEFEF',
                background: '#F8F8F8',
                color: textColor,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {searched && (
        <div style={{ marginTop: '24px', textAlign: 'left' }}>
          {matchedGuest ? (
            matchedGuest.table_id ? (
              <div>
                <p style={{ fontSize: '14px', color: textColor, marginBottom: '8px' }}>
                  {matchedGuest.name}, you are seated at:
                </p>
                <p style={{ fontSize: '22px', fontWeight: 700, color: textColor }}>
                  {(() => { const t = tableMap.get(matchedGuest.table_id); return t ? `Table ${t.name}` : 'Table'; })()}
                </p>
              </div>
            ) : (
              <p style={{ fontSize: '14px', color: textColor }}>
                {matchedGuest.name}, you don't have a table assignment yet.
              </p>
            )
          ) : (
            <p style={{ fontSize: '14px', color: textColor }}>
              No guest found with that name. Please check your spelling or contact the host.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function VenueLayoutTab({
  settings,
  cardColor,
  borderRadius,
  textColor,
}: {
  settings: { venue_image_url: string | null };
  cardColor: string;
  borderRadius: number;
  textColor: string;
}) {
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = { x: 0, y: 0 };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.x = e.clientX - panX;
    dragStart.y = e.clientY - panY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => { setZoom(1); setPanX(0); setPanY(0); };

  if (!settings.venue_image_url) {
    return (
      <div
        style={{
          background: cardColor,
          borderRadius: `${borderRadius}px`,
          padding: '48px 32px',
          textAlign: 'center',
          border: '1px solid #EFEFEF',
        }}
      >
        <p style={{ color: textColor, fontSize: '15px', opacity: 0.7 }}>
          No venue layout image has been uploaded for this event.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          borderRadius: `${borderRadius}px`,
          overflow: 'hidden',
          border: '1px solid #EFEFEF',
          background: cardColor,
          position: 'relative',
          width: '100%',
          height: '600px',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={settings.venue_image_url}
          alt="Venue layout"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translate(${panX}px, ${panY}px) scale(${zoom})`,
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center', justifyContent: 'center' }}>
        <button
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #DADADA',
            background: '#FFFFFF',
            color: '#4A4A4A',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Zoom Out
        </button>
        <span style={{ fontSize: '13px', color: '#4A4A4A', minWidth: '48px', textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #DADADA',
            background: '#FFFFFF',
            color: '#4A4A4A',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Zoom In
        </button>
        <button
          onClick={resetView}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #DADADA',
            background: '#FFFFFF',
            color: '#4A4A4A',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
