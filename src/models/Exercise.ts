export type ExerciseTier = 1 | 2 | 3

export type ExercisePriority = 'mandatory' | 'preferred' | 'rotation' | 'avoid'

export type EquipmentType =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'smith-machine'
  | 'cable'
  | 'bodyweight'
  | 'other'

export interface Exercise {
  id: string
  name: string
  mainMuscleGroup: string
  secondaryMuscleGroup?: string
  /** Links to MovementCategory.id — e.g. "Incline Press". */
  movementCategoryId: string
  tier: ExerciseTier
  equipment: EquipmentType
  currentWorkingWeight: number | 'bodyweight'
  priority: ExercisePriority
  notes?: string
  createdAt: string
  updatedAt: string
}
