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
  updateSessionExerciseWeight,
} from '../services/workoutSessionService'
import { getCoachRules } from '../services/coachRulesService'
import { getUserSettings, updateUserSettings } from '../services/settingsService'
import { getCardioForDate, toggleCardioActivity } from '../services/cardioService'
import { exportAllData } from '../database/exportData'
import { completeSessionExercise, uncompleteSessionExercise } from '../coach/progression'
import { generateWorkoutExercises } from '../coach/workoutGenerator'
import { getCoachSummary, type CoachSummary } from '../coach/summary'
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
  const [targetRepThreshold, setTargetRepThreshold] = useState(8)
  const [confirmingIndex, setConfirmingIndex] = useState<number | null>(null)
  const [progressionNotice, setProgressionNotice] = useState<string | null>(null)
  const [cardioOptions, setCardioOptions] = useState<string[]>([])
  const [completedCardio, setCompletedCardio] = useState<Set<string>>(new Set())
  const [addingCardio, setAddingCardio] = useState(false)
  const [newCardioName, setNewCardioName] = useState('')
  const [summary, setSummary] = useState<CoachSummary | null>(null)
  const [reasons, setReasons] = useState<Map<string, string>>(new Map())
  const [lastExportedAt, setLastExportedAt] = useState<string | undefined>(undefined)
  const [backupDismissed, setBackupDismissed] = useState(false)
  const [exporting, setExporting] = useState(false)

  async function loadEverything() {
    setLoading(true)
    const [y, m] = today.split('-').map(Number)
    const [plan, splits, allExercises, allCategories, existingSession, coachRules, settings, cardioToday] =
      await Promise.all([
        getMonthlyPlan(y, m),
        getActiveTrainingSplits(),
        getAllExercises(),
        getAllMovementCategories(),
        getSessionByDate(today),
        getCoachRules(),
        getUserSettings(),
        getCardioForDate(today),
      ])

    const todaysPlannedDay = plan?.days.find((d) => d.date === today)
    const split = todaysPlannedDay?.assignedSplitId
      ? splits.find((s) => s.id === todaysPlannedDay.assignedSplitId) ?? null
      : null

    setAssignedSplit(split)
    setExercises(allExercises)
    setCategories(allCategories)
    setSession(existingSession ?? null)
    setTargetRepThreshold(coachRules.targetRepThreshold)
    setCardioOptions(settings.cardioOptions)
    setLastExportedAt(settings.lastExportedAt)
    setCompletedCardio(new Set(cardioToday.map((c) => c.activityType)))
    setLoading(false)
  }

  useEffect(() => {
    loadEverything()
    getCoachSummary().then(setSummary)
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
      const { sessionExercises, reasons: generatedReasons } = generateWorkoutExercises(
        assignedSplit,
        exercises,
        categories,
        recentSessions,
      )
      const created = await createSession(today, assignedSplit.id, sessionExercises)
      setSession(created)
      setReasons(generatedReasons)
      getCoachSummary().then(setSummary)
    } finally {
      setGenerating(false)
    }
  }

  function handleCompleteTap(index: number) {
    if (!session) return
    const entry = session.exercises[index]
    if (entry.completed) {
      // Undo — no re-prompt needed.
      uncompleteSessionExercise(session, index).then(setSession)
      return
    }
    setConfirmingIndex(index)
  }

  async function handleConfirmCompletion(index: number, hitTarget: boolean) {
    if (!session) return
    const entry = session.exercises[index]
    const exercise = exerciseById.get(entry.exerciseId)
    if (!exercise) return

    const { session: updatedSession, exercise: updatedExercise } = await completeSessionExercise(
      session,
      index,
      exercise,
      hitTarget,
    )
    setSession(updatedSession)
    setExercises((prev) => prev.map((e) => (e.id === updatedExercise.id ? updatedExercise : e)))
    setConfirmingIndex(null)
    getCoachSummary().then(setSummary)

    if (hitTarget && updatedExercise.currentWorkingWeight !== 'bodyweight') {
      setProgressionNotice(
        `${exercise.name} moves up to ${updatedExercise.currentWorkingWeight}kg next time.`,
      )
      setTimeout(() => setProgressionNotice(null), 4000)
    }
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

  async function handleToggleCardio(activity: string) {
    const updated = await toggleCardioActivity(today, activity)
    setCompletedCardio(new Set(updated.map((c) => c.activityType)))
  }

  const daysSinceBackup = lastExportedAt
    ? Math.floor((Date.now() - Date.parse(lastExportedAt)) / (1000 * 60 * 60 * 24))
    : null
  const showBackupBanner =
    !backupDismissed && (daysSinceBackup === null || daysSinceBackup >= 14)

  async function handleBackupNow() {
    setExporting(true)
    try {
      await exportAllData()
      setLastExportedAt(new Date().toISOString())
    } finally {
      setExporting(false)
    }
  }

  async function handleAddCardioOption() {
    const name = newCardioName.trim()
    if (!name || cardioOptions.includes(name)) {
      setAddingCardio(false)
      setNewCardioName('')
      return
    }
    const updatedOptions = [...cardioOptions, name]
    await updateUserSettings({ cardioOptions: updatedOptions })
    setCardioOptions(updatedOptions)
    setAddingCardio(false)
    setNewCardioName('')
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

      {showBackupBanner && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-1 px-4 py-3">
          <p className="text-sm text-ink-secondary">
            {daysSinceBackup === null
              ? "You haven't backed up your data yet."
              : `It's been ${daysSinceBackup} days since your last backup.`}
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={handleBackupNow}
              disabled={exporting}
              className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-surface-0"
            >
              {exporting ? 'Exporting…' : 'Back up now'}
            </button>
            <button
              onClick={() => setBackupDismissed(true)}
              className="rounded-full bg-surface-3 px-3 py-1.5 text-xs font-medium text-ink-secondary"
            >
              Not now
            </button>
          </div>
        </div>
      )}

      {summary && (summary.completionText || summary.balanceMessage) && (
        <section className="mb-4 rounded-2xl border border-line bg-surface-1 p-4 shadow-card">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            Coach Summary
          </p>
          {summary.completionText && (
            <p className="mt-1.5 text-sm text-ink-secondary">{summary.completionText}</p>
          )}
          {summary.balanceMessage && (
            <p className="mt-1.5 text-sm text-ink-secondary">{summary.balanceMessage}</p>
          )}
        </section>
      )}

      {loading && <p className="text-ink-muted">Loading today's plan…</p>}

      {progressionNotice && (
        <div className="mb-4 rounded-xl border border-accent/30 bg-accent-soft px-4 py-2.5 text-sm text-accent">
          {progressionNotice}
        </div>
      )}

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
                                {reasons.get(exercise.id) && (
                                  <p className="mt-0.5 text-[11px] italic text-ink-muted">
                                    {reasons.get(exercise.id)}
                                  </p>
                                )}
                              </div>
                              {editingWeightIndex === index ? (
                                <div className="flex shrink-0 items-center gap-1">
                                  <button
                                    onClick={() =>
                                      setWeightDraft((prev) =>
                                        String(Math.max(0, (Number(prev) || 0) - 2.5)),
                                      )
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-1 text-ink-secondary"
                                    aria-label="Decrease weight"
                                  >
                                    −
                                  </button>
                                  <input
                                    autoFocus
                                    type="number"
                                    inputMode="decimal"
                                    step="0.5"
                                    value={weightDraft}
                                    onChange={(e) => setWeightDraft(e.target.value)}
                                    className="w-16 rounded-lg border border-line bg-surface-1 px-2 py-1 text-center text-base text-ink-primary"
                                  />
                                  <button
                                    onClick={() =>
                                      setWeightDraft((prev) => String((Number(prev) || 0) + 2.5))
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-1 text-ink-secondary"
                                    aria-label="Increase weight"
                                  >
                                    +
                                  </button>
                                  <button
                                    onClick={() => handleSaveWeight(index)}
                                    className="ml-1 text-xs font-medium text-accent"
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
                              {confirmingIndex === index ? (
                                <>
                                  <span className="flex items-center px-1 text-ink-muted">
                                    Hit {targetRepThreshold}+ reps?
                                  </span>
                                  <button
                                    onClick={() => handleConfirmCompletion(index, true)}
                                    className="rounded-full bg-accent px-3 py-1.5 font-medium text-surface-0"
                                  >
                                    Yes — up the weight
                                  </button>
                                  <button
                                    onClick={() => handleConfirmCompletion(index, false)}
                                    className="rounded-full bg-surface-3 px-3 py-1.5 font-medium text-ink-secondary"
                                  >
                                    Not quite
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleCompleteTap(index)}
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
                                </>
                              )}
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

      {!loading && cardioOptions.length > 0 && (
        <section className="mt-4 rounded-2xl border border-line bg-surface-1 p-5 shadow-card">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            Today's Cardio
          </p>
          <div className="mt-3 space-y-2">
            {cardioOptions.map((activity) => {
              const isDone = completedCardio.has(activity)
              return (
                <label
                  key={activity}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3"
                >
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => handleToggleCardio(activity)}
                    className="h-5 w-5 accent-[#8FBF6B]"
                  />
                  <span
                    className={isDone ? 'text-ink-muted line-through' : 'text-ink-primary'}
                  >
                    {activity}
                  </span>
                </label>
              )
            })}
          </div>

          {addingCardio ? (
            <div className="mt-3 flex items-center gap-2">
              <input
                autoFocus
                type="text"
                value={newCardioName}
                onChange={(e) => setNewCardioName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCardioOption()}
                placeholder="e.g. Swimming"
                className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-base text-ink-primary"
              />
              <Button variant="secondary" onClick={handleAddCardioOption}>
                Add
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setAddingCardio(true)}
              className="mt-3 text-xs font-medium text-accent"
            >
              + Add other cardio option
            </button>
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
