import type {
  BudgetGoal,
  BudgetBalance,
  DistributionResult,
  ImportanceLevel,
} from "@/lib/types"

/**
 * Weighted distribution algorithm.
 *
 * Weight per importance level:
 *   4 → weight 4
 *   3 → weight 3
 *   2 → weight 2
 *   1 → weight 1
 *
 * Each goal gets: (its weight / total weight) * available amount,
 * capped at the remaining amount needed for that goal.
 * Any leftover (from capped goals) is redistributed in another pass.
 */
const IMPORTANCE_WEIGHT: Record<ImportanceLevel, number> = {
  4: 4,
  3: 3,
  2: 2,
  1: 1,
}

export function distributeIncome(
  income: number,
  _balance: BudgetBalance,
  goals: BudgetGoal[]
): { results: DistributionResult[]; available: number } {
  // Резерв уже учтён в store до вызова — income = сумма после пополнения резерва
  const available = Math.max(0, income)

  // 2. Filter only active (non-completed) goals that still need money
  const activeGoals = goals.filter(
    (g) => !g.completed && g.currentAmount < g.targetAmount
  )

  if (activeGoals.length === 0 || available <= 0) {
    return { results: [], available }
  }

  // 3. Multi-pass weighted distribution
  let remaining = available
  const allocated = new Map<string, number>()
  let pool = [...activeGoals]

  while (remaining > 0.01 && pool.length > 0) {
    const totalWeight = pool.reduce(
      (sum, g) => sum + IMPORTANCE_WEIGHT[g.importance],
      0
    )

    let anyChange = false

    for (const goal of pool) {
      const share =
        (IMPORTANCE_WEIGHT[goal.importance] / totalWeight) * remaining
      const needed = goal.targetAmount - goal.currentAmount - (allocated.get(goal.id) ?? 0)
      const give = Math.min(share, Math.max(0, needed))
      const rounded = Math.round(give * 100) / 100

      if (rounded > 0) {
        allocated.set(goal.id, (allocated.get(goal.id) ?? 0) + rounded)
        anyChange = true
      }
    }

    if (!anyChange) break

    // Recalculate remaining
    const totalAllocated = Array.from(allocated.values()).reduce(
      (sum, v) => sum + v,
      0
    )
    remaining = Math.round((available - totalAllocated) * 100) / 100

    // Remove goals that are fully funded
    pool = pool.filter((g) => {
      const needed = g.targetAmount - g.currentAmount - (allocated.get(g.id) ?? 0)
      return needed > 0.01
    })
  }

  const results: DistributionResult[] = activeGoals
    .filter((g) => (allocated.get(g.id) ?? 0) > 0)
    .map((g) => ({
      goalId: g.id,
      goalName: g.name,
      amount: allocated.get(g.id)!,
    }))

  return { results, available }
}
