import type { Exercise, MovementCategory } from '../models'

interface ExerciseCardProps {
  exercise: Exercise
  category?: MovementCategory
  onClick: () => void
}

const tierLabel: Record<Exercise['tier'], string> = {
  1: 'Tier 1',
  2: 'Tier 2',
  3: 'Tier 3',
}

const equipmentLabel: Record<Exercise['equipment'], string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  machine: 'Machine',
  'smith-machine': 'Smith Machine',
  cable: 'Cable',
  bodyweight: 'Bodyweight',
  other: 'Other',
}

export default function ExerciseCard({ exercise, category, onClick }: ExerciseCardProps) {
  const weightLabel =
    exercise.currentWorkingWeight === 'bodyweight'
      ? 'Bodyweight'
      : `${exercise.currentWorkingWeight}kg`

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface-1 p-4 text-left shadow-card transition-colors hover:bg-surface-2"
    >
      <div className="min-w-0">
        <p className="truncate font-medium text-ink-primary">{exercise.name}</p>
        <p className="mt-0.5 truncate text-xs text-ink-muted">
          {category?.name ?? 'Uncategorised'} · {equipmentLabel[exercise.equipment]} ·{' '}
          {tierLabel[exercise.tier]}
        </p>
      </div>
      <div className="ml-3 shrink-0 text-right">
        <p className="font-semibold text-accent">{weightLabel}</p>
        {exercise.priority === 'mandatory' && (
          <p className="mt-0.5 text-[11px] uppercase tracking-wide text-ink-muted">Mandatory</p>
        )}
      </div>
    </button>
  )
}
