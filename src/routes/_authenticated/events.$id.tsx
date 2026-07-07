import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Copy, Download, ExternalLink, Plus, Trash2, MessageSquare } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/events/$id")({
  component: EventManager,
});

type EventRow = {
  id: string; slug: string; name: string; event_date: string | null;
  headline: string | null; subheadline: string | null; welcome_message: string | null;
  footer_note: string | null; hero_image_url: string | null; logo_url: string | null;
  accent_color: string; background_color: string; text_color: string; font_style: string;
  venue_name: string | null; venue_address: string | null; contact_info: string | null;
  is_published: boolean; schedule: Array<{ time: string; label: string }>;
  public_base_url: string | null;
};

function EventManager() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const eventQ = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", id).single();
      if (error) throw error;
      return data as unknown as EventRow;
    },
  });

  if (eventQ.isLoading) return <p className="p-8 text-sm text-muted-foreground">Loading…</p>;
  if (eventQ.error || !eventQ.data) return <p className="p-8 text-sm">Event not found.</p>;

  const event = eventQ.data;
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const isPreviewHost = /(?:^|\/\/)(?:id-preview--|preview--)/.test(currentOrigin);
  const shareBase = (event.public_base_url?.replace(/\/+$/, "") || (isPreviewHost ? "" : currentOrigin));
  const publicUrl = shareBase ? `${shareBase}/e/${event.slug}` : `/e/${event.slug}`;

  const del = async () => {
    if (!confirm("Delete this event permanently?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    navigate({ to: "/dashboard" });
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All events
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">{event.name}</h1>
          <a href={publicUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            /e/{event.slug} <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <Button variant="ghost" size="sm" onClick={del}><Trash2 className="h-4 w-4" /> Delete</Button>
      </div>

      <Tabs defaultValue="guests" className="mt-8">
        <TabsList>
          <TabsTrigger value="guests">Guests</TabsTrigger>
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="customize">Customize</TabsTrigger>
          <TabsTrigger value="share">Share</TabsTrigger>
        </TabsList>

        <TabsContent value="guests" className="mt-6"><GuestsTab eventId={id} /></TabsContent>
        <TabsContent value="tables" className="mt-6"><TablesTab eventId={id} /></TabsContent>
        <TabsContent value="customize" className="mt-6">
          <CustomizeTab event={event} onSaved={() => qc.invalidateQueries({ queryKey: ["event", id] })} />
        </TabsContent>
        <TabsContent value="share" className="mt-6">
          <ShareTab event={event} publicUrl={publicUrl} isPreviewHost={isPreviewHost} onChange={() => qc.invalidateQueries({ queryKey: ["event", id] })} />
        </TabsContent>
      </Tabs>
    </main>
  );
}

/* ---------------- TABLES ---------------- */
function TablesTab({ eventId }: { eventId: string }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["tables", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_tables").select("*").eq("event_id", eventId).order("sort_order");
      if (error) throw error;
      return data;
    },
  });
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [note, setNote] = useState("");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("event_tables").insert({
      event_id: eventId, name, capacity: capacity ? Number(capacity) : null, location_note: note || null,
      sort_order: (q.data?.length ?? 0) + 1,
    });
    if (error) return toast.error(error.message);
    setName(""); setCapacity(""); setNote("");
    qc.invalidateQueries({ queryKey: ["tables", eventId] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("event_tables").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["tables", eventId] });
    qc.invalidateQueries({ queryKey: ["guests", eventId] });
  };

  const updateTable = async (id: string, patch: Partial<{ name: string; capacity: number | null; location_note: string | null }>) => {
    const { error } = await supabase.from("event_tables").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["tables", eventId] });
  };

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <div className="rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-24">Seats</TableHead>
              <TableHead>Location note</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.data?.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <Input defaultValue={t.name} onBlur={(e) => e.target.value !== t.name && updateTable(t.id, { name: e.target.value })} className="h-8" />
                </TableCell>
                <TableCell>
                  <Input type="number" defaultValue={t.capacity ?? ""} onBlur={(e) => updateTable(t.id, { capacity: e.target.value ? Number(e.target.value) : null })} className="h-8" />
                </TableCell>
                <TableCell>
                  <Input defaultValue={t.location_note ?? ""} onBlur={(e) => updateTable(t.id, { location_note: e.target.value || null })} className="h-8" placeholder="e.g. near the window" />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {q.data?.length === 0 && (
              <TableRow><TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">No tables yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <form onSubmit={add} className="h-fit space-y-3 rounded-2xl border border-border bg-card p-5">
        <h3 className="font-display text-xl">Add a table</h3>
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Table 1" />
        </div>
        <div className="space-y-1.5">
          <Label>Capacity</Label>
          <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="8" />
        </div>
        <div className="space-y-1.5">
          <Label>Location note (optional)</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Near the garden" />
        </div>
        <Button type="submit" className="w-full"><Plus className="h-4 w-4" /> Add</Button>
      </form>
    </div>
  );
}

