"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import type {
  DayTask,
  TaskPriority,
  EnergyLevel,
  DayTemplate,
  WeeklyHabit,
  WeeklyHabitCompletions,
  WeeklyGoal,
  PomodoroSession,
} from "@/lib/types"
import { BUILT_IN_TEMPLATES } from "@/lib/types"
import { fetchDayPlannerState, saveDayPlannerState } from "@/lib/api-client"

// Generate a random short id
function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

// Default tasks shown when a day has no data yet
const DEFAULT_TASKS: DayTask[] = [
  {
    id: generateId(),
    name: "Утренняя тренировка",
    completed: false,
    priority: "high",
    time: "05:00",
    isFocus: true,
    order: 0,
  },
  {
    id: generateId(),
    name: "Глубокая работа над проектом",
    completed: false,
    priority: "high",
    time: "06:00",
    isFocus: true,
    order: 1,
  },
  {
    id: generateId(),
    name: "Планирование недели",
    completed: false,
    priority: "medium",
    time: "08:00",
    isFocus: false,
    order: 2,
  },
  {
    id: generateId(),
    name: "Изучение нового навыка",
    completed: false,
    priority: "high",
    time: "09:00",
    isFocus: true,
    order: 3,
  },
  {
    id: generateId(),
    name: "Ответить на все письма",
    completed: false,
    priority: "medium",
    time: "10:00",
    isFocus: false,
    order: 4,
  },
  {
    id: generateId(),
    name: "Чтение — 30 минут",
    completed: false,
    priority: "low",
    time: "12:00",
    isFocus: false,
    order: 5,
  },
  {
    id: generateId(),
    name: "Вечерний обзор дня",
    completed: false,
    priority: "medium",
    time: "20:00",
    isFocus: false,
    order: 6,
  },
]

// Data stored per day
interface DayData {
  tasks: DayTask[]
  energyLevel: EnergyLevel
  daySummary: string | null
}

