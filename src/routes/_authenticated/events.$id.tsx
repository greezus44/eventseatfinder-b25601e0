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
import { ArrowLeft, Copy, Download, ExternalLink, Plus, Trash2, MessageSquare, Mail } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { FONT_PRESETS, fontFor } from "@/lib/font";
import { T, type Lang, type BilingualContent, LANG_LABEL, pickBilingual } from "@/lib/i18n";
import { slugify } from "@/lib/slug";

export const Route = createFileRoute("/_authenticated/events/$id")({
  component: EventManager,
});

type EventRow = {
  id: string; slug: string; name: string; event_date: string | null;
  event_time: string | null;
  title_scale: number; subtitle_scale: number; body_scale: number;
  headline: string | null; subheadline: string | null; welcome_message: string | null;
  footer_note: string | null; hero_image_url: string | null; logo_url: string | null;
  logo_size: string; layout_image_url: string | null;
  accent_color: string; background_color: string; text_color: string; font_style: string;
  venue_name: string | null; venue_address: string | null; contact_info: string | null;
  is_published: boolean; schedule: Array<{ time: string; label: string }>;
  public_base_url: string | null;
  content_ms: BilingualContent;
  default_language: string;
  owner_id: string;
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
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="guests" className="mt-6"><GuestsTab eventId={id} /></TabsContent>
        <TabsContent value="tables" className="mt-6"><TablesTab eventId={id} /></TabsContent>
        <TabsContent value="customize" className="mt-6">
          <CustomizeTab event={event} onSaved={() => qc.invalidateQueries({ queryKey: ["event", id] })} />
        </TabsContent>
        <TabsContent value="share" className="mt-6">
          <ShareTab event={event} publicUrl={publicUrl} isPreviewHost={isPreviewHost} onChange={() => qc.invalidateQueries({ queryKey: ["event", id] })} />
        </TabsContent>
        <TabsContent value="team" className="mt-6">
          <TeamTab event={event} />
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

  const [bulkCount, setBulkCount] = useState("15");
  const [bulkCapacity, setBulkCapacity] = useState("10");
  const [bulkPrefix, setBulkPrefix] = useState("Table");
  const [bulkStart, setBulkStart] = useState("1");

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

  const bulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = Number(bulkCount);
    const cap = bulkCapacity ? Number(bulkCapacity) : null;
    const start = Number(bulkStart) || 1;
    if (!count || count < 1 || count > 200) return toast.error("Enter a count between 1 and 200");
    const base = q.data?.length ?? 0;
    const rows = Array.from({ length: count }, (_, i) => ({
      event_id: eventId,
      name: `${bulkPrefix.trim() || "Table"} ${start + i}`,
      capacity: cap,
      location_note: null,
      sort_order: base + i + 1,
    }));
    const { error } = await supabase.from("event_tables").insert(rows);
    if (error) return toast.error(error.message);
    toast.success(`Added ${count} tables`);
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
                  <Input defaultValue={t.location_note ?? ""} onBlur={(e) => updateTable(t.id, { location_note: e.target.value || null })} className="h-8" placeholder="Near the window" />
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

      <div className="space-y-4">
        <form onSubmit={bulkAdd} className="h-fit space-y-3 rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display text-xl">Add multiple tables</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>How many</Label>
              <Input type="number" min={1} max={200} value={bulkCount} onChange={(e) => setBulkCount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Capacity each</Label>
              <Input type="number" value={bulkCapacity} onChange={(e) => setBulkCapacity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Name prefix</Label>
              <Input value={bulkPrefix} onChange={(e) => setBulkPrefix(e.target.value)} placeholder="Table" />
            </div>
            <div className="space-y-1.5">
              <Label>Start number</Label>
              <Input type="number" value={bulkStart} onChange={(e) => setBulkStart(e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="w-full" variant="secondary"><Plus className="h-4 w-4" /> Add {bulkCount || 0} tables</Button>
        </form>

        <form onSubmit={add} className="h-fit space-y-3 rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display text-xl">Add a single table</h3>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Table 1" />
          </div>
          <div className="space-y-1.5">
            <Label>Capacity</Label>
            <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="8" />
          </div>
          <div className="space-y-1.5">
            <Label>Location note</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Near the garden" />
          </div>
          <Button type="submit" className="w-full"><Plus className="h-4 w-4" /> Add</Button>
        </form>
      </div>
    </div>
  );
}


/* ---------------- GUESTS ---------------- */
function GuestsTab({ eventId }: { eventId: string }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [bulk, setBulk] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "table">("name");

  const tablesQ = useQuery({
    queryKey: ["tables", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_tables").select("id, name, sort_order").eq("event_id", eventId).order("sort_order");
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
    const list = guestsQ.data?.filter((g) => !term || g.full_name.toLowerCase().includes(term)) ?? [];
    if (sortBy === "table") {
      const orderById = new Map(tablesQ.data?.map((t, i) => [t.id, i]));
      return [...list].sort((a, b) => {
        const ai = a.table_id ? orderById.get(a.table_id) ?? 999 : 1000;
        const bi = b.table_id ? orderById.get(b.table_id) ?? 999 : 1000;
        if (ai !== bi) return ai - bi;
        return a.full_name.localeCompare(b.full_name);
      });
    }
    return [...list].sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [guestsQ.data, tablesQ.data, search, sortBy]);

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
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Input placeholder="Search guests…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          <div className="ml-auto flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Group by</Label>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as "name" | "table")}>
              <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="table">Table</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">{filtered.length} guest{filtered.length !== 1 ? "s" : ""}</span>
          </div>
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
        <p className="text-xs text-muted-foreground">One name per line.</p>
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
  const [form, setForm] = useState<EventRow>(event);
  const [contentLang, setContentLang] = useState<Lang>("en");
  const [previewLang, setPreviewLang] = useState<Lang>((event.default_language as Lang) ?? "en");
  useEffect(() => setForm(event), [event]);

  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        event_date: form.event_date,
        headline: form.headline,
        subheadline: form.subheadline,
        welcome_message: form.welcome_message,
        footer_note: form.footer_note,
        logo_url: form.logo_url,
        logo_size: form.logo_size,
        layout_image_url: form.layout_image_url,
        accent_color: form.accent_color,
        background_color: form.background_color,
        text_color: form.text_color,
        font_style: form.font_style,
        venue_name: form.venue_name,
        venue_address: form.venue_address,
        contact_info: form.contact_info,
        schedule: form.schedule ?? [],
        content_ms: form.content_ms ?? {},
        default_language: form.default_language,
      } as never;
      const { error } = await supabase.from("events").update(payload).eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Saved"); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = <K extends keyof EventRow>(k: K, v: EventRow[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setMs = (patch: Partial<BilingualContent>) =>
    setForm((f) => ({ ...f, content_ms: { ...(f.content_ms ?? {}), ...patch } }));

  const updateSchedule = (i: number, patch: Partial<{ time: string; label: string }>) => {
    const next = [...(form.schedule ?? [])];
    next[i] = { ...next[i], ...patch };
    set("schedule", next);
  };
  const addSchedule = () => set("schedule", [...(form.schedule ?? []), { time: "", label: "" }]);
  const removeSchedule = (i: number) => set("schedule", (form.schedule ?? []).filter((_, idx) => idx !== i));

  const updateScheduleMs = (i: number, label: string) => {
    const next = [...(form.content_ms?.schedule ?? [])];
    while (next.length < i + 1) next.push({ time: "", label: "" });
    next[i] = { time: form.schedule?.[i]?.time ?? "", label };
    setMs({ schedule: next });
  };

  const ms = form.content_ms ?? {};
  const isMs = contentLang === "ms";

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Section title="Content">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-xs text-muted-foreground">Editing language</Label>
            <div className="inline-flex overflow-hidden rounded-full border border-border text-xs">
              {(["en", "ms"] as Lang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setContentLang(l)}
                  className={`px-3 py-1.5 transition ${contentLang === l ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {LANG_LABEL[l]}
                </button>
              ))}
            </div>
          </div>

          <Field label="Event name">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>

          <Field label={isMs ? "Headline (BM)" : "Headline"}>
            <Textarea
              rows={2}
              value={isMs ? ms.headline ?? "" : form.headline ?? ""}
              onChange={(e) => isMs ? setMs({ headline: e.target.value }) : set("headline", e.target.value)}
            />
          </Field>
          <Field label={isMs ? "Subheadline (BM)" : "Subheadline"}>
            <Textarea
              rows={2}
              value={isMs ? ms.subheadline ?? "" : form.subheadline ?? ""}
              onChange={(e) => isMs ? setMs({ subheadline: e.target.value }) : set("subheadline", e.target.value)}
            />
          </Field>
          <Field label={isMs ? "Welcome message (BM)" : "Welcome message"}>
            <Textarea
              rows={4}
              value={isMs ? ms.welcome_message ?? "" : form.welcome_message ?? ""}
              onChange={(e) => isMs ? setMs({ welcome_message: e.target.value }) : set("welcome_message", e.target.value)}
            />
          </Field>
          <Field label={isMs ? "Footer note (BM)" : "Footer note"}>
            <Textarea
              rows={2}
              value={isMs ? ms.footer_note ?? "" : form.footer_note ?? ""}
              onChange={(e) => isMs ? setMs({ footer_note: e.target.value }) : set("footer_note", e.target.value)}
              placeholder="With love, A + N"
            />
          </Field>

          <Field label="Default language shown to guests">
            <Select
              value={form.default_language}
              onValueChange={(v) => set("default_language", v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{LANG_LABEL.en}</SelectItem>
                <SelectItem value="ms">{LANG_LABEL.ms}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </Section>

        <Section title="Venue">
          <Field label="Event date">
            <Input type="date" value={form.event_date ?? ""} onChange={(e) => set("event_date", e.target.value || null)} />
          </Field>
          <Field label={isMs ? "Venue name (BM)" : "Venue name"}>
            <Input
              value={isMs ? ms.venue_name ?? "" : form.venue_name ?? ""}
              onChange={(e) => isMs ? setMs({ venue_name: e.target.value }) : set("venue_name", e.target.value)}
            />
          </Field>
          <Field label={isMs ? "Address (BM)" : "Address"}>
            <Textarea
              rows={2}
              value={isMs ? ms.venue_address ?? "" : form.venue_address ?? ""}
              onChange={(e) => isMs ? setMs({ venue_address: e.target.value }) : set("venue_address", e.target.value)}
              placeholder="Line 1&#10;Line 2"
            />
          </Field>
          <Field label={isMs ? "Contact / help text (BM)" : "Contact / help text"}>
            <Input
              value={isMs ? ms.contact_info ?? "" : form.contact_info ?? ""}
              onChange={(e) => isMs ? setMs({ contact_info: e.target.value }) : set("contact_info", e.target.value)}
              placeholder="Ask the host if you need help"
            />
          </Field>
        </Section>

        <Section title="Schedule">
          <div className="space-y-2">
            {(form.schedule ?? []).map((s, i) => (
              <div key={i} className="flex gap-2">
                <Input className="w-32" placeholder="5:00 pm" value={s.time} onChange={(e) => updateSchedule(i, { time: e.target.value })} />
                <Input
                  placeholder={isMs ? "Majlis" : "Ceremony"}
                  value={isMs ? ms.schedule?.[i]?.label ?? "" : s.label}
                  onChange={(e) => isMs ? updateScheduleMs(i, e.target.value) : updateSchedule(i, { label: e.target.value })}
                />
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
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
          <Field label="Logo">
            <ImageUpload value={form.logo_url} onChange={(url) => set("logo_url", url)} kind="logo" />
          </Field>
          {form.logo_url && (
            <Field label="Logo size">
              <div className="grid grid-cols-3 gap-2">
                {(["small", "medium", "large"] as const).map((s) => {
                  const active = (form.logo_size || "medium") === s;
                  const h = s === "small" ? "h-10" : s === "medium" ? "h-16" : "h-24";
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set("logo_size", s)}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition ${active ? "border-foreground ring-2 ring-foreground/10" : "border-border hover:border-foreground/40"}`}
                    >
                      <img src={form.logo_url!} alt="" className={`${h} object-contain`} />
                      <span className="text-xs capitalize text-muted-foreground">{s}</span>
                    </button>
                  );
                })}
              </div>
            </Field>
          )}
          <Field label="Event space layout">
            <ImageUpload value={form.layout_image_url} onChange={(url) => set("layout_image_url", url)} kind="hero" />
          </Field>
        </Section>

        <div className="sticky bottom-4 flex justify-end">
          <Button onClick={() => mut.mutate()} disabled={mut.isPending} size="lg">
            {mut.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      {/* Live preview mirrors the guest page */}
      <div className="h-fit space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Live preview</p>
          <div className="inline-flex overflow-hidden rounded-full border border-border text-[10px]">
            {(["en", "ms"] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setPreviewLang(l)}
                className={`px-2 py-1 transition ${previewLang === l ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
              >
                {LANG_LABEL[l]}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border">
          <GuestPreview form={form} lang={previewLang} />
        </div>
      </div>
    </div>
  );
}

function GuestPreview({ form, lang }: { form: EventRow; lang: Lang }) {
  const t = T[lang];
  const ms = form.content_ms ?? {};
  const headline = pickBilingual(form.headline ?? form.name, ms.headline, lang);
  const subheadline = pickBilingual(form.subheadline ?? t.default_sub, ms.subheadline, lang);
  const welcome = pickBilingual(form.welcome_message ?? "", ms.welcome_message, lang);
  const footer = pickBilingual(form.footer_note ?? "", ms.footer_note, lang);
  const venueName = pickBilingual(form.venue_name ?? "", ms.venue_name, lang);
  const venueAddress = pickBilingual(form.venue_address ?? "", ms.venue_address, lang);
  const displayFont = fontFor(form.font_style);
  const accent = form.accent_color;
  const logoClass =
    form.logo_size === "small" ? "h-12" : form.logo_size === "large" ? "h-28" : "h-20";

  const eventDateStr = form.event_date
    ? new Date(form.event_date).toLocaleDateString(lang === "ms" ? "ms-MY" : "en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div
      className="aspect-[9/16] w-full overflow-auto"
      style={{ background: form.background_color, color: form.text_color }}
    >
      <div className="flex min-h-full flex-col items-center px-5 py-8 text-center">
        {form.logo_url && <img src={form.logo_url} alt="" className={`mb-5 ${logoClass} object-contain`} />}
        <h2 className="whitespace-pre-line text-2xl leading-tight" style={{ fontFamily: displayFont }}>
          {headline}
        </h2>
        <p className="mt-2 whitespace-pre-line text-[10px] uppercase tracking-[0.2em] opacity-70">
          {subheadline}
        </p>
        {(eventDateStr || venueName || venueAddress) && (
          <div className="mt-3 space-y-0.5 text-[11px]">
            {eventDateStr && <p className="uppercase tracking-[0.15em] opacity-80">{eventDateStr}</p>}
            {venueName && <p style={{ fontFamily: displayFont }} className="text-sm">{venueName}</p>}
            {venueAddress && <p className="whitespace-pre-line opacity-80">{venueAddress}</p>}
          </div>
        )}
        {welcome && <p className="mt-4 max-w-[28ch] whitespace-pre-line text-[11px] opacity-80">{welcome}</p>}
        <div
          className="mt-5 flex h-9 w-full max-w-[220px] items-center rounded-full border-2 px-3 text-[11px]"
          style={{ borderColor: accent, background: "transparent", color: form.text_color, opacity: 0.85 }}
        >
          <span className="opacity-60">{t.placeholder}</span>
        </div>
        {footer && (
          <p className="mt-auto pt-6 text-[10px] italic opacity-70" style={{ fontFamily: displayFont }}>
            {footer}
          </p>
        )}
      </div>
    </div>
  );
}

const COLOR_PRESETS: Array<{ name: string; bg: string; text: string; accent: string }> = [
  { name: "Ivory",     bg: "#faf7f2", text: "#1a1a1a", accent: "#b08b5b" },
  { name: "Bone",      bg: "#ffffff", text: "#111111", accent: "#111111" },
  { name: "Sage",      bg: "#eef1ea", text: "#22301f", accent: "#5c7a4a" },
  { name: "Blush",     bg: "#f7ecec", text: "#2a1a1a", accent: "#b25c67" },
  { name: "Midnight",  bg: "#0f1220", text: "#f2f2f2", accent: "#c9a86b" },
  { name: "Burgundy",  bg: "#2a0f13", text: "#f4e9d8", accent: "#c58a5f" },
  { name: "Ocean",     bg: "#eaf1f6", text: "#0d2a3a", accent: "#1f6f8b" },
  { name: "Sand",      bg: "#f3ead9", text: "#3a2a10", accent: "#8a5a2b" },
  { name: "Forest",    bg: "#0f1a14", text: "#e9efe4", accent: "#a3c48c" },
  { name: "Lilac",     bg: "#f2eef7", text: "#2b1f3a", accent: "#7a5cc0" },
  { name: "Charcoal",  bg: "#1a1a1a", text: "#f5f5f5", accent: "#e2b04a" },
  { name: "Mint",      bg: "#eaf6f0", text: "#0f2a1e", accent: "#2fa06f" },
];

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
  const [slugInput, setSlugInput] = useState(event.slug);
  const [savingSlug, setSavingSlug] = useState(false);

  useEffect(() => setSlugInput(event.slug), [event.slug]);

  // Auto-save current origin as the share URL when opened from the published site
  useEffect(() => {
    if (event.public_base_url || isPreviewHost) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    if (!origin) return;
    supabase.from("events").update({ public_base_url: origin }).eq("id", event.id).then(({ error }) => {
      if (!error) onChange();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id, event.public_base_url, isPreviewHost]);

  useEffect(() => {
    if (!publicUrl.startsWith("http")) { setQr(""); return; }
    QRCode.toDataURL(publicUrl, { width: 512, margin: 2, color: { dark: "#111111", light: "#ffffff" } }).then(setQr);
  }, [publicUrl]);

  const togglePublish = async (v: boolean) => {
    const { error } = await supabase.from("events").update({ is_published: v }).eq("id", event.id);
    if (error) return toast.error(error.message);
    onChange();
  };

  const saveSlug = async () => {
    const cleaned = slugInput.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
    if (!cleaned) return toast.error("Enter a slug");
    if (cleaned === event.slug) return;
    setSavingSlug(true);
    const { error } = await supabase.from("events").update({ slug: cleaned }).eq("id", event.id);
    setSavingSlug(false);
    if (error) return toast.error(error.message.includes("duplicate") ? "That link is already taken" : error.message);
    toast.success("Share link updated");
    onChange();
  };

  const copy = () => {
    if (!publicUrl.startsWith("http")) return toast.error("Publish your app first");
    navigator.clipboard.writeText(publicUrl);
    toast.success("Link copied");
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display text-xl">Public link</h3>

        <div className="mt-4 space-y-1.5">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">Custom link name</Label>
          <div className="flex items-center gap-2">
            <span className="shrink-0 rounded-l-md border border-r-0 border-input bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
              /e/
            </span>
            <Input
              value={slugInput}
              onChange={(e) => setSlugInput(e.target.value)}
              placeholder="my-wedding"
              className="-ml-2 rounded-l-none font-mono text-xs"
            />
            <Button onClick={saveSlug} disabled={savingSlug || slugInput === event.slug} variant="outline">
              {savingSlug ? "…" : "Save"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Lowercase letters, numbers and hyphens.</p>
        </div>

        <div className="mt-6 flex items-center gap-2">
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
            <p className="mt-3 text-xs text-muted-foreground">Print and place at the entrance — guests scan without signing in.</p>
          </>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">Publish your app to generate a QR code.</p>
        )}
      </div>
    </div>
  );
}

/* ---------------- TEAM (Collaborators) ---------------- */
function TeamTab({ event }: { event: EventRow }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const collabQ = useQuery({
    queryKey: ["collaborators", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_collaborators")
        .select("*")
        .eq("event_id", event.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Array<{
        id: string; invited_email: string; status: string; invite_token: string; role: string;
      }>;
    },
  });

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return toast.error("Enter a valid email");
    setInviting(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("event_collaborators").insert({
      event_id: event.id,
      invited_email: clean,
      role: "editor",
      status: "pending",
      invited_by: userData.user!.id,
    });
    setInviting(false);
    if (error) return toast.error(error.message.includes("duplicate") ? "That email is already invited" : error.message);
    setEmail("");
    toast.success("Invite created — copy the link to share");
    qc.invalidateQueries({ queryKey: ["collaborators", event.id] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("event_collaborators").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["collaborators", event.id] });
  };

  const linkFor = (token: string) => `${origin}/invite/${token}`;

  const copyLink = (token: string, email: string) => {
    navigator.clipboard.writeText(linkFor(token));
    toast.success(`Invite link for ${email} copied`);
  };

  const mailto = (token: string, email: string) => {
    const subject = encodeURIComponent(`Co-manage "${event.name}" with me on Seatly`);
    const body = encodeURIComponent(
      `Hi,\n\nI've invited you as an editor on "${event.name}". Accept your invite here:\n\n${linkFor(token)}\n\nThanks!`,
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display text-xl">Collaborators</h3>
        <p className="mt-1 text-sm text-muted-foreground">Invite others to co-edit this event.</p>

        <div className="mt-4 divide-y">
          {collabQ.data?.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No collaborators yet.</p>
          )}
          {collabQ.data?.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.invited_email}</p>
                <p className="text-xs text-muted-foreground capitalize">{c.role} · {c.status}</p>
              </div>
              {c.status === "pending" && (
                <>
                  <Button variant="outline" size="sm" onClick={() => copyLink(c.invite_token, c.invited_email)}>
                    <Copy className="h-3.5 w-3.5" /> Copy link
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => mailto(c.invite_token, c.invited_email)}>
                    <Mail className="h-3.5 w-3.5" /> Email
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" onClick={() => remove(c.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={invite} className="h-fit space-y-3 rounded-2xl border border-border bg-card p-5">
        <h3 className="font-display text-xl">Invite by email</h3>
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="friend@example.com"
        />
        <Button type="submit" className="w-full" disabled={inviting}>
          <Plus className="h-4 w-4" /> {inviting ? "Creating…" : "Send invite"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Creates a private invite link — send it via the Email button or copy it to share any way you like. The invitee signs in with this email to accept.
        </p>
      </form>
    </div>
  );
}

// keep default suffix util for future use
void slugify;
