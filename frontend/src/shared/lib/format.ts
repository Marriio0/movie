/** Year from an ISO date ('2024-02-27' → 2024). Null for missing or malformed dates. */
export function yearOf(date: string | null | undefined): number | null {
  const match = date ? /^(\d{4})-\d{2}-\d{2}$/.exec(date) : null;
  return match ? Number(match[1]) : null;
}

/** 165 → '2h 45m', 45 → '45m', 120 → '2h'. Null for missing or non-positive values. */
export function formatRuntime(minutes: number | null | undefined): string | null {
  if (!minutes || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

/** 8.137 → '8.1' (one decimal, as TMDB displays it). */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

const languageNames =
  typeof Intl !== 'undefined' && 'DisplayNames' in Intl
    ? new Intl.DisplayNames(['en'], { type: 'language' })
    : null;

/** ISO 639-1 code → English name ('fr' → 'French'). Falls back to the upper-cased code. */
export function languageName(code: string): string {
  try {
    return languageNames?.of(code) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

const regionNames =
  typeof Intl !== 'undefined' && 'DisplayNames' in Intl
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

/** ISO 3166-1 alpha-2 code → English name ('MA' → 'Morocco'). Falls back to the code. */
export function regionName(code: string): string {
  try {
    return regionNames?.of(code) ?? code;
  } catch {
    return code;
  }
}