// Convert Date to string key like "2026-2-13"
export function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export function useDayStore() {
  // === Core state ===
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dayDataMap, setDayDataMap] = useState<Record<string, DayData>>(() => {
    const key = getDateKey(new Date())
    return {
      [key]: {
        tasks: DEFAULT_TASKS,
        energyLevel: "medium",
        daySummary: null,
      },
    }
  })
  const [isLoaded, setIsLoaded] = useState(false)

  // === Pomodoro timer state ===
  const [timerSeconds, setTimerSeconds] = useState(25 * 60)
  const [timerRunning, setTimerRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [pomodoroCount, setPomodoroCount] = useState(0)
  const [pomodoroTaskId, setPomodoroTaskId] = useState<string | null>(null) // which task is bound to current pomodoro

  // === New feature state ===
  const [customTemplates, setCustomTemplates] = useState<DayTemplate[]>([])
  const [weeklyHabits, setWeeklyHabits] = useState<WeeklyHabit[]>([])
  const [habitCompletions, setHabitCompletions] = useState<WeeklyHabitCompletions>({})
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([])
  const [pomodoroSessions, setPomodoroSessions] = useState<PomodoroSession[]>([])

  // === Carry over state ===
  const [showCarryOverBadge, setShowCarryOverBadge] = useState(false)
  const [carryOverTasks, setCarryOverTasks] = useState<DayTask[]>([])

  // Current date key
  const dateKey = useMemo(() => getDateKey(selectedDate), [selectedDate])

  // === Load data from API on mount ===
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const stored = await fetchDayPlannerState()
        if (cancelled || !stored) return
        setDayDataMap(stored.dayDataMap)
        setCustomTemplates(stored.customTemplates ?? [])
        setWeeklyHabits(stored.weeklyHabits ?? [])
        setHabitCompletions(stored.habitCompletions ?? {})
        setWeeklyGoals(stored.weeklyGoals ?? [])
        setPomodoroSessions(stored.pomodoroSessions ?? [])
      } catch (error) {
        console.error("Failed to load day planner state:", error)
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

  // === Auto-save with 300ms debounce ===
  useEffect(() => {
    if (!isLoaded) return

    const timeout = window.setTimeout(() => {
      saveDayPlannerState({
        dayDataMap,
        customTemplates,
        weeklyHabits,
        habitCompletions,
        weeklyGoals,
        pomodoroSessions,
      }).catch((error) => {
        console.error("Failed to save day planner state:", error)
      })
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [isLoaded, dayDataMap, customTemplates, weeklyHabits, habitCompletions, weeklyGoals, pomodoroSessions])

  // === Current day data ===
  const currentDayData = useMemo(() => {
    return (
      dayDataMap[dateKey] ?? {
        tasks: [...DEFAULT_TASKS.map((t) => ({ ...t, id: generateId(), completed: false }))],
        energyLevel: "medium" as EnergyLevel,
        daySummary: null,
      }
    )
  }, [dayDataMap, dateKey])

  // Helper: update current day data with an updater function
  const updateDayData = useCallback(
    (updater: (prev: DayData) => DayData) => {
      setDayDataMap((prev) => {
        const current = prev[dateKey] ?? {
          tasks: [...DEFAULT_TASKS.map((t) => ({ ...t, id: generateId(), completed: false }))],
          energyLevel: "medium" as EnergyLevel,
          daySummary: null,
        }
        return { ...prev, [dateKey]: updater(current) }
      })
    },
    [dateKey]
  )

  // Shortcuts for current day
  const tasks = currentDayData.tasks
  const energyLevel = currentDayData.energyLevel
  const daySummary = currentDayData.daySummary

  // === Task CRUD ===
  const addTask = useCallback(
    (name: string, priority: TaskPriority = "medium", time: string = "09:00") => {
      if (!name.trim()) return
      updateDayData((data) => ({
        ...data,
        tasks: [
          ...data.tasks,
          {
            id: generateId(),
            name: name.trim(),
            completed: false,
            priority,
            time,
            isFocus: false,
            order: data.tasks.length,
          },
        ],
      }))
    },
    [updateDayData]
  )

  const removeTask = useCallback(
    (id: string) => {
      updateDayData((data) => ({
        ...data,
        tasks: data.tasks.filter((t) => t.id !== id),
      }))
    },
    [updateDayData]
  )

  const toggleTask = useCallback(
    (id: string) => {
      updateDayData((data) => ({
        ...data,
        tasks: data.tasks.map((t) =>
          t.id === id ? { ...t, completed: !t.completed } : t
        ),
      }))
    },
    [updateDayData]
  )

  const updateTask = useCallback(
    (id: string, updates: Partial<DayTask>) => {
      updateDayData((data) => ({
        ...data,
        tasks: data.tasks.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      }))
    },
    [updateDayData]
  )

  const toggleFocus = useCallback(
    (id: string) => {
      updateDayData((data) => {
        const focusCount = data.tasks.filter((t) => t.isFocus && t.id !== id).length
        return {
          ...data,
          tasks: data.tasks.map((t) => {
            if (t.id !== id) return t
            if (t.isFocus) return { ...t, isFocus: false }
            if (focusCount >= 3) return t
            return { ...t, isFocus: true }
          }),
        }
      })
    },
    [updateDayData]
  )

  const setEnergyLevel = useCallback(
    (level: EnergyLevel) => {
      updateDayData((data) => ({ ...data, energyLevel: level }))
    },
    [updateDayData]
  )

  const setDaySummary = useCallback(
    (summary: string) => {
      updateDayData((data) => ({ ...data, daySummary: summary }))
    },
    [updateDayData]
  )

  const moveTask = useCallback(
    (fromIndex: number, toIndex: number) => {
      updateDayData((data) => {
        const newTasks = [...data.tasks]
        const [moved] = newTasks.splice(fromIndex, 1)
        newTasks.splice(toIndex, 0, moved)
        return {
          ...data,
          tasks: newTasks.map((t, i) => ({ ...t, order: i })),
        }
      })
    },
    [updateDayData]
  )

  // === Computed stats ===
  const focusTasks = useMemo(() => tasks.filter((t) => t.isFocus), [tasks])
  const completedCount = useMemo(() => tasks.filter((t) => t.completed).length, [tasks])
  const totalCount = tasks.length

  const completionRate = useMemo(
    () => (totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0),
    [completedCount, totalCount]
  )

  const focusCompletionRate = useMemo(() => {
    if (focusTasks.length === 0) return 0
    const done = focusTasks.filter((t) => t.completed).length
    return Math.round((done / focusTasks.length) * 100)
  }, [focusTasks])

  // Hours worked — count from pomodoro sessions for current day
  const hoursWorked = useMemo(() => {
    const todaySessions = pomodoroSessions.filter((s) => s.dateKey === dateKey)
    if (todaySessions.length === 0) {
      // Fallback: estimate from completed tasks if no pomodoro sessions
      return Math.round((completedCount * 30) / 60 * 10) / 10
    }
    const totalMinutes = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0)
    return Math.round((totalMinutes / 60) * 10) / 10
  }, [pomodoroSessions, dateKey, completedCount])

  // Most productive period
  const mostProductivePeriod = useMemo(() => {
    const periods = { morning: 0, afternoon: 0, evening: 0 }
    for (const task of tasks) {
      if (!task.completed) continue
      const hour = parseInt(task.time.split(":")[0], 10)
      if (hour < 12) periods.morning++
      else if (hour < 18) periods.afternoon++
      else periods.evening++
    }
    if (periods.morning >= periods.afternoon && periods.morning >= periods.evening)
      return "Утро"
    if (periods.afternoon >= periods.morning && periods.afternoon >= periods.evening)
      return "День"
    return "Вечер"
  }, [tasks])

  // Tasks sorted by time
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.time < b.time) return -1
      if (a.time > b.time) return 1
      return a.order - b.order
    })
  }, [tasks])

  // === Smart sort ===
  const [isSmartSort, setIsSmartSort] = useState(false)
  const toggleSmartSort = useCallback(() => setIsSmartSort((v) => !v), [])

  const smartSortedTasks = useMemo(() => {
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const todayKey = getDateKey(now)
    const isToday = dateKey === todayKey

    return [...tasks].map((task) => {
      const importanceScore = task.priority === "high" ? 5 : task.priority === "medium" ? 3 : 1

      let urgencyScore: number
      if (task.completed) {
        urgencyScore = 0
      } else if (!isToday) {
        urgencyScore = 2
      } else {
        const [h, m] = task.time.split(":").map(Number)
        const taskMinutes = h * 60 + m
        const diff = taskMinutes - currentMinutes
        if (diff < 0) urgencyScore = 5
        else if (diff < 30) urgencyScore = 5
        else if (diff < 60) urgencyScore = 4
        else if (diff < 120) urgencyScore = 3
        else if (diff < 240) urgencyScore = 2
        else urgencyScore = 1
      }

      return { ...task, importanceScore, urgencyScore, priorityScore: importanceScore + urgencyScore }
    }).sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      return b.priorityScore - a.priorityScore
    })
  }, [tasks, dateKey])

  const recommendedNext = useMemo(
    () => smartSortedTasks.find((t) => !t.completed) ?? null,
    [smartSortedTasks]
  )

  // Check if a task is overdue
  const isOverdue = useCallback(
    (task: DayTask) => {
      if (task.completed) return false
      const now = new Date()
      const todayKey = getDateKey(now)
      if (dateKey !== todayKey) return false
      const [h, m] = task.time.split(":").map(Number)
      const taskTime = new Date()
      taskTime.setHours(h, m, 0, 0)
      return now > taskTime
    },
    [dateKey]
  )

  // ============================================================
  // FEATURE: Templates
  // ============================================================

  // Apply a template — add its tasks to current day
  const applyTemplate = useCallback(
    (templateId: string) => {
      const allTemplates = [...BUILT_IN_TEMPLATES, ...customTemplates]
      const template = allTemplates.find((t) => t.id === templateId)
      if (!template) return

      updateDayData((data) => {
        const newTasks = template.tasks.map((t, index) => ({
          ...t,
          id: generateId(),
          completed: false,
          order: data.tasks.length + index,
        }))
        return { ...data, tasks: [...data.tasks, ...newTasks] }
      })
    },
    [customTemplates, updateDayData]
  )

  // Save current day's tasks as a custom template
  const saveCurrentAsTemplate = useCallback(
    (name: string) => {
      if (!name.trim()) return
      const newTemplate: DayTemplate = {
        id: generateId(),
        name: name.trim(),
        isBuiltIn: false,
        tasks: tasks.map(({ id, completed, order, carriedFrom, ...rest }) => rest),
      }
      setCustomTemplates((prev) => [...prev, newTemplate])
    },
    [tasks]
  )

  // Delete a custom template
  const deleteTemplate = useCallback((templateId: string) => {
    setCustomTemplates((prev) => prev.filter((t) => t.id !== templateId))
  }, [])

  // ============================================================
  // FEATURE: Habit Tracker
  // ============================================================

  const addHabit = useCallback((name: string) => {
    if (!name.trim()) return
    setWeeklyHabits((prev) => [...prev, { id: generateId(), name: name.trim() }])
  }, [])

  const removeHabit = useCallback((habitId: string) => {
    setWeeklyHabits((prev) => prev.filter((h) => h.id !== habitId))
    setHabitCompletions((prev) => {
      const next = { ...prev }
      delete next[habitId]
      return next
    })
  }, [])

  const toggleHabitCompletion = useCallback((habitId: string, date: Date) => {
    const key = getDateKey(date)
    setHabitCompletions((prev) => {
      const habitData = prev[habitId] ?? {}
      return {
        ...prev,
        [habitId]: { ...habitData, [key]: !habitData[key] },
      }
    })
  }, [])

  // Calculate streak (consecutive days completed going backwards from today)
  const getHabitStreak = useCallback(
    (habitId: string): number => {
      const completions = habitCompletions[habitId] ?? {}
      let streak = 0
      const today = new Date()

      for (let i = 0; i < 365; i++) {
        const d = new Date(today)
        d.setDate(today.getDate() - i)
        const key = getDateKey(d)
        if (completions[key]) {
          streak++
        } else {
          break
        }
      }
      return streak
    },
    [habitCompletions]
  )

  // ============================================================
  // FEATURE: Weekly Goals
  // ============================================================

  // Get Monday of selected week as dateKey
  const getCurrentWeekStart = useCallback(() => {
    const d = new Date(selectedDate)
    const dow = d.getDay() === 0 ? 6 : d.getDay() - 1
    const monday = new Date(d)
    monday.setDate(d.getDate() - dow)
    monday.setHours(0, 0, 0, 0)
    return getDateKey(monday)
  }, [selectedDate])

  // Filter goals for current week
  const currentWeekGoals = useMemo(() => {
    const weekStart = getCurrentWeekStart()
    return weeklyGoals.filter((g) => g.weekStart === weekStart)
  }, [weeklyGoals, getCurrentWeekStart])

  const addWeeklyGoal = useCallback(
    (name: string, autoProgress: boolean) => {
      if (!name.trim()) return
      if (currentWeekGoals.length >= 3) return
      setWeeklyGoals((prev) => [
        ...prev,
        {
          id: generateId(),
          name: name.trim(),
          progress: 0,
          linkedTaskIds: [],
          autoProgress,
          weekStart: getCurrentWeekStart(),
        },
      ])
    },
    [currentWeekGoals.length, getCurrentWeekStart]
  )

  const updateWeeklyGoalProgress = useCallback((goalId: string, progress: number) => {
    setWeeklyGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, progress: Math.max(0, Math.min(100, progress)) } : g
      )
    )
  }, [])

  const toggleTaskLink = useCallback((goalId: string, taskId: string) => {
    setWeeklyGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g
        const linked = g.linkedTaskIds.includes(taskId)
          ? g.linkedTaskIds.filter((id) => id !== taskId)
          : [...g.linkedTaskIds, taskId]
        return { ...g, linkedTaskIds: linked }
      })
    )
  }, [])

  const removeWeeklyGoal = useCallback((goalId: string) => {
    setWeeklyGoals((prev) => prev.filter((g) => g.id !== goalId))
  }, [])

  // Auto-update progress for goals with autoProgress=true
  // Only depends on dayDataMap — uses functional update to avoid infinite loop
  useEffect(() => {
    const allTasks = Object.values(dayDataMap).flatMap((d) => d.tasks)

    setWeeklyGoals((prev) => {
      let changed = false
      const updated = prev.map((goal) => {
        if (!goal.autoProgress || goal.linkedTaskIds.length === 0) return goal
        const linkedTasks = allTasks.filter((t) => goal.linkedTaskIds.includes(t.id))
        const completed = linkedTasks.filter((t) => t.completed).length
        const progress = linkedTasks.length > 0 ? Math.round((completed / linkedTasks.length) * 100) : 0
        if (progress !== goal.progress) changed = true
        return { ...goal, progress }
      })
      return changed ? updated : prev
    })
  }, [dayDataMap])

  // ============================================================
  // FEATURE: Pomodoro Task Binding
  // ============================================================

  // Log a completed pomodoro session
  const logPomodoroSession = useCallback(
    (taskId: string | null) => {
      setPomodoroSessions((prev) => [
        ...prev,
        {
          id: generateId(),
          taskId,
          durationMinutes: 25,
          dateKey,
        },
      ])
    },
    [dateKey]
  )

  // ============================================================
  // FEATURE: Carry Over Tasks
  // ============================================================

  // Check for uncompleted tasks from yesterday when date changes
  useEffect(() => {
    const yesterday = new Date(selectedDate)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayKey = getDateKey(yesterday)
    const yesterdayData = dayDataMap[yesterdayKey]

    if (yesterdayData) {
      const uncompleted = yesterdayData.tasks.filter((t) => !t.completed)
      if (uncompleted.length > 0) {
        setCarryOverTasks(uncompleted)
        setShowCarryOverBadge(true)
      } else {
        setShowCarryOverBadge(false)
        setCarryOverTasks([])
      }
    } else {
      setShowCarryOverBadge(false)
      setCarryOverTasks([])
    }
  }, [selectedDate, dayDataMap])

  // Carry all uncompleted tasks from yesterday to today
  const carryOverAllTasks = useCallback(() => {
    const yesterdayKey = getDateKey(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - 1)
    )
    updateDayData((data) => {
      const newTasks = carryOverTasks.map((task, i) => ({
        ...task,
        id: generateId(),
        completed: false,
        carriedFrom: yesterdayKey,
        order: data.tasks.length + i,
      }))
      return { ...data, tasks: [...data.tasks, ...newTasks] }
    })
    setShowCarryOverBadge(false)
    setCarryOverTasks([])
  }, [carryOverTasks, updateDayData, selectedDate])

  // Carry selected tasks
  const carryOverSelected = useCallback(
    (taskIds: string[]) => {
      const yesterdayKey = getDateKey(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - 1)
      )
      const tasksToCarry = carryOverTasks.filter((t) => taskIds.includes(t.id))
      updateDayData((data) => {
        const newTasks = tasksToCarry.map((task, i) => ({
          ...task,
          id: generateId(),
          completed: false,
          carriedFrom: yesterdayKey,
          order: data.tasks.length + i,
        }))
        return { ...data, tasks: [...data.tasks, ...newTasks] }
      })
      setShowCarryOverBadge(false)
      setCarryOverTasks([])
    },
    [carryOverTasks, updateDayData, selectedDate]
  )

  const dismissCarryOver = useCallback(() => {
    setShowCarryOverBadge(false)
    setCarryOverTasks([])
  }, [])

  // ============================================================
  // FEATURE: Energy Optimization
  // ============================================================

  // Check if high-priority tasks are scheduled for afternoon when energy is low
  const needsEnergyOptimization = useMemo(() => {
    if (energyLevel !== "low") return false
    return tasks.some(
      (t) => !t.completed && t.priority === "high" && parseInt(t.time.split(":")[0]) >= 12
    )
  }, [tasks, energyLevel])

  // Reorder tasks: high priority → morning slots
  const optimizeByEnergy = useCallback(() => {
    updateDayData((data) => {
      const sorted = [...data.tasks].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        if (a.priority !== b.priority) return priorityOrder[a.priority] - priorityOrder[b.priority]
        return a.time < b.time ? -1 : 1
      })
      return { ...data, tasks: sorted.map((t, i) => ({ ...t, order: i })) }
    })
  }, [updateDayData])

  // ============================================================
  // FEATURE: Weekly Summary
  // ============================================================

  const weeklyStats = useMemo(() => {
    // Get 7 days of the current week (Mon-Sun)
    const d = new Date(selectedDate)
    const dow = d.getDay() === 0 ? 6 : d.getDay() - 1
    const monday = new Date(d)
    monday.setDate(d.getDate() - dow)

    const dayStats = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      const key = getDateKey(date)
      const data = dayDataMap[key]

      if (!data) return { date, tasksCompleted: 0, totalTasks: 0, mitCompleted: 0, totalMIT: 0, pomodoroMinutes: 0 }

      return {
        date,
        tasksCompleted: data.tasks.filter((t) => t.completed).length,
        totalTasks: data.tasks.length,
        mitCompleted: data.tasks.filter((t) => t.isFocus && t.completed).length,
        totalMIT: data.tasks.filter((t) => t.isFocus).length,
        pomodoroMinutes: pomodoroSessions
          .filter((s) => s.dateKey === key)
          .reduce((sum, s) => sum + s.durationMinutes, 0),
      }
    })

    const bestDayIndex = dayStats.reduce(
      (bestIdx, curr, idx) => (curr.tasksCompleted > dayStats[bestIdx].tasksCompleted ? idx : bestIdx),
      0
    )

    const totalMIT = dayStats.reduce((sum, d) => sum + d.totalMIT, 0)
    const completedMIT = dayStats.reduce((sum, d) => sum + d.mitCompleted, 0)
    const mitCompletionRate = totalMIT > 0 ? Math.round((completedMIT / totalMIT) * 100) : 0

    const avgFocusMinutes = Math.round(
      dayStats.reduce((sum, d) => sum + d.pomodoroMinutes, 0) / 7
    )

    return { dayStats, bestDayIndex, mitCompletionRate, avgFocusMinutes }
  }, [selectedDate, dayDataMap, pomodoroSessions])

  // Reset current week: clear all day data + goals for this week
  const resetWeek = useCallback(() => {
    const d = new Date(selectedDate)
    const dow = d.getDay() === 0 ? 6 : d.getDay() - 1
    const monday = new Date(d)
    monday.setDate(d.getDate() - dow)

    const weekKeys = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      return getDateKey(date)
    })

    setDayDataMap((prev) => {
      const next = { ...prev }
      weekKeys.forEach((key) => delete next[key])
      return next
    })

    const weekStart = getCurrentWeekStart()
    setWeeklyGoals((prev) => prev.filter((g) => g.weekStart !== weekStart))
  }, [selectedDate, getCurrentWeekStart])

  // ============================================================
  // RETURN
  // ============================================================
  return {
    // Core
    selectedDate,
    setSelectedDate,
    tasks: sortedTasks,
    focusTasks,
    addTask,
    removeTask,
    toggleTask,
    updateTask,
    toggleFocus,
    moveTask,
    energyLevel,
    setEnergyLevel,
    daySummary,
    setDaySummary,
    completedCount,
    totalCount,
    completionRate,
    focusCompletionRate,
    hoursWorked,
    mostProductivePeriod,
    isOverdue,
    // Pomodoro
    timerSeconds,
    setTimerSeconds,
    timerRunning,
    setTimerRunning,
    isBreak,
    setIsBreak,
    pomodoroCount,
    setPomodoroCount,
    pomodoroTaskId,
    setPomodoroTaskId,
    logPomodoroSession,
    pomodoroSessions,
    // Smart sort
    smartSortedTasks,
    recommendedNext,
    isSmartSort,
    toggleSmartSort,
    // Raw data
    dayDataMap,
    // Templates
    customTemplates,
    applyTemplate,
    saveCurrentAsTemplate,
    deleteTemplate,
    // Habits
    weeklyHabits,
    habitCompletions,
    addHabit,
    removeHabit,
    toggleHabitCompletion,
    getHabitStreak,
    // Weekly goals
    currentWeekGoals,
    addWeeklyGoal,
    updateWeeklyGoalProgress,
    toggleTaskLink,
    removeWeeklyGoal,
    // Carry over
    showCarryOverBadge,
    carryOverTasks,
    carryOverAllTasks,
    carryOverSelected,
    dismissCarryOver,
    // Energy optimization
    needsEnergyOptimization,
    optimizeByEnergy,
    // Weekly summary
    weeklyStats,
    resetWeek,
  }
}
