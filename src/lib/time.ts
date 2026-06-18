/**
 * Minutes from midnight of the set's own `date` (its day-table bucket), read
 * straight off the "+02:00" string — never `new Date()` localization, so the
 * layout is timezone-stable. An overnight `endTime` whose calendar date is the
 * day after `date` gets +1440, extending the same day's axis instead of wrapping
 * to 00:00. Seconds are dropped (the data ends sets at :01) and intervals are
 * half-open [start, end).
 */
export function toMinutes(ts: string, dateField: string): number {
  const dayGap = Math.round(
    (Date.parse(ts.slice(0, 10)) - Date.parse(dateField)) / 86_400_000,
  );
  const hh = Number(ts.slice(11, 13));
  const mm = Number(ts.slice(14, 16));
  return dayGap * 1440 + hh * 60 + mm;
}

/** Format a day offset back to wall-clock HH:MM (handles the >1440 overnight range). */
export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
