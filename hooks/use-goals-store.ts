"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import type { Goal, SubTask, GoalStatus } from "@/lib/types"
import { fetchGoalsState, saveGoalsState } from "@/lib/api-client"

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

const DEFAULT_MONTHLY_GOALS: Goal[] = [
  {
    id: generateId(),
    name: "Заработать 50 000 ₽",
    description: "Достичь дохода 50 000 рублей за месяц",
    progress: 0,
    deadline: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      .toISOString()
      .split("T")[0],
    status: "in-progress",
    subtasks: [
      { id: generateId(), name: "Завершить проект для клиента", completed: false },
      { id: generateId(), name: "Запустить рекламную кампанию", completed: false },
      { id: generateId(), name: "Найти 2 новых клиента", completed: false },
    ],
    whyImportant: "Финансовая стабильность и возможность инвестировать в развитие.",
    type: "month",
  },
  {
    id: generateId(),
    name: "Прочитать 3 книги",
    description: "Прочитать 3 книги по саморазвитию",
    progress: 0,
    deadline: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      .toISOString()
      .split("T")[0],
    status: "in-progress",
    subtasks: [
      { id: generateId(), name: '"Атомные привычки"', completed: false },
      { id: generateId(), name: '"Думай медленно, решай быстро"', completed: false },
      { id: generateId(), name: '"Поток"', completed: false },
    ],
    whyImportant: "Знания формируют мышление. Чтение расширяет горизонты.",
    type: "month",
  },
  {
    id: generateId(),
    name: "20 тренировок",
    description: "Провести минимум 20 тренировок за месяц",
    progress: 0,
    deadline: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      .toISOString()
      .split("T")[0],
    status: "in-progress",
    subtasks: [
      { id: generateId(), name: "Неделя 1: 5 тренировок", completed: false },
      { id: generateId(), name: "Неделя 2: 5 тренировок", completed: false },
      { id: generateId(), name: "Неделя 3: 5 тренировок", completed: false },
      { id: generateId(), name: "Неделя 4: 5 тренировок", completed: false },
    ],
    whyImportant: "Здоровое тело - основа продуктивности и энергии.",
    type: "month",
  },
  {
    id: generateId(),
    name: "Запустить мини-проект",
    description: "Создать и запустить MVP собственного проекта",
    progress: 0,
    deadline: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      .toISOString()
      .split("T")[0],
    status: "in-progress",
    subtasks: [
      { id: generateId(), name: "Определить идею и MVP", completed: false },
      { id: generateId(), name: "Разработать прототип", completed: false },
      { id: generateId(), name: "Запустить и получить первых пользователей", completed: false },
    ],
    whyImportant: "Собственный проект - путь к независимости и росту навыков.",
    type: "month",
  },
]

const DEFAULT_YEARLY_GOALS: Goal[] = [
  {
    id: generateId(),
    name: "Доход 1 000 000 ₽/год",
    description: "Выйти на суммарный доход 1 миллион рублей за год",
    progress: 0,
    deadline: `${new Date().getFullYear()}-12-31`,
    status: "in-progress",
    subtasks: [
      { id: generateId(), name: "Q1: 200 000 ₽", completed: false },
      { id: generateId(), name: "Q2: 250 000 ₽", completed: false },
      { id: generateId(), name: "Q3: 250 000 ₽", completed: false },
      { id: generateId(), name: "Q4: 300 000 ₽", completed: false },
    ],
    whyImportant: "Финансовая свобода и возможность масштабирования.",
    type: "year",
  },
  {
    id: generateId(),
    name: "Прочитать 30 книг",
    description: "Прочитать 30 книг за год для интеллектуального роста",
    progress: 0,
    deadline: `${new Date().getFullYear()}-12-31`,
    status: "in-progress",
    subtasks: [
      { id: generateId(), name: "Q1: 8 книг", completed: false },
      { id: generateId(), name: "Q2: 8 книг", completed: false },
      { id: generateId(), name: "Q3: 7 книг", completed: false },
      { id: generateId(), name: "Q4: 7 книг", completed: false },
    ],
    whyImportant: "Непрерывное обучение - ключ к конкурентному преимуществу.",
    type: "year",
  },
  {
    id: generateId(),
    name: "Запустить свой бизнес",
    description: "Создать и монетизировать собственный продукт",
    progress: 0,
    deadline: `${new Date().getFullYear()}-12-31`,
    status: "in-progress",
    subtasks: [
      { id: generateId(), name: "Исследование рынка", completed: false },
      { id: generateId(), name: "Разработка MVP", completed: false },
      { id: generateId(), name: "Привлечение первых клиентов", completed: false },
      { id: generateId(), name: "Масштабирование", completed: false },
    ],
    whyImportant: "Предпринимательство - путь к настоящей свободе.",
    type: "year",
  },
]

