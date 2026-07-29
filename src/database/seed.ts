import { getDB } from './db'
import { STORES } from './schema'
import { generateId, nowISO } from '../utils/id'
import type { MovementCategory, TrainingSplit } from '../models'

/**
 * Default movement categories per muscle group, matching the biomechanics
 * groupings from the spec. These exist so exercises (added in Phase 3) have
 * somewhere to attach to, and so the Coach (Phase 8) has defined slots to
 * fill per split.
 */
const DEFAULT_CATEGORIES: Omit<MovementCategory, 'id'>[] = [
  { name: 'Horizontal Press', muscleGroup: 'Chest', priorityOrder: 1 },
  { name: 'Incline Press', muscleGroup: 'Chest', priorityOrder: 2 },
  { name: 'Chest Isolation', muscleGroup: 'Chest', priorityOrder: 3 },
  { name: 'Vertical Pull', muscleGroup: 'Back', priorityOrder: 1 },
  { name: 'Horizontal Row', muscleGroup: 'Back', priorityOrder: 2 },
  { name: 'Rear Delt / Upper Back', muscleGroup: 'Back', priorityOrder: 3 },
  { name: 'Lat Isolation', muscleGroup: 'Back', priorityOrder: 4 },
  { name: 'Overhead Press', muscleGroup: 'Shoulders', priorityOrder: 1 },
  { name: 'Lateral Raise', muscleGroup: 'Shoulders', priorityOrder: 2 },
  { name: 'Rear Delt', muscleGroup: 'Shoulders', priorityOrder: 3 },
  { name: 'Biceps Isolation', muscleGroup: 'Biceps', priorityOrder: 1 },
  { name: 'Triceps Isolation', muscleGroup: 'Triceps', priorityOrder: 1 },
  { name: 'Squat Pattern', muscleGroup: 'Legs', priorityOrder: 1 },
  { name: 'Hip Hinge', muscleGroup: 'Legs', priorityOrder: 2 },
  { name: 'Leg Curl', muscleGroup: 'Legs', priorityOrder: 3 },
  { name: 'Calf Movement', muscleGroup: 'Legs', priorityOrder: 4 },
]

/** The user's current split from the spec — editable and not hard-coded
 * into any logic, just the starting data. */
const DEFAULT_SPLITS: Omit<TrainingSplit, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Chest & Back',
    order: 0,
    isActive: true,
    muscleGroups: ['Chest', 'Back'],
    exerciseTargets: [
      { muscleGroup: 'Chest', targetExerciseCount: 3 },
      { muscleGroup: 'Back', targetExerciseCount: 3 },
    ],
  },
  {
    name: 'Shoulders & Arms',
    order: 1,
    isActive: true,
    muscleGroups: ['Shoulders', 'Biceps', 'Triceps'],
    exerciseTargets: [
      { muscleGroup: 'Shoulders', targetExerciseCount: 3 },
      { muscleGroup: 'Biceps', targetExerciseCount: 2 },
      { muscleGroup: 'Triceps', targetExerciseCount: 2 },
    ],
  },
  {
    name: 'Legs',
    order: 2,
    isActive: true,
    muscleGroups: ['Legs'],
    exerciseTargets: [{ muscleGroup: 'Legs', targetExerciseCount: 4 }],
  },
]

/**
 * Populates default movement categories and the default split, but only
 * the very first time the app runs — if either store already has data,
 * this does nothing, so it's always safe to call on every app launch.
 */
export async function seedDatabaseIfNeeded(): Promise<void> {
  const db = await getDB()

  const categoryCount = await db.count(STORES.movementCategories)
  if (categoryCount === 0) {
    const tx = db.transaction(STORES.movementCategories, 'readwrite')
    await Promise.all(
      DEFAULT_CATEGORIES.map((category) =>
        tx.store.add({ ...category, id: generateId() }),
      ),
    )
    await tx.done
  }

  const splitCount = await db.count(STORES.trainingSplits)
  if (splitCount === 0) {
    const timestamp = nowISO()
    const tx = db.transaction(STORES.trainingSplits, 'readwrite')
    await Promise.all(
      DEFAULT_SPLITS.map((split) =>
        tx.store.add({ ...split, id: generateId(), createdAt: timestamp, updatedAt: timestamp }),
      ),
    )
    await tx.done
  }
}
