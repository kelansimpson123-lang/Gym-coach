import { useEffect, useMemo, useState } from 'react'
import PageContainer from '../components/PageContainer'
import Button from '../components/Button'
import Modal from '../components/Modal'
import ExercisePicker from '../components/ExercisePicker'
import { todayISO } from '../utils/date'
import { getMonthlyPlan } from '../services/monthlyPlanService'
import { getActiveTrainingSplits } from '../services/trainingSplitService'
import { getAllExercises } from '../services/exerciseService'
import { getAllMovementCategories } from '../services/movementCategoryService'
import {
  addExerciseToSession,
  createSession,
  getRecentSessions,
  getSessionByDate,
  removeExerciseAt,
  swapExerciseAt,
  toggleExerciseCompleted,
  updateSessionExerciseWeight,
} from '../services/workoutSessionService'
import { generateWorkoutExercises } from '../coach/workoutGenerator'
import type {
  Exercise,
  MovementCategory,
  TrainingSplit,
  WorkoutSession,
} from '../models'

type PickerState =
  | { mode: 'swap'; index: number; muscleGroup: string; categoryId: string }
  | { mode: 'add'; muscleGroup: string }
  | null

export default function Home() {
  const today = todayISO()
  const dateLabel = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const [loading, setLoading] = useState(true)
  const [assignedSplit, setAssignedSplit] = useState<TrainingSplit | null>(null)
  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [categories, setCategories] = useState<MovementCategory[]>([])
  const [generating, setGenerating] = useState(false)
  const [started, setStarted] = useState(false)
  const [editingWeightIndex, setEditingWeightIndex] = useState<number | null>(null)
  const [weightDraft, setWeightDraft] = useState('')
  const [picker, setPicker] = useState<PickerState>(null)

  async function loadEverything() {
    setLoading(true)
    const [y, m] = today.split('-').map(Number)
    const [plan, splits, allExercises, allCategories, existingSession] = await Promise.all([
      getMonthlyPlan(y, m),
      getActiveTrainingSplits(),
      getAllExercises(),
      getAllMovementCategories(),
      getSessionByDate(today),
    ])

    const todaysPlannedDay = plan?.days.find((d) => d.date === today)
    const split = todaysPlannedDay?.assignedSplitId
      ? splits.find((s) => s.id === todaysPlannedDay.assignedSplitId) ?? null
      : null

    setAssignedSplit(split)
    setExercises(allExercises)
    setCategories(allCategories)
    setSession(existingSession ?? null)
    setLoading(false)
  }

  useEffect(() => {
    loadEverything()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const exerciseById = useMemo(() => {
    const map = new Map<string, Exercise>()
    exercises.forEach((e) => map.set(e.id, e))
    return map
  }, [exercises])

  const categoryById = useMemo(() => {
    const map = new Map<string, MovementCategory>()
    categories.forEach((c) => map.set(c.id, c))
    return map
  }, [categories])

  async function handleGenerateWorkout() {
    if (!assignedSplit) return
    setGenerating(true)
    try {
      const recentSessions = await getRecentSessions(10)
      const sessionExercises = generateWorkoutExercises(
        assignedSplit,
        exercises,
        categories,
        recentSessions,
      )
      const created = await createSession(today, assignedSplit.id, sessionExercises)
      setSession(created)
    } finally {
      setGenerating(false)
    }
  }

  async function handleToggleComplete(index: number) {
    if (!session) return
    const updated = await toggleExerciseCompleted(session, index)
    setSession(updated)
  }

  async function handleRemove(index: number) {
    if (!session) return
    const updated = await removeExerciseAt(session, index)
    setSession(updated)
  }

  function openWeightEditor(index: number, current: Exercise['currentWorkingWeight']) {
    setEditingWeightIndex(index)
    setWeightDraft(current === 'bodyweight' ? '' : String(current))
  }

  async function handleSaveWeight(index: number) {
    if (!session) return
    const numeric = Number(weightDraft)
    if (weightDraft.trim() !== '' && !Number.isNaN(numeric)) {
      const updated = await updateSessionExerciseWeight(session, index, numeric)
      setSession(updated)
    }
    setEditingWeightIndex(null)
  }

  async function handlePickExercise(pickedExercise: Exercise) {
    if (!session || !picker) return
    if (picker.mode === 'swap') {
      const updated = await swapExerciseAt(session, picker.index, pickedExercise)
      setSession(updated)
    } else {
      const updated = await addExerciseToSession(session, pickedExercise)
      setSession(updated)
    }
    setPicker(null)
  }

  const groupedSessionExercises = useMemo(() => {
    if (!session) return new Map<string, { index: number; exercise: Exercise }[]>()
    const groups = new Map<string, { index: number; exercise: Exercise }[]>()
    session.exercises.forEach((entry, index) => {
      const exercise = exerciseById.get(entry.exerciseId)
      if (!exercise) return
      const bucket = groups.get(exercise.mainMuscleGroup) ?? []
      bucket.push({ index, exercise })
      groups.set(exercise.mainMuscleGroup, bucket)
    })
    return groups
  }, [session, exerciseById])

  return (
    <PageContainer>
      <header className="mb-6">
        <p className="text-sm text-ink-muted">Good to see you</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink-primary">{dateLabel}</h1>
      </header>

      {loading && <p className="text-ink-muted">Loading today's plan…</p>}

      {!loading && !assignedSplit && (
        <section className="rounded-2xl border border-line bg-surface-1 p-5 shadow-card">
          <p className="text-ink-secondary">No training planned for today.</p>
          <p className="mt-1 text-sm text-ink-muted">
            Set up this month in Calendar if that's not right.
          </p>
        </section>
      )}

      {!loading && assignedSplit && (
        <section className="rounded-2xl border border-line bg-surface-1 p-5 shadow-card">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Today</p>
          <h2 className="mt-1 text-xl font-semibold text-ink-primary">{assignedSplit.name}</h2>

          {!session && (
            <>
              <p className="mt-2 text-sm text-ink-muted">Workout not generated</p>
              <Button
                onClick={handleGenerateWorkout}
                disabled={generating}
                className="mt-4 w-full"
              >
                {generating ? 'Generating…' : 'Generate Workout'}
              </Button>
            </>
          )}

          {session && (
            <>
              {!started && (
                <Button onClick={() => setStarted(true)} className="mt-4 w-full">
                  Start Workout
                </Button>
              )}

              <div className="mt-4 space-y-5">
                {Array.from(groupedSessionExercises.entries()).map(([muscleGroup, entries]) => (
                  <div key={muscleGroup}>
                    <h3 className="mb-2 text-sm font-medium text-ink-secondary">{muscleGroup}</h3>
                    <div className="space-y-2">
                      {entries.map(({ index, exercise }) => {
                        const sessionEntry = session.exercises[index]
                        const category = categoryById.get(exercise.movementCategoryId)
                        return (
                          <div
                            key={index}
                            className="rounded-xl border border-line bg-surface-2 p-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p
                                  className={[
                                    'font-medium',
                                    sessionEntry.completed
                                      ? 'text-ink-muted line-through'
                                      : 'text-ink-primary',
                                  ].join(' ')}
                                >
                                  {exercise.name}
                                </p>
                                <p className="text-xs text-ink-muted">{category?.name}</p>
                              </div>
                              {editingWeightIndex === index ? (
                                <div className="flex shrink-0 items-center gap-1">
                                  <input
                                    autoFocus
                                    type="number"
                                    inputMode="decimal"
                                    step="0.5"
                                    value={weightDraft}
                                    onChange={(e) => setWeightDraft(e.target.value)}
                                    className="w-16 rounded-lg border border-line bg-surface-1 px-2 py-1 text-base text-ink-primary"
                                  />
                                  <button
                                    onClick={() => handleSaveWeight(index)}
                                    className="text-xs font-medium text-accent"
                                  >
                                    Save
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => openWeightEditor(index, sessionEntry.workingWeight)}
                                  className="shrink-0 font-semibold text-accent"
                                >
                                  {sessionEntry.workingWeight === 'bodyweight'
                                    ? 'Bodyweight'
                                    : `${sessionEntry.workingWeight}kg`}
                                </button>
                              )}
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                              <button
                                onClick={() => handleToggleComplete(index)}
                                className={[
                                  'rounded-full px-3 py-1.5 font-medium',
                                  sessionEntry.completed
                                    ? 'bg-accent-soft text-accent'
                                    : 'bg-surface-3 text-ink-secondary',
                                ].join(' ')}
                              >
                                {sessionEntry.completed ? 'Completed' : 'Complete'}
                              </button>
                              <button
                                onClick={() =>
                                  setPicker({
                                    mode: 'swap',
                                    index,
                                    muscleGroup: exercise.mainMuscleGroup,
                                    categoryId: exercise.movementCategoryId,
                                  })
                                }
                                className="rounded-full bg-surface-3 px-3 py-1.5 font-medium text-ink-secondary"
                              >
                                Swap
                              </button>
                              <button
                                onClick={() => handleRemove(index)}
                                className="rounded-full bg-surface-3 px-3 py-1.5 font-medium text-status-missed"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <button
                      onClick={() => setPicker({ mode: 'add', muscleGroup })}
                      className="mt-2 text-xs font-medium text-accent"
                    >
                      + Add exercise to {muscleGroup}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      <Modal
        isOpen={picker !== null}
        onClose={() => setPicker(null)}
        title={picker?.mode === 'swap' ? 'Swap exercise' : 'Add exercise'}
      >
        {picker?.mode === 'swap' && (
          <ExercisePicker
            exercises={exercises.filter(
              (e) =>
                e.movementCategoryId === picker.categoryId &&
                !session?.exercises.some((entry) => entry.exerciseId === e.id),
            )}
            onPick={handlePickExercise}
            emptyMessage="No other exercises in this movement category yet — add one in the Exercises tab."
          />
        )}
        {picker?.mode === 'add' && (
          <ExercisePicker
            exercises={exercises.filter(
              (e) =>
                e.mainMuscleGroup === picker.muscleGroup &&
                !session?.exercises.some((entry) => entry.exerciseId === e.id),
            )}
            onPick={handlePickExercise}
          />
        )}
      </Modal>
    </PageContainer>
  )
}
