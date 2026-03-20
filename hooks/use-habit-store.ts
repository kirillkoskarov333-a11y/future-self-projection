"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import type { Habit, HabitCompletions } from "@/lib/types"
import { DAYS_OF_WEEK } from "@/lib/types"
import { fetchHabitsState, saveHabitsState } from "@/lib/api-client"

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

const DEFAULT_HABITS: Habit[] = [
  { id: generateId(), name: "Подъём в 4:30" },
  { id: generateId(), name: "Тренировка" },
  { id: generateId(), name: "Работа 2+ часа" },
  { id: generateId(), name: "Планирование дня" },
  { id: generateId(), name: "Никакого алкоголя" },
  { id: generateId(), name: "Никаких соцсетей" },
  { id: generateId(), name: "Чтение 30 минут" },
]

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getDayOfWeek(year: number, month: number, day: number): number {
  const d = new Date(year, month, day)
  return d.getDay() === 0 ? 6 : d.getDay() - 1
}

export function useHabitStore() {
  const now = new Date()
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())
  const [currentYear, setCurrentYear] = useState(now.getFullYear())
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS)
  const [completions, setCompletions] = useState<HabitCompletions>({})
  const [isLoaded, setIsLoaded] = useState(false)

  const daysInMonth = useMemo(
    () => getDaysInMonth(currentYear, currentMonth),
    [currentYear, currentMonth]
  )

  const weeks = useMemo(() => {
    const result: { day: number; dayOfWeek: number }[][] = []
    let currentWeek: { day: number; dayOfWeek: number }[] = []

    for (let day = 1; day <= daysInMonth; day++) {
      const dow = getDayOfWeek(currentYear, currentMonth, day)
      currentWeek.push({ day, dayOfWeek: dow })

      if (dow === 6 || day === daysInMonth) {
        result.push(currentWeek)
        currentWeek = []
      }
    }

    return result
  }, [daysInMonth, currentYear, currentMonth])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const stored = await fetchHabitsState()
        if (cancelled || !stored) return

        setCurrentMonth(stored.currentMonth)
        setCurrentYear(stored.currentYear)
        setHabits(stored.habits)
        setCompletions(stored.completions)
      } catch (error) {
        console.error("Failed to load habits state:", error)
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

  useEffect(() => {
    if (!isLoaded) return

    const timeout = window.setTimeout(() => {
      saveHabitsState({
        currentMonth,
        currentYear,
        habits,
        completions,
      }).catch((error) => {
        console.error("Failed to save habits state:", error)
      })
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [isLoaded, currentMonth, currentYear, habits, completions])

  const toggleCompletion = useCallback(
    (habitId: string, day: number) => {
      setCompletions((prev) => {
        const habitData = prev[habitId] || {}
        const key = `${currentYear}-${currentMonth}`
        const compositeKey = `${key}-${day}`
        return {
          ...prev,
          [habitId]: {
            ...habitData,
            [compositeKey]: !habitData[compositeKey],
          },
        }
      })
    },
    [currentYear, currentMonth]
  )

  const isCompleted = useCallback(
    (habitId: string, day: number) => {
      const key = `${currentYear}-${currentMonth}-${day}`
      return completions[habitId]?.[key] ?? false
    },
    [completions, currentYear, currentMonth]
  )

  const addHabit = useCallback((name: string, weekDays?: number[]) => {
    if (!name.trim()) return
    // weekDays — optional array of day indices (0=Mon..6=Sun). Empty = every day
    const habit: Habit = { id: generateId(), name: name.trim() }
    if (weekDays && weekDays.length > 0) {
      habit.weekDays = weekDays
    }
    setHabits((prev) => [...prev, habit])
  }, [])

  const removeHabit = useCallback((id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id))
    setCompletions((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const updateHabit = useCallback((id: string, name: string) => {
    if (!name.trim()) return
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, name: name.trim() } : h))
    )
  }, [])

  // Update which weekdays a habit is active on
  const updateHabitDays = useCallback((id: string, weekDays: number[]) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h
        // Empty array = every day — remove the field
        if (weekDays.length === 0 || weekDays.length === 7) {
          const { weekDays: _, ...rest } = h
          return rest as Habit
        }
        return { ...h, weekDays }
      })
    )
  }, [])

  // Check if a habit is active on a specific day of week (0=Mon..6=Sun)
  const isHabitActiveOnDay = useCallback(
    (habit: Habit, dayOfWeek: number) => {
      // No weekDays set = active every day
      if (!habit.weekDays || habit.weekDays.length === 0) return true
      return habit.weekDays.includes(dayOfWeek)
    },
    []
  )

  // Get habits filtered for a specific calendar day
  const getHabitsForDay = useCallback(
    (day: number) => {
      const dow = getDayOfWeek(currentYear, currentMonth, day)
      return habits.filter((h) => isHabitActiveOnDay(h, dow))
    },
    [habits, currentYear, currentMonth, isHabitActiveOnDay]
  )

  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1)
        return 11
      }
      return prev - 1
    })
  }, [])

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1)
        return 0
      }
      return prev + 1
    })
  }, [])

  const getHabitCompletionRate = useCallback(
    (habitId: string) => {
      const habit = habits.find((h) => h.id === habitId)
      if (!habit) return 0

      let completed = 0
      let activeDays = 0
      const today = new Date()
      const maxDay =
        currentYear === today.getFullYear() && currentMonth === today.getMonth()
          ? today.getDate()
          : daysInMonth

      for (let d = 1; d <= maxDay; d++) {
        const dow = getDayOfWeek(currentYear, currentMonth, d)
        // Only count days when this habit is active
        if (!isHabitActiveOnDay(habit, dow)) continue
        activeDays++
        if (isCompleted(habitId, d)) completed++
      }
      return activeDays > 0 ? Math.round((completed / activeDays) * 100) : 0
    },
    [habits, isCompleted, daysInMonth, currentYear, currentMonth, isHabitActiveOnDay]
  )

  const getDayCompletionRate = useCallback(
    (day: number) => {
      // Only count habits that are active on this day of week
      const activeHabits = getHabitsForDay(day)
      if (activeHabits.length === 0) return 0
      let completed = 0
      for (const habit of activeHabits) {
        if (isCompleted(habit.id, day)) completed++
      }
      return Math.round((completed / activeHabits.length) * 100)
    },
    [getHabitsForDay, isCompleted]
  )

  const getOverallProgress = useCallback(() => {
    if (habits.length === 0) return 0
    const today = new Date()
    const maxDay =
      currentYear === today.getFullYear() && currentMonth === today.getMonth()
        ? today.getDate()
        : daysInMonth

    let totalPossible = 0
    let totalCompleted = 0

    for (const habit of habits) {
      for (let d = 1; d <= maxDay; d++) {
        const dow = getDayOfWeek(currentYear, currentMonth, d)
        if (!isHabitActiveOnDay(habit, dow)) continue
        totalPossible++
        if (isCompleted(habit.id, d)) totalCompleted++
      }
    }

    return totalPossible > 0
      ? Math.round((totalCompleted / totalPossible) * 100)
      : 0
  }, [habits, isCompleted, daysInMonth, currentYear, currentMonth, isHabitActiveOnDay])

  const getWeekdayStats = useCallback(() => {
    const stats = DAYS_OF_WEEK.map((name) => ({ name, completed: 0, total: 0 }))
    const today = new Date()
    const maxDay =
      currentYear === today.getFullYear() && currentMonth === today.getMonth()
        ? today.getDate()
        : daysInMonth

    for (let d = 1; d <= maxDay; d++) {
      const dow = getDayOfWeek(currentYear, currentMonth, d)
      for (const habit of habits) {
        // Only count if habit is active on this weekday
        if (!isHabitActiveOnDay(habit, dow)) continue
        stats[dow].total++
        if (isCompleted(habit.id, d)) stats[dow].completed++
      }
    }

    return stats.map((s) => ({
      ...s,
      rate: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0,
    }))
  }, [habits, isCompleted, daysInMonth, currentYear, currentMonth, isHabitActiveOnDay])

  const getDailyStats = useCallback(() => {
    const today = new Date()
    const maxDay =
      currentYear === today.getFullYear() && currentMonth === today.getMonth()
        ? today.getDate()
        : daysInMonth

    const stats = []
    for (let d = 1; d <= maxDay; d++) {
      const activeHabits = getHabitsForDay(d)
      let completed = 0
      for (const habit of activeHabits) {
        if (isCompleted(habit.id, d)) completed++
      }
      stats.push({
        day: d,
        rate: activeHabits.length > 0 ? Math.round((completed / activeHabits.length) * 100) : 0,
        completed,
        total: activeHabits.length,
      })
    }
    return stats
  }, [getHabitsForDay, isCompleted, daysInMonth, currentYear, currentMonth])

  const getStreak = useCallback(() => {
    const today = new Date()
    const maxDay =
      currentYear === today.getFullYear() && currentMonth === today.getMonth()
        ? today.getDate()
        : daysInMonth

    let streak = 0
    for (let d = maxDay; d >= 1; d--) {
      const rate = getDayCompletionRate(d)
      if (rate >= 80) {
        streak++
      } else {
        break
      }
    }
    return streak
  }, [getDayCompletionRate, daysInMonth, currentYear, currentMonth])

  const getBestDay = useCallback(() => {
    const today = new Date()
    const maxDay =
      currentYear === today.getFullYear() && currentMonth === today.getMonth()
        ? today.getDate()
        : daysInMonth

    let bestDay = 0
    let bestRate = -1
    for (let d = 1; d <= maxDay; d++) {
      const rate = getDayCompletionRate(d)
      if (rate > bestRate) {
        bestRate = rate
        bestDay = d
      }
    }
    return { day: bestDay, rate: bestRate }
  }, [getDayCompletionRate, daysInMonth, currentYear, currentMonth])

  return {
    currentMonth,
    currentYear,
    habits,
    completions,
    daysInMonth,
    weeks,
    toggleCompletion,
    isCompleted,
    addHabit,
    removeHabit,
    updateHabit,
    updateHabitDays,
    getHabitsForDay,
    isHabitActiveOnDay,
    goToPreviousMonth,
    goToNextMonth,
    getHabitCompletionRate,
    getDayCompletionRate,
    getOverallProgress,
    getWeekdayStats,
    getDailyStats,
    getStreak,
    getBestDay,
  }
}
