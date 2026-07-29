import { useEffect, useState } from 'react'
import PageContainer from '../components/PageContainer'
import { getUserSettings } from '../services/settingsService'
import { getAllTrainingSplits } from '../services/trainingSplitService'
import { getAllExercises } from '../services/exerciseService'
import { getAllMovementCategories } from '../services/movementCategoryService'
import type { UserSettings, TrainingSplit } from '../models'

interface DataCheck {
  settings: UserSettings
  splitCount: number
  splitNames: string[]
  categoryCount: number
  exerciseCount: number
}

export default function Home() {
  const today = new Date()
  const dateLabel = today.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const [check, setCheck] = useState<DataCheck | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function runCheck() {
      try {
        const settings = await getUserSettings()
        const splits: TrainingSplit[] = await getAllTrainingSplits()
        const categories = await getAllMovementCategories()
        const exercises = await getAllExercises()

        if (!cancelled) {
          setCheck({
            settings,
            splitCount: splits.length,
            splitNames: splits.map((s) => s.name),
            categoryCount: categories.length,
            exerciseCount: exercises.length,
          })
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error reading the database.')
        }
      }
    }

    runCheck()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <PageContainer>
      <header className="mb-6">
        <p className="text-sm text-ink-muted">Good to see you</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink-primary">{dateLabel}</h1>
      </header>

      <section className="rounded-2xl border border-line bg-surface-1 p-5 shadow-card">
        <h2 className="text-sm font-medium text-ink-secondary">Coach summary</h2>
        <p className="mt-2 text-ink-muted">
          Your coach summary, today's plan, and workout generation will appear
          here once the planning and generation systems are built in later
          phases.
        </p>
      </section>

      {/* Temporary Phase 2 verification panel — remove once Phase 3+ gives
          this data a real home in the Exercises and Edit App screens. */}
      <section className="mt-4 rounded-2xl border border-dashed border-line bg-surface-1/50 p-5">
        <h2 className="text-sm font-medium text-ink-secondary">
          Phase 2 data check (temporary)
        </h2>
        {error && <p className="mt-2 text-status-missed">Error: {error}</p>}
        {!error && !check && <p className="mt-2 text-ink-muted">Loading from IndexedDB…</p>}
        {check && (
          <ul className="mt-2 space-y-1 text-ink-muted">
            <li>Settings loaded — goal: {check.settings.goal}, units: {check.settings.units}</li>
            <li>
              Training splits: {check.splitCount} ({check.splitNames.join(', ')})
            </li>
            <li>Movement categories: {check.categoryCount}</li>
            <li>Exercises stored: {check.exerciseCount}</li>
          </ul>
        )}
      </section>
    </PageContainer>
  )
}
