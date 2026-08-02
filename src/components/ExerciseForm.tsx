import { useEffect, useMemo, useState, lazy, Suspense } from 'react'
import Button from './Button'
import { getAllMovementCategories } from '../services/movementCategoryService'
import { getPerformanceForExercise } from '../services/exercisePerformanceService'
import type {
  Exercise,
  ExercisePriority,
  ExerciseTier,
  EquipmentType,
  MovementCategory,
  ExercisePerformance,
} from '../models'

const ProgressionChart = lazy(() => import('./ProgressionChart'))

export const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs'] as const

const EQUIPMENT_OPTIONS: { value: EquipmentType; label: string }[] = [
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbell', label: 'Dumbbell' },
  { value: 'machine', label: 'Machine' },
  { value: 'smith-machine', label: 'Smith Machine' },
  { value: 'cable', label: 'Cable' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'other', label: 'Other' },
]

const PRIORITY_OPTIONS: { value: ExercisePriority; label: string }[] = [
  { value: 'mandatory', label: 'Mandatory' },
  { value: 'preferred', label: 'Preferred' },
  { value: 'rotation', label: 'Rotation' },
  { value: 'avoid', label: 'Avoid' },
]

export interface ExerciseFormValues {
  name: string
  mainMuscleGroup: string
  movementCategoryId: string
  tier: ExerciseTier
  equipment: EquipmentType
  currentWorkingWeight: number | 'bodyweight'
  priority: ExercisePriority
  notes?: string
}

interface ExerciseFormProps {
  initialValues?: Exercise
  defaultMuscleGroup?: string
  onSubmit: (values: ExerciseFormValues) => Promise<void> | void
  onCancel: () => void
  onDelete?: () => Promise<void> | void
}

const fieldLabel = 'mb-1.5 block text-xs font-medium text-ink-secondary'
const fieldControl =
  'w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-base text-ink-primary outline-none focus:border-accent'

