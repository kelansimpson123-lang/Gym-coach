import { useEffect, useMemo, useState } from 'react'
import PageContainer from '../components/PageContainer'
import Button from '../components/Button'
import Modal from '../components/Modal'
import ExerciseCard from '../components/ExerciseCard'
import ExerciseForm, { MUSCLE_GROUPS, type ExerciseFormValues } from '../components/ExerciseForm'
import {
  getAllExercises,
  addExercise,
  updateExercise,
  deleteExercise,
} from '../services/exerciseService'
import { getAllMovementCategories } from '../services/movementCategoryService'
import type { Exercise, MovementCategory } from '../models'

type ModalState = { mode: 'add'; muscleGroup: string } | { mode: 'edit'; exercise: Exercise } | null

export default function Exercises() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [categories, setCategories] = useState<MovementCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalState>(null)

  async function refresh() {
    const [ex, cats] = await Promise.all([getAllExercises(), getAllMovementCategories()])
    setExercises(ex)
    setCategories(cats)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  const categoryById = useMemo(() => {
    const map = new Map<string, MovementCategory>()
    categories.forEach((c) => map.set(c.id, c))
    return map
  }, [categories])

  const groupedByMuscle = useMemo(() => {
    const groups = new Map<string, Exercise[]>()
    for (const group of MUSCLE_GROUPS) groups.set(group, [])
    for (const exercise of exercises) {
      const bucket = groups.get(exercise.mainMuscleGroup)
      if (bucket) bucket.push(exercise)
      else groups.set(exercise.mainMuscleGroup, [exercise])
    }
    return groups
  }, [exercises])

  async function handleAddSubmit(values: ExerciseFormValues) {
    await addExercise(values)
    setModal(null)
    await refresh()
  }

  async function handleEditSubmit(id: string, values: ExerciseFormValues) {
    await updateExercise(id, values)
    setModal(null)
    await refresh()
  }

  async function handleDelete(id: string) {
    await deleteExercise(id)
    setModal(null)
    await refresh()
  }

  return (
    <PageContainer>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-primary">Exercises</h1>
          <p className="mt-1 text-sm text-ink-muted">Your exercise library</p>
        </div>
        <Button onClick={() => setModal({ mode: 'add', muscleGroup: MUSCLE_GROUPS[0] })}>
          + Add
        </Button>
      </header>

      {loading && <p className="text-ink-muted">Loading your library…</p>}

      {!loading && exercises.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line p-6 text-center">
          <p className="text-ink-secondary">No exercises yet.</p>
          <p className="mt-1 text-sm text-ink-muted">
            Add your first one to start building your library.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {MUSCLE_GROUPS.map((group) => {
          const groupExercises = groupedByMuscle.get(group) ?? []
          if (groupExercises.length === 0) return null

          return (
            <section key={group}>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-medium text-ink-secondary">{group}</h2>
                <button
                  onClick={() => setModal({ mode: 'add', muscleGroup: group })}
                  className="text-xs font-medium text-accent"
                >
                  + Add to {group}
                </button>
              </div>
              <div className="space-y-2">
                {groupExercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    category={categoryById.get(exercise.movementCategoryId)}
                    onClick={() => setModal({ mode: 'edit', exercise })}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <Modal
        isOpen={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? modal.exercise.name : 'Add exercise'}
      >
        {modal?.mode === 'add' && (
          <ExerciseForm
            defaultMuscleGroup={modal.muscleGroup}
            onSubmit={handleAddSubmit}
            onCancel={() => setModal(null)}
          />
        )}
        {modal?.mode === 'edit' && (
          <ExerciseForm
            initialValues={modal.exercise}
            onSubmit={(values) => handleEditSubmit(modal.exercise.id, values)}
            onCancel={() => setModal(null)}
            onDelete={() => handleDelete(modal.exercise.id)}
          />
        )}
      </Modal>
    </PageContainer>
  )
}
