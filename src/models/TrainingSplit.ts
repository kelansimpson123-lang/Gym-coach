export interface SplitExerciseTarget {
  muscleGroup: string
  targetExerciseCount: number
}

export interface TrainingSplit {
  id: string
  /** e.g. "Chest & Back" */
  name: string
  /** Position in rotation preference — editable, not fixed. */
  order: number
  isActive: boolean
  muscleGroups: string[]
  exerciseTargets: SplitExerciseTarget[]
  createdAt: string
  updatedAt: string
}
