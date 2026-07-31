import { getDB } from '../database/db'
import { STORES } from '../database/schema'
import { generateId } from '../utils/id'
import type { ExercisePerformance } from '../models'

export async function addPerformanceEntry(
  entry: Omit<ExercisePerformance, 'id'>,
): Promise<ExercisePerformance> {
  const db = await getDB()
  const record: ExercisePerformance = { ...entry, id: generateId() }
  await db.add(STORES.exercisePerformance, record)
  return record
}

/** Most recent first. */
export async function getPerformanceForExercise(
  exerciseId: string,
): Promise<ExercisePerformance[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex(STORES.exercisePerformance, 'by-exercise', exerciseId)
  return all.sort((a, b) => b.date.localeCompare(a.date))
}

/** Last-performed date per exercise, for display in the library list. */
export async function getLastPerformedDates(): Promise<Map<string, string>> {
  const db = await getDB()
  const all = await db.getAll(STORES.exercisePerformance)
  const map = new Map<string, string>()
  for (const entry of all) {
    const current = map.get(entry.exerciseId)
    if (!current || entry.date > current) {
      map.set(entry.exerciseId, entry.date)
    }
  }
  return map
}
