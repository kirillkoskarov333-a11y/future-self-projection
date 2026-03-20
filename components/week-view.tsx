"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Pencil,
  Sparkles,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Habit } from "@/lib/types"

const FULL_DAY_NAMES = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
] as const

const SHORT_DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const

interface WeekViewProps {
  habits: Habit[]
  currentMonth: number
  currentYear: number
  daysInMonth: number
  isCompleted: (habitId: string, day: number) => boolean
  toggleCompletion: (habitId: string, day: number) => void
  getHabitCompletionRate: (habitId: string) => number
  getDayCompletionRate: (day: number) => number
  addHabit: (name: string, weekDays?: number[]) => void
  removeHabit: (id: string) => void
  updateHabit: (id: string, name: string) => void
  updateHabitDays: (id: string, weekDays: number[]) => void
  getHabitsForDay: (day: number) => Habit[]
}

function getDayOfWeek(year: number, month: number, day: number): number {
  const d = new Date(year, month, day)
  return d.getDay() === 0 ? 6 : d.getDay() - 1
}

function DayCard({
  day,
  dayOfWeek,
  isToday,
  habits,
  isCompleted,
  toggleCompletion,
  getDayCompletionRate,
  index,
}: {
  day: number
  dayOfWeek: number
  isToday: boolean
  habits: Habit[]
  isCompleted: (habitId: string, day: number) => boolean
  toggleCompletion: (habitId: string, day: number) => void
  getDayCompletionRate: (day: number) => number
  index: number
}) {
  const rate = getDayCompletionRate(day)
  const completedCount = habits.filter((h) => isCompleted(h.id, day)).length
  const isWeekend = dayOfWeek >= 5
  const isPerfect = rate === 100 && habits.length > 0

  return (
    <div
      className={`glass rounded-2xl flex flex-col overflow-hidden glass-hover opacity-0 animate-slide-up stagger-${index + 1} ${
        isToday ? "neon-border ring-1 ring-primary/30" : ""
      } ${isPerfect ? "neon-glow" : ""}`}
    >
      {/* Day header */}
      <div
        className={`px-4 py-3 flex items-center justify-between border-b border-border/30 relative overflow-hidden ${
          isToday ? "bg-primary/5" : isWeekend ? "bg-secondary/30" : ""
        }`}
      >
        {isToday && (
          <div className="absolute inset-0 animate-shimmer pointer-events-none" />
        )}
        <div className="flex items-center gap-2 relative">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold font-mono ${
              isToday
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-secondary/50 text-foreground border border-border/30"
            }`}
          >
            {day}
          </div>
          <div className="flex flex-col">
            <span
              className={`text-sm font-semibold leading-tight ${
                isToday ? "text-primary neon-text" : "text-foreground"
              }`}
            >
              {FULL_DAY_NAMES[dayOfWeek]}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {SHORT_DAY_NAMES[dayOfWeek]}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 relative">
          {isPerfect && (
            <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-glow-pulse" />
          )}
          <span
            className={`text-xs font-mono font-bold ${
              rate >= 80
                ? "text-primary neon-text"
                : rate >= 50
                  ? "text-foreground"
                  : "text-muted-foreground"
            }`}
          >
            {completedCount}/{habits.length}
          </span>
          <div className="w-11 h-11 relative">
            <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
              <circle
                cx="22"
                cy="22"
                r="17"
                stroke="hsl(var(--secondary))"
                strokeWidth="3"
                fill="none"
              />
              <circle
                cx="22"
                cy="22"
                r="17"
                stroke={rate >= 80 ? "hsl(var(--primary))" : rate >= 50 ? "hsl(45, 80%, 50%)" : "hsl(0, 0%, 35%)"}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 17}
                strokeDashoffset={
                  2 * Math.PI * 17 - (rate / 100) * 2 * Math.PI * 17
                }
                className="transition-all duration-700 ease-out"
                style={{
                  filter:
                    rate > 0
                      ? `drop-shadow(0 0 4px ${rate >= 80 ? "rgba(var(--theme-glow), 0.4)" : rate >= 50 ? "hsl(45 80% 50% / 0.3)" : "transparent"})`
                      : undefined,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold text-foreground font-mono">
                {rate}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Habits list */}
      <div className="flex-1 p-3 flex flex-col gap-1.5">
        {habits.map((habit, hIdx) => {
          const done = isCompleted(habit.id, day)
          return (
            <button
              key={habit.id}
              onClick={() => toggleCompletion(habit.id, day)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-300 group/item ${
                done
                  ? "bg-primary/8 border border-primary/15 hover:bg-primary/12"
                  : "bg-secondary/20 border border-border/10 hover:bg-secondary/40 hover:border-border/30"
              }`}
              style={{ animationDelay: `${hIdx * 30}ms` }}
            >
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all duration-300 ${
                  done
                    ? "bg-primary/25 border border-primary/50 scale-100"
                    : "bg-secondary/40 border border-border/40 group-hover/item:border-primary/20"
                }`}
              >
                {done && (
                  <Check className="w-3 h-3 text-primary animate-checkmark" />
                )}
              </div>
              <span
                className={`text-xs leading-tight transition-all duration-300 ${
                  done
                    ? "text-primary/70 line-through"
                    : "text-foreground/80 group-hover/item:text-foreground"
                }`}
              >
                {habit.name}
              </span>
            </button>
          )
        })}
      </div>

      {/* Footer progress bar */}
      <div className="px-3 pb-3">
        <div className="w-full h-1.5 rounded-full bg-secondary/50 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${rate}%`,
              background: rate >= 80
                ? "hsl(var(--primary))"
                : rate >= 50
                  ? "hsl(45, 80%, 50%)"
                  : "hsl(0, 0%, 35%)",
              boxShadow:
                rate > 50
                  ? `0 0 8px ${rate >= 80 ? "hsl(var(--primary) / 0.4)" : "hsl(45 80% 50% / 0.3)"}`
                  : "none",
            }}
          />
        </div>
      </div>
    </div>
  )
}

