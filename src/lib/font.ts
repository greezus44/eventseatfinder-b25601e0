export const FONT_PRESETS: Array<{ value: string; label: string; sample: string }> = [
  { value: "sans", label: "Inter (Modern sans)", sample: "AaBbCc — Clean and contemporary" },
  { value: "serif", label: "Instrument Serif", sample: "AaBbCc — Timeless and refined" },
  { value: "playfair", label: "Playfair Display", sample: "AaBbCc — Editorial elegance" },
  { value: "cormorant", label: "Cormorant Garamond", sample: "AaBbCc — Delicate and formal" },
  { value: "nunito", label: "Nunito Sans (Avenir-style)", sample: "AaBbCc — Warm & approachable" },
  { value: "mulish", label: "Mulish (Proxima-style)", sample: "AaBbCc — Geometric & clean" },
  { value: "montserrat", label: "Montserrat", sample: "AaBbCc — Modern & bold" },
  { value: "lora", label: "Lora", sample: "AaBbCc — Friendly serif" },
  { value: "bebas", label: "Bebas Neue", sample: "AaBbCc — Bold display" },
  { value: "greatvibes", label: "Great Vibes (Script)", sample: "AaBbCc — Flowing script" },
  { value: "imperial", label: "Imperial Script", sample: "AaBbCc — Grand & elegant" },
  { value: "mssans", label: "Microsoft Sans Serif", sample: "AaBbCc — Familiar system" },
];

export function fontFor(style: string) {
  switch (style) {
    case "serif": return "'Instrument Serif', Georgia, serif";
    case "playfair": return "'Playfair Display', Georgia, serif";
    case "cormorant": return "'Cormorant Garamond', Georgia, serif";
    case "nunito": return "'Nunito Sans', 'Avenir Next', 'Avenir', ui-sans-serif, system-ui, sans-serif";
    case "mulish": return "'Mulish', 'Proxima Nova', ui-sans-serif, system-ui, sans-serif";
    case "montserrat": return "'Montserrat', ui-sans-serif, system-ui, sans-serif";
    case "lora": return "'Lora', Georgia, serif";
    case "bebas": return "'Bebas Neue', Impact, sans-serif";
    case "greatvibes": return "'Great Vibes', 'Segoe Script', cursive";
    case "imperial": return "'Imperial Script', 'Great Vibes', cursive";
    case "mssans": return "'Microsoft Sans Serif', 'Segoe UI', Tahoma, sans-serif";
    // legacy "display" alias
    case "display": return "'Instrument Serif', Georgia, serif";
    default: return "'Inter', ui-sans-serif, system-ui, sans-serif";
  }
}
