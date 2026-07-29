import type { DBSchema } from 'idb'
import type {
  UserSettings,
  TrainingSplit,
  Exercise,
  MovementCategory,
  MonthlyPlan,
  WorkoutSession,
  ExercisePerformance,
  CardioEntry,
  WorkScheduleEntry,
  CoachRules,
} from '../models'

export const DB_NAME = 'gym-coach-db'
export const DB_VERSION = 1

/**
 * Object store names, centralised so nothing in the app hard-codes a raw
 * string. Phase 2's service layer imports these instead of retyping them.
 */
export const STORES = {
  userSettings: 'userSettings',
  trainingSplits: 'trainingSplits',
  exercises: 'exercises',
  movementCategories: 'movementCategories',
  monthlyPlans: 'monthlyPlans',
  workoutSessions: 'workoutSessions',
  exercisePerformance: 'exercisePerformance',
  cardioEntries: 'cardioEntries',
  workSchedule: 'workSchedule',
  coachRules: 'coachRules',
} as const

export interface GymCoachDBSchema extends DBSchema {
  userSettings: {
    key: string
    value: UserSettings
  }
  trainingSplits: {
    key: string
    value: TrainingSplit
    indexes: { 'by-order': number }
  }
  exercises: {
    key: string
    value: Exercise
    indexes: {
      'by-muscle-group': string
      'by-movement-category': string
    }
  }
  movementCategories: {
    key: string
    value: MovementCategory
    indexes: { 'by-muscle-group': string }
  }
  monthlyPlans: {
    key: string
    value: MonthlyPlan
  }
  workoutSessions: {
    key: string
    value: WorkoutSession
    indexes: { 'by-date': string; 'by-split': string }
  }
  exercisePerformance: {
    key: string
    value: ExercisePerformance
    indexes: { 'by-exercise': string; 'by-date': string }
  }
  cardioEntries: {
    key: string
    value: CardioEntry
    indexes: { 'by-date': string }
  }
  workSchedule: {
    key: string
    value: WorkScheduleEntry
  }
  coachRules: {
    key: string
    value: CoachRules
  }
}