/* ---------------- GUESTS ---------------- */
function GuestsTab({ eventId }: { eventId: string }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [bulk, setBulk] = useState("");

  const tablesQ = useQuery({
    queryKey: ["tables", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_tables").select("id, name").eq("event_id", eventId).order("sort_order");
      if (error) throw error;
      return data;
    },
  });
  const guestsQ = useQuery({
    queryKey: ["guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("guests").select("*").eq("event_id", eventId).order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return guestsQ.data?.filter((g) => !term || g.full_name.toLowerCase().includes(term)) ?? [];
  }, [guestsQ.data, search]);

  const addBulk = async () => {
    const names = bulk.split("\n").map((s) => s.trim()).filter(Boolean);
    if (!names.length) return;
    const { error } = await supabase.from("guests").insert(names.map((n) => ({ event_id: eventId, full_name: n })));
    if (error) return toast.error(error.message);
    setBulk("");
    toast.success(`Added ${names.length} guest${names.length > 1 ? "s" : ""}`);
    qc.invalidateQueries({ queryKey: ["guests", eventId] });
  };

  const updateGuest = async (
    id: string,
    patch: Partial<{ full_name: string; table_id: string | null; personal_message: string | null; meal_choice: string | null; notes: string | null }>,
  ) => {
    const { error } = await supabase.from("guests").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["guests", eventId] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("guests").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["guests", eventId] });
  };

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Input placeholder="Search guests…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          <span className="text-sm text-muted-foreground">{filtered.length} guest{filtered.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-40">Table</TableHead>
                <TableHead className="w-10"></TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>
                    <Input defaultValue={g.full_name} className="h-8" onBlur={(e) => e.target.value !== g.full_name && updateGuest(g.id, { full_name: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Select value={g.table_id ?? "none"} onValueChange={(v) => updateGuest(g.id, { table_id: v === "none" ? null : v })}>
                      <SelectTrigger className="h-8"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Unassigned</SelectItem>
                        {tablesQ.data?.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <PersonalMessageDialog
                      guestName={g.full_name}
                      value={g.personal_message ?? ""}
                      onSave={(msg) => updateGuest(g.id, { personal_message: msg || null })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => remove(g.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">No guests</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="h-fit space-y-3 rounded-2xl border border-border bg-card p-5">
        <h3 className="font-display text-xl">Add guests</h3>
        <p className="text-xs text-muted-foreground">One name per line — paste from a list.</p>
        <Textarea rows={8} value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder={"Amelia Chen\nNoah Patel\nJordan Lee"} />
        <Button onClick={addBulk} className="w-full"><Plus className="h-4 w-4" /> Add all</Button>
      </div>
    </div>
  );
}

function PersonalMessageDialog({ guestName, value, onSave }: { guestName: string; value: string; onSave: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value, open]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Personal note">
          <MessageSquare className={`h-4 w-4 ${value ? "text-foreground" : "text-muted-foreground"}`} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Personal note for {guestName}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Shown only when this guest finds their seat.</p>
        <Textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="So happy you're here — you're seated with your college friends." />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => { onSave(text); setOpen(false); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- CUSTOMIZE ---------------- */
function CustomizeTab({ event, onSaved }: { event: EventRow; onSaved: () => void }) {
  const [form, setForm] = useState(event);
  useEffect(() => setForm(event), [event]);

  const mut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("events").update({
        name: form.name,
        event_date: form.event_date,
        headline: form.headline,
        subheadline: form.subheadline,
        welcome_message: form.welcome_message,
        footer_note: form.footer_note,
        hero_image_url: form.hero_image_url,
        logo_url: form.logo_url,
        accent_color: form.accent_color,
        background_color: form.background_color,
        text_color: form.text_color,
        font_style: form.font_style,
        venue_name: form.venue_name,
        venue_address: form.venue_address,
        contact_info: form.contact_info,
        schedule: form.schedule ?? [],
      }).eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Saved"); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = <K extends keyof EventRow>(k: K, v: EventRow[K]) => setForm((f) => ({ ...f, [k]: v }));

  const updateSchedule = (i: number, patch: Partial<{ time: string; label: string }>) => {
    const next = [...(form.schedule ?? [])];
    next[i] = { ...next[i], ...patch };
    set("schedule", next);
  };
  const addSchedule = () => set("schedule", [...(form.schedule ?? []), { time: "", label: "" }]);
  const removeSchedule = (i: number) => set("schedule", (form.schedule ?? []).filter((_, idx) => idx !== i));

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Section title="Content">
          <Field label="Event name"><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Headline (large text)"><Input value={form.headline ?? ""} onChange={(e) => set("headline", e.target.value)} /></Field>
          <Field label="Subheadline"><Input value={form.subheadline ?? ""} onChange={(e) => set("subheadline", e.target.value)} /></Field>
          <Field label="Welcome message"><Textarea rows={3} value={form.welcome_message ?? ""} onChange={(e) => set("welcome_message", e.target.value)} /></Field>
          <Field label="Footer note"><Input value={form.footer_note ?? ""} onChange={(e) => set("footer_note", e.target.value)} placeholder="With love, A + N" /></Field>
        </Section>

        <Section title="Venue">
          <Field label="Venue name"><Input value={form.venue_name ?? ""} onChange={(e) => set("venue_name", e.target.value)} /></Field>
          <Field label="Address"><Input value={form.venue_address ?? ""} onChange={(e) => set("venue_address", e.target.value)} /></Field>
          <Field label="Contact / help text"><Input value={form.contact_info ?? ""} onChange={(e) => set("contact_info", e.target.value)} placeholder="Ask the host if you need help" /></Field>
        </Section>

        <Section title="Schedule">
          <div className="space-y-2">
            {(form.schedule ?? []).map((s, i) => (
              <div key={i} className="flex gap-2">
                <Input className="w-32" placeholder="5:00 pm" value={s.time} onChange={(e) => updateSchedule(i, { time: e.target.value })} />
                <Input placeholder="Ceremony" value={s.label} onChange={(e) => updateSchedule(i, { label: e.target.value })} />
                <Button variant="ghost" size="icon" onClick={() => removeSchedule(i)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addSchedule}><Plus className="h-4 w-4" /> Add item</Button>
          </div>
        </Section>

        <Section title="Design">
          <Field label="Color theme">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {COLOR_PRESETS.map((p) => {
                const active =
                  form.background_color.toLowerCase() === p.bg.toLowerCase() &&
                  form.text_color.toLowerCase() === p.text.toLowerCase() &&
                  form.accent_color.toLowerCase() === p.accent.toLowerCase();
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      set("background_color", p.bg);
                      set("text_color", p.text);
                      set("accent_color", p.accent);
                    }}
                    className={`group flex flex-col items-center gap-1.5 rounded-xl border p-2 text-left transition ${active ? "border-foreground ring-2 ring-foreground/10" : "border-border hover:border-foreground/40"}`}
                    title={p.name}
                  >
                    <div className="flex h-10 w-full items-center justify-center rounded-lg" style={{ background: p.bg }}>
                      <span className="text-xs" style={{ fontFamily: fontFor(form.font_style), color: p.text }}>Aa</span>
                      <span className="ml-1 h-3 w-3 rounded-full" style={{ background: p.accent }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{p.name}</span>
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Background">
              <div className="flex items-center gap-2">
                <Input type="color" value={form.background_color} onChange={(e) => set("background_color", e.target.value)} className="h-10 w-14 p-1" />
                <Input value={form.background_color} onChange={(e) => set("background_color", e.target.value)} className="h-10 font-mono text-xs" />
              </div>
            </Field>
            <Field label="Text">
              <div className="flex items-center gap-2">
                <Input type="color" value={form.text_color} onChange={(e) => set("text_color", e.target.value)} className="h-10 w-14 p-1" />
                <Input value={form.text_color} onChange={(e) => set("text_color", e.target.value)} className="h-10 font-mono text-xs" />
              </div>
            </Field>
            <Field label="Accent">
              <div className="flex items-center gap-2">
                <Input type="color" value={form.accent_color} onChange={(e) => set("accent_color", e.target.value)} className="h-10 w-14 p-1" />
                <Input value={form.accent_color} onChange={(e) => set("accent_color", e.target.value)} className="h-10 font-mono text-xs" />
              </div>
            </Field>
          </div>

          <Field label="Font style">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {FONT_PRESETS.map((f) => {
                const active = form.font_style === f.value;
                return (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => set("font_style", f.value)}
                    className={`rounded-xl border p-3 text-left transition ${active ? "border-foreground ring-2 ring-foreground/10" : "border-border hover:border-foreground/40"}`}
                  >
                    <div className="text-2xl leading-none" style={{ fontFamily: fontFor(f.value) }}>Aa</div>
                    <div className="mt-2 text-xs text-muted-foreground">{f.label}</div>
                    <div className="text-[11px]" style={{ fontFamily: fontFor(f.value) }}>{f.sample}</div>
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Logo (shown top-middle on the guest page)">
            <ImageUpload value={form.logo_url} onChange={(url) => set("logo_url", url)} kind="logo" />
          </Field>
          <Field label="Hero image">
            <ImageUpload value={form.hero_image_url} onChange={(url) => set("hero_image_url", url)} kind="hero" />
          </Field>
        </Section>

        <div className="sticky bottom-4 flex justify-end">
          <Button onClick={() => mut.mutate()} disabled={mut.isPending} size="lg">
            {mut.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      <div className="h-fit rounded-2xl border border-border bg-card p-2">
        <p className="px-3 pt-2 text-xs uppercase tracking-widest text-muted-foreground">Live preview</p>
        <div
          className="mt-2 aspect-[9/16] w-full overflow-hidden rounded-xl border border-border"
          style={{ background: form.background_color, color: form.text_color }}
        >
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            {form.logo_url && <img src={form.logo_url} alt="" className="mb-4 h-10 object-contain" />}
            <p className="text-xs uppercase tracking-[0.2em] opacity-70">{form.subheadline}</p>
            <h2
              className="mt-3 text-3xl leading-tight"
              style={{ fontFamily: fontFor(form.font_style) }}
            >
              {form.headline || form.name}
            </h2>
            <p className="mt-3 max-w-[24ch] text-xs opacity-80">{form.welcome_message}</p>
            <div className="mt-4 h-8 w-32 rounded" style={{ background: form.accent_color }} />
            <p className="mt-4 text-[10px] opacity-60">{form.footer_note}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function fontFor(style: string) {
  if (style === "serif") return "'Instrument Serif', Georgia, serif";
  if (style === "display") return "'Instrument Serif', Georgia, serif";
  return "'Inter', ui-sans-serif, system-ui, sans-serif";
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-display text-xl">{title}</h3>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function ImageUpload({ value, onChange, kind }: { value: string | null; onChange: (url: string | null) => void; kind: "logo" | "hero" }) {
  const [uploading, setUploading] = useState(false);
  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5 MB");
    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");
      const ext = (file.name.split(".").pop() ?? "png").toLowerCase();
      const path = `${uid}/${kind}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("event-assets").upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabase.storage
        .from("event-assets")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (sErr) throw sErr;
      onChange(signed.signedUrl);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };
  return (
    <div className="space-y-2">
      {value && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-2">
          <img src={value} alt="" className={kind === "logo" ? "h-12 object-contain" : "h-16 w-24 rounded object-cover"} />
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            <Trash2 className="h-4 w-4" /> Remove
          </Button>
        </div>
      )}
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
        <input type="file" accept="image/*" className="hidden" onChange={handle} disabled={uploading} />
        {uploading ? "Uploading…" : value ? "Replace image" : "Upload image"}
      </label>
    </div>
  );
}

/* ---------------- SHARE ---------------- */
function ShareTab({ event, publicUrl, isPreviewHost, onChange }: { event: EventRow; publicUrl: string; isPreviewHost: boolean; onChange: () => void }) {
  const [qr, setQr] = useState<string>("");
  const [baseInput, setBaseInput] = useState(event.public_base_url ?? "");
  const [savingBase, setSavingBase] = useState(false);

  useEffect(() => setBaseInput(event.public_base_url ?? ""), [event.public_base_url]);

  useEffect(() => {
    if (!publicUrl.startsWith("http")) { setQr(""); return; }
    QRCode.toDataURL(publicUrl, { width: 512, margin: 2, color: { dark: "#111111", light: "#ffffff" } }).then(setQr);
  }, [publicUrl]);

  const togglePublish = async (v: boolean) => {
    const { error } = await supabase.from("events").update({ is_published: v }).eq("id", event.id);
    if (error) return toast.error(error.message);
    onChange();
  };

  const saveBase = async () => {
    const normalized = baseInput.trim().replace(/\/+$/, "");
    if (normalized && !/^https?:\/\//i.test(normalized)) {
      return toast.error("Enter a full URL, e.g. https://your-site.lovable.app");
    }
    setSavingBase(true);
    const { error } = await supabase.from("events").update({ public_base_url: normalized || null }).eq("id", event.id);
    setSavingBase(false);
    if (error) return toast.error(error.message);
    toast.success("Share URL saved");
    onChange();
  };

  const copy = () => {
    if (!publicUrl.startsWith("http")) return toast.error("Set your public share URL first");
    navigator.clipboard.writeText(publicUrl);
    toast.success("Link copied");
  };

  const needsBase = isPreviewHost && !event.public_base_url;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display text-xl">Public link</h3>

        <div className="mt-4 space-y-1.5">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">Public share URL</Label>
          <div className="flex gap-2">
            <Input
              value={baseInput}
              onChange={(e) => setBaseInput(e.target.value)}
              placeholder="https://your-site.lovable.app"
              className="font-mono text-xs"
            />
            <Button onClick={saveBase} disabled={savingBase} variant="outline">
              {savingBase ? "…" : "Save"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            The domain where guests will open this page. Use your published site — the editor preview URL requires sign-in and won't work for guests.
          </p>
        </div>

        {needsBase && (
          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
            You're currently on the editor preview, which asks visitors to sign in. Publish your app and paste that URL above so guests can open the QR code without an account.
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <Input readOnly value={publicUrl} className="font-mono text-xs" />
          <Button size="icon" variant="outline" onClick={copy}><Copy className="h-4 w-4" /></Button>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium">Published</p>
            <p className="text-xs text-muted-foreground">Turn off to hide the page from guests.</p>
          </div>
          <Switch checked={event.is_published} onCheckedChange={togglePublish} />
        </div>
        {publicUrl.startsWith("http") && (
          <a href={publicUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            Open guest page <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <h3 className="font-display text-xl">QR code</h3>
        {qr ? (
          <>
            <img src={qr} alt="QR code" className="mx-auto mt-4 w-64 rounded-lg border border-border" />
            <a href={qr} download={`${event.slug}-qr.png`}>
              <Button variant="outline" className="mt-4"><Download className="h-4 w-4" /> Download PNG</Button>
            </a>
            <p className="mt-3 text-xs text-muted-foreground">Print and place at the entrance — anyone can scan without signing in.</p>
          </>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            Set your public share URL to generate a QR code guests can scan.
          </p>
        )}
      </div>
    </div>
  );
}
