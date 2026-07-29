export interface ExercisePerformance {
  id: string
  exerciseId: string
  /** ISO date. */
  date: string
  workingWeight: number | 'bodyweight'
  completed: boolean
  /** True if this entry represents a progression increase over the last one. */
  isProgression: boolean
}
