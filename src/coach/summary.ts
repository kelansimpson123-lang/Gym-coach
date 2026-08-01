import { getDB } from '../database/db'
import { STORES } from '../database/schema'
import { monthId, todayISO } from '../utils/date'
import type { Exercise } from '../models'

export interface CoachSummary {
  completionText: string | null
  balanceMessage: string | null
}

/** How many days back counts as "recent" for the muscle-balance check. */
const BALANCE_WINDOW_DAYS = 30

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export async function getCoachSummary(): Promise<CoachSummary> {
  const db = await getDB()
  const today = todayISO()
  const [year, month] = today.split('-').map(Number)

  // Monthly consistency: planned-and-available days so far this month vs
  // how many of those already have a logged session.
  const plan = await db.get(STORES.monthlyPlans, monthId(year, month))
  let completionText: string | null = null
  if (plan) {
    const plannedSoFar = plan.days.filter(
      (d) => d.isAvailableForTraining && d.assignedSplitId && d.date <= today,
    )
    if (plannedSoFar.length > 0) {
      const sessions = await db.getAll(STORES.workoutSessions)
      const loggedDates = new Set(sessions.map((s) => s.date))
      const logged = plannedSoFar.filter((d) => loggedDates.has(d.date)).length
      completionText = `${logged} of ${plannedSoFar.length} planned sessions logged this month.`
    }
  }

  // Muscle balance: which trained muscle group has had the least volume
  // in the last 30 days, relative to the others.
  const cutoff = daysAgo(BALANCE_WINDOW_DAYS)
  const [performance, exercises] = await Promise.all([
    db.getAll(STORES.exercisePerformance),
    db.getAll(STORES.exercises),
  ])
  const exerciseById = new Map<string, Exercise>(exercises.map((e) => [e.id, e]))

  const countsByMuscle = new Map<string, number>()
  for (const entry of performance) {
    if (entry.date < cutoff) continue
    const exercise = exerciseById.get(entry.exerciseId)
    if (!exercise) continue
    countsByMuscle.set(
      exercise.mainMuscleGroup,
      (countsByMuscle.get(exercise.mainMuscleGroup) ?? 0) + 1,
    )
  }

  let balanceMessage: string | null = null
  if (countsByMuscle.size >= 2) {
    const entries = [...countsByMuscle.entries()]
    const total = entries.reduce((sum, [, count]) => sum + count, 0)
    const average = total / entries.length
    const [lowestMuscle, lowestCount] = entries.sort((a, b) => a[1] - b[1])[0]

    if (lowestCount < average * 0.5) {
      balanceMessage = `${lowestMuscle} training has been lower than the rest over the last month — worth prioritising soon.`
    }
  }

  return { completionText, balanceMessage }
}
