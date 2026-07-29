import { getDB } from '../database/db'
import { STORES } from '../database/schema'
import { nowISO } from '../utils/id'
import type { UserSettings } from '../models'

const DEFAULT_SETTINGS: UserSettings = {
  id: 'user-settings',
  goal: 'hypertrophy',
  units: 'kg',
  theme: 'dark',
  progressionRuleDescription: 'Increase weight after achieving target reps',
  updatedAt: nowISO(),
}

/** Returns the stored settings, creating the default record on first run. */
export async function getUserSettings(): Promise<UserSettings> {
  const db = await getDB()
  const existing = await db.get(STORES.userSettings, 'user-settings')
  if (existing) return existing

  await db.put(STORES.userSettings, DEFAULT_SETTINGS)
  return DEFAULT_SETTINGS
}

/** Merges the given changes into the stored settings and saves the result. */
export async function updateUserSettings(
  changes: Partial<Omit<UserSettings, 'id'>>,
): Promise<UserSettings> {
  const db = await getDB()
  const current = await getUserSettings()
  const updated: UserSettings = { ...current, ...changes, id: 'user-settings', updatedAt: nowISO() }
  await db.put(STORES.userSettings, updated)
  return updated
}
