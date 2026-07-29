export type PlannedDayStatus = 'planned' | 'completed' | 'missed' | 'rest'

export interface PlannedDay {
  /** ISO date, e.g. "2026-08-12". */
  date: string
  isAvailableForTraining: boolean
  /** Links to TrainingSplit.id, or null on a rest day. */
  assignedSplitId: string | null
  status: PlannedDayStatus
  notes?: string
}

export interface MonthlyPlan {
  /** e.g. "2026-08". */
  id: string
  year: number
  month: number
  days: PlannedDay[]
  createdAt: string
  updatedAt: string
}
