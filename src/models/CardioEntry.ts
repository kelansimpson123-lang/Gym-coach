export interface CardioEntry {
  id: string
  /** ISO date. */
  date: string
  activityType: string
  durationMinutes: number
  completed: boolean
  notes?: string
}
