/** Zero-padded "YYYY-MM" id used as the MonthlyPlan key. */
export function monthId(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

/** ISO "YYYY-MM-DD" for a given year/month/day, using local time (not UTC)
 * so the date always matches what the user sees on the calendar. */
export function toISODate(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, '0')
  const m = String(month).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayISO(): string {
  const now = new Date()
  return toISODate(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

export function daysInMonth(year: number, month: number): number {
  // Day 0 of the *next* month is the last day of this one.
  return new Date(year, month, 0).getDate()
}

/** 0 (Sunday) – 6 (Saturday) for the 1st of the given month, used to pad
 * the calendar grid so the 1st lands under the correct weekday column. */
export function firstWeekdayOfMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay()
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })
}

export function dayLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
