import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, MapPin, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/e/$slug")({
  loader: async ({ params }) => {
    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("slug", params.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw error;
    if (!event) throw notFound();
    return { event };
  },
  head: ({ loaderData }) => ({
    meta: loaderData?.event
      ? [
          { title: `${loaderData.event.name} — Find your seat` },
          { name: "description", content: loaderData.event.welcome_message ?? "Find your seat" },
          { property: "og:title", content: loaderData.event.name },
          ...(loaderData.event.hero_image_url ? [{ property: "og:image", content: loaderData.event.hero_image_url }] : []),
        ]
      : [{ title: "Find your seat" }],
  }),
  component: GuestPage,
});

type Guest = { id: string; full_name: string; table_id: string | null; personal_message: string | null; meal_choice: string | null };
type EventTable = { id: string; name: string; location_note: string | null };

type Lang = "en" | "ms";
const T: Record<Lang, Record<string, string>> = {
  en: {
    default_sub: "Please find your seat",
    search_again: "Search again",
    welcome: "Welcome",
    seated_at: "You're seated at",
    no_table: "Your table hasn't been assigned yet — please ask a host.",
    meal: "Meal",
    placeholder: "Type your name…",
    no_match: "No match. Try a different spelling or ask the host.",
    venue: "Venue",
    schedule: "Schedule",
  },
  ms: {
    default_sub: "Sila cari tempat duduk anda",
    search_again: "Cari semula",
    welcome: "Selamat datang",
    seated_at: "Anda duduk di",
    no_table: "Meja anda belum ditetapkan — sila bertanya kepada tuan rumah.",
    meal: "Hidangan",
    placeholder: "Taip nama anda…",
    no_match: "Tiada padanan. Cuba ejaan lain atau tanya tuan rumah.",
    venue: "Tempat",
    schedule: "Aturcara",
  },
};

