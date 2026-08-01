import { useEffect, useState } from 'react'
import PageContainer from '../components/PageContainer'
import Button from '../components/Button'
import {
  getAllTrainingSplits,
  addTrainingSplit,
  updateTrainingSplit,
  deleteTrainingSplit,
  reorderTrainingSplits,
} from '../services/trainingSplitService'
import { getCoachRules, updateCoachRules } from '../services/coachRulesService'
import { getUserSettings, updateUserSettings } from '../services/settingsService'
import { exportAllData } from '../database/exportData'
import { resetDatabase } from '../database/resetDatabase'
import { MUSCLE_GROUPS } from '../components/ExerciseForm'
import type { CoachRules, TrainingSplit, UserSettings, Units } from '../models'

export default function EditApp() {
  const [splits, setSplits] = useState<TrainingSplit[]>([])
  const [coachRules, setCoachRulesState] = useState<CoachRules | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const [addingSplit, setAddingSplit] = useState(false)
  const [newSplitName, setNewSplitName] = useState('')
  const [newSplitGroups, setNewSplitGroups] = useState<string[]>([])
  const [confirmingDeleteSplit, setConfirmingDeleteSplit] = useState<string | null>(null)

  const [newCardioName, setNewCardioName] = useState('')
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [resetting, setResetting] = useState(false)

  async function refresh() {
    const [allSplits, rules, userSettings] = await Promise.all([
      getAllTrainingSplits(),
      getCoachRules(),
      getUserSettings(),
    ])
    setSplits(allSplits)
    setCoachRulesState(rules)
    setSettings(userSettings)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleRenameSplit(id: string, name: string) {
    await updateTrainingSplit(id, { name } as Partial<TrainingSplit>)
    setSplits((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)))
  }

  async function handleToggleActive(split: TrainingSplit) {
    const updated = await updateTrainingSplit(split.id, { isActive: !split.isActive })
    setSplits((prev) => prev.map((s) => (s.id === split.id ? updated : s)))
  }

  async function handleMove(split: TrainingSplit, direction: -1 | 1) {
    const sorted = [...splits].sort((a, b) => a.order - b.order)
    const index = sorted.findIndex((s) => s.id === split.id)
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= sorted.length) return
    const reordered = [...sorted]
    ;[reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]]
    await reorderTrainingSplits(reordered.map((s) => s.id))
    await refresh()
  }

  async function handleDeleteSplit(id: string) {
    await deleteTrainingSplit(id)
    setConfirmingDeleteSplit(null)
    await refresh()
  }

  function toggleNewSplitGroup(group: string) {
    setNewSplitGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group],
    )
  }

  async function handleAddSplit() {
    const name = newSplitName.trim()
    if (!name || newSplitGroups.length === 0) return
    await addTrainingSplit({
      name,
      order: splits.length,
      isActive: true,
      muscleGroups: newSplitGroups,
      exerciseTargets: newSplitGroups.map((muscleGroup) => ({
        muscleGroup,
        targetExerciseCount: 3,
      })),
    })
    setAddingSplit(false)
    setNewSplitName('')
    setNewSplitGroups([])
    await refresh()
  }

  async function handleCoachRuleChange(changes: Partial<CoachRules>) {
    if (!coachRules) return
    const updated = await updateCoachRules(changes)
    setCoachRulesState(updated)
  }

  async function handleUnitsChange(units: Units) {
    const updated = await updateUserSettings({ units })
    setSettings(updated)
  }

  async function handleAddCardioOption() {
    if (!settings) return
    const name = newCardioName.trim()
    if (!name || settings.cardioOptions.includes(name)) {
      setNewCardioName('')
      return
    }
    const updated = await updateUserSettings({ cardioOptions: [...settings.cardioOptions, name] })
    setSettings(updated)
    setNewCardioName('')
  }

  async function handleRemoveCardioOption(name: string) {
    if (!settings) return
    const updated = await updateUserSettings({
      cardioOptions: settings.cardioOptions.filter((c) => c !== name),
    })
    setSettings(updated)
  }

  async function handleExport() {
    setExporting(true)
    try {
      await exportAllData()
    } finally {
      setExporting(false)
    }
  }

  async function handleReset() {
    setResetting(true)
    await resetDatabase()
    // resetDatabase reloads the page, so nothing else runs after this.
  }

  const sortedSplits = [...splits].sort((a, b) => a.order - b.order)

  return (
    <PageContainer>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-ink-primary">Edit App</h1>
        <p className="mt-1 text-sm text-ink-muted">Settings and customisation</p>
      </header>

      {loading && <p className="text-ink-muted">Loading settings…</p>}

      {!loading && (
        <div className="space-y-6">
          {/* Training Settings — split management */}
          <section className="rounded-2xl border border-line bg-surface-1 p-5 shadow-card">
            <h2 className="text-sm font-medium text-ink-secondary">Training Split</h2>
            <div className="mt-3 space-y-2">
              {sortedSplits.map((split, index) => (
                <div key={split.id} className="rounded-xl border border-line bg-surface-2 p-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      defaultValue={split.name}
                      onBlur={(e) => handleRenameSplit(split.id, e.target.value)}
                      className="min-w-0 flex-1 rounded-lg border border-line bg-surface-1 px-2 py-1.5 text-base text-ink-primary"
                    />
                    <button
                      onClick={() => handleMove(split, -1)}
                      disabled={index === 0}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-secondary hover:bg-surface-3 disabled:opacity-30"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleMove(split, 1)}
                      disabled={index === sortedSplits.length - 1}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-secondary hover:bg-surface-3 disabled:opacity-30"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 text-ink-secondary">
                      <input
                        type="checkbox"
                        checked={split.isActive}
                        onChange={() => handleToggleActive(split)}
                        className="h-4 w-4 accent-[#8FBF6B]"
                      />
                      Active
                    </label>
                    {confirmingDeleteSplit === split.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteSplit(split.id)}
                          className="font-medium text-status-missed"
                        >
                          Confirm delete
                        </button>
                        <button
                          onClick={() => setConfirmingDeleteSplit(null)}
                          className="text-ink-muted"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmingDeleteSplit(split.id)}
                        className="text-status-missed"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-ink-muted">
                    {split.muscleGroups.join(', ')}
                  </p>
                </div>
              ))}
            </div>

            {addingSplit ? (
              <div className="mt-3 space-y-3 rounded-xl border border-line bg-surface-2 p-3">
                <input
                  type="text"
                  value={newSplitName}
                  onChange={(e) => setNewSplitName(e.target.value)}
                  placeholder="Split name, e.g. Push"
                  className="w-full rounded-lg border border-line bg-surface-1 px-3 py-2 text-base text-ink-primary"
                />
                <div className="flex flex-wrap gap-2">
                  {MUSCLE_GROUPS.map((group) => (
                    <button
                      key={group}
                      type="button"
                      onClick={() => toggleNewSplitGroup(group)}
                      className={[
                        'rounded-full px-3 py-1.5 text-xs font-medium',
                        newSplitGroups.includes(group)
                          ? 'bg-accent text-surface-0'
                          : 'bg-surface-3 text-ink-secondary',
                      ].join(' ')}
                    >
                      {group}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddSplit} className="flex-1">
                    Add split
                  </Button>
                  <Button variant="secondary" onClick={() => setAddingSplit(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingSplit(true)}
                className="mt-3 text-xs font-medium text-accent"
              >
                + Add split
              </button>
            )}
          </section>

          {/* Coach Settings */}
          {coachRules && (
            <section className="rounded-2xl border border-line bg-surface-1 p-5 shadow-card">
              <h2 className="text-sm font-medium text-ink-secondary">Coach Settings</h2>
              <div className="mt-3 space-y-3">
                {(
                  [
                    ['alwaysIncludeRearDelts', 'Always include rear delts'],
                    ['alwaysIncludeCompoundMovement', 'Always include a compound movement'],
                    ['avoidRepeatingExercisesConsecutively', 'Avoid repeating exercises consecutively'],
                    ['preferFreeWeights', 'Prefer free weights'],
                    ['preferMachines', 'Prefer machines'],
                  ] as [keyof CoachRules, string][]
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between text-sm">
                    <span className="text-ink-secondary">{label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(coachRules[key])}
                      onChange={(e) => handleCoachRuleChange({ [key]: e.target.checked })}
                      className="h-5 w-5 accent-[#8FBF6B]"
                    />
                  </label>
                ))}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-secondary">Target rep threshold</span>
                  <input
                    type="number"
                    min={1}
                    value={coachRules.targetRepThreshold}
                    onChange={(e) =>
                      handleCoachRuleChange({ targetRepThreshold: Number(e.target.value) })
                    }
                    className="w-16 rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-base text-ink-primary"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-secondary">Minimum compound movements</span>
                  <input
                    type="number"
                    min={0}
                    value={coachRules.minimumCompoundMovements}
                    onChange={(e) =>
                      handleCoachRuleChange({ minimumCompoundMovements: Number(e.target.value) })
                    }
                    className="w-16 rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-base text-ink-primary"
                  />
                </div>
              </div>
            </section>
          )}

          {/* Schedule Settings */}
          <section className="rounded-2xl border border-line bg-surface-1 p-5 shadow-card">
            <h2 className="text-sm font-medium text-ink-secondary">Schedule</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Work shifts, rest days, and gym availability are set per-day in the Calendar tab —
              tap any date there to edit it.
            </p>
          </section>

          {/* Cardio Settings */}
          {settings && (
            <section className="rounded-2xl border border-line bg-surface-1 p-5 shadow-card">
              <h2 className="text-sm font-medium text-ink-secondary">Cardio Options</h2>
              <div className="mt-3 space-y-2">
                {settings.cardioOptions.map((option) => (
                  <div
                    key={option}
                    className="flex items-center justify-between rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm"
                  >
                    <span className="text-ink-primary">{option}</span>
                    <button
                      onClick={() => handleRemoveCardioOption(option)}
                      className="text-xs font-medium text-status-missed"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newCardioName}
                  onChange={(e) => setNewCardioName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCardioOption()}
                  placeholder="e.g. Swimming"
                  className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-base text-ink-primary"
                />
                <Button variant="secondary" onClick={handleAddCardioOption}>
                  Add
                </Button>
              </div>
            </section>
          )}

          {/* General Settings */}
          {settings && (
            <section className="rounded-2xl border border-line bg-surface-1 p-5 shadow-card">
              <h2 className="text-sm font-medium text-ink-secondary">General</h2>

              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-ink-secondary">Units</span>
                <div className="flex overflow-hidden rounded-lg border border-line">
                  {(['kg', 'lb'] as Units[]).map((unit) => (
                    <button
                      key={unit}
                      onClick={() => handleUnitsChange(unit)}
                      className={[
                        'px-3 py-1.5 text-xs font-medium',
                        settings.units === unit
                          ? 'bg-accent text-surface-0'
                          : 'bg-surface-2 text-ink-secondary',
                      ].join(' ')}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-1 text-[11px] text-ink-muted">
                Note: exercise weights are currently displayed in kg regardless of this setting —
                full unit conversion is a future improvement.
              </p>

              <div className="mt-4 border-t border-line pt-4">
                <Button variant="secondary" onClick={handleExport} disabled={exporting} className="w-full">
                  {exporting ? 'Exporting…' : 'Export my data'}
                </Button>
              </div>

              <div className="mt-3">
                {!confirmingReset ? (
                  <Button
                    variant="danger"
                    onClick={() => setConfirmingReset(true)}
                    className="w-full"
                  >
                    Reset app (delete all data)
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-status-missed">
                      This permanently deletes everything — exercises, history, plans. Export your
                      data first if you want a backup.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="danger"
                        onClick={handleReset}
                        disabled={resetting}
                        className="flex-1"
                      >
                        {resetting ? 'Resetting…' : 'Yes, delete everything'}
                      </Button>
                      <Button variant="secondary" onClick={() => setConfirmingReset(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </PageContainer>
  )
}