export function WeekView({
  habits,
  currentMonth,
  currentYear,
  daysInMonth,
  isCompleted,
  toggleCompletion,
  getHabitCompletionRate,
  getDayCompletionRate,
  addHabit,
  removeHabit,
  updateHabit,
  updateHabitDays,
  getHabitsForDay,
}: WeekViewProps) {
  const [newHabitName, setNewHabitName] = useState("")
  const [newHabitDays, setNewHabitDays] = useState<number[]>([]) // selected weekdays for new habit
  const [isAdding, setIsAdding] = useState(false)
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editingDaysHabitId, setEditingDaysHabitId] = useState<string | null>(null) // editing weekdays for existing habit
  const [mounted, setMounted] = useState(false)
  const [todayDate, setTodayDate] = useState(1)
  const [isCurrentMonth, setIsCurrentMonth] = useState(false)

  useEffect(() => {
    const now = new Date()
    const isCurrent =
      currentYear === now.getFullYear() && currentMonth === now.getMonth()
    setIsCurrentMonth(isCurrent)
    setTodayDate(isCurrent ? now.getDate() : 1)
    setMounted(true)
  }, [currentYear, currentMonth])

  // Compute current week's days
  const currentWeekDays = useMemo(() => {
    const todayDow = getDayOfWeek(currentYear, currentMonth, todayDate)

    let mondayDay = todayDate - todayDow
    if (mondayDay < 1) mondayDay = 1

    const days: { day: number; dayOfWeek: number }[] = []
    for (let i = 0; i < 7; i++) {
      const d = mondayDay + i
      if (d >= 1 && d <= daysInMonth) {
        days.push({
          day: d,
          dayOfWeek: getDayOfWeek(currentYear, currentMonth, d),
        })
      }
    }

    return days
  }, [currentYear, currentMonth, daysInMonth, todayDate])

  const [weekOffset, setWeekOffset] = useState(0)

  const displayedWeekDays = useMemo(() => {
    if (weekOffset === 0) return currentWeekDays

    const baseMonday = currentWeekDays.length > 0 ? currentWeekDays[0].day : 1
    const newMonday = baseMonday + weekOffset * 7

    const days: { day: number; dayOfWeek: number }[] = []
    for (let i = 0; i < 7; i++) {
      const d = newMonday + i
      if (d >= 1 && d <= daysInMonth) {
        days.push({
          day: d,
          dayOfWeek: getDayOfWeek(currentYear, currentMonth, d),
        })
      }
    }

    return days
  }, [weekOffset, currentWeekDays, daysInMonth, currentYear, currentMonth])

  const canGoPrev = useMemo(() => {
    if (displayedWeekDays.length === 0) return false
    return displayedWeekDays[0].day > 1
  }, [displayedWeekDays])

  const canGoNext = useMemo(() => {
    if (displayedWeekDays.length === 0) return false
    return displayedWeekDays[displayedWeekDays.length - 1].day < daysInMonth
  }, [displayedWeekDays, daysInMonth])

  const handleAdd = () => {
    if (newHabitName.trim()) {
      addHabit(newHabitName, newHabitDays.length > 0 ? newHabitDays : undefined)
      setNewHabitName("")
      setNewHabitDays([])
      setIsAdding(false)
    }
  }

  // Toggle a day in the weekday selector
  const toggleNewHabitDay = (dayIdx: number) => {
    setNewHabitDays((prev) =>
      prev.includes(dayIdx) ? prev.filter((d) => d !== dayIdx) : [...prev, dayIdx].sort()
    )
  }

  const handleSaveEdit = (id: string) => {
    if (editName.trim()) {
      updateHabit(id, editName.trim())
    }
    setEditingHabitId(null)
  }

  const weekLabel = useMemo(() => {
    if (displayedWeekDays.length === 0) return ""
    const first = displayedWeekDays[0].day
    const last = displayedWeekDays[displayedWeekDays.length - 1].day
    return `${first} - ${last}`
  }, [displayedWeekDays])

  // Week summary stats — only count habits active on each day
  const weekStats = useMemo(() => {
    let totalChecks = 0
    let totalPossible = 0
    for (const { day } of displayedWeekDays) {
      const dayHabits = getHabitsForDay(day)
      totalPossible += dayHabits.length
      for (const habit of dayHabits) {
        if (isCompleted(habit.id, day)) totalChecks++
      }
    }
    const rate = totalPossible > 0 ? Math.round((totalChecks / totalPossible) * 100) : 0
    return { totalChecks, totalPossible, rate }
  }, [displayedWeekDays, getHabitsForDay, isCompleted])

  if (!mounted) {
    return (
      <div className="flex flex-col gap-4">
        <div className="glass-strong rounded-2xl p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground">Распорядок дня</h2>
          </div>
          <div className="h-8 bg-secondary/30 rounded-lg animate-pulse" />
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="h-5 w-32 bg-secondary/30 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl h-48 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Habit management bar */}
      <div className="glass-strong rounded-2xl p-4 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">
            Распорядок дня
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-mono">
              {habits.length} привычек
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="text-primary hover:text-primary hover:bg-primary/10 gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Добавить
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {habits.map((habit) => (
            <div key={habit.id} className="flex flex-col gap-1">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/40 border border-border/20 group hover:bg-secondary/60 hover:border-border/40 transition-all duration-200"
              >
                {editingHabitId === habit.id ? (
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit(habit.id)
                      if (e.key === "Escape") setEditingHabitId(null)
                    }}
                    onBlur={() => handleSaveEdit(habit.id)}
                    className="h-6 text-xs bg-secondary border-border/50 text-foreground w-32"
                    autoFocus
                  />
                ) : (
                  <>
                    <span className="text-xs text-foreground">{habit.name}</span>
                    {/* Show day badges if habit has specific days */}
                    {habit.weekDays && habit.weekDays.length > 0 && (
                      <span className="text-[9px] text-muted-foreground bg-secondary/60 px-1 py-0.5 rounded">
                        {habit.weekDays.map((d) => SHORT_DAY_NAMES[d]).join(", ")}
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setEditingHabitId(habit.id)
                        setEditName(habit.name)
                      }}
                      className="p-0.5 rounded hover:bg-secondary text-muted-foreground/50 hover:text-foreground opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                      <Pencil className="w-2.5 h-2.5" />
                    </button>
                    {/* Button to edit weekdays */}
                    <button
                      onClick={() =>
                        setEditingDaysHabitId(
                          editingDaysHabitId === habit.id ? null : habit.id
                        )
                      }
                      className="p-0.5 rounded hover:bg-secondary text-muted-foreground/50 hover:text-foreground opacity-0 group-hover:opacity-100 transition-all duration-200"
                      title="Дни недели"
                    >
                      <Calendar className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={() => removeHabit(habit.id)}
                      className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </>
                )}
              </div>
              {/* Weekday editor dropdown */}
              {editingDaysHabitId === habit.id && (
                <div className="flex items-center gap-1 px-1 animate-scale-in">
                  {SHORT_DAY_NAMES.map((name, idx) => {
                    const isActive = habit.weekDays?.includes(idx) ?? false
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          const current = habit.weekDays ?? []
                          const next = isActive
                            ? current.filter((d) => d !== idx)
                            : [...current, idx].sort()
                          updateHabitDays(habit.id, next)
                        }}
                        className={`w-6 h-6 rounded text-[9px] font-medium transition-all ${
                          isActive
                            ? "bg-primary/20 text-primary border border-primary/40"
                            : "bg-secondary/30 text-muted-foreground border border-border/20 hover:border-border/40"
                        }`}
                      >
                        {name}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}

          {isAdding && (
            <div className="flex flex-col gap-1.5 animate-scale-in">
              <div className="flex items-center gap-1.5">
                <Input
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd()
                    if (e.key === "Escape") {
                      setNewHabitName("")
                      setNewHabitDays([])
                      setIsAdding(false)
                    }
                  }}
                  placeholder="Новая привычка..."
                  className="h-7 text-xs bg-secondary border-border/50 text-foreground w-40 placeholder:text-muted-foreground/50"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={!newHabitName.trim()}
                  className="h-7 px-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Check className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setNewHabitName("")
                    setNewHabitDays([])
                    setIsAdding(false)
                  }}
                  className="h-7 px-2 text-muted-foreground"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              {/* Weekday selector for new habit */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground mr-1">Дни:</span>
                {SHORT_DAY_NAMES.map((name, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleNewHabitDay(idx)}
                    className={`w-6 h-6 rounded text-[9px] font-medium transition-all ${
                      newHabitDays.includes(idx)
                        ? "bg-primary/20 text-primary border border-primary/40"
                        : "bg-secondary/30 text-muted-foreground border border-border/20 hover:border-border/40"
                    }`}
                  >
                    {name}
                  </button>
                ))}
                {newHabitDays.length === 0 && (
                  <span className="text-[9px] text-muted-foreground/60 ml-1">каждый день</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Week navigation with stats */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setWeekOffset((o) => o - 1)}
          disabled={!canGoPrev}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Пред. неделя
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground font-mono">
            {weekLabel}
          </span>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-20 h-1.5 rounded-full bg-secondary/50 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{
                  width: `${weekStats.rate}%`,
                  boxShadow: weekStats.rate > 50 ? "0 0 6px hsl(var(--primary) / 0.3)" : "none",
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {weekStats.rate}%
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setWeekOffset((o) => o + 1)}
          disabled={!canGoNext}
          className="text-muted-foreground hover:text-foreground"
        >
          След. неделя
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* 7 Day cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displayedWeekDays.map(({ day, dayOfWeek }, index) => (
          <DayCard
            key={day}
            day={day}
            dayOfWeek={dayOfWeek}
            isToday={isCurrentMonth && day === todayDate}
            habits={getHabitsForDay(day)}
            isCompleted={isCompleted}
            toggleCompletion={toggleCompletion}
            getDayCompletionRate={getDayCompletionRate}
            index={index}
          />
        ))}
      </div>
    </div>
  )
}
