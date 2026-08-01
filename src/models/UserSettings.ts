export type Units = 'kg' | 'lb'
export type Theme = 'dark' | 'light'
export type TrainingGoal = 'hypertrophy' | 'strength' | 'general-fitness'

export interface UserSettings {
  /** Singleton row — always 'user-settings'. */
  id: 'user-settings'
  goal: TrainingGoal
  units: Units
  theme: Theme
  /** e.g. "increase weight after achieving target reps" — refined in Phase 6. */
  progressionRuleDescription: string
  /** User-customisable cardio activity names shown on the Home screen. */
  cardioOptions: string[]
  updatedAt: string
}
