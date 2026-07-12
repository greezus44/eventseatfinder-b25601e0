import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, MapPin, ArrowLeft } from "lucide-react";
import { T, type Lang, type BilingualContent, pickBilingual } from "@/lib/i18n";
import { LangSwitch } from "@/routes/index";
import { fontFor } from "@/lib/font";

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
          ...(loaderData.event.hero_image_url
            ? [{ property: "og:image", content: loaderData.event.hero_image_url }]
            : []),
        ]
      : [{ title: "Find your seat" }],
  }),
  component: GuestPage,
});

type Guest = {
  id: string;
  full_name: string;
  table_id: string | null;
  personal_message: string | null;
  meal_choice: string | null;
};
type EventTable = { id: string; name: string; location_note: string | null };

function GuestPage() {
  const { event } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const defaultLang = ((event as { default_language?: string }).default_language as Lang) ?? "en";
  const [lang, setLang] = useState<Lang>(defaultLang === "ms" ? "ms" : "en");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Guest | null>(null);
  const [tab, setTab] = useState<"seat" | "layout">("seat");
  const t = T[lang];

  const ms: BilingualContent = ((event as { content_ms?: BilingualContent }).content_ms ?? {}) as BilingualContent;
  const headline = pickBilingual(event.headline ?? event.name, ms.headline, lang);
  const subheadline = pickBilingual(event.subheadline ?? t.default_sub, ms.subheadline, lang);
  const welcome = pickBilingual(event.welcome_message ?? "", ms.welcome_message, lang);
  const footer = pickBilingual(event.footer_note ?? "", ms.footer_note, lang);
  const venueName = pickBilingual(event.venue_name ?? "", ms.venue_name, lang);
  const venueAddress = pickBilingual(event.venue_address ?? "", ms.venue_address, lang);
  const contact = pickBilingual(event.contact_info ?? "", ms.contact_info, lang);
  const scheduleRaw = (event.schedule ?? []) as Array<{ time: string; end_time?: string; label: string; description?: string }>;
  const scheduleMs = ms.schedule ?? [];
  const schedule = scheduleRaw.map((s, i) => ({
    time: s.time,
    end_time: s.end_time ?? "",
    label: pickBilingual(s.label, scheduleMs[i]?.label, lang),
    description: pickBilingual(s.description ?? "", scheduleMs[i]?.description, lang),
  }));
  const fmtScheduleTime = (a: string, b: string) => (a && b ? `${a} – ${b}` : a || b);

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
      const { data, error } = await supabase
        .from("event_tables")
        .select("id, name, location_note")
        .eq("event_id", event.id);
      if (error) throw error;
      return data as EventTable[];
    },
  });

  const matches = searchQ.data ?? [];
  const tableFor = (id: string | null) => tablesQ.data?.find((tb) => tb.id === id);
  const evAny = event as unknown as Record<string, unknown>;
  const eventTime = (evAny.event_time as string | null) ?? null;
  const titleScale = Number(evAny.title_scale ?? 1) || 1;
  const subtitleScale = Number(evAny.subtitle_scale ?? 1) || 1;
  const bodyScale = Number(evAny.body_scale ?? 1) || 1;
  const displayFont = fontFor(event.font_style);
  const titleFont = fontFor((evAny.font_title as string) || event.font_style);
  const subtitleFont = fontFor((evAny.font_subtitle as string) || event.font_style);
  const bodyFont = fontFor((evAny.font_body as string) || event.font_style);

  const logoSize = event.logo_size || "medium";
  const logoClass =
    logoSize === "small" ? "h-16 md:h-20" : logoSize === "large" ? "h-40 md:h-56" : "h-24 md:h-32";
  const logoSelectedClass =
    logoSize === "small" ? "h-14" : logoSize === "large" ? "h-32" : "h-20";
  const hasLayout = !!event.layout_image_url;

  const bodyStyle: React.CSSProperties = {
    background: event.background_color,
    color: event.text_color,
    minHeight: "100vh",
  };
  const accent = event.accent_color;

  const langSwitch = (
    <LangSwitch lang={lang} onChange={setLang} accent={accent} bg={event.background_color} />
  );

  const eventDateStr = event.event_date
    ? new Date(event.event_date).toLocaleDateString(lang === "ms" ? "ms-MY" : "en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  if (selected) {
    const tbl = tableFor(selected.table_id);
    return (
      <div style={bodyStyle}>
        {/* Top bar with lang switch top-right */}
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 pt-6">
          <button
            onClick={() => setSelected(null)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm opacity-70 transition hover:opacity-100"
          >
            <ArrowLeft className="h-4 w-4" /> {t.search_again}
          </button>
          {langSwitch}
        </div>

        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center px-6 pb-16 pt-4 text-center">
          {event.logo_url && (
            <img src={event.logo_url} alt="" className={`mb-8 ${logoSelectedClass} object-contain`} />
          )}

          <p
            className="text-[11px] uppercase tracking-[0.28em] opacity-60"
            style={{ fontFamily: subtitleFont }}
          >
            {t.welcome}
          </p>
          <h1
            className="mt-3 text-4xl leading-tight md:text-5xl"
            style={{ fontFamily: titleFont }}
          >
            {selected.full_name}
          </h1>

          {tbl ? (
            <div
              className="mt-10 w-full rounded-lg border px-8 py-8"
              style={{ borderColor: accent + "30", background: accent + "08" }}
            >
              <p
                className="text-[11px] uppercase tracking-[0.28em] opacity-60"
                style={{ fontFamily: subtitleFont }}
              >
                {t.seated_at}
              </p>
              <p
                className="mt-3 text-6xl leading-none md:text-7xl"
                style={{ fontFamily: displayFont, color: accent }}
              >
                {tbl.name}
              </p>
              {tbl.location_note && (
                <p className="mt-4 inline-flex items-center gap-1.5 text-sm opacity-80">
                  <MapPin className="h-3.5 w-3.5" /> {tbl.location_note}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-10 opacity-70">{t.no_table}</p>
          )}

          {selected.personal_message && (
            <div
              className="mt-6 w-full rounded-lg border p-5 text-left text-sm leading-relaxed opacity-90"
              style={{ borderColor: accent + "30" }}
            >
              {selected.personal_message}
            </div>
          )}
          {selected.meal_choice && (
            <p className="mt-6 text-[11px] uppercase tracking-[0.28em] opacity-60">
              {t.meal} · {selected.meal_choice}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={bodyStyle}>
      <div className="mx-auto max-w-2xl px-6 pb-12 pt-6 text-center">
        <div className="mb-8 flex justify-end">{langSwitch}</div>

        {/* Logo + title + date/venue block */}
        {event.logo_url && (
          <img src={event.logo_url} alt="" className={`mx-auto mb-6 ${logoClass} object-contain`} />
        )}
        <h1
          className="whitespace-pre-line leading-[1.05]"
          style={{ fontFamily: titleFont, fontSize: `${3 * titleScale}rem` }}
        >
          {headline}
        </h1>
        <p
          className="mt-4 whitespace-pre-line uppercase tracking-[0.25em] opacity-70"
          style={{ fontFamily: subtitleFont, fontSize: `${0.75 * subtitleScale}rem` }}
        >
          {subheadline}
        </p>

        {/* Date, time, venue name under the title */}
        {(eventDateStr || eventTime || venueName) && (
          <div className="mt-6 space-y-1 text-sm">
            {eventDateStr && (
              <p className="uppercase tracking-[0.2em] opacity-80">{eventDateStr}</p>
            )}
            {eventTime && (
              <p className="uppercase tracking-[0.2em] opacity-80">{eventTime}</p>
            )}
            {venueName && (
              <p style={{ fontFamily: subtitleFont }} className="text-lg">
                {venueName}
              </p>
            )}
          </div>
        )}

        {welcome && (
          <p
            className="mx-auto mt-8 max-w-lg whitespace-pre-line leading-relaxed opacity-80"
            style={{ fontFamily: bodyFont, fontSize: `${1 * bodyScale}rem` }}
          >
            {welcome}
          </p>
        )}

        {hasLayout && (
          <div
            className="mx-auto mt-10 inline-flex overflow-hidden rounded-lg border text-sm font-medium"
            style={{ borderColor: accent + "60" }}
          >
            {(
              [
                { id: "seat" as const, label: t.tab_seat },
                { id: "layout" as const, label: t.tab_layout },
              ]
            ).map((it) => (
              <button
                key={it.id}
                onClick={() => setTab(it.id)}
                className="px-5 py-2 transition-colors"
                style={
                  tab === it.id
                    ? { background: accent, color: event.background_color }
                    : { opacity: 0.7 }
                }
              >
                {it.label}
              </button>
            ))}
          </div>
        )}

        {tab === "layout" && hasLayout ? (
          <div className="mx-auto mt-8 max-w-2xl">
            <img
              src={event.layout_image_url!}
              alt="Event space layout"
              className="w-full rounded-lg border object-contain"
              style={{ borderColor: accent + "40" }}
            />
          </div>
        ) : (
          <>
            <div className="mx-auto mt-10 max-w-md">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: event.text_color, opacity: 0.55 }}
                />
                <Input
                  autoFocus
                  placeholder={t.placeholder}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-14 rounded-lg border-2 bg-transparent pl-10 text-center text-lg"
                  style={{
                    borderColor: accent,
                    background: "transparent",
                    color: event.text_color,
                    ["--tw-placeholder-color" as string]: event.text_color,
                  }}
                />
                <style>{`
                  input::placeholder { color: ${event.text_color}; opacity: 0.55; }
                `}</style>
              </div>
              {matches.length > 0 && (
                <div
                  className="mt-3 divide-y overflow-hidden rounded-lg border text-left"
                  style={{ borderColor: accent + "40" }}
                >
                  {matches.map((g) => {
                    const tbl = tableFor(g.table_id);
                    return (
                      <button
                        key={g.id}
                        onClick={() => setSelected(g)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-black/5"
                      >
                        <span>{g.full_name}</span>
                        <span
                          className="shrink-0 rounded-md px-2.5 py-0.5 text-xs font-medium"
                          style={
                            tbl
                              ? { background: accent + "18", color: accent }
                              : { opacity: 0.55 }
                          }
                        >
                          {tbl ? tbl.name : "—"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {q.length >= 2 && !searchQ.isLoading && matches.length === 0 && (
                <p className="mt-3 text-sm opacity-70">{t.no_match}</p>
              )}
            </div>

            {schedule.length > 0 && (
              <div className="mx-auto mt-16 max-w-lg text-left">
                <p className="text-xs uppercase tracking-widest opacity-70">{t.schedule}</p>
                <ul className="mt-2 space-y-1.5">
                  {schedule.map((s, i) => (
                    <li key={i} className="flex gap-4 text-sm">
                      <span className="w-20 opacity-70">{s.time}</span>
                      <span>{s.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {venueAddress && (
              <div className="mx-auto mt-10 max-w-lg text-left">
                <p className="text-xs uppercase tracking-widest opacity-70">{t.venue}</p>
                <p className="mt-2 whitespace-pre-line text-sm opacity-80">{venueAddress}</p>
              </div>
            )}
          </>
        )}

        {footer && (
          <p
            className="mt-16 whitespace-pre-line text-sm opacity-70"
            style={{ fontFamily: displayFont, fontStyle: "italic" }}
          >
            {footer}
          </p>
        )}
        {contact && <p className="mt-2 text-xs opacity-60">{contact}</p>}
      </div>
    </div>
  );
}
