export type Lang = "en" | "ms";

export const LANG_LABEL: Record<Lang, string> = {
  en: "English",
  ms: "Bahasa Melayu",
};

export const T: Record<Lang, Record<string, string>> = {
  en: {
    // Guest page
    default_sub: "Please find your seat",
    search_again: "Search again",
    welcome: "Welcome",
    seated_at: "You're seated at",
    no_table: "Your table hasn't been assigned yet — please ask a host.",
    meal: "Meal",
    placeholder: "Type your name…",
    no_match: "No match. Try a different spelling or ask the host.",
    venue: "Venue",
    schedule: "Schedule",
    tab_seat: "Find seat",
    tab_layout: "Venue layout",
    // Homepage
    home_eyebrow: "Live seating charts for weddings & events",
    home_title: "Find your seat.",
    home_lede:
      "A quiet, elegant page your guests open with a QR code — type a name, see the table. Edit everything — copy, colours, tables, even a personal note per guest — after the invitations are printed.",
    home_cta_primary: "Create your event",
    home_cta_secondary: "How it works",
    home_how_1_title: "Add your guests",
    home_how_1_body: "Paste in your list, group into tables. Import as CSV or type by hand.",
    home_how_2_title: "Design it live",
    home_how_2_body: "Colours, welcome message, even a personal note for each guest. Change anything, any time.",
    home_how_3_title: "Share a QR",
    home_how_3_body: "Print one small sign at the door. Guests scan and instantly find where to sit.",
    sign_in: "Sign in",
    get_started: "Get started",
    footer: "Seatly — quiet software for loud rooms.",
  },
  ms: {
    default_sub: "Sila cari tempat duduk anda",
    search_again: "Cari semula",
    welcome: "Selamat datang",
    seated_at: "Anda duduk di",
    no_table: "Meja anda belum ditetapkan — sila bertanya kepada tuan rumah.",
    meal: "Hidangan",
    placeholder: "Taip nama anda…",
    no_match: "Tiada padanan. Cuba ejaan lain atau tanya tuan rumah.",
    venue: "Tempat",
    schedule: "Aturcara",
    tab_seat: "Cari tempat",
    tab_layout: "Pelan tempat",
    home_eyebrow: "Pelan tempat duduk langsung untuk majlis kahwin & acara",
    home_title: "Cari tempat duduk anda.",
    home_lede:
      "Halaman anggun yang tetamu buka dengan kod QR — taip nama, lihat meja. Ubah apa sahaja — teks, warna, meja, mesej peribadi setiap tetamu — walaupun kad jemputan sudah dicetak.",
    home_cta_primary: "Cipta acara anda",
    home_cta_secondary: "Cara ia berfungsi",
    home_how_1_title: "Tambah tetamu",
    home_how_1_body: "Tampal senarai, kumpulkan dalam meja. Import CSV atau taip sendiri.",
    home_how_2_title: "Reka bentuk langsung",
    home_how_2_body: "Warna, mesej aluan, mesej peribadi untuk setiap tetamu. Ubah bila-bila masa.",
    home_how_3_title: "Kongsi QR",
    home_how_3_body: "Cetak satu papan tanda kecil di pintu. Tetamu imbas dan segera jumpa tempat.",
    sign_in: "Log masuk",
    get_started: "Mula",
    footer: "Seatly — perisian tenang untuk ruang meriah.",
  },
};

// Bilingual content fields stored on events.content_ms as { headline, subheadline, welcome_message, footer_note, venue_name, venue_address, contact_info, default_sub, schedule: [{time,label}] }
export type BilingualContent = {
  headline?: string;
  subheadline?: string;
  welcome_message?: string;
  footer_note?: string;
  venue_name?: string;
  venue_address?: string;
  contact_info?: string;
  default_sub?: string;
  schedule?: Array<{ time: string; end_time?: string; label: string; description?: string }>;
};

export function pickBilingual<T>(en: T, ms: T | undefined | null, lang: Lang): T {
  if (lang === "ms" && ms !== undefined && ms !== null && ms !== "") return ms;
  return en;
}
