import { getDB } from '../database/db'
import { STORES } from '../database/schema'
import { generateId } from '../utils/id'
import type { MovementCategory } from '../models'

export type NewMovementCategory = Omit<MovementCategory, 'id'>

export async function getAllMovementCategories(): Promise<MovementCategory[]> {
  const db = await getDB()
  return db.getAll(STORES.movementCategories)
}

export async function getMovementCategoriesByMuscleGroup(
  muscleGroup: string,
): Promise<MovementCategory[]> {
  const db = await getDB()
  return db.getAllFromIndex(STORES.movementCategories, 'by-muscle-group', muscleGroup)
}

export async function addMovementCategory(
  category: NewMovementCategory,
): Promise<MovementCategory> {
  const db = await getDB()
  const record: MovementCategory = { ...category, id: generateId() }
  await db.add(STORES.movementCategories, record)
  return record
}

export async function updateMovementCategory(
  id: string,
  changes: Partial<NewMovementCategory>,
): Promise<MovementCategory> {
  const db = await getDB()
  const existing = await db.get(STORES.movementCategories, id)
  if (!existing) {
    throw new Error(`Cannot update movement category "${id}" — it does not exist.`)
  }
  const updated: MovementCategory = { ...existing, ...changes, id }
  await db.put(STORES.movementCategories, updated)
  return updated
}

export async function deleteMovementCategory(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORES.movementCategories, id)
}
