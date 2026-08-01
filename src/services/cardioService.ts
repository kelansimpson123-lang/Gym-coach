import { getDB } from '../database/db'
import { STORES } from '../database/schema'
import { generateId } from '../utils/id'
import { daysInMonth, toISODate } from '../utils/date'
import type { CardioEntry } from '../models'

/** Sensible default durations per activity, matching the spec's examples. */
const DEFAULT_DURATIONS: Record<string, number> = {
  Run: 30,
  Bike: 30,
  'Stair Machine': 30,
  Walk: 60,
}

export async function getCardioForDate(date: string): Promise<CardioEntry[]> {
  const db = await getDB()
  return db.getAllFromIndex(STORES.cardioEntries, 'by-date', date)
}

export async function getCardioForMonth(year: number, month: number): Promise<CardioEntry[]> {
  const db = await getDB()
  const total = daysInMonth(year, month)
  const results: CardioEntry[] = []
  for (let day = 1; day <= total; day++) {
    const date = toISODate(year, month, day)
    const entries = await db.getAllFromIndex(STORES.cardioEntries, 'by-date', date)
    results.push(...entries)
  }
  return results
}

/** Toggles a cardio activity for the given date — adds a completed entry
 * if none exists yet for that activity, removes it if it does. Kept this
 * simple (no separate "planned vs completed" state) to match the spec's
 * lightweight checklist approach. */
export async function toggleCardioActivity(
  date: string,
  activityType: string,
): Promise<CardioEntry[]> {
  const db = await getDB()
  const existing = await db.getAllFromIndex(STORES.cardioEntries, 'by-date', date)
  const match = existing.find((e) => e.activityType === activityType)

  if (match) {
    await db.delete(STORES.cardioEntries, match.id)
  } else {
    const entry: CardioEntry = {
      id: generateId(),
      date,
      activityType,
      durationMinutes: DEFAULT_DURATIONS[activityType] ?? 30,
      completed: true,
    }
    await db.add(STORES.cardioEntries, entry)
  }

  return getCardioForDate(date)
}
