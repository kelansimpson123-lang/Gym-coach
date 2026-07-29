import { getDB } from '../database/db'
import { STORES } from '../database/schema'
import { generateId, nowISO } from '../utils/id'
import type { TrainingSplit } from '../models'

export type NewTrainingSplit = Omit<TrainingSplit, 'id' | 'createdAt' | 'updatedAt'>

export async function getAllTrainingSplits(): Promise<TrainingSplit[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex(STORES.trainingSplits, 'by-order')
  return all
}

export async function getActiveTrainingSplits(): Promise<TrainingSplit[]> {
  const all = await getAllTrainingSplits()
  return all.filter((split) => split.isActive)
}

export async function addTrainingSplit(split: NewTrainingSplit): Promise<TrainingSplit> {
  const db = await getDB()
  const timestamp = nowISO()
  const record: TrainingSplit = {
    ...split,
    id: generateId(),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  await db.add(STORES.trainingSplits, record)
  return record
}

export async function updateTrainingSplit(
  id: string,
  changes: Partial<NewTrainingSplit>,
): Promise<TrainingSplit> {
  const db = await getDB()
  const existing = await db.get(STORES.trainingSplits, id)
  if (!existing) {
    throw new Error(`Cannot update training split "${id}" — it does not exist.`)
  }
  const updated: TrainingSplit = { ...existing, ...changes, id, updatedAt: nowISO() }
  await db.put(STORES.trainingSplits, updated)
  return updated
}

export async function deleteTrainingSplit(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORES.trainingSplits, id)
}

export async function reorderTrainingSplits(orderedIds: string[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORES.trainingSplits, 'readwrite')
  await Promise.all(
    orderedIds.map(async (id, index) => {
      const existing = await tx.store.get(id)
      if (existing) {
        await tx.store.put({ ...existing, order: index, updatedAt: nowISO() })
      }
    }),
  )
  await tx.done
}
