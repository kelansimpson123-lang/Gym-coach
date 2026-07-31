import { useEffect, useMemo, useState } from 'react'
import PageContainer from '../components/PageContainer'
import Button from '../components/Button'
import {
  daysInMonth,
  dayLabel,
  firstWeekdayOfMonth,
  monthLabel,
  todayISO,
  toISODate,
} from '../utils/date'
import { ensureScheduleForMonth, upsertScheduleEntry } from '../services/workScheduleService'
import { ensureMonthlyPlan, saveMonthlyPlan, updatePlanDay } from '../services/monthlyPlanService'
import { getActiveTrainingSplits } from '../services/trainingSplitService'
import { assignSplitsToPlan } from '../coach/monthlyPlanner'
import type { MonthlyPlan, PlannedDay, ShiftType, TrainingSplit, WorkScheduleEntry } from '../models'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function dayVisual(day: PlannedDay | undefined, today: string) {
  if (!day) return { dot: 'bg-transparent', ring: '' }
  if (!day.isAvailableForTraining) return { dot: 'bg-status-rest', ring: '' }
  if (!day.assignedSplitId) return { dot: 'bg-transparent', ring: 'ring-1 ring-inset ring-line' }
  if (day.date < today) return { dot: 'bg-status-missed', ring: '' }
  return { dot: 'bg-accent', ring: '' }
}

