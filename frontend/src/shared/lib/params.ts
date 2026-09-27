/**
 * Parses a route param that must be a positive integer, such as a TMDB id.
 * Returns null for anything else ("abc", "0", "-1", "1.5", "007", values past MAX_SAFE_INTEGER).
 */
export function parsePositiveInt(value: string | undefined): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}