// Determine goal status based on progress and deadline
function computeGoalStatus(goal: Goal): GoalStatus {
  if (goal.progress >= 100) return "completed"
  const now = new Date()
  const deadline = new Date(goal.deadline)
  if (now > deadline && goal.progress < 100) return "overdue"
  return "in-progress"
}

// Old formula: percentage of completed subtasks
function computeProgress(subtasks: SubTask[]): number {
  if (subtasks.length === 0) return 0
  const done = subtasks.filter((s) => s.completed).length
  return Math.round((done / subtasks.length) * 100)
}

// New formula: completed count / target * 100
// Works for goals with target number (e.g. 20 workouts, 100 books)
// Falls back to old formula if no target is set
function computeProgressWithTarget(
  goal: Goal,
  getHabitCompletionCount?: (habitId: string) => number,
  getMonthlyGoalCompletedCount?: (goalId: string) => number,
): number {
  // No target — use old percentage formula
  if (!goal.target) {
    return computeProgress(goal.subtasks)
  }

  // Count completed subtasks as absolute numbers
  let completedCount = goal.subtasks.filter((s) => s.completed).length

  // Add habit completions (each capped at its own target)
  if (goal.linkedHabits && getHabitCompletionCount) {
    for (const lh of goal.linkedHabits) {
      const count = getHabitCompletionCount(lh.habitId)
      completedCount += Math.min(count, lh.target)
    }
  }

  // Add completed items from linked monthly goals
  if (goal.linkedMonthlyGoals && getMonthlyGoalCompletedCount) {
    for (const lm of goal.linkedMonthlyGoals) {
      completedCount += getMonthlyGoalCompletedCount(lm.goalId)
    }
  }

  return Math.min(Math.round((completedCount / goal.target) * 100), 100)
}

