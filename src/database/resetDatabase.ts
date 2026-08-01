import { DB_NAME } from './schema'
import { closeDB } from './db'

/** Deletes the local database entirely and reloads the page so a fresh
 * one gets created (with seed data) on next load. Irreversible — the
 * calling UI is responsible for confirming with the user first. */
export async function resetDatabase(): Promise<void> {
  await closeDB()
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => resolve() // still proceed with reload
  })
  window.location.reload()
}
