import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { session } = useSession();
  const uid = session?.user.id;

  const { data: events, isLoading } = useQuery({
    enabled: !!uid,
    queryKey: ["events", uid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, slug, name, event_date, is_published, updated_at")
        .eq("owner_id", uid!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl">Your events</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create, edit, and share live seating pages.</p>
        </div>
        <Link to="/events/new">
          <Button><Plus className="h-4 w-4" /> New event</Button>
        </Link>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {events && events.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="font-display text-2xl">No events yet</p>
            <p className="mt-2 text-sm text-muted-foreground">Create your first seating page.</p>
            <Link to="/events/new" className="mt-4 inline-block">
              <Button><Plus className="h-4 w-4" /> New event</Button>
            </Link>
          </div>
        )}
        {events?.map((e) => (
          <Link
            key={e.id}
            to="/events/$id"
            params={{ id: e.id }}
            className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-foreground/30 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <h3 className="font-display text-2xl leading-tight">{e.name}</h3>
              <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${e.is_published ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
                {e.is_published ? "live" : "draft"}
              </span>
            </div>
            {e.event_date && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(e.event_date).toLocaleDateString(undefined, { dateStyle: "long" })}
              </p>
            )}
            <p className="mt-4 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground">
              /e/{e.slug} <ExternalLink className="h-3 w-3" />
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
