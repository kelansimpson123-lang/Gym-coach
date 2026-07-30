import type { MonthlyPlan, PlannedDay, TrainingSplit } from '../models'

/**
 * Assigns a split to every available day in the plan that doesn't already
 * have one (or, when `fromDate` is given, re-assigns every available day
 * from that date forward — used by "Rebalance Remaining Month").
 *
 * Approach: for each available day, in date order, pick whichever active
 * split has gone the longest without being trained. Ties are broken by
 * whichever split has been assigned the fewest times so far this month,
 * then by the split's configured order. This keeps frequency balanced and
 * avoids back-to-back repeats of the same split without needing full
 * workout history yet — Phase 8 will feed real training history in here
 * so "previous months" also count toward recovery, not just this month.
 */
export function assignSplitsToPlan(
  plan: MonthlyPlan,
  activeSplits: TrainingSplit[],
  fromDate?: string,
): MonthlyPlan {
  if (activeSplits.length === 0) return plan

  const sortedSplits = [...activeSplits].sort((a, b) => a.order - b.order)
  const lastAssignedIndex = new Map<string, number>()
  const assignmentCount = new Map<string, number>()
  for (const split of sortedSplits) assignmentCount.set(split.id, 0)

  const days = [...plan.days].sort((a, b) => a.date.localeCompare(b.date))

  // Seed recency/counts from days that stay fixed (before fromDate, or all
  // days if we're generating fresh) so a rebalance still respects what
  // already happened earlier in the month.
  days.forEach((day, index) => {
    const isFixed = fromDate ? day.date < fromDate : false
    if (isFixed && day.assignedSplitId) {
      lastAssignedIndex.set(day.assignedSplitId, index)
      assignmentCount.set(
        day.assignedSplitId,
        (assignmentCount.get(day.assignedSplitId) ?? 0) + 1,
      )
    }
  })

  const updatedDays: PlannedDay[] = days.map((day, index) => {
    const isFixed = fromDate ? day.date < fromDate : Boolean(day.assignedSplitId)
    if (!day.isAvailableForTraining || isFixed) {
      return day
    }

    // Pick the split with the longest gap since it was last trained.
    let bestSplit = sortedSplits[0]
    for (const split of sortedSplits) {
      const lastIndex = lastAssignedIndex.get(split.id)
      const gap = lastIndex === undefined ? Infinity : index - lastIndex
      const bestSplitLastIndex = lastAssignedIndex.get(bestSplit.id)
      const bestGapValue = bestSplitLastIndex === undefined ? Infinity : index - bestSplitLastIndex

      const splitCount = assignmentCount.get(split.id) ?? 0
      const bestCount = assignmentCount.get(bestSplit.id) ?? 0

      const better =
        gap > bestGapValue || (gap === bestGapValue && splitCount < bestCount)

      if (better) {
        bestSplit = split
      }
    }

    lastAssignedIndex.set(bestSplit.id, index)
    assignmentCount.set(bestSplit.id, (assignmentCount.get(bestSplit.id) ?? 0) + 1)

    return { ...day, assignedSplitId: bestSplit.id, status: 'planned' as const }
  })

  return { ...plan, days: updatedDays }
}
