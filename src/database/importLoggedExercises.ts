import { getAllMovementCategories } from '../services/movementCategoryService'
import { getAllExercises, addExercise } from '../services/exerciseService'
import { updateCoachRules } from '../services/coachRulesService'
import { IMPORTED_EXERCISES } from './importedExercises'

export interface ImportResult {
  added: string[]
  skipped: string[]
}

/**
 * Adds each logged exercise as a normal, fully-editable Exercise record.
 * Skips any name that already exists (case-insensitive) so it's safe to
 * click more than once without creating duplicates. Also applies the
 * "increase weight after 6+ reps" progression rule from the same notes.
 */
export async function importLoggedExercises(): Promise<ImportResult> {
  const [categories, existingExercises] = await Promise.all([
    getAllMovementCategories(),
    getAllExercises(),
  ])

  const existingNames = new Set(existingExercises.map((e) => e.name.toLowerCase()))
  const added: string[] = []
  const skipped: string[] = []

  for (const item of IMPORTED_EXERCISES) {
    if (existingNames.has(item.name.toLowerCase())) {
      skipped.push(item.name)
      continue
    }

    const category = categories.find(
      (c) => c.name === item.categoryName && c.muscleGroup === item.muscleGroup,
    )
    if (!category) {
      skipped.push(`${item.name} (no matching "${item.categoryName}" category)`)
      continue
    }

    await addExercise({
      name: item.name,
      mainMuscleGroup: item.muscleGroup,
      movementCategoryId: category.id,
      tier: item.tier,
      equipment: item.equipment,
      currentWorkingWeight: item.weight,
      priority: item.priority,
      notes: item.notes,
    })
    added.push(item.name)
  }

  await updateCoachRules({ targetRepThreshold: 6 })

  return { added, skipped }
}
