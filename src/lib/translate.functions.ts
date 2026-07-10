import { createServerFn } from "@tanstack/react-start";

type Payload = { fields: Record<string, string>; target: "ms" | "en" };

export const translateFields = createServerFn({ method: "POST" })
  .inputValidator((data: Payload) => {
    if (!data || typeof data !== "object") throw new Error("Invalid input");
    if (!data.fields || typeof data.fields !== "object") throw new Error("Missing fields");
    if (data.target !== "ms" && data.target !== "en") throw new Error("Invalid target");
    return data;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Translation service is not configured");

    const entries = Object.entries(data.fields).filter(([, v]) => v && v.trim());
    if (entries.length === 0) return {} as Record<string, string>;

    const targetName = data.target === "ms" ? "Bahasa Melayu (Malay)" : "English";
    const sourceName = data.target === "ms" ? "English" : "Bahasa Melayu (Malay)";

    const prompt =
      `Translate the following JSON values from ${sourceName} to ${targetName}. ` +
      `Preserve line breaks and punctuation. Keep proper names, dates, and numbers unchanged. ` +
      `Reply with ONLY a JSON object mapping the same keys to their translated values, no prose.\n\n` +
      JSON.stringify(Object.fromEntries(entries));

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a precise translator that responds with strict JSON only." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Translation failed (${res.status})`);
    const body = await res.json();
    const text: string = body?.choices?.[0]?.message?.content ?? "{}";
    // Strip fences if any
    const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```/, "").replace(/```$/, "").trim();
    let parsed: Record<string, string> = {};
    try { parsed = JSON.parse(cleaned); } catch {
      // last resort: find first { ... }
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    }
    return parsed;
  });
