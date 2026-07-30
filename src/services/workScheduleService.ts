import { getDB } from '../database/db'
import { STORES } from '../database/schema'
import { daysInMonth, toISODate } from '../utils/date'
import type { WorkScheduleEntry } from '../models'

export async function getScheduleEntry(date: string): Promise<WorkScheduleEntry | undefined> {
  const db = await getDB()
  return db.get(STORES.workSchedule, date)
}

export async function getScheduleForMonth(
  year: number,
  month: number,
): Promise<WorkScheduleEntry[]> {
  const db = await getDB()
  const total = daysInMonth(year, month)
  const dates = Array.from({ length: total }, (_, i) => toISODate(year, month, i + 1))
  const entries = await Promise.all(dates.map((date) => db.get(STORES.workSchedule, date)))
  return entries.filter((e): e is WorkScheduleEntry => Boolean(e))
}

export async function upsertScheduleEntry(entry: WorkScheduleEntry): Promise<WorkScheduleEntry> {
  const db = await getDB()
  await db.put(STORES.workSchedule, entry)
  return entry
}

/** Creates a default "available" entry for every day in the month that
 * doesn't already have one — used the first time a month is set up so the
 * user only has to mark the *exceptions* (work/rest days), not every day. */
export async function ensureScheduleForMonth(
  year: number,
  month: number,
): Promise<WorkScheduleEntry[]> {
  const db = await getDB()
  const total = daysInMonth(year, month)
  const tx = db.transaction(STORES.workSchedule, 'readwrite')

  const results: WorkScheduleEntry[] = []
  for (let day = 1; day <= total; day++) {
    const date = toISODate(year, month, day)
    const existing = await tx.store.get(date)
    if (existing) {
      results.push(existing)
    } else {
      const created: WorkScheduleEntry = { date, shiftType: 'off', availableForTraining: true }
      await tx.store.put(created)
      results.push(created)
    }
  }
  await tx.done
  return results.sort((a, b) => a.date.localeCompare(b.date))
}