export default function Calendar() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1) // 1-12

  const [schedule, setSchedule] = useState<WorkScheduleEntry[]>([])
  const [plan, setPlan] = useState<MonthlyPlan | null>(null)
  const [splits, setSplits] = useState<TrainingSplit[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const today = todayISO()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setSelectedDate(null)

    async function load() {
      const sched = await ensureScheduleForMonth(year, month)
      const monthPlan = await ensureMonthlyPlan(year, month, sched)
      const activeSplits = await getActiveTrainingSplits()
      if (!cancelled) {
        setSchedule(sched)
        setPlan(monthPlan)
        setSplits(activeSplits)
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [year, month])

  const dayByDate = useMemo(() => {
    const map = new Map<string, PlannedDay>()
    plan?.days.forEach((d) => map.set(d.date, d))
    return map
  }, [plan])

  const scheduleByDate = useMemo(() => {
    const map = new Map<string, WorkScheduleEntry>()
    schedule.forEach((s) => map.set(s.date, s))
    return map
  }, [schedule])

  const splitById = useMemo(() => {
    const map = new Map<string, TrainingSplit>()
    splits.forEach((s) => map.set(s.id, s))
    return map
  }, [splits])

  const totalDays = daysInMonth(year, month)
  const leadingBlanks = firstWeekdayOfMonth(year, month)

  function goToMonth(delta: number) {
    const base = new Date(year, month - 1 + delta, 1)
    setYear(base.getFullYear())
    setMonth(base.getMonth() + 1)
  }

  async function handleGeneratePlan() {
    if (!plan || splits.length === 0) return
    setGenerating(true)
    try {
      const updated = assignSplitsToPlan(plan, splits)
      const saved = await saveMonthlyPlan(updated)
      setPlan(saved)
    } finally {
      setGenerating(false)
    }
  }

  async function handleRebalanceFrom(date: string) {
    if (!plan || splits.length === 0) return
    setGenerating(true)
    try {
      const updated = assignSplitsToPlan(plan, splits, date)
      const saved = await saveMonthlyPlan(updated)
      setPlan(saved)
    } finally {
      setGenerating(false)
    }
  }

  async function handleToggleAvailability(date: string, available: boolean) {
    const existingEntry = scheduleByDate.get(date)
    const entry: WorkScheduleEntry = {
      date,
      shiftType: existingEntry?.shiftType ?? 'off',
      availableForTraining: available,
      notes: existingEntry?.notes,
    }
    await upsertScheduleEntry(entry)
    setSchedule((prev) => [...prev.filter((s) => s.date !== date), entry])

    if (plan) {
      const changes: Partial<PlannedDay> = available
        ? { isAvailableForTraining: true, status: 'planned' }
        : { isAvailableForTraining: false, assignedSplitId: null, status: 'rest' }
      const updated = await updatePlanDay(plan, date, changes)
      setPlan(updated)
    }
  }

  async function handleShiftTypeChange(date: string, shiftType: ShiftType) {
    const existingEntry = scheduleByDate.get(date)
    const entry: WorkScheduleEntry = {
      date,
      shiftType,
      availableForTraining: existingEntry?.availableForTraining ?? true,
      notes: existingEntry?.notes,
    }
    await upsertScheduleEntry(entry)
    setSchedule((prev) => [...prev.filter((s) => s.date !== date), entry])
  }

  async function handleAssignSplit(date: string, splitId: string | null) {
    if (!plan) return
    const updated = await updatePlanDay(plan, date, { assignedSplitId: splitId, status: 'planned' })
    setPlan(updated)
  }

  const selectedDay = selectedDate ? dayByDate.get(selectedDate) : undefined
  const selectedSchedule = selectedDate ? scheduleByDate.get(selectedDate) : undefined

  return (
    <PageContainer>
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-primary">Calendar</h1>
          <p className="mt-1 text-sm text-ink-muted">Monthly planning and history</p>
        </div>
      </header>

      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => goToMonth(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink-secondary hover:bg-surface-2"
          aria-label="Previous month"
        >
          ‹
        </button>
        <p className="font-medium text-ink-primary">{monthLabel(year, month)}</p>
        <button
          onClick={() => goToMonth(1)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink-secondary hover:bg-surface-2"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {loading ? (
        <p className="text-ink-muted">Loading…</p>
      ) : (
        <>
          <div className="rounded-2xl border border-line bg-surface-1 p-3 shadow-card">
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-ink-muted">
              {WEEKDAY_LABELS.map((w) => (
                <div key={w} className="py-1">
                  {w}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: leadingBlanks }).map((_, i) => (
                <div key={`blank-${i}`} />
              ))}
              {Array.from({ length: totalDays }, (_, i) => i + 1).map((dayNum) => {
                const date = toISODate(year, month, dayNum)
                const day = dayByDate.get(date)
                const visual = dayVisual(day, today)
                const isToday = date === today
                const isSelected = date === selectedDate

                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={[
                      'flex aspect-square flex-col items-center justify-center rounded-lg text-xs transition-colors',
                      isSelected ? 'bg-surface-3' : 'hover:bg-surface-2',
                      isToday ? 'font-semibold text-ink-primary' : 'text-ink-secondary',
                    ].join(' ')}
                  >
                    <span>{dayNum}</span>
                    <span className={['mt-1 h-1.5 w-1.5 rounded-full', visual.dot, visual.ring].join(' ')} />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-muted">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Planned
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-status-missed" /> Missed
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-status-rest" /> Rest
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full ring-1 ring-inset ring-line" /> Unplanned
            </span>
          </div>

          <div className="mt-4 flex gap-3">
            <Button onClick={handleGeneratePlan} disabled={generating || splits.length === 0} className="flex-1">
              {generating ? 'Generating…' : 'Generate Training Plan'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleRebalanceFrom(today)}
              disabled={generating || splits.length === 0}
            >
              Rebalance Remaining Month
            </Button>
          </div>
          {splits.length === 0 && (
            <p className="mt-2 text-xs text-ink-muted">
              Add an active training split in Edit App before generating a plan.
            </p>
          )}

          {selectedDate && (
            <section className="mt-5 rounded-2xl border border-line bg-surface-1 p-4 shadow-card">
              <h2 className="font-medium text-ink-primary">{dayLabel(selectedDate)}</h2>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-ink-secondary">Available for training</span>
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-[#8FBF6B]"
                  checked={selectedDay?.isAvailableForTraining ?? true}
                  onChange={(e) => handleToggleAvailability(selectedDate, e.target.checked)}
                />
              </div>

              <div className="mt-3">
                <label className="mb-1.5 block text-xs font-medium text-ink-secondary">
                  Shift
                </label>
                <select
                  className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-base text-ink-primary"
                  value={selectedSchedule?.shiftType ?? 'off'}
                  onChange={(e) => handleShiftTypeChange(selectedDate, e.target.value as ShiftType)}
                >
                  <option value="day">Day shift</option>
                  <option value="night">Night shift</option>
                  <option value="off">Off</option>
                  <option value="holiday">Holiday</option>
                </select>
              </div>

              {selectedDay?.isAvailableForTraining && (
                <div className="mt-3">
                  <label className="mb-1.5 block text-xs font-medium text-ink-secondary">
                    Assigned split
                  </label>
                  <select
                    className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-base text-ink-primary"
                    value={selectedDay.assignedSplitId ?? ''}
                    onChange={(e) => handleAssignSplit(selectedDate, e.target.value || null)}
                  >
                    <option value="">Not assigned</option>
                    {splits.map((split) => (
                      <option key={split.id} value={split.id}>
                        {split.name}
                      </option>
                    ))}
                  </select>
                  {selectedDay.assignedSplitId && splitById.get(selectedDay.assignedSplitId) && (
                    <p className="mt-1 text-xs text-ink-muted">
                      {splitById.get(selectedDay.assignedSplitId)?.name}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => handleRebalanceFrom(selectedDate)}
                  disabled={generating}
                >
                  Rebalance from here
                </Button>
                <Button variant="ghost" onClick={() => setSelectedDate(null)}>
                  Close
                </Button>
              </div>
            </section>
          )}
        </>
      )}
    </PageContainer>
  )
}