export default function ExerciseForm({
  initialValues,
  defaultMuscleGroup,
  onSubmit,
  onCancel,
  onDelete,
}: ExerciseFormProps) {
  const [categories, setCategories] = useState<MovementCategory[]>([])
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(initialValues?.name ?? '')
  const [muscleGroup, setMuscleGroup] = useState(
    initialValues?.mainMuscleGroup ?? defaultMuscleGroup ?? MUSCLE_GROUPS[0],
  )
  const [movementCategoryId, setMovementCategoryId] = useState(
    initialValues?.movementCategoryId ?? '',
  )
  const [tier, setTier] = useState<ExerciseTier>(initialValues?.tier ?? 2)
  const [equipment, setEquipment] = useState<EquipmentType>(initialValues?.equipment ?? 'machine')
  const [isBodyweight, setIsBodyweight] = useState(
    initialValues?.currentWorkingWeight === 'bodyweight',
  )
  const [weight, setWeight] = useState<string>(
    initialValues && initialValues.currentWorkingWeight !== 'bodyweight'
      ? String(initialValues.currentWorkingWeight)
      : '',
  )
  const [priority, setPriority] = useState<ExercisePriority>(initialValues?.priority ?? 'rotation')
  const [notes, setNotes] = useState(initialValues?.notes ?? '')
  const [history, setHistory] = useState<ExercisePerformance[]>([])

  useEffect(() => {
    getAllMovementCategories().then(setCategories)
  }, [])

  useEffect(() => {
    if (initialValues) {
      getPerformanceForExercise(initialValues.id).then(setHistory)
    }
  }, [initialValues])

  const categoriesForMuscle = useMemo(
    () => categories.filter((c) => c.muscleGroup === muscleGroup),
    [categories, muscleGroup],
  )

  // Keep the selected category valid whenever the muscle group changes.
  useEffect(() => {
    if (categoriesForMuscle.length === 0) {
      setMovementCategoryId('')
      return
    }
    const stillValid = categoriesForMuscle.some((c) => c.id === movementCategoryId)
    if (!stillValid) {
      setMovementCategoryId(categoriesForMuscle[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriesForMuscle])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Give the exercise a name.')
      return
    }
    if (!movementCategoryId) {
      setError('Add a movement category for this muscle group first, in Edit App.')
      return
    }
    if (!isBodyweight && (weight.trim() === '' || Number.isNaN(Number(weight)))) {
      setError('Enter a current working weight, or mark this as bodyweight.')
      return
    }

    setSaving(true)
    try {
      await onSubmit({
        name: name.trim(),
        mainMuscleGroup: muscleGroup,
        movementCategoryId,
        tier,
        equipment,
        currentWorkingWeight: isBodyweight ? 'bodyweight' : Number(weight),
        priority,
        notes: notes.trim() || undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {initialValues && history.length > 0 && (
        <div className="rounded-xl border border-line bg-surface-2 p-3">
          <p className="mb-1.5 text-xs font-medium text-ink-secondary">Progression history</p>
          <Suspense fallback={<div className="h-32 w-full" />}>
            <ProgressionChart history={history} />
          </Suspense>
          <ul className="mt-2 space-y-1 text-xs text-ink-muted">
            {history.slice(0, 5).map((entry) => (
              <li key={entry.id} className="flex items-center justify-between">
                <span>{entry.date}</span>
                <span className={entry.isProgression ? 'text-accent' : ''}>
                  {entry.workingWeight === 'bodyweight' ? 'Bodyweight' : `${entry.workingWeight}kg`}
                  {entry.isProgression ? ' ↑' : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <label className={fieldLabel} htmlFor="exercise-name">
          Exercise name
        </label>
        <input
          id="exercise-name"
          className={fieldControl}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Bench Press"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={fieldLabel} htmlFor="muscle-group">
            Muscle
          </label>
          <select
            id="muscle-group"
            className={fieldControl}
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value)}
          >
            {MUSCLE_GROUPS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={fieldLabel} htmlFor="movement-category">
            Category
          </label>
          <select
            id="movement-category"
            className={fieldControl}
            value={movementCategoryId}
            onChange={(e) => setMovementCategoryId(e.target.value)}
            disabled={categoriesForMuscle.length === 0}
          >
            {categoriesForMuscle.length === 0 && <option value="">No categories yet</option>}
            {categoriesForMuscle.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={fieldLabel} htmlFor="tier">
            Tier
          </label>
          <select
            id="tier"
            className={fieldControl}
            value={tier}
            onChange={(e) => setTier(Number(e.target.value) as ExerciseTier)}
          >
            <option value={1}>Tier 1 — Foundation</option>
            <option value={2}>Tier 2 — Supporting</option>
            <option value={3}>Tier 3 — Accessory</option>
          </select>
        </div>

        <div>
          <label className={fieldLabel} htmlFor="equipment">
            Equipment
          </label>
          <select
            id="equipment"
            className={fieldControl}
            value={equipment}
            onChange={(e) => setEquipment(e.target.value as EquipmentType)}
          >
            {EQUIPMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={fieldLabel} htmlFor="working-weight">
          Current working weight
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeight((prev) => String(Math.max(0, (Number(prev) || 0) - 2.5)))}
            disabled={isBodyweight}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ink-secondary disabled:opacity-40"
            aria-label="Decrease weight"
          >
            −
          </button>
          <input
            id="working-weight"
            className={fieldControl}
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            disabled={isBodyweight}
            placeholder="e.g. 82.5"
          />
          <button
            type="button"
            onClick={() => setWeight((prev) => String((Number(prev) || 0) + 2.5))}
            disabled={isBodyweight}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ink-secondary disabled:opacity-40"
            aria-label="Increase weight"
          >
            +
          </button>
        </div>
        <label className="mt-2 flex items-center gap-2 text-sm text-ink-secondary">
          <input
            type="checkbox"
            checked={isBodyweight}
            onChange={(e) => setIsBodyweight(e.target.checked)}
            className="h-4 w-4 accent-[#8FBF6B]"
          />
          Bodyweight
        </label>
      </div>

      <div>
        <label className={fieldLabel} htmlFor="priority">
          Priority
        </label>
        <select
          id="priority"
          className={fieldControl}
          value={priority}
          onChange={(e) => setPriority(e.target.value as ExercisePriority)}
        >
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={fieldLabel} htmlFor="notes">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          className={fieldControl}
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any cues or reminders for yourself"
        />
      </div>

      {error && <p className="text-sm text-status-missed">{error}</p>}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? 'Saving…' : initialValues ? 'Save changes' : 'Add exercise'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>

      {onDelete && (
        <div className="pt-2">
          {!confirmingDelete ? (
            <Button
              type="button"
              variant="danger"
              className="w-full"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete exercise
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="danger"
                className="flex-1"
                onClick={onDelete}
                disabled={saving}
              >
                Confirm delete
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setConfirmingDelete(false)}
                disabled={saving}
              >
                Keep it
              </Button>
            </div>
          )}
        </div>
      )}
    </form>
  )
}
