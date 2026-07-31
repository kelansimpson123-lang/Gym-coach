import { updateExerciseWorkingWeight } from '../services/exerciseService'
import { addPerformanceEntry } from '../services/exercisePerformanceService'
import { saveSession } from '../services/workoutSessionService'
import type { Exercise, WorkoutSession } from '../models'

/** How much to add when the target rep threshold is hit. Free-weight
 * increments are smaller than machine/cable increments, matching typical
 * plate availability. Bodyweight exercises aren't auto-progressed by
 * weight — reps are the natural progression there instead. */
const WEIGHT_INCREMENT: Record<Exercise['equipment'], number> = {
  barbell: 2.5,
  dumbbell: 2.5,
  'smith-machine': 2.5,
  cable: 2.5,
  machine: 5,
  other: 2.5,
  bodyweight: 0,
}

export function computeNextWorkingWeight(
  exercise: Exercise,
  hitTarget: boolean,
): Exercise['currentWorkingWeight'] {
  if (!hitTarget) return exercise.currentWorkingWeight
  if (exercise.currentWorkingWeight === 'bodyweight') return 'bodyweight'
  return exercise.currentWorkingWeight + WEIGHT_INCREMENT[exercise.equipment]
}

/**
 * Marks a session exercise as completed, logs a lightweight performance
 * entry, and — if the target rep threshold was hit — bumps the exercise's
 * working weight for its *next* appearance (today's logged weight is left
 * as-is, since that's what was actually lifted today).
 */
export async function completeSessionExercise(
  session: WorkoutSession,
  index: number,
  exercise: Exercise,
  hitTarget: boolean,
): Promise<{ session: WorkoutSession; exercise: Exercise }> {
  const entry = session.exercises[index]
  const isProgression = hitTarget && exercise.currentWorkingWeight !== 'bodyweight'

  await addPerformanceEntry({
    exerciseId: exercise.id,
    date: session.date,
    workingWeight: entry.workingWeight,
    completed: true,
    isProgression,
  })

  let updatedExercise = exercise
  if (isProgression) {
    const nextWeight = computeNextWorkingWeight(exercise, true)
    updatedExercise = await updateExerciseWorkingWeight(exercise.id, nextWeight)
  }

  const exercises = session.exercises.map((e, i) => (i === index ? { ...e, completed: true } : e))
  const updatedSession = await saveSession({ ...session, exercises })

  return { session: updatedSession, exercise: updatedExercise }
}

/** Undoing a completion just reverts the checkbox — it does not reverse
 * any weight bump that already happened, since that's now a real change
 * to what you'll lift next time, not just today's UI state. */
export async function uncompleteSessionExercise(
  session: WorkoutSession,
  index: number,
): Promise<WorkoutSession> {
  const exercises = session.exercises.map((e, i) =>
    i === index ? { ...e, completed: false } : e,
  )
  return saveSession({ ...session, exercises })
}
