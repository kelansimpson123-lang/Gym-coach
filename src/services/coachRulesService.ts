import { getDB } from '../database/db'
import { STORES } from '../database/schema'
import { nowISO } from '../utils/id'
import type { CoachRules } from '../models'

const DEFAULT_COACH_RULES: CoachRules = {
  id: 'coach-rules',
  alwaysIncludeRearDelts: true,
  alwaysIncludeCompoundMovement: true,
  avoidRepeatingExercisesConsecutively: true,
  preferFreeWeights: false,
  preferMachines: false,
  minimumCompoundMovements: 1,
  targetRepThreshold: 8,
  updatedAt: nowISO(),
}

/** Returns the stored Coach rules, creating sensible defaults on first run. */
export async function getCoachRules(): Promise<CoachRules> {
  const db = await getDB()
  const existing = await db.get(STORES.coachRules, 'coach-rules')
  if (existing) return existing

  await db.put(STORES.coachRules, DEFAULT_COACH_RULES)
  return DEFAULT_COACH_RULES
}

/** Merges the given changes into the stored Coach rules and saves the result. */
export async function updateCoachRules(
  changes: Partial<Omit<CoachRules, 'id'>>,
): Promise<CoachRules> {
  const db = await getDB()
  const current = await getCoachRules()
  const updated: CoachRules = { ...current, ...changes, id: 'coach-rules', updatedAt: nowISO() }
  await db.put(STORES.coachRules, updated)
  return updated
}
