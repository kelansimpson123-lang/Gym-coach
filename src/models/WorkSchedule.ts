export type ShiftType = 'day' | 'night' | 'off' | 'holiday'

export interface WorkScheduleEntry {
  /** ISO date — also the store's key. */
  date: string
  shiftType: ShiftType
  availableForTraining: boolean
  notes?: string
}
