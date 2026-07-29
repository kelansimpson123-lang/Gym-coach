export interface MovementCategory {
  id: string
  /** e.g. "Incline Press", "Horizontal Row", "Hip Hinge". */
  name: string
  muscleGroup: string
  /** Optional ordering hint for how the Coach fills slots (Phase 8). */
  priorityOrder: number
}
