import { getDB } from './db'
import { STORES, DB_NAME } from './schema'

export async function exportAllData(): Promise<void> {
  const db = await getDB()
  const data: Record<string, unknown> = { exportedAt: new Date().toISOString(), dbName: DB_NAME }

  for (const storeName of Object.values(STORES)) {
    data[storeName] = await db.getAll(storeName)
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const dateStamp = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = `gym-coach-backup-${dateStamp}.json`
  link.click()
  URL.revokeObjectURL(url)
}
