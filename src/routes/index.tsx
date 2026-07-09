import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, QrCode, Users, Palette } from "lucide-react";
import { T, LANG_LABEL, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const [lang, setLang] = useState<Lang>("en");
  const t = T[lang];

  const cards = [
    { icon: Users, title: t.home_how_1_title, body: t.home_how_1_body },
    { icon: Palette, title: t.home_how_2_title, body: t.home_how_2_body },
    { icon: QrCode, title: t.home_how_3_title, body: t.home_how_3_body },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="font-display text-2xl tracking-tight">
          Seatly<span className="text-muted-foreground">.</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <LangSwitch lang={lang} onChange={setLang} />
          <Link to="/auth" className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground">
            {t.sign_in}
          </Link>
          <Link
            to="/auth"
            className="rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t.get_started}
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-6 pt-16 pb-24 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t.home_eyebrow}</p>
        <h1 className="mt-6 font-display text-6xl leading-[1.02] tracking-tight text-foreground md:text-7xl">
          {t.home_title.split(" ").slice(0, -1).join(" ")}{" "}
          <em className="italic">{t.home_title.split(" ").slice(-1)}</em>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{t.home_lede}</p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t.home_cta_primary} <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#how"
            className="inline-flex items-center rounded-md border border-border px-5 py-3 text-sm font-medium hover:bg-accent"
          >
            {t.home_cta_secondary}
          </a>
        </div>
      </section>

      <section id="how" className="border-t border-border bg-card/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-3">
          {cards.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <Icon className="h-6 w-6 text-foreground" strokeWidth={1.5} />
              <h3 className="mt-4 text-xl">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-xs text-muted-foreground">{t.footer}</footer>
    </div>
  );
}

export function LangSwitch({
  lang,
  onChange,
  accent,
  bg,
}: {
  lang: Lang;
  onChange: (l: Lang) => void;
  accent?: string;
  bg?: string;
}) {
  const borderColor = accent ? accent + "60" : undefined;
  return (
    <div
      className="inline-flex overflow-hidden rounded-full border text-xs font-medium"
      style={{ borderColor }}
    >
      {(["en", "ms"] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          className={`px-3 py-1.5 transition-colors ${lang === l ? (accent ? "" : "bg-foreground text-background") : "opacity-70 hover:opacity-100"}`}
          style={
            lang === l && accent
              ? { background: accent, color: bg ?? "#fff" }
              : undefined
          }
        >
          {LANG_LABEL[l]}
        </button>
      ))}
    </div>
  );
}
