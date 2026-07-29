/** Generates a unique id for a new record. Uses the browser's built-in
 * crypto API — no dependency needed. */
export function generateId(): string {
  return crypto.randomUUID()
}

export function nowISO(): string {
  return new Date().toISOString()
}
