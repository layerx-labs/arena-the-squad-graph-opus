// Map national-team country names (as they appear in the dataset) to emoji flags
// and a stable color for graph node coloring.

const FLAGS: Record<string, string> = {
  Argentina: "🇦🇷",
  Australia: "🇦🇺",
  Austria: "🇦🇹",
  Belgium: "🇧🇪",
  Brazil: "🇧🇷",
  Canada: "🇨🇦",
  Colombia: "🇨🇴",
  Croatia: "🇭🇷",
  "Czech Republic": "🇨🇿",
  Denmark: "🇩🇰",
  Ecuador: "🇪🇨",
  Egypt: "🇪🇬",
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  France: "🇫🇷",
  Germany: "🇩🇪",
  Ghana: "🇬🇭",
  Iran: "🇮🇷",
  Italy: "🇮🇹",
  "Ivory Coast": "🇨🇮",
  Japan: "🇯🇵",
  "South Korea": "🇰🇷",
  Korea: "🇰🇷",
  Mexico: "🇲🇽",
  Morocco: "🇲🇦",
  Netherlands: "🇳🇱",
  Nigeria: "🇳🇬",
  Norway: "🇳🇴",
  Panama: "🇵🇦",
  Paraguay: "🇵🇾",
  Peru: "🇵🇪",
  Poland: "🇵🇱",
  Portugal: "🇵🇹",
  Qatar: "🇶🇦",
  "Saudi Arabia": "🇸🇦",
  Scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  Senegal: "🇸🇳",
  Serbia: "🇷🇸",
  Spain: "🇪🇸",
  Sweden: "🇸🇪",
  Switzerland: "🇨🇭",
  Tunisia: "🇹🇳",
  Turkey: "🇹🇷",
  "United States": "🇺🇸",
  USA: "🇺🇸",
  Uruguay: "🇺🇾",
  Wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
};

export function flag(country: string): string {
  return FLAGS[country] ?? "🏳️";
}

const PALETTE = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#64748b", "#0891b2", "#7c3aed",
];

const colorCache = new Map<string, string>();

export function countryColor(country: string): string {
  if (colorCache.has(country)) return colorCache.get(country)!;
  let h = 0;
  for (let i = 0; i < country.length; i++) {
    h = (h * 31 + country.charCodeAt(i)) >>> 0;
  }
  const c = PALETTE[h % PALETTE.length];
  colorCache.set(country, c);
  return c;
}
