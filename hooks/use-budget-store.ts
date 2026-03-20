"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import type {
  BudgetGoal,
  BudgetBalance,
  BudgetGoalCategory,
  ImportanceLevel,
  IncomeEntry,
  ExpenseEntry,
  Deposit,
  DistributionResult,
  SavingsGoal,
  EarningEntry,
} from "@/lib/types"
import { distributeIncome } from "@/lib/budget-engine"
import { fetchBudgetState, saveBudgetState } from "@/lib/api-client"

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

const DEFAULT_BALANCE: BudgetBalance = {
  cardBalance: 0,
  reserveTarget: 4000,
  reserveCurrent: 4000,
}

/**
 * Авто-повышение важности при приближении дедлайна.
 * ≤ 7 дней → 4, ≤ 30 дней → min(original+1, 4), ≤ 60 дней → min(original+1, 3)
 */
function computeEffectiveImportance(goal: BudgetGoal): ImportanceLevel {
  if (goal.completed) return goal.importance
  const now = Date.now()
  const deadline = new Date(goal.deadline).getTime()
  const daysLeft = Math.max(0, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)))

  if (daysLeft <= 7) return 4
  if (daysLeft <= 30) return Math.min(goal.importance + 1, 4) as ImportanceLevel
  if (daysLeft <= 60) return Math.min(goal.importance + 1, 3) as ImportanceLevel
  return goal.importance
}

