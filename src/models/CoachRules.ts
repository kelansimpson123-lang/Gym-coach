export interface CoachRules {
  /** Singleton row — always 'coach-rules'. */
  id: 'coach-rules'
  alwaysIncludeRearDelts: boolean
  alwaysIncludeCompoundMovement: boolean
  avoidRepeatingExercisesConsecutively: boolean
  preferFreeWeights: boolean
  preferMachines: boolean
  minimumCompoundMovements: number
  targetRepThreshold: number
  updatedAt: string
}
