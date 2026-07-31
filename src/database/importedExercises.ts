import type { EquipmentType, ExercisePriority, ExerciseTier } from '../models'

export interface ImportedExercise {
  name: string
  muscleGroup: string
  categoryName: string
  tier: ExerciseTier
  equipment: EquipmentType
  priority: ExercisePriority
  weight: number | 'bodyweight'
  notes?: string
}

/**
 * One-time import of exercises logged in Notes ("Gym 2026"). Weight of 0
 * means it wasn't recorded in the original notes — worth updating the
 * first time you use that exercise. Where the same exercise appeared
 * across multiple sessions, entries were merged and the most recent /
 * most complete weight was kept.
 */
export const IMPORTED_EXERCISES: ImportedExercise[] = [
  // Chest
  { name: 'Flat Bench', muscleGroup: 'Chest', categoryName: 'Horizontal Press', tier: 1, equipment: 'barbell', priority: 'mandatory', weight: 75 },
  { name: 'Incline Dumbbell Press', muscleGroup: 'Chest', categoryName: 'Incline Press', tier: 2, equipment: 'dumbbell', priority: 'rotation', weight: 30 },
  { name: 'Pec Dec', muscleGroup: 'Chest', categoryName: 'Chest Isolation', tier: 3, equipment: 'machine', priority: 'rotation', weight: 59 },
  { name: 'Smith Incline Press', muscleGroup: 'Chest', categoryName: 'Incline Press', tier: 2, equipment: 'smith-machine', priority: 'rotation', weight: 60, notes: 'Logged as both "Smith machine incline" and "Smith incline press" — merged into one.' },
  { name: 'Machine Chest Press', muscleGroup: 'Chest', categoryName: 'Horizontal Press', tier: 2, equipment: 'machine', priority: 'rotation', weight: 80 },
  { name: 'Cable Fly', muscleGroup: 'Chest', categoryName: 'Chest Isolation', tier: 3, equipment: 'cable', priority: 'rotation', weight: 0 },

  // Back
  { name: 'Pull Up', muscleGroup: 'Back', categoryName: 'Vertical Pull', tier: 1, equipment: 'bodyweight', priority: 'mandatory', weight: 'bodyweight' },
  { name: 'Machine Seated Row', muscleGroup: 'Back', categoryName: 'Horizontal Row', tier: 2, equipment: 'machine', priority: 'rotation', weight: 35 },
  { name: 'Lat Pulldown', muscleGroup: 'Back', categoryName: 'Vertical Pull', tier: 2, equipment: 'cable', priority: 'rotation', weight: 65 },
  { name: 'Chest Supported Row', muscleGroup: 'Back', categoryName: 'Horizontal Row', tier: 2, equipment: 'machine', priority: 'rotation', weight: 40 },
  { name: 'Machine Lat Pulldown', muscleGroup: 'Back', categoryName: 'Vertical Pull', tier: 2, equipment: 'machine', priority: 'rotation', weight: 40, notes: 'Logged as "40kg each" (per side).' },
  { name: 'Rear Delts', muscleGroup: 'Back', categoryName: 'Rear Delt / Upper Back', tier: 3, equipment: 'machine', priority: 'rotation', weight: 0, notes: 'Generic name in notes — rename to the specific movement if you remember it (e.g. Reverse Pec Deck, Face Pull).' },
  { name: 'Seated Cable Pull', muscleGroup: 'Back', categoryName: 'Horizontal Row', tier: 2, equipment: 'cable', priority: 'rotation', weight: 0 },

  // Shoulders
  { name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders', categoryName: 'Overhead Press', tier: 2, equipment: 'dumbbell', priority: 'rotation', weight: 26 },
  { name: 'Single Arm Lateral Raise (Wrist Strap)', muscleGroup: 'Shoulders', categoryName: 'Lateral Raise', tier: 3, equipment: 'dumbbell', priority: 'rotation', weight: 0 },
  { name: 'Lateral Raise Machine', muscleGroup: 'Shoulders', categoryName: 'Lateral Raise', tier: 3, equipment: 'machine', priority: 'rotation', weight: 41, notes: 'Logged as both "Lat raise machine" and "Side raises machine" — merged into one.' },
  { name: 'Military Press', muscleGroup: 'Shoulders', categoryName: 'Overhead Press', tier: 1, equipment: 'barbell', priority: 'mandatory', weight: 35 },
  { name: 'Shoulder Press (Smith Machine)', muscleGroup: 'Shoulders', categoryName: 'Overhead Press', tier: 2, equipment: 'smith-machine', priority: 'rotation', weight: 40, notes: 'Logged as both "Overhead press smith" and "Shoulder press smith" — merged into one.' },
  { name: 'Bar Trap Raises', muscleGroup: 'Shoulders', categoryName: 'Rear Delt', tier: 2, equipment: 'barbell', priority: 'rotation', weight: 60 },

  // Triceps
  { name: 'Tricep Bar Pushdown', muscleGroup: 'Triceps', categoryName: 'Triceps Isolation', tier: 2, equipment: 'cable', priority: 'rotation', weight: 54 },
  { name: 'Tricep Rope Pushdown', muscleGroup: 'Triceps', categoryName: 'Triceps Isolation', tier: 3, equipment: 'cable', priority: 'rotation', weight: 0 },
  { name: 'Single-Arm Tricep Pushdown (Wrist Strap)', muscleGroup: 'Triceps', categoryName: 'Triceps Isolation', tier: 3, equipment: 'cable', priority: 'rotation', weight: 0, notes: 'Logged as both "Single arm tricep push dow" and "Single arm push down (wrist strap)" — merged into one.' },
  { name: 'Dips', muscleGroup: 'Triceps', categoryName: 'Triceps Isolation', tier: 2, equipment: 'bodyweight', priority: 'rotation', weight: 'bodyweight' },

  // Biceps
  { name: 'Bicep Curl', muscleGroup: 'Biceps', categoryName: 'Biceps Isolation', tier: 2, equipment: 'dumbbell', priority: 'rotation', weight: 16 },
  { name: 'Hammer Curl', muscleGroup: 'Biceps', categoryName: 'Biceps Isolation', tier: 2, equipment: 'dumbbell', priority: 'rotation', weight: 16 },
  { name: 'Cable Curl (Bar)', muscleGroup: 'Biceps', categoryName: 'Biceps Isolation', tier: 2, equipment: 'cable', priority: 'rotation', weight: 40, notes: 'Logged as both "Bar cable curl" and "Cable curl bar" — merged into one.' },
  { name: 'Preacher Curl', muscleGroup: 'Biceps', categoryName: 'Biceps Isolation', tier: 2, equipment: 'barbell', priority: 'rotation', weight: 32.5 },
  { name: 'Rope Hammer Curl', muscleGroup: 'Biceps', categoryName: 'Biceps Isolation', tier: 3, equipment: 'cable', priority: 'rotation', weight: 0 },

  // Legs
  { name: 'Hamstring Curl', muscleGroup: 'Legs', categoryName: 'Leg Curl', tier: 2, equipment: 'machine', priority: 'rotation', weight: 73 },
  { name: 'Leg Extension', muscleGroup: 'Legs', categoryName: 'Squat Pattern', tier: 3, equipment: 'machine', priority: 'rotation', weight: 91, notes: 'No dedicated quad-isolation category exists yet — filed under Squat Pattern as the closest fit.' },
  { name: 'Smith Machine Squats', muscleGroup: 'Legs', categoryName: 'Squat Pattern', tier: 1, equipment: 'smith-machine', priority: 'mandatory', weight: 0 },
  { name: 'Leg Press', muscleGroup: 'Legs', categoryName: 'Squat Pattern', tier: 2, equipment: 'machine', priority: 'rotation', weight: 180, notes: 'Logged at both 150kg and 180kg across sessions — kept the higher (most recent) figure.' },
  { name: 'Dead Lift', muscleGroup: 'Legs', categoryName: 'Hip Hinge', tier: 1, equipment: 'barbell', priority: 'mandatory', weight: 0, notes: 'Listed under a "Chest & Back" session in the original notes, but filed under Legs/Hip Hinge as the standard classification.' },
  { name: 'Calf Raises', muscleGroup: 'Legs', categoryName: 'Calf Movement', tier: 3, equipment: 'machine', priority: 'rotation', weight: 0, notes: 'A stray "-50kg" line near this entry in the original notes was unclear — check whether this should be 50kg.' },
  { name: 'Dumbbell Lunges', muscleGroup: 'Legs', categoryName: 'Squat Pattern', tier: 2, equipment: 'dumbbell', priority: 'rotation', weight: 0 },
]
