import { getDB } from '../database/db'
import { STORES } from '../database/schema'
import { monthId } from '../utils/date'
import { nowISO } from '../utils/id'
import type { MonthlyPlan, PlannedDay, WorkScheduleEntry } from '../models'

export async function getMonthlyPlan(
  year: number,
  month: number,
): Promise<MonthlyPlan | undefined> {
  const db = await getDB()
  return db.get(STORES.monthlyPlans, monthId(year, month))
}

export async function saveMonthlyPlan(plan: MonthlyPlan): Promise<MonthlyPlan> {
  const db = await getDB()
  const updated: MonthlyPlan = { ...plan, updatedAt: nowISO() }
  await db.put(STORES.monthlyPlans, updated)
  return updated
}

/** Creates the plan record from the work schedule if it doesn't exist yet.
 * Existing plans are left untouched — this never overwrites assignments. */
export async function ensureMonthlyPlan(
  year: number,
  month: number,
  schedule: WorkScheduleEntry[],
): Promise<MonthlyPlan> {
  const existing = await getMonthlyPlan(year, month)
  if (existing) return existing

  const days: PlannedDay[] = schedule
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => ({
      date: entry.date,
      isAvailableForTraining: entry.availableForTraining,
      assignedSplitId: null,
      status: entry.availableForTraining ? 'planned' : 'rest',
    }))

  const timestamp = nowISO()
  const plan: MonthlyPlan = {
    id: monthId(year, month),
    year,
    month,
    days,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  return saveMonthlyPlan(plan)
}

/** Applies a partial update to a single day within a plan and saves it. */
export async function updatePlanDay(
  plan: MonthlyPlan,
  date: string,
  changes: Partial<PlannedDay>,
): Promise<MonthlyPlan> {
  const days = plan.days.map((day) => (day.date === date ? { ...day, ...changes } : day))
  return saveMonthlyPlan({ ...plan, days })
}