// Hook accepts optional function to count habit completions (passed from habit store)
export function useGoalsStore(getHabitCompletionCount?: (habitId: string) => number) {
  const [monthlyGoals, setMonthlyGoals] = useState<Goal[]>(DEFAULT_MONTHLY_GOALS)
  const [yearlyGoals, setYearlyGoals] = useState<Goal[]>(DEFAULT_YEARLY_GOALS)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load saved state from server
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const stored = await fetchGoalsState()
        if (cancelled || !stored) return

        setMonthlyGoals(stored.monthlyGoals)
        setYearlyGoals(stored.yearlyGoals)
      } catch (error) {
        console.error("Failed to load goals state:", error)
      } finally {
        if (!cancelled) {
          setIsLoaded(true)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  // Auto-save with 300ms debounce
  useEffect(() => {
    if (!isLoaded) return

    const timeout = window.setTimeout(() => {
      saveGoalsState({
        monthlyGoals,
        yearlyGoals,
      }).catch((error) => {
        console.error("Failed to save goals state:", error)
      })
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [isLoaded, monthlyGoals, yearlyGoals])

  // Count completed items in a monthly goal (for yearly goal linking)
  const getMonthlyGoalCompletedCount = useCallback(
    (goalId: string): number => {
      const goal = monthlyGoals.find((g) => g.id === goalId)
      if (!goal) return 0

      // Count completed subtasks
      let count = goal.subtasks.filter((s) => s.completed).length

      // Add habit completions
      if (goal.linkedHabits && getHabitCompletionCount) {
        for (const lh of goal.linkedHabits) {
          count += Math.min(getHabitCompletionCount(lh.habitId), lh.target)
        }
      }

      return count
    },
    [monthlyGoals, getHabitCompletionCount]
  )

  // Recalculate progress for all goals when habit data changes
  useEffect(() => {
    if (!isLoaded || !getHabitCompletionCount) return

    // Recalculate monthly goals progress
    setMonthlyGoals((prev) => {
      const updated = prev.map((g) => {
        const progress = computeProgressWithTarget(g, getHabitCompletionCount)
        if (progress === g.progress) return g
        const goal = { ...g, progress }
        goal.status = computeGoalStatus(goal)
        return goal
      })
      // Only update if something changed
      if (updated.every((g, i) => g === prev[i])) return prev
      return updated
    })

    // Recalculate yearly goals progress
    setYearlyGoals((prev) => {
      const updated = prev.map((g) => {
        const progress = computeProgressWithTarget(g, getHabitCompletionCount, getMonthlyGoalCompletedCount)
        if (progress === g.progress) return g
        const goal = { ...g, progress }
        goal.status = computeGoalStatus(goal)
        return goal
      })
      if (updated.every((g, i) => g === prev[i])) return prev
      return updated
    })
  }, [isLoaded, getHabitCompletionCount, getMonthlyGoalCompletedCount])

  // Add a new goal
  const addGoal = useCallback((type: "month" | "year", name: string) => {
    if (!name.trim()) return
    const now = new Date()
    const deadline =
      type === "month"
        ? new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]
        : `${now.getFullYear()}-12-31`

    const newGoal: Goal = {
      id: generateId(),
      name: name.trim(),
      description: "",
      progress: 0,
      deadline,
      status: "in-progress",
      subtasks: [],
      whyImportant: "",
      type,
    }

    if (type === "month") {
      setMonthlyGoals((prev) => [...prev, newGoal])
    } else {
      setYearlyGoals((prev) => [...prev, newGoal])
    }
  }, [])

  // Remove a goal
  const removeGoal = useCallback((type: "month" | "year", id: string) => {
    if (type === "month") {
      setMonthlyGoals((prev) => prev.filter((g) => g.id !== id))
    } else {
      setYearlyGoals((prev) => prev.filter((g) => g.id !== id))
    }
  }, [])

  // Update goal fields (name, description, deadline, target, etc.)
  const updateGoal = useCallback(
    (type: "month" | "year", id: string, updates: Partial<Goal>) => {
      const setter = type === "month" ? setMonthlyGoals : setYearlyGoals
      setter((prev) =>
        prev.map((g) => {
          if (g.id !== id) return g
          const updated = { ...g, ...updates }
          // Recalculate progress with new formula
          updated.progress = computeProgressWithTarget(updated, getHabitCompletionCount, getMonthlyGoalCompletedCount)
          updated.status = computeGoalStatus(updated)
          return updated
        })
      )
    },
    [getHabitCompletionCount, getMonthlyGoalCompletedCount]
  )

  // Toggle a subtask completed/uncompleted
  const toggleSubtask = useCallback(
    (type: "month" | "year", goalId: string, subtaskId: string) => {
      const setter = type === "month" ? setMonthlyGoals : setYearlyGoals
      setter((prev) =>
        prev.map((g) => {
          if (g.id !== goalId) return g
          const newSubtasks = g.subtasks.map((s) =>
            s.id === subtaskId ? { ...s, completed: !s.completed } : s
          )
          const updated = { ...g, subtasks: newSubtasks }
          updated.progress = computeProgressWithTarget(updated, getHabitCompletionCount, getMonthlyGoalCompletedCount)
          updated.status = computeGoalStatus(updated)
          return updated
        })
      )
    },
    [getHabitCompletionCount, getMonthlyGoalCompletedCount]
  )

  // Add a subtask to a goal
  const addSubtask = useCallback(
    (type: "month" | "year", goalId: string, name: string) => {
      if (!name.trim()) return
      const setter = type === "month" ? setMonthlyGoals : setYearlyGoals
      setter((prev) =>
        prev.map((g) => {
          if (g.id !== goalId) return g
          const newSubtasks = [
            ...g.subtasks,
            { id: generateId(), name: name.trim(), completed: false },
          ]
          const updated = { ...g, subtasks: newSubtasks }
          updated.progress = computeProgressWithTarget(updated, getHabitCompletionCount, getMonthlyGoalCompletedCount)
          return updated
        })
      )
    },
    [getHabitCompletionCount, getMonthlyGoalCompletedCount]
  )

  // Remove a subtask from a goal
  const removeSubtask = useCallback(
    (type: "month" | "year", goalId: string, subtaskId: string) => {
      const setter = type === "month" ? setMonthlyGoals : setYearlyGoals
      setter((prev) =>
        prev.map((g) => {
          if (g.id !== goalId) return g
          const newSubtasks = g.subtasks.filter((s) => s.id !== subtaskId)
          const updated = { ...g, subtasks: newSubtasks }
          updated.progress = computeProgressWithTarget(updated, getHabitCompletionCount, getMonthlyGoalCompletedCount)
          updated.status = computeGoalStatus(updated)
          return updated
        })
      )
    },
    [getHabitCompletionCount, getMonthlyGoalCompletedCount]
  )

  // Link a habit to a goal (e.g. "Тренировка" with target 20)
  const linkHabit = useCallback(
    (type: "month" | "year", goalId: string, habitId: string, target: number) => {
      const setter = type === "month" ? setMonthlyGoals : setYearlyGoals
      setter((prev) =>
        prev.map((g) => {
          if (g.id !== goalId) return g
          const existing = g.linkedHabits || []
          // Don't add duplicate
          if (existing.some((lh) => lh.habitId === habitId)) return g
          const updated = { ...g, linkedHabits: [...existing, { habitId, target }] }
          updated.progress = computeProgressWithTarget(updated, getHabitCompletionCount, getMonthlyGoalCompletedCount)
          updated.status = computeGoalStatus(updated)
          return updated
        })
      )
    },
    [getHabitCompletionCount, getMonthlyGoalCompletedCount]
  )

  // Unlink a habit from a goal
  const unlinkHabit = useCallback(
    (type: "month" | "year", goalId: string, habitId: string) => {
      const setter = type === "month" ? setMonthlyGoals : setYearlyGoals
      setter((prev) =>
        prev.map((g) => {
          if (g.id !== goalId) return g
          const updated = {
            ...g,
            linkedHabits: (g.linkedHabits || []).filter((lh) => lh.habitId !== habitId),
          }
          updated.progress = computeProgressWithTarget(updated, getHabitCompletionCount, getMonthlyGoalCompletedCount)
          updated.status = computeGoalStatus(updated)
          return updated
        })
      )
    },
    [getHabitCompletionCount, getMonthlyGoalCompletedCount]
  )

  // Link a monthly goal to a yearly goal
  const linkMonthlyGoal = useCallback(
    (yearlyGoalId: string, monthlyGoalId: string) => {
      setYearlyGoals((prev) =>
        prev.map((g) => {
          if (g.id !== yearlyGoalId) return g
          const existing = g.linkedMonthlyGoals || []
          if (existing.some((lm) => lm.goalId === monthlyGoalId)) return g
          const updated = {
            ...g,
            linkedMonthlyGoals: [...existing, { goalId: monthlyGoalId }],
          }
          updated.progress = computeProgressWithTarget(updated, getHabitCompletionCount, getMonthlyGoalCompletedCount)
          updated.status = computeGoalStatus(updated)
          return updated
        })
      )
    },
    [getHabitCompletionCount, getMonthlyGoalCompletedCount]
  )

  // Unlink a monthly goal from a yearly goal
  const unlinkMonthlyGoal = useCallback(
    (yearlyGoalId: string, monthlyGoalId: string) => {
      setYearlyGoals((prev) =>
        prev.map((g) => {
          if (g.id !== yearlyGoalId) return g
          const updated = {
            ...g,
            linkedMonthlyGoals: (g.linkedMonthlyGoals || []).filter(
              (lm) => lm.goalId !== monthlyGoalId
            ),
          }
          updated.progress = computeProgressWithTarget(updated, getHabitCompletionCount, getMonthlyGoalCompletedCount)
          updated.status = computeGoalStatus(updated)
          return updated
        })
      )
    },
    [getHabitCompletionCount, getMonthlyGoalCompletedCount]
  )

  // Overall progress stats
  const overallYearlyProgress = useMemo(() => {
    if (yearlyGoals.length === 0) return 0
    const total = yearlyGoals.reduce((sum, g) => sum + g.progress, 0)
    return Math.round(total / yearlyGoals.length)
  }, [yearlyGoals])

  const overallMonthlyProgress = useMemo(() => {
    if (monthlyGoals.length === 0) return 0
    const total = monthlyGoals.reduce((sum, g) => sum + g.progress, 0)
    return Math.round(total / monthlyGoals.length)
  }, [monthlyGoals])

  const daysUntilEndOfYear = useMemo(() => {
    const now = new Date()
    const nextNewYear = new Date(now.getFullYear() + 1, 0, 1)
    const diff = nextNewYear.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }, [])

  const monthlyProgressByMonth = useMemo(() => {
    const now = new Date()
    const months = []
    for (let i = 0; i <= now.getMonth(); i++) {
      // Only current month has real data — past months show 0
      months.push({
        month: i,
        progress: i === now.getMonth() ? overallMonthlyProgress : 0,
      })
    }
    return months
  }, [overallMonthlyProgress])

  return {
    monthlyGoals,
    yearlyGoals,
    addGoal,
    removeGoal,
    updateGoal,
    toggleSubtask,
    addSubtask,
    removeSubtask,
    linkHabit,
    unlinkHabit,
    linkMonthlyGoal,
    unlinkMonthlyGoal,
    getMonthlyGoalCompletedCount,
    overallYearlyProgress,
    overallMonthlyProgress,
    daysUntilEndOfYear,
    monthlyProgressByMonth,
  }
}
