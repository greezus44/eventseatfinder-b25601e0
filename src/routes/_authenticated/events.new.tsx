import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { slugify } from "@/lib/slug";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/events/new")({
  component: NewEvent,
});

function NewEvent() {
  const { session } = useSession();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setBusy(true);
    try {
      const slug = slugify(name);
      const { data, error } = await supabase
        .from("events")
        .insert({
          owner_id: session.user.id,
          slug,
          name,
          event_date: date || null,
          headline: name,
          subheadline: "Please find your seat",
          welcome_message: "Welcome — we're so glad you're here. Type your name to find your table.",
        })
        .select("id")
        .single();
      if (error) throw error;
      toast.success("Event created");
      navigate({ to: "/events/$id", params: { id: data.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <Link to="/dashboard" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="font-display text-4xl">New event</h1>
      <p className="mt-1 text-sm text-muted-foreground">You can edit everything after creating.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name">Event name</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Amelia & Noah's Wedding" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date">Date (optional)</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Creating…" : "Create event"}
        </Button>
      </form>
    </main>
  );
}
