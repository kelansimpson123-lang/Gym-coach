import { getDB } from '../database/db'
import { STORES } from '../database/schema'
import { generateId, nowISO } from '../utils/id'
import type { Exercise } from '../models'

export type NewExercise = Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>

export async function getAllExercises(): Promise<Exercise[]> {
  const db = await getDB()
  return db.getAll(STORES.exercises)
}

export async function getExerciseById(id: string): Promise<Exercise | undefined> {
  const db = await getDB()
  return db.get(STORES.exercises, id)
}

export async function getExercisesByMuscleGroup(muscleGroup: string): Promise<Exercise[]> {
  const db = await getDB()
  return db.getAllFromIndex(STORES.exercises, 'by-muscle-group', muscleGroup)
}

export async function getExercisesByMovementCategory(
  movementCategoryId: string,
): Promise<Exercise[]> {
  const db = await getDB()
  return db.getAllFromIndex(STORES.exercises, 'by-movement-category', movementCategoryId)
}

export async function addExercise(exercise: NewExercise): Promise<Exercise> {
  const db = await getDB()
  const timestamp = nowISO()
  const record: Exercise = {
    ...exercise,
    id: generateId(),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  await db.add(STORES.exercises, record)
  return record
}

/** Applies a partial update (e.g. changing tier, equipment, or working weight). */
export async function updateExercise(
  id: string,
  changes: Partial<NewExercise>,
): Promise<Exercise> {
  const db = await getDB()
  const existing = await db.get(STORES.exercises, id)
  if (!existing) {
    throw new Error(`Cannot update exercise "${id}" — it does not exist.`)
  }

  const updated: Exercise = { ...existing, ...changes, id, updatedAt: nowISO() }
  await db.put(STORES.exercises, updated)
  return updated
}

/** Convenience helper for the common case of logging a new working weight. */
export async function updateExerciseWorkingWeight(
  id: string,
  currentWorkingWeight: Exercise['currentWorkingWeight'],
): Promise<Exercise> {
  return updateExercise(id, { currentWorkingWeight })
}

export async function deleteExercise(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORES.exercises, id)
}
