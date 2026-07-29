export interface SessionExercise {
  exerciseId: string
  workingWeight: number | 'bodyweight'
  completed: boolean
}

export interface WorkoutSession {
  id: string
  /** ISO date, e.g. "2026-08-12". */
  date: string
  splitId: string
  exercises: SessionExercise[]
  isCompleted: boolean
  notes?: string
  createdAt: string
}
