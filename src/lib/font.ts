export const FONT_PRESETS: Array<{ value: string; label: string; sample: string; note?: string }> = [
  { value: "sans", label: "Modern sans", sample: "Clean & contemporary" },
  { value: "serif", label: "Elegant serif", sample: "Timeless & refined" },
  { value: "display", label: "Display serif", sample: "Dramatic & editorial" },
  { value: "nunito", label: "Nunito Sans", sample: "Warm & approachable (Avenir-style)" },
  { value: "mulish", label: "Mulish", sample: "Geometric & clean (Proxima-style)" },
];

export function fontFor(style: string) {
  if (style === "serif" || style === "display") return "'Instrument Serif', Georgia, serif";
  if (style === "nunito") return "'Nunito Sans', 'Avenir Next', 'Avenir', ui-sans-serif, system-ui, sans-serif";
  if (style === "mulish") return "'Mulish', 'Proxima Nova', ui-sans-serif, system-ui, sans-serif";
  return "'Inter', ui-sans-serif, system-ui, sans-serif";
}