function GuestPage() {
  const { event } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Guest | null>(null);
  const [lang, setLang] = useState<Lang>("en");
  const t = T[lang];

  const q = query.trim();
  const searchQ = useQuery({
    queryKey: ["guest-search", slug, q.toLowerCase()],
    enabled: q.length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_event_guests", { _slug: slug, _q: q });
      if (error) throw error;
      return (data ?? []) as Guest[];
    },
  });
  const tablesQ = useQuery({
    queryKey: ["public-tables", event.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_tables").select("id, name, location_note").eq("event_id", event.id);
      if (error) throw error;
      return data as EventTable[];
    },
  });

  const matches = searchQ.data ?? [];

  const tableFor = (id: string | null) => tablesQ.data?.find((t) => t.id === id);
  const displayFont =
    event.font_style === "serif" || event.font_style === "display"
      ? "'Instrument Serif', Georgia, serif"
      : "'Inter', ui-sans-serif, system-ui, sans-serif";

  const bodyStyle: React.CSSProperties = {
    background: event.background_color,
    color: event.text_color,
    minHeight: "100vh",
  };
  const accent = event.accent_color;

  const LangToggle = (
    <div
      className="inline-flex overflow-hidden rounded-full border text-xs font-medium"
      style={{ borderColor: accent + "60" }}
    >
      {(["en", "ms"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className="px-3 py-1 transition-colors"
          style={
            lang === l
              ? { background: accent, color: event.background_color }
              : { opacity: 0.7 }
          }
        >
          {l === "en" ? "EN" : "BM"}
        </button>
      ))}
    </div>
  );

  if (selected) {
    const tbl = tableFor(selected.table_id);
    return (
      <div style={bodyStyle} className="flex items-center justify-center px-6">
        <div className="w-full max-w-md py-16 text-center">
          <div className="mb-6 flex items-center justify-between">
            <button onClick={() => setSelected(null)} className="inline-flex items-center gap-1 text-sm opacity-70 hover:opacity-100">
              <ArrowLeft className="h-4 w-4" /> {t.search_again}
            </button>
            {LangToggle}
          </div>
          {event.logo_url && (
            <img src={event.logo_url} alt="" className="mx-auto mb-8 h-14 object-contain" />
          )}
          <p className="text-xs uppercase tracking-[0.2em] opacity-70">{t.welcome}</p>
          <h1 className="mt-3 text-4xl leading-tight" style={{ fontFamily: displayFont }}>
            {selected.full_name}
          </h1>
          {tbl ? (
            <>
              <p className="mt-10 text-xs uppercase tracking-[0.2em] opacity-70">{t.seated_at}</p>
              <p className="mt-2 text-6xl" style={{ fontFamily: displayFont, color: accent }}>{tbl.name}</p>
              {tbl.location_note && (
                <p className="mt-3 inline-flex items-center gap-1 text-sm opacity-80">
                  <MapPin className="h-3.5 w-3.5" /> {tbl.location_note}
                </p>
              )}
            </>
          ) : (
            <p className="mt-10 opacity-70">{t.no_table}</p>
          )}
          {selected.personal_message && (
            <div className="mt-10 rounded-2xl border p-5 text-left text-sm opacity-90" style={{ borderColor: accent + "40" }}>
              {selected.personal_message}
            </div>
          )}
          {selected.meal_choice && (
            <p className="mt-6 text-xs uppercase tracking-widest opacity-70">{t.meal} · {selected.meal_choice}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={bodyStyle}>
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <div className="mb-6 flex justify-end">{LangToggle}</div>
        {event.logo_url && (
          <img src={event.logo_url} alt="" className="mx-auto mb-8 h-16 object-contain md:h-20" />
        )}
        <p className="text-xs uppercase tracking-[0.25em] opacity-70">{event.subheadline ?? t.default_sub}</p>
        <h1 className="mt-4 text-5xl leading-[1.05] md:text-6xl" style={{ fontFamily: displayFont }}>
          {event.headline ?? event.name}
        </h1>
        {event.welcome_message && (
          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed opacity-80">
            {event.welcome_message}
          </p>
        )}

        {event.hero_image_url && (
          <img src={event.hero_image_url} alt="" className="mx-auto mt-10 max-h-72 w-full rounded-2xl object-cover" />
        )}

        <div className="mx-auto mt-10 max-w-md">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
            <Input
              autoFocus
              placeholder={t.placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-14 rounded-full border-2 pl-10 text-center text-lg"
              style={{ borderColor: accent }}
            />
          </div>
          {matches.length > 0 && (
            <div className="mt-3 divide-y overflow-hidden rounded-2xl border text-left" style={{ borderColor: accent + "40" }}>
              {matches.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelected(g)}
                  className="block w-full px-4 py-3 text-left transition-colors hover:bg-black/5"
                >
                  {g.full_name}
                </button>
              ))}
            </div>
          )}
          {q.length >= 2 && !searchQ.isLoading && matches.length === 0 && (
            <p className="mt-3 text-sm opacity-70">{t.no_match}</p>
          )}
        </div>

        {(event.venue_name || event.venue_address || (event.schedule && event.schedule.length > 0)) && (
          <div className="mx-auto mt-16 grid max-w-lg gap-6 text-left">
            {(event.venue_name || event.venue_address) && (
              <div>
                <p className="text-xs uppercase tracking-widest opacity-70">{t.venue}</p>
                {event.venue_name && <p className="mt-1 text-lg" style={{ fontFamily: displayFont }}>{event.venue_name}</p>}
                {event.venue_address && <p className="text-sm opacity-80">{event.venue_address}</p>}
              </div>
            )}
            {event.schedule && event.schedule.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest opacity-70">{t.schedule}</p>
                <ul className="mt-2 space-y-1.5">
                  {(event.schedule as Array<{ time: string; label: string }>).map((s, i) => (
                    <li key={i} className="flex gap-4 text-sm">
                      <span className="w-20 opacity-70">{s.time}</span>
                      <span>{s.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {event.footer_note && (
          <p className="mt-16 text-sm opacity-70" style={{ fontFamily: displayFont, fontStyle: "italic" }}>
            {event.footer_note}
          </p>
        )}
        {event.contact_info && <p className="mt-2 text-xs opacity-60">{event.contact_info}</p>}
      </div>
    </div>
  );
}
