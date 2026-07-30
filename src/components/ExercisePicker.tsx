import type { Exercise } from '../models'

interface ExercisePickerProps {
  exercises: Exercise[]
  onPick: (exercise: Exercise) => void
  emptyMessage?: string
}

export default function ExercisePicker({ exercises, onPick, emptyMessage }: ExercisePickerProps) {
  if (exercises.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        {emptyMessage ?? 'No matching exercises in your library yet.'}
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {exercises.map((exercise) => (
        <button
          key={exercise.id}
          onClick={() => onPick(exercise)}
          className="flex w-full items-center justify-between rounded-xl border border-line bg-surface-2 px-4 py-3 text-left text-sm hover:bg-surface-3"
        >
          <span className="text-ink-primary">{exercise.name}</span>
          <span className="text-ink-muted">
            {exercise.currentWorkingWeight === 'bodyweight'
              ? 'Bodyweight'
              : `${exercise.currentWorkingWeight}kg`}
          </span>
        </button>
      ))}
    </div>
  )
}
