import type {
  Exercise,
  MovementCategory,
  SessionExercise,
  TrainingSplit,
  WorkoutSession,
} from '../models'

const DEFAULT_TARGET_PER_MUSCLE = 3

/** Builds a map of movementCategoryId -> most recently used exerciseId,
 * scanning sessions newest-first so the first match wins. Used to avoid
 * picking the exact same exercise in a slot two sessions running. */
function buildLastUsedByCategory(
  recentSessions: WorkoutSession[],
  exercisesById: Map<string, Exercise>,
): Map<string, string> {
  const lastUsed = new Map<string, string>()
  for (const session of recentSessions) {
    for (const entry of session.exercises) {
      const exercise = exercisesById.get(entry.exerciseId)
      if (!exercise) continue
      if (!lastUsed.has(exercise.movementCategoryId)) {
        lastUsed.set(exercise.movementCategoryId, exercise.id)
      }
    }
  }
  return lastUsed
}

function pickForSlot(
  candidates: Exercise[],
  lastUsedId: string | undefined,
): Exercise | undefined {
  const usable = candidates.filter((c) => c.priority !== 'avoid')
  if (usable.length === 0) return undefined

  // Mandatory exercises should appear regularly — don't rotate them away.
  const mandatory = usable.filter((c) => c.priority === 'mandatory')
  if (mandatory.length > 0) {
    return mandatory[0]
  }

  // Otherwise prefer something other than whatever was used last time here.
  const notLastUsed = usable.filter((c) => c.id !== lastUsedId)
  const pool = notLastUsed.length > 0 ? notLastUsed : usable

  // Among the remaining options, favour lower (more foundational) tiers,
  // then "preferred" over plain "rotation" priority.
  const sorted = [...pool].sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier
    const priorityWeight = { preferred: 0, rotation: 1, mandatory: 0, avoid: 2 }
    return priorityWeight[a.priority] - priorityWeight[b.priority]
  })

  return sorted[0]
}

/**
 * Generates the exercise list for today's session from the assigned split.
 * For each muscle group in the split, fills up to its target exercise
 * count using one movement category "slot" per exercise (in the
 * categories' defined priority order), so coverage stays balanced across
 * movement patterns rather than picking randomly.
 */
export function generateWorkoutExercises(
  split: TrainingSplit,
  allExercises: Exercise[],
  allCategories: MovementCategory[],
  recentSessions: WorkoutSession[],
): SessionExercise[] {
  const exercisesById = new Map(allExercises.map((e) => [e.id, e]))
  const lastUsedByCategory = buildLastUsedByCategory(recentSessions, exercisesById)

  const result: SessionExercise[] = []
  const usedExerciseIds = new Set<string>()

  for (const muscleGroup of split.muscleGroups) {
    const target =
      split.exerciseTargets.find((t) => t.muscleGroup === muscleGroup)?.targetExerciseCount ??
      DEFAULT_TARGET_PER_MUSCLE

    const categories = allCategories
      .filter((c) => c.muscleGroup === muscleGroup)
      .sort((a, b) => a.priorityOrder - b.priorityOrder)

    let filled = 0
    for (const category of categories) {
      if (filled >= target) break

      const candidates = allExercises.filter(
        (e) => e.movementCategoryId === category.id && !usedExerciseIds.has(e.id),
      )
      const chosen = pickForSlot(candidates, lastUsedByCategory.get(category.id))
      if (!chosen) continue

      usedExerciseIds.add(chosen.id)
      result.push({
        exerciseId: chosen.id,
        workingWeight: chosen.currentWorkingWeight,
        completed: false,
      })
      filled += 1
    }
  }

  return result
}
