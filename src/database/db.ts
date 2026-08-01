import { openDB, type IDBPDatabase } from 'idb'
import { DB_NAME, DB_VERSION, STORES, type GymCoachDBSchema } from './schema'

let dbPromise: Promise<IDBPDatabase<GymCoachDBSchema>> | null = null

/**
 * Opens (or creates) the local database. Safe to call multiple times —
 * subsequent calls reuse the same connection promise.
 *
 * Schema changes in future phases belong here, in the `upgrade` callback,
 * bumping DB_VERSION in schema.ts. Nothing else in the app should ever
 * touch object-store creation directly.
 */
export function getDB(): Promise<IDBPDatabase<GymCoachDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<GymCoachDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORES.userSettings)) {
          db.createObjectStore(STORES.userSettings, { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains(STORES.trainingSplits)) {
          const store = db.createObjectStore(STORES.trainingSplits, { keyPath: 'id' })
          store.createIndex('by-order', 'order')
        }

        if (!db.objectStoreNames.contains(STORES.exercises)) {
          const store = db.createObjectStore(STORES.exercises, { keyPath: 'id' })
          store.createIndex('by-muscle-group', 'mainMuscleGroup')
          store.createIndex('by-movement-category', 'movementCategoryId')
        }

        if (!db.objectStoreNames.contains(STORES.movementCategories)) {
          const store = db.createObjectStore(STORES.movementCategories, { keyPath: 'id' })
          store.createIndex('by-muscle-group', 'muscleGroup')
        }

        if (!db.objectStoreNames.contains(STORES.monthlyPlans)) {
          db.createObjectStore(STORES.monthlyPlans, { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains(STORES.workoutSessions)) {
          const store = db.createObjectStore(STORES.workoutSessions, { keyPath: 'id' })
          store.createIndex('by-date', 'date')
          store.createIndex('by-split', 'splitId')
        }

        if (!db.objectStoreNames.contains(STORES.exercisePerformance)) {
          const store = db.createObjectStore(STORES.exercisePerformance, { keyPath: 'id' })
          store.createIndex('by-exercise', 'exerciseId')
          store.createIndex('by-date', 'date')
        }

        if (!db.objectStoreNames.contains(STORES.cardioEntries)) {
          const store = db.createObjectStore(STORES.cardioEntries, { keyPath: 'id' })
          store.createIndex('by-date', 'date')
        }

        if (!db.objectStoreNames.contains(STORES.workSchedule)) {
          db.createObjectStore(STORES.workSchedule, { keyPath: 'date' })
        }

        if (!db.objectStoreNames.contains(STORES.coachRules)) {
          db.createObjectStore(STORES.coachRules, { keyPath: 'id' })
        }
      },
    })
  }

  return dbPromise
}

/**
 * Opens the database ahead of time at app startup so the first real read
 * or write (added in Phase 2) doesn't pay the connection cost.
 */
export async function initDatabase(): Promise<void> {
  await getDB()
}

/** Closes the current connection so the database can be safely deleted
 * (used by the reset flow) — without this, deleteDatabase can hang
 * waiting for an open connection to release it. */
export async function closeDB(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise
    db.close()
    dbPromise = null
  }
}