export function useBudgetStore() {
  const [balance, setBalance] = useState<BudgetBalance>(DEFAULT_BALANCE)
  const [goals, setGoals] = useState<BudgetGoal[]>([])
  const [incomeHistory, setIncomeHistory] = useState<IncomeEntry[]>([])
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [lastDistribution, setLastDistribution] = useState<
    DistributionResult[] | null
  >(null)
  const [lastReserveTopUp, setLastReserveTopUp] = useState(0)

  // Goals with auto-boosted importance
  const effectiveGoals = useMemo(
    () =>
      goals.map((g) => ({
        ...g,
        importance: computeEffectiveImportance(g),
      })),
    [goals]
  )

  // Load from API
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const stored = await fetchBudgetState()
        if (cancelled || !stored) return
        setBalance(stored.balance)
        setGoals(stored.goals)
        setIncomeHistory(stored.incomeHistory)
        setExpenses(stored.expenses ?? [])
        setDeposits(stored.deposits ?? [])
        setSavingsGoals(stored.savingsGoals ?? [])
      } catch (error) {
        console.error("Failed to load budget state:", error)
      } finally {
        if (!cancelled) setIsLoaded(true)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Persist to API
  useEffect(() => {
    if (!isLoaded) return
    const timeout = window.setTimeout(() => {
      saveBudgetState({ balance, goals, incomeHistory, expenses, deposits, savingsGoals }).catch(
        (error) => console.error("Failed to save budget state:", error)
      )
    }, 300)
    return () => window.clearTimeout(timeout)
  }, [isLoaded, balance, goals, incomeHistory, expenses, deposits, savingsGoals])

  // ── Balance ──
  const updateBalance = useCallback(
    (updates: Partial<BudgetBalance>) => {
      setBalance((prev) => ({ ...prev, ...updates }))
    },
    []
  )

  // ── Goals ──
  const addGoal = useCallback(
    (params: {
      name: string
      targetAmount: number
      deadline: string
      category: BudgetGoalCategory
      importance: ImportanceLevel
    }) => {
      if (!params.name.trim() || params.targetAmount <= 0) return
      const newGoal: BudgetGoal = {
        id: generateId(),
        name: params.name.trim(),
        targetAmount: params.targetAmount,
        currentAmount: 0,
        deadline: params.deadline,
        category: params.category,
        importance: params.importance,
        completed: false,
        createdAt: new Date().toISOString(),
      }
      setGoals((prev) => [...prev, newGoal])
    },
    []
  )

  const removeGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id))
  }, [])

  const updateGoal = useCallback(
    (id: string, updates: Partial<BudgetGoal>) => {
      setGoals((prev) =>
        prev.map((g) => {
          if (g.id !== id) return g
          const updated = { ...g, ...updates }
          if (updated.currentAmount >= updated.targetAmount) updated.completed = true
          return updated
        })
      )
    },
    []
  )

  // ── Income + Distribution ──
  const addIncome = useCallback(
    (amount: number) => {
      if (amount <= 0) return null
      const entry: IncomeEntry = {
        id: generateId(),
        amount,
        date: new Date().toISOString(),
        distributed: false,
      }

      // 1. Пополняем резерв
      const reserveGap = Math.max(0, balance.reserveTarget - balance.reserveCurrent)
      const toReserve = Math.min(reserveGap, amount)
      const afterReserve = Math.round((amount - toReserve) * 100) / 100

      // 2. Распределяем остаток по целям (используем effectiveGoals с авто-важностью)
      const updatedBalance: BudgetBalance = {
        ...balance,
        reserveCurrent: balance.reserveCurrent + toReserve,
      }
      const goalsForDistribution = goals.map((g) => ({
        ...g,
        importance: computeEffectiveImportance(g),
      }))
      const { results } = distributeIncome(afterReserve, updatedBalance, goalsForDistribution)

      setGoals((prev) =>
        prev.map((g) => {
          const allocation = results.find((r) => r.goalId === g.id)
          if (!allocation) return g
          const newAmount = g.currentAmount + allocation.amount
          return {
            ...g,
            currentAmount: Math.round(newAmount * 100) / 100,
            completed: newAmount >= g.targetAmount,
          }
        })
      )

      const totalDistributed = results.reduce((s, r) => s + r.amount, 0)
      setBalance((prev) => ({
        ...prev,
        reserveCurrent: Math.round((prev.reserveCurrent + toReserve) * 100) / 100,
        cardBalance: Math.round(
          (prev.cardBalance + amount - toReserve - totalDistributed) * 100
        ) / 100,
      }))

      setIncomeHistory((prev) => [...prev, { ...entry, distributed: true }])
      setLastDistribution(results)
      setLastReserveTopUp(toReserve)
      return { results, toReserve }
    },
    [balance, goals]
  )

  const removeIncome = useCallback((id: string) => {
    setIncomeHistory((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const clearLastDistribution = useCallback(() => {
    setLastDistribution(null)
    setLastReserveTopUp(0)
  }, [])

  // ── Expenses ──
  const addExpense = useCallback(
    (amount: number, description: string) => {
      if (amount <= 0) return
      setExpenses((prev) => [
        ...prev,
        {
          id: generateId(),
          amount,
          description: description.trim() || "Расход",
          date: new Date().toISOString(),
        },
      ])
      setBalance((prev) => ({
        ...prev,
        cardBalance: Math.round((prev.cardBalance - amount) * 100) / 100,
      }))
    },
    []
  )

  const removeExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }, [])

  // ── Deposits (вклады) ──
  const addDeposit = useCallback(
    (params: {
      name: string
      bankName: string
      amount: number
      interestRate: number
      monthlyContribution: number
      startDate: string
      endDate: string
    }) => {
      if (!params.name.trim() || params.amount <= 0) return
      setDeposits((prev) => [
        ...prev,
        {
          id: generateId(),
          name: params.name.trim(),
          bankName: params.bankName.trim(),
          amount: params.amount,
          interestRate: params.interestRate,
          monthlyContribution: Math.max(0, params.monthlyContribution || 0),
          startDate: params.startDate,
          endDate: params.endDate,
          createdAt: new Date().toISOString(),
        },
      ])
    },
    []
  )

  const removeDeposit = useCallback((id: string) => {
    setDeposits((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const updateDeposit = useCallback(
    (id: string, updates: Partial<Deposit>) => {
      setDeposits((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
      )
    },
    []
  )

  // ── Analytics ──

  /** Средний доход в месяц */
  const avgMonthlyIncome = useMemo(() => {
    if (incomeHistory.length === 0) return 0
    const byMonth = new Map<string, number>()
    for (const e of incomeHistory) {
      const d = new Date(e.date)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      byMonth.set(key, (byMonth.get(key) ?? 0) + e.amount)
    }
    const total = Array.from(byMonth.values()).reduce((s, v) => s + v, 0)
    return Math.round(total / byMonth.size)
  }, [incomeHistory])

  /** Средние расходы в месяц */
  const avgMonthlyExpenses = useMemo(() => {
    if (expenses.length === 0) return 0
    const byMonth = new Map<string, number>()
    for (const e of expenses) {
      const d = new Date(e.date)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      byMonth.set(key, (byMonth.get(key) ?? 0) + e.amount)
    }
    const total = Array.from(byMonth.values()).reduce((s, v) => s + v, 0)
    return Math.round(total / byMonth.size)
  }, [expenses])

  /** Данные для графика доходов по месяцам */
  const incomeChartData = useMemo(() => {
    const byMonth = new Map<string, { label: string; income: number; expense: number; sortKey: string }>()
    const MONTH_SHORT = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]

    for (const e of incomeHistory) {
      const d = new Date(e.date)
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`
      const label = `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`
      if (!byMonth.has(key)) byMonth.set(key, { label, income: 0, expense: 0, sortKey: key })
      byMonth.get(key)!.income += e.amount
    }

    for (const e of expenses) {
      const d = new Date(e.date)
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`
      const label = `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`
      if (!byMonth.has(key)) byMonth.set(key, { label, income: 0, expense: 0, sortKey: key })
      byMonth.get(key)!.expense += e.amount
    }

    return Array.from(byMonth.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey))
  }, [incomeHistory, expenses])

  // ── Savings Goals (smart accumulation) ──

  const addSavingsGoal = useCallback(
    (params: { name: string; targetAmount: number; deadline: string; workDaysPerWeek: number }) => {
      if (!params.name.trim() || params.targetAmount <= 0) return
      setSavingsGoals((prev) => [
        ...prev,
        {
          id: generateId(),
          name: params.name.trim(),
          targetAmount: params.targetAmount,
          deadline: params.deadline,
          workDaysPerWeek: params.workDaysPerWeek,
          earnings: [],
          createdAt: new Date().toISOString(),
        },
      ])
    },
    []
  )

  const removeSavingsGoal = useCallback((id: string) => {
    setSavingsGoals((prev) => prev.filter((g) => g.id !== id))
  }, [])

  const addEarning = useCallback(
    (goalId: string, amount: number) => {
      if (amount <= 0) return
      const entry: EarningEntry = {
        id: generateId(),
        amount,
        date: new Date().toISOString(),
      }
      setSavingsGoals((prev) =>
        prev.map((g) =>
          g.id === goalId ? { ...g, earnings: [...g.earnings, entry] } : g
        )
      )
    },
    []
  )

  const removeEarning = useCallback((goalId: string, earningId: string) => {
    setSavingsGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? { ...g, earnings: g.earnings.filter((e) => e.id !== earningId) }
          : g
      )
    )
  }, [])

  const updateSavingsGoal = useCallback(
    (id: string, updates: Partial<SavingsGoal>) => {
      setSavingsGoals((prev) =>
        prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
      )
    },
    []
  )

  /**
   * Calculate smart recommendation for a savings goal.
   * Returns: average daily income, total earned, remaining,
   * weeks left, recommended work days/week, pace status.
   */
  const getSavingsRecommendation = useCallback(
    (goal: SavingsGoal) => {
      const totalEarned = goal.earnings.reduce((s, e) => s + e.amount, 0)
      const remaining = Math.max(0, goal.targetAmount - totalEarned)
      const percent = goal.targetAmount > 0 ? Math.round((totalEarned / goal.targetAmount) * 100) : 0

      // Average daily income (per work day)
      const avgDailyIncome = goal.earnings.length > 0
        ? totalEarned / goal.earnings.length
        : 0

      // Weeks left until deadline
      const now = Date.now()
      const deadline = new Date(goal.deadline).getTime()
      const msLeft = Math.max(0, deadline - now)
      const weeksLeft = msLeft / (1000 * 60 * 60 * 24 * 7)

      // How many work days per week needed to reach the goal
      const recommendedDaysPerWeek =
        avgDailyIncome > 0 && weeksLeft > 0
          ? Math.ceil(remaining / (avgDailyIncome * weeksLeft))
          : goal.workDaysPerWeek

      // Pace: how far ahead/behind the planned schedule
      // Expected earnings by now = (weeks elapsed) * workDaysPerWeek * avgDailyIncome
      const createdAt = new Date(goal.createdAt).getTime()
      const totalDuration = deadline - createdAt
      const elapsed = now - createdAt
      const expectedProgress = totalDuration > 0 ? (elapsed / totalDuration) * goal.targetAmount : 0
      const pacePercent = expectedProgress > 0
        ? Math.round(((totalEarned - expectedProgress) / expectedProgress) * 100)
        : 0

      // Average over last 30 days for recent trend
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
      const recentEarnings = goal.earnings.filter(
        (e) => new Date(e.date).getTime() >= thirtyDaysAgo
      )
      const recentAvg = recentEarnings.length > 0
        ? recentEarnings.reduce((s, e) => s + e.amount, 0) / recentEarnings.length
        : avgDailyIncome

      // Recommendation based on recent average
      const recentRecommendedDays =
        recentAvg > 0 && weeksLeft > 0
          ? Math.ceil(remaining / (recentAvg * weeksLeft))
          : recommendedDaysPerWeek

      return {
        totalEarned,
        remaining,
        percent,
        avgDailyIncome: Math.round(avgDailyIncome),
        weeksLeft: Math.round(weeksLeft * 10) / 10,
        recommendedDaysPerWeek: Math.min(7, Math.max(1, recommendedDaysPerWeek)),
        recentRecommendedDays: Math.min(7, Math.max(1, recentRecommendedDays)),
        pacePercent,
        recentAvg: Math.round(recentAvg),
        daysWorked: goal.earnings.length,
      }
    },
    []
  )

  /** Суммарный ожидаемый доход с вкладов (с учётом ежемесячных взносов) */
  const totalDepositValue = useMemo(() => {
    return deposits.reduce((sum, d) => {
      const start = new Date(d.startDate).getTime()
      const end = new Date(d.endDate).getTime()
      const years = Math.max(0, (end - start) / (1000 * 60 * 60 * 24 * 365.25))
      const months = Math.max(0, Math.round(years * 12))
      const monthly = d.monthlyContribution || 0
      const totalContributions = monthly * months
      // Начальный вклад + проценты на начальный вклад
      const baseIncome = d.amount * (d.interestRate / 100) * years
      // Ежемесячные взносы + средний процент (взносы поступают постепенно)
      const contribIncome = totalContributions * (d.interestRate / 100) * (years / 2)
      return sum + d.amount + totalContributions + baseIncome + contribIncome
    }, 0)
  }, [deposits])

  return {
    balance,
    goals,
    effectiveGoals,
    incomeHistory,
    expenses,
    deposits,
    lastDistribution,
    lastReserveTopUp,
    updateBalance,
    addGoal,
    removeGoal,
    updateGoal,
    addIncome,
    removeIncome,
    clearLastDistribution,
    addExpense,
    removeExpense,
    addDeposit,
    removeDeposit,
    updateDeposit,
    savingsGoals,
    addSavingsGoal,
    removeSavingsGoal,
    addEarning,
    removeEarning,
    updateSavingsGoal,
    getSavingsRecommendation,
    avgMonthlyIncome,
    avgMonthlyExpenses,
    incomeChartData,
    totalDepositValue,
  }
}
