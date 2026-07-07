import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, QrCode, Users, Palette } from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="font-display text-2xl tracking-tight">
          Seatly<span className="text-muted-foreground">.</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            to="/auth"
            className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            className="rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground hover:bg-primary/90"
          >
            Get started
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-6 pt-16 pb-24 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Live seating charts for weddings & events
        </p>
        <h1 className="mt-6 font-display text-6xl leading-[1.02] tracking-tight text-foreground md:text-7xl">
          Please find <em className="italic">your seat.</em>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          A quiet, elegant page your guests open with a QR code — type a name,
          see the table. Edit everything — copy, colors, tables, even a personal
          note per guest — after the invitations are printed.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create your event <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#how"
            className="inline-flex items-center rounded-md border border-border px-5 py-3 text-sm font-medium hover:bg-accent"
          >
            How it works
          </a>
        </div>
      </section>

      <section id="how" className="border-t border-border bg-card/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-3">
          {[
            { icon: Users, title: "Add your guests", body: "Paste in your list, group into tables. Import as CSV or type by hand." },
            { icon: Palette, title: "Design it live", body: "Colors, hero image, welcome message — even a personal note for each guest. Change anything, any time." },
            { icon: QrCode, title: "Share a QR", body: "Print one small sign at the door. Guests scan and instantly find where to sit." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <Icon className="h-6 w-6 text-foreground" strokeWidth={1.5} />
              <h3 className="mt-4 text-xl">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-xs text-muted-foreground">
        Seatly — quiet software for loud rooms.
      </footer>
    </div>
  );
}
