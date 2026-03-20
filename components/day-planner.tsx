"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Check,
  Plus,
  X,
  Star,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Zap,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Battery,
  BatteryMedium,
  BatteryFull,
  MessageSquareQuote,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowRight,
  FileText,
  Flame,
  Target,
  Trophy,
  Trash2,
  Link,
  Save,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts"
import type { DayTask, TaskPriority, EnergyLevel, WeeklyGoal } from "@/lib/types"
import { PRIORITY_LABELS, ENERGY_LABELS, MOTIVATIONAL_QUOTES, BUILT_IN_TEMPLATES } from "@/lib/types"
import { useDayStore, getDateKey } from "@/hooks/use-day-store"
import { ProcrastinationAnalysis } from "@/components/procrastination-analysis"

// === Constants ===

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

const MONTH_NAMES_GEN = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
]

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

// === Small reusable components ===

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const colors = {
    high: "bg-red-500/10 text-red-400 border-red-500/20",
    medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    low: "bg-muted text-muted-foreground border-border/30",
  }
  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium ${colors[priority]}`}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  )
}

function EnergyIndicator({
  level,
  onChange,
}: {
  level: EnergyLevel
  onChange: (level: EnergyLevel) => void
}) {
  const levels: EnergyLevel[] = ["low", "medium", "high"]
  const icons = {
    low: <Battery className="w-4 h-4" />,
    medium: <BatteryMedium className="w-4 h-4" />,
    high: <BatteryFull className="w-4 h-4" />,
  }
  const colors = {
    low: "text-red-400",
    medium: "text-yellow-400",
    high: "text-primary",
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Энергия:</span>
      <div className="flex items-center gap-1">
        {levels.map((l) => (
          <button
            key={l}
            onClick={() => onChange(l)}
            className={`p-1.5 rounded-lg transition-all duration-200 ${
              level === l
                ? `${colors[l]} bg-secondary/80 border border-border/50`
                : "text-muted-foreground/40 hover:text-muted-foreground"
            }`}
            title={ENERGY_LABELS[l]}
          >
            {icons[l]}
          </button>
        ))}
      </div>
      <span className={`text-xs font-medium ${colors[level]}`}>
        {ENERGY_LABELS[level]}
      </span>
    </div>
  )
}

// ============================================================
// FEATURE 1: Mini Week Overview — progress bars under each day
// ============================================================

function MiniWeekOverview({
  selectedDate,
  dayDataMap,
  onSelectDate,
}: {
  selectedDate: Date
  dayDataMap: Record<string, { tasks: DayTask[] }>
  onSelectDate: (date: Date) => void
}) {
  // Get 7 days of current week (Mon-Sun)
  const d = new Date(selectedDate)
  const dow = d.getDay() === 0 ? 6 : d.getDay() - 1
  const monday = new Date(d)
  monday.setDate(d.getDate() - dow)

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    return date
  })

  const today = new Date()

  return (
    <div className="glass-strong rounded-2xl p-4 animate-slide-up">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground">Обзор недели</span>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((date, idx) => {
          const key = getDateKey(date)
          const data = dayDataMap[key]
          const totalTasks = data?.tasks?.length ?? 0
          const completedTasks = data?.tasks?.filter((t) => t.completed).length ?? 0
          const focusTasks = data?.tasks?.filter((t) => t.isFocus) ?? []
          const allMITsDone = focusTasks.length > 0 && focusTasks.every((t) => t.completed)
          const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

          const isSelected =
            date.getFullYear() === selectedDate.getFullYear() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getDate() === selectedDate.getDate()
          const isToday =
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate()

          return (
            <button
              key={idx}
              onClick={() => onSelectDate(new Date(date))}
              className={`flex flex-col items-center gap-1.5 py-2 px-1 rounded-xl transition-all duration-200 ${
                isSelected
                  ? "bg-primary/10 border border-primary/30"
                  : isToday
                    ? "bg-secondary/30 border border-border/20"
                    : "border border-transparent hover:bg-secondary/20"
              }`}
            >
              <span className="text-[9px] font-medium text-muted-foreground uppercase">
                {SHORT_DAY_NAMES[idx]}
              </span>
              {/* Progress indicator */}
              <div className="w-full h-1.5 rounded-full bg-secondary/40 overflow-hidden">
                {totalTasks > 0 ? (
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20" />
                  </div>
                )}
              </div>
              {/* MIT star if all MITs done */}
              {allMITsDone ? (
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              ) : (
                <span className="text-[10px] font-mono text-muted-foreground/60">
                  {totalTasks > 0 ? `${completedTasks}/${totalTasks}` : "—"}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// FEATURE 3: Weekly Goals — collapsible section
// ============================================================

function WeeklyGoalsSection({
  goals,
  allTasks,
  onAdd,
  onUpdateProgress,
  onRemove,
  onToggleTaskLink,
}: {
  goals: WeeklyGoal[]
  allTasks: DayTask[]
  onAdd: (name: string, autoProgress: boolean) => void
  onUpdateProgress: (id: string, progress: number) => void
  onRemove: (id: string) => void
  onToggleTaskLink: (goalId: string, taskId: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newGoalName, setNewGoalName] = useState("")
  const [autoProgress, setAutoProgress] = useState(false)
  const [linkingGoalId, setLinkingGoalId] = useState<string | null>(null) // which goal is in "link tasks" mode

  const handleAdd = () => {
    if (!newGoalName.trim()) return
    onAdd(newGoalName, autoProgress)
    setNewGoalName("")
    setAutoProgress(false)
    setIsAdding(false)
  }

  return (
    <div className="glass-strong rounded-2xl p-4 animate-slide-up" style={{ animationDelay: "0.05s" }}>
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 w-full mb-2"
      >
        <Target className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Цели на неделю</span>
        <span className="text-xs text-muted-foreground font-mono ml-1">{goals.length}/3</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground ml-auto transition-transform duration-200 ${
            collapsed ? "-rotate-90" : ""
          }`}
        />
      </button>

      {/* Content — collapsible */}
      {!collapsed && (
        <div className="flex flex-col gap-3 animate-fade-in">
          {/* Goal list */}
          {goals.map((goal) => (
            <div key={goal.id} className="flex flex-col gap-2 p-3 rounded-xl bg-secondary/20 border border-border/10">
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground flex-1 truncate">{goal.name}</span>
                <span className="text-xs font-mono text-primary font-bold">{goal.progress}%</span>
                {/* Link tasks button */}
                <button
                  onClick={() => setLinkingGoalId(linkingGoalId === goal.id ? null : goal.id)}
                  className={`p-1 rounded-md transition-colors ${
                    linkingGoalId === goal.id ? "text-primary bg-primary/10" : "text-muted-foreground/40 hover:text-muted-foreground"
                  }`}
                  title="Привязать задачи"
                >
                  <Link className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onRemove(goal.id)}
                  className="text-muted-foreground/30 hover:text-destructive p-1 rounded-md"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
              {/* Manual progress slider (if not auto) */}
              {!goal.autoProgress && (
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={goal.progress}
                  onChange={(e) => onUpdateProgress(goal.id, parseInt(e.target.value))}
                  className="w-full h-1 accent-primary cursor-pointer"
                />
              )}
              {/* Task linking dropdown */}
              {linkingGoalId === goal.id && (
                <div className="flex flex-col gap-1 p-2 rounded-lg bg-secondary/30 border border-border/10 animate-scale-in max-h-40 overflow-y-auto">
                  <span className="text-[10px] text-muted-foreground mb-1">Привязанные задачи:</span>
                  {allTasks.map((task) => (
                    <label key={task.id} className="flex items-center gap-2 text-xs text-foreground cursor-pointer hover:bg-secondary/30 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={goal.linkedTaskIds.includes(task.id)}
                        onChange={() => onToggleTaskLink(goal.id, task.id)}
                        className="accent-primary w-3 h-3"
                      />
                      <span className="truncate">{task.name}</span>
                    </label>
                  ))}
                  {allTasks.length === 0 && (
                    <span className="text-[10px] text-muted-foreground">Нет задач</span>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Add goal */}
          {goals.length < 3 && !isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors py-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Добавить цель
            </button>
          )}

          {isAdding && (
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-secondary/20 border border-border/10 animate-scale-in">
              <Input
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd()
                  if (e.key === "Escape") setIsAdding(false)
                }}
                placeholder="Название цели..."
                className="bg-secondary/50 border-border/50 text-foreground text-sm h-8"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoProgress}
                    onChange={(e) => setAutoProgress(e.target.checked)}
                    className="accent-primary w-3 h-3"
                  />
                  Авто-прогресс
                </label>
                <div className="flex-1" />
                <Button size="sm" onClick={handleAdd} disabled={!newGoalName.trim()} className="h-7 text-xs bg-primary text-primary-foreground rounded-lg">
                  <Check className="w-3 h-3 mr-1" />
                  Добавить
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)} className="h-7 text-xs text-muted-foreground">
                  Отмена
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================
// FEATURE 4: Habit Tracker — habits with streak and heat map
// ============================================================

function HabitTracker({
  habits,
  completions,
  selectedDate,
  onToggle,
  onAdd,
  onRemove,
  getStreak,
}: {
  habits: { id: string; name: string }[]
  completions: Record<string, Record<string, boolean>>
  selectedDate: Date
  onToggle: (habitId: string, date: Date) => void
  onAdd: (name: string) => void
  onRemove: (habitId: string) => void
  getStreak: (habitId: string) => number
}) {
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState("")

  // Get 7 days of current week for heat map
  const d = new Date(selectedDate)
  const dow = d.getDay() === 0 ? 6 : d.getDay() - 1
  const monday = new Date(d)
  monday.setDate(d.getDate() - dow)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    return date
  })

  const handleAdd = () => {
    if (!newName.trim()) return
    onAdd(newName)
    setNewName("")
    setIsAdding(false)
  }

  return (
    <div className="glass-strong rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Flame className="w-4 h-4 text-orange-400" />
        <h3 className="text-sm font-semibold text-foreground">Привычки</h3>
        <span className="text-xs text-muted-foreground font-mono">{habits.length}</span>
      </div>

      {/* Habit list */}
      <div className="flex flex-col gap-3">
        {habits.map((habit) => {
          const streak = getStreak(habit.id)
          const habitComp = completions[habit.id] ?? {}

          return (
            <div key={habit.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {/* Checkbox for selected day */}
                <button
                  onClick={() => onToggle(habit.id, selectedDate)}
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all duration-300 ${
                    habitComp[getDateKey(selectedDate)]
                      ? "bg-primary/20 border border-primary/50"
                      : "bg-secondary/50 border border-border hover:border-primary/30"
                  }`}
                >
                  {habitComp[getDateKey(selectedDate)] && (
                    <Check className="w-3 h-3 text-primary animate-checkmark" />
                  )}
                </button>
                <span className="text-sm text-foreground flex-1 truncate">{habit.name}</span>
                {/* Streak */}
                {streak > 0 && (
                  <span className="text-xs font-bold text-orange-400 flex items-center gap-0.5">
                    <Flame className="w-3 h-3" />
                    {streak}
                  </span>
                )}
                {/* Delete */}
                <button
                  onClick={() => onRemove(habit.id)}
                  className="text-muted-foreground/20 hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              {/* Heat map — 7 cells for the week */}
              <div className="flex gap-1 ml-7">
                {weekDays.map((date, i) => {
                  const key = getDateKey(date)
                  const done = habitComp[key]
                  return (
                    <button
                      key={i}
                      onClick={() => onToggle(habit.id, date)}
                      className={`w-5 h-5 rounded-md border transition-all duration-200 ${
                        done
                          ? "bg-primary/30 border-primary/40"
                          : "bg-secondary/20 border-border/10 hover:border-border/30"
                      }`}
                      title={`${SHORT_DAY_NAMES[i]}`}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add habit */}
      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Добавить привычку
        </button>
      ) : (
        <div className="flex items-center gap-2 animate-scale-in">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd()
              if (e.key === "Escape") { setNewName(""); setIsAdding(false) }
            }}
            placeholder="Название..."
            className="bg-secondary/50 border-border/50 text-foreground text-sm h-8 flex-1"
            autoFocus
          />
          <Button size="sm" onClick={handleAdd} disabled={!newName.trim()} className="h-8 text-xs bg-primary text-primary-foreground rounded-lg">
            <Check className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setNewName(""); setIsAdding(false) }} className="h-8 text-xs text-muted-foreground">
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {habits.length === 0 && !isAdding && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Добавьте привычки для отслеживания
        </p>
      )}
    </div>
  )
}

// ============================================================
// FEATURE 5: Pomodoro Timer with task binding
// ============================================================

function PomodoroTimer({
  seconds,
  running,
  isBreak,
  pomodoroCount,
  tasks,
  selectedTaskId,
  onToggle,
  onReset,
  onSelectTask,
}: {
  seconds: number
  running: boolean
  isBreak: boolean
  pomodoroCount: number
  tasks: DayTask[]
  selectedTaskId: string | null
  onToggle: () => void
  onReset: () => void
  onSelectTask: (taskId: string | null) => void
}) {
  const progress = isBreak
    ? ((5 * 60 - seconds) / (5 * 60)) * 100
    : ((25 * 60 - seconds) / (25 * 60)) * 100
  const circumference = 2 * Math.PI * 54

  return (
    <div className="glass-strong rounded-2xl p-5 flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          {isBreak ? "Перерыв" : "Pomodoro"}
        </h3>
        <span className="text-xs text-muted-foreground font-mono">
          #{pomodoroCount + 1}
        </span>
      </div>

      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="54"
            stroke="hsl(var(--secondary))"
            strokeWidth="5"
            fill="none"
          />
          <circle
            cx="60"
            cy="60"
            r="54"
            stroke={isBreak ? "hsl(45, 80%, 50%)" : "hsl(var(--primary))"}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (progress / 100) * circumference}
            className="transition-all duration-1000"
            style={{
              filter: `drop-shadow(0 0 8px ${
                isBreak ? "hsl(45 80% 50% / 0.3)" : "rgba(var(--theme-glow), 0.3)"
              })`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-foreground font-mono">
            {formatTime(seconds)}
          </span>
        </div>
      </div>

      {/* Task binding dropdown */}
      <select
        value={selectedTaskId ?? ""}
        onChange={(e) => onSelectTask(e.target.value || null)}
        className="w-full bg-secondary/30 border border-border/30 text-foreground text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/50"
      >
        <option value="">Без привязки к задаче</option>
        {tasks.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={`h-10 w-10 rounded-xl transition-all duration-300 ${
            running
              ? "bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
              : "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
          }`}
        >
          {running ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onReset}
          className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1.5">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i < pomodoroCount
                ? "bg-primary neon-glow scale-110"
                : "bg-secondary"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================================
// FEATURE 7: Weekly Summary — bars, best day, MIT %, focus time
// ============================================================

function WeeklySummary({
  stats,
  onReset,
}: {
  stats: {
    dayStats: { date: Date; tasksCompleted: number; totalTasks: number; mitCompleted: number; totalMIT: number; pomodoroMinutes: number }[]
    bestDayIndex: number
    mitCompletionRate: number
    avgFocusMinutes: number
  }
  onReset: () => void
}) {
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const maxTasks = Math.max(...stats.dayStats.map((d) => d.tasksCompleted), 1)

  return (
    <div className="glass-strong rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-yellow-400" />
        <h3 className="text-sm font-semibold text-foreground">Итоги недели</h3>
      </div>

      {/* 7 mini bars */}
      <div className="flex items-end justify-between gap-1 h-20">
        {stats.dayStats.map((day, i) => {
          const height = maxTasks > 0 ? (day.tasksCompleted / maxTasks) * 100 : 0
          const isBest = i === stats.bestDayIndex && day.tasksCompleted > 0
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              {isBest && <Trophy className="w-3 h-3 text-yellow-400 mb-0.5" />}
              <div
                className={`w-full rounded-t-md transition-all duration-700 animate-bar-grow ${
                  isBest ? "bg-yellow-400/80" : "bg-primary/50"
                }`}
                style={{ height: `${Math.max(height, 4)}%` }}
              />
              <span className="text-[8px] text-muted-foreground uppercase">
                {SHORT_DAY_NAMES[i]}
              </span>
            </div>
          )
        })}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-secondary/20 rounded-lg p-2.5 text-center border border-border/10">
          <div className="text-sm font-bold text-foreground font-mono">{stats.mitCompletionRate}%</div>
          <div className="text-[9px] text-muted-foreground">MIT за неделю</div>
        </div>
        <div className="bg-secondary/20 rounded-lg p-2.5 text-center border border-border/10">
          <div className="text-sm font-bold text-foreground font-mono">{stats.avgFocusMinutes} мин</div>
          <div className="text-[9px] text-muted-foreground">Среднее фокус/день</div>
        </div>
      </div>

      {/* Reset week */}
      {!showResetConfirm ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowResetConfirm(true)}
          className="w-full text-muted-foreground hover:text-destructive text-xs rounded-xl"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          Сбросить неделю
        </Button>
      ) : (
        <div className="flex flex-col gap-2 animate-scale-in">
          <p className="text-xs text-destructive text-center">Все данные недели будут удалены!</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => { onReset(); setShowResetConfirm(false) }}
              className="flex-1 h-7 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg"
            >
              Подтвердить
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowResetConfirm(false)}
              className="flex-1 h-7 text-xs text-muted-foreground"
            >
              Отмена
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// FEATURE 8: Day Templates — apply or save templates
// ============================================================

function TemplateSelector({
  customTemplates,
  onApply,
  onSaveNew,
  onDelete,
}: {
  customTemplates: { id: string; name: string; isBuiltIn: boolean }[]
  onApply: (id: string) => void
  onSaveNew: (name: string) => void
  onDelete: (id: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveName, setSaveName] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
        setIsSaving(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [isOpen])

  const allTemplates = [...BUILT_IN_TEMPLATES, ...customTemplates]

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="text-muted-foreground hover:text-foreground gap-1.5 rounded-xl text-xs"
      >
        <FileText className="w-3.5 h-3.5" />
        Шаблоны
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 glass-strong rounded-xl p-3 w-64 z-50 animate-scale-in border border-border/30">
          <span className="text-xs font-semibold text-foreground block mb-2">Шаблоны дня</span>

          <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
            {allTemplates.map((t) => (
              <div key={t.id} className="flex items-center gap-2 group">
                <button
                  onClick={() => { onApply(t.id); setIsOpen(false) }}
                  className="flex-1 text-left text-xs text-foreground hover:text-primary p-1.5 rounded-lg hover:bg-secondary/30 transition-colors truncate"
                >
                  {t.name}
                  {t.isBuiltIn && <span className="text-[9px] text-muted-foreground ml-1">(встроенный)</span>}
                </button>
                {!t.isBuiltIn && (
                  <button
                    onClick={() => onDelete(t.id)}
                    className="text-muted-foreground/30 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-border/20 mt-2 pt-2">
            {!isSaving ? (
              <button
                onClick={() => setIsSaving(true)}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 w-full transition-colors"
              >
                <Save className="w-3 h-3" />
                Сохранить текущий как шаблон
              </button>
            ) : (
              <div className="flex items-center gap-1.5 animate-scale-in">
                <Input
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && saveName.trim()) {
                      onSaveNew(saveName)
                      setSaveName("")
                      setIsSaving(false)
                    }
                    if (e.key === "Escape") setIsSaving(false)
                  }}
                  placeholder="Название..."
                  className="bg-secondary/50 border-border/50 text-foreground text-xs h-7 flex-1"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (saveName.trim()) {
                      onSaveNew(saveName)
                      setSaveName("")
                      setIsSaving(false)
                    }
                  }}
                  disabled={!saveName.trim()}
                  className="h-7 text-xs bg-primary text-primary-foreground rounded-lg px-2"
                >
                  <Check className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Task Item (updated: carry-over arrow, energy warning)
// ============================================================

function TaskItem({
  task,
  isOverdue,
  energyWarning,
  onToggle,
  onRemove,
  onToggleFocus,
  onMoveUp,
  onMoveDown,
  index,
  priorityScore,
}: {
  task: DayTask
  isOverdue: boolean
  energyWarning: boolean
  onToggle: () => void
  onRemove: () => void
  onToggleFocus: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  index: number
  priorityScore?: number
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group opacity-0 animate-slide-up ${
        task.completed
          ? "bg-primary/5 border border-primary/10"
          : isOverdue
            ? "bg-destructive/5 border border-destructive/20 animate-pulse-glow"
            : energyWarning
              ? "bg-destructive/5 border-2 border-destructive/30"
              : task.isFocus
                ? "bg-primary/5 border border-primary/20 neon-border"
                : "bg-secondary/20 border border-border/10 hover:bg-secondary/40 hover:border-border/30"
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Time */}
      <span
        className={`text-xs font-mono shrink-0 w-12 ${
          isOverdue && !task.completed
            ? "text-destructive"
            : "text-muted-foreground"
        }`}
      >
        {task.time}
      </span>

      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all duration-300 ${
          task.completed
            ? "bg-primary/20 border border-primary/50 scale-100"
            : "bg-secondary/50 border border-border hover:border-primary/30 hover:scale-105"
        }`}
      >
        {task.completed && (
          <Check className="w-3 h-3 text-primary animate-checkmark" />
        )}
      </button>

      {/* Name + priority + carried icon */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        {/* Carried-from arrow */}
        {task.carriedFrom && (
          <ArrowRight className="w-3 h-3 text-yellow-400 shrink-0" />
        )}
        <span
          className={`text-sm truncate transition-all duration-300 ${
            task.completed
              ? "text-muted-foreground line-through"
              : "text-foreground"
          }`}
        >
          {task.name}
        </span>
        <PriorityBadge priority={task.priority} />
        {isOverdue && !task.completed && (
          <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 animate-glow-pulse" />
        )}
        {energyWarning && !task.completed && (
          <span className="text-[9px] text-destructive/70 shrink-0">перенести?</span>
        )}
        {priorityScore !== undefined && (
          <span className="text-[10px] font-mono font-bold text-primary/70 shrink-0">[{priorityScore}]</span>
        )}
      </div>

      {/* Focus star */}
      <button
        onClick={onToggleFocus}
        className={`shrink-0 transition-all duration-300 ${
          task.isFocus
            ? "text-yellow-400 scale-110"
            : "text-muted-foreground/30 hover:text-yellow-400/50 opacity-0 group-hover:opacity-100"
        }`}
        title="Фокус-задача"
      >
        <Star className={`w-4 h-4 ${task.isFocus ? "fill-yellow-400" : ""}`} />
      </button>

      {/* Reorder */}
      <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {onMoveUp && (
          <button
            onClick={onMoveUp}
            className="text-muted-foreground/50 hover:text-foreground"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
        )}
        {onMoveDown && (
          <button
            onClick={onMoveDown}
            className="text-muted-foreground/50 hover:text-foreground"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="shrink-0 text-muted-foreground/30 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all duration-200"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ============================================================
// Week Day Selector
// ============================================================

function WeekDaySelector({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: Date
  onSelectDate: (date: Date) => void
}) {
  const getWeekDays = () => {
    const d = new Date(selectedDate)
    const dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1
    const monday = new Date(d)
    monday.setDate(d.getDate() - dayOfWeek)

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      return date
    })
  }

  const weekDays = getWeekDays()
  const today = new Date()

  const goToPrevWeek = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 7)
    onSelectDate(newDate)
  }

  const goToNextWeek = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 7)
    onSelectDate(newDate)
  }

  return (
    <div className="glass-strong rounded-2xl p-4 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPrevWeek}
          className="text-muted-foreground hover:text-foreground rounded-xl"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-sm font-semibold text-foreground">
          Планировка недели
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextWeek}
          className="text-muted-foreground hover:text-foreground rounded-xl"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((date, idx) => {
          const isSelected =
            date.getFullYear() === selectedDate.getFullYear() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getDate() === selectedDate.getDate()
          const isToday =
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate()

          return (
            <button
              key={idx}
              onClick={() => onSelectDate(new Date(date))}
              className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl transition-all duration-200 ${
                isSelected
                  ? "bg-primary/10 border border-primary/30 text-primary"
                  : isToday
                    ? "bg-secondary/40 border border-border/30 text-foreground"
                    : "border border-transparent hover:bg-secondary/30 hover:border-border/20 text-muted-foreground"
              }`}
            >
              <span className="text-[10px] font-medium uppercase">
                {SHORT_DAY_NAMES[idx]}
              </span>
              <span className={`text-sm font-bold font-mono ${isSelected ? "text-primary" : isToday ? "text-foreground" : ""}`}>
                {date.getDate()}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function DayPlanner() {
  const store = useDayStore()
  const [newTaskName, setNewTaskName] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("medium")
  const [newTaskTime, setNewTaskTime] = useState("09:00")
  const [isAdding, setIsAdding] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [summaryText, setSummaryText] = useState("")
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Mobile: tabs for right sidebar
  const [rightTab, setRightTab] = useState<"pomodoro" | "habits">("pomodoro")

  const dow =
    store.selectedDate.getDay() === 0
      ? 6
      : store.selectedDate.getDay() - 1

  const [quote, setQuote] = useState<string>(MOTIVATIONAL_QUOTES[0])

  useEffect(() => {
    const today = new Date()
    const dayOfYear = Math.floor(
      (Date.now() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
    )
    setQuote(MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length])
  }, [])

  // Pomodoro timer interval
  useEffect(() => {
    if (store.timerRunning) {
      timerRef.current = setInterval(() => {
        store.setTimerSeconds((prev: number) => {
          if (prev <= 1) {
            store.setTimerRunning(false)
            if (!store.isBreak) {
              // Log completed pomodoro session
              store.logPomodoroSession(store.pomodoroTaskId)
              store.setPomodoroCount((c: number) => c + 1)
              store.setIsBreak(true)
              return 5 * 60
            } else {
              store.setIsBreak(false)
              return 25 * 60
            }
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [store.timerRunning, store.isBreak, store])

  const handleToggleTimer = useCallback(() => {
    store.setTimerRunning(!store.timerRunning)
  }, [store])

  const handleResetTimer = useCallback(() => {
    store.setTimerRunning(false)
    store.setIsBreak(false)
    store.setTimerSeconds(25 * 60)
  }, [store])

  const handleAddTask = () => {
    if (!newTaskName.trim()) return
    store.addTask(newTaskName, newTaskPriority, newTaskTime)
    setNewTaskName("")
    setNewTaskPriority("medium")
    setNewTaskTime("09:00")
    setIsAdding(false)
  }

  const handleSummary = () => {
    if (summaryText.trim()) {
      store.setDaySummary(summaryText.trim())
    }
    setShowSummary(false)
  }

  // Check if a task needs energy warning (high priority in afternoon when energy is low)
  const needsEnergyWarning = (task: DayTask) => {
    if (task.completed || store.energyLevel !== "low" || task.priority !== "high") return false
    return parseInt(task.time.split(":")[0]) >= 12
  }

  const progressPieData = [
    { name: "done", value: store.completionRate },
    { name: "left", value: 100 - store.completionRate },
  ]
  const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--border))"]

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* FEATURE 1: Mini week overview */}
      <MiniWeekOverview
        selectedDate={store.selectedDate}
        dayDataMap={store.dayDataMap}
        onSelectDate={store.setSelectedDate}
      />

      {/* FEATURE 3: Weekly goals */}
      <WeeklyGoalsSection
        goals={store.currentWeekGoals}
        allTasks={store.tasks}
        onAdd={store.addWeeklyGoal}
        onUpdateProgress={store.updateWeeklyGoalProgress}
        onRemove={store.removeWeeklyGoal}
        onToggleTaskLink={store.toggleTaskLink}
      />

      {/* Week day selector */}
      <WeekDaySelector
        selectedDate={store.selectedDate}
        onSelectDate={store.setSelectedDate}
      />

      {/* FEATURE 2: Carry over badge */}
      {store.showCarryOverBadge && store.carryOverTasks.length > 0 && (
        <div className="glass-strong rounded-2xl p-4 flex items-start gap-3 border border-yellow-500/30 animate-slide-up">
          <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground mb-1">
              {store.carryOverTasks.length} задач не выполнено вчера
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Перенести их на сегодня?
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                onClick={store.carryOverAllTasks}
                className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
              >
                Перенести все
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={store.dismissCarryOver}
                className="h-8 text-xs text-muted-foreground"
              >
                Пропустить
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Day header block */}
      <div className="glass-strong rounded-2xl p-5 lg:p-6 animate-slide-up">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-lg font-bold text-foreground">
                {FULL_DAY_NAMES[dow]},{" "}
                {store.selectedDate.getDate()}{" "}
                {MONTH_NAMES_GEN[store.selectedDate.getMonth()]}
              </h2>
              {store.completionRate === 100 && store.tasks.length > 0 && (
                <Sparkles className="w-5 h-5 text-yellow-400 animate-glow-pulse" />
              )}
            </div>
            <p className="text-xs text-muted-foreground italic mb-4 leading-relaxed">
              {`"${quote}"`}
            </p>
            <EnergyIndicator
              level={store.energyLevel}
              onChange={store.setEnergyLevel}
            />
          </div>

          <div className="w-24 h-24 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={progressPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={42}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {progressPieData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={PIE_COLORS[i]}
                      style={
                        i === 0
                          ? {
                              filter:
                                "drop-shadow(0 0 6px rgba(var(--theme-glow), 0.3))",
                            }
                          : undefined
                      }
                    />
                  ))}
                </Pie>
                <text
                  x="50%"
                  y="46%"
                  textAnchor="middle"
                  fill="hsl(var(--foreground))"
                  fontSize="16"
                  fontWeight="bold"
                  fontFamily="var(--font-jetbrains-mono)"
                >
                  {store.completionRate}%
                </text>
                <text
                  x="50%"
                  y="60%"
                  textAnchor="middle"
                  fill="hsl(var(--muted-foreground))"
                  fontSize="9"
                >
                  прогресс
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main task list - 2 cols */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Focus block */}
          {store.focusTasks.length > 0 && (
            <div className="glass-strong rounded-2xl p-5 neon-border animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <h3 className="text-sm font-semibold text-foreground">
                  Фокус-задачи (MIT)
                </h3>
                <span className="text-xs text-muted-foreground font-mono">
                  {store.focusTasks.filter((t) => t.completed).length}/
                  {store.focusTasks.length}
                </span>
                {store.focusCompletionRate === 100 && (
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-glow-pulse ml-auto" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                {store.focusTasks.map((task, idx) => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 opacity-0 animate-slide-up ${
                      task.completed
                        ? "bg-primary/10 border border-primary/20"
                        : "bg-primary/5 border border-primary/15 hover:bg-primary/8"
                    }`}
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <button
                      onClick={() => store.toggleTask(task.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                        task.completed
                          ? "bg-primary/30 border border-primary/60 neon-glow"
                          : "bg-secondary/50 border border-primary/30 hover:border-primary/50 hover:scale-105"
                      }`}
                    >
                      {task.completed && (
                        <Check className="w-3.5 h-3.5 text-primary animate-checkmark" />
                      )}
                    </button>
                    <span
                      className={`text-sm font-medium flex-1 transition-all duration-300 ${
                        task.completed
                          ? "text-primary/60 line-through"
                          : "text-foreground"
                      }`}
                    >
                      {task.name}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {task.time}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 w-full h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                  style={{
                    width: `${store.focusCompletionRate}%`,
                    boxShadow: "0 0 8px hsl(var(--primary) / 0.4)",
                  }}
                />
              </div>
            </div>
          )}

          {/* Recommended next task */}
          {store.isSmartSort && store.recommendedNext && (
            <div className="glass-strong rounded-2xl p-4 neon-border animate-slide-up" style={{ animationDelay: "0.12s" }}>
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-primary">Рекомендуемая следующая</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">{store.recommendedNext.name}</span>
                <PriorityBadge priority={store.recommendedNext.priority} />
                <span className="text-xs font-mono text-muted-foreground">{store.recommendedNext.time}</span>
                <span className="text-xs font-mono font-bold text-primary ml-auto">[{store.recommendedNext.priorityScore}]</span>
              </div>
            </div>
          )}

          {/* FEATURE 6: Energy optimization warning */}
          {store.energyLevel === "low" && store.needsEnergyOptimization && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/5 border border-destructive/20 animate-slide-up">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive/90 flex-1">
                Низкая энергия! Важные задачи запланированы на вторую половину дня.
              </p>
              <Button
                size="sm"
                onClick={store.optimizeByEnergy}
                className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shrink-0"
              >
                Оптимизировать
              </Button>
            </div>
          )}

          {/* Task list */}
          <div className="glass-strong rounded-2xl p-5 animate-slide-up" style={{ animationDelay: "0.15s" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Задачи на день
                </h3>
                <span className="text-xs font-mono text-muted-foreground px-2 py-0.5 rounded-lg bg-secondary/50">
                  {store.completedCount}/{store.totalCount}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={store.toggleSmartSort}
                  className={`gap-1.5 rounded-xl text-xs ${
                    store.isSmartSort
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  {store.isSmartSort ? "По приоритету" : "Умная сортировка"}
                </Button>
                {/* FEATURE 8: Template selector */}
                <TemplateSelector
                  customTemplates={store.customTemplates}
                  onApply={store.applyTemplate}
                  onSaveNew={store.saveCurrentAsTemplate}
                  onDelete={store.deleteTemplate}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAdding(true)}
                  className="text-primary hover:text-primary hover:bg-primary/10 gap-1.5 rounded-xl"
                >
                  <Plus className="w-4 h-4" />
                  Добавить
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {(store.isSmartSort ? store.smartSortedTasks : store.tasks).map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isOverdue={store.isOverdue(task)}
                  energyWarning={needsEnergyWarning(task)}
                  onToggle={() => store.toggleTask(task.id)}
                  onRemove={() => store.removeTask(task.id)}
                  onToggleFocus={() => store.toggleFocus(task.id)}
                  onMoveUp={
                    !store.isSmartSort && index > 0
                      ? () => store.moveTask(index, index - 1)
                      : undefined
                  }
                  onMoveDown={
                    !store.isSmartSort && index < store.tasks.length - 1
                      ? () => store.moveTask(index, index + 1)
                      : undefined
                  }
                  index={index}
                  priorityScore={store.isSmartSort ? (task as typeof store.smartSortedTasks[number]).priorityScore : undefined}
                />
              ))}

              {isAdding && (
                <div className="flex flex-col gap-2 p-4 rounded-xl bg-secondary/20 border border-border/20 animate-scale-in">
                  <Input
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddTask()
                      if (e.key === "Escape") {
                        setNewTaskName("")
                        setIsAdding(false)
                      }
                    }}
                    placeholder="Название задачи..."
                    className="bg-secondary/50 border-border/50 text-foreground text-sm h-9"
                    autoFocus
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <Input
                      type="time"
                      value={newTaskTime}
                      onChange={(e) => setNewTaskTime(e.target.value)}
                      className="bg-secondary/50 border-border/50 text-foreground text-sm h-9 w-28"
                    />
                    <select
                      value={newTaskPriority}
                      onChange={(e) =>
                        setNewTaskPriority(e.target.value as TaskPriority)
                      }
                      className="bg-secondary/50 border border-border/50 text-foreground text-sm h-9 rounded-md px-2"
                    >
                      <option value="high">Высокий</option>
                      <option value="medium">Средний</option>
                      <option value="low">Низкий</option>
                    </select>
                    <div className="flex-1" />
                    <Button
                      size="sm"
                      onClick={handleAddTask}
                      disabled={!newTaskName.trim()}
                      className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Добавить
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setNewTaskName("")
                        setIsAdding(false)
                      }}
                      className="h-9 text-muted-foreground"
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              )}

              {store.tasks.length === 0 && !isAdding && (
                <div className="text-center py-10 text-muted-foreground text-sm animate-fade-in">
                  Нет задач на сегодня. Добавьте первую задачу!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-6">
          {/* Mobile tabs: switch between Pomodoro and Habits */}
          <div className="flex lg:hidden gap-1 bg-secondary/20 rounded-xl p-1">
            <button
              onClick={() => setRightTab("pomodoro")}
              className={`flex-1 text-xs py-2 rounded-lg transition-colors ${
                rightTab === "pomodoro" ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground"
              }`}
            >
              Pomodoro
            </button>
            <button
              onClick={() => setRightTab("habits")}
              className={`flex-1 text-xs py-2 rounded-lg transition-colors ${
                rightTab === "habits" ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground"
              }`}
            >
              Привычки
            </button>
          </div>

          {/* Pomodoro — visible on desktop always, on mobile only when tab=pomodoro */}
          <div className={`animate-slide-up ${rightTab !== "pomodoro" ? "hidden lg:block" : ""}`} style={{ animationDelay: "0.2s" }}>
            <PomodoroTimer
              seconds={store.timerSeconds}
              running={store.timerRunning}
              isBreak={store.isBreak}
              pomodoroCount={store.pomodoroCount}
              tasks={store.tasks.filter((t) => !t.completed)}
              selectedTaskId={store.pomodoroTaskId}
              onToggle={handleToggleTimer}
              onReset={handleResetTimer}
              onSelectTask={store.setPomodoroTaskId}
            />
          </div>

          {/* FEATURE 4: Habit Tracker — visible on desktop always, on mobile only when tab=habits */}
          <div className={`animate-slide-up ${rightTab !== "habits" ? "hidden lg:block" : ""}`} style={{ animationDelay: "0.22s" }}>
            <HabitTracker
              habits={store.weeklyHabits}
              completions={store.habitCompletions}
              selectedDate={store.selectedDate}
              onToggle={store.toggleHabitCompletion}
              onAdd={store.addHabit}
              onRemove={store.removeHabit}
              getStreak={store.getHabitStreak}
            />
          </div>

          {/* FEATURE 7: Weekly Summary */}
          <div className="animate-slide-up" style={{ animationDelay: "0.25s" }}>
            <WeeklySummary
              stats={store.weeklyStats}
              onReset={store.resetWeek}
            />
          </div>

          {/* Day analysis block */}
          <div className="glass-strong rounded-2xl p-5 flex flex-col gap-4 animate-slide-up" style={{ animationDelay: "0.28s" }}>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Анализ дня
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/20 rounded-xl p-3.5 text-center border border-border/10 hover:bg-secondary/30 transition-all duration-200">
                <div className="text-lg font-bold text-foreground font-mono animate-count-up">
                  {store.hoursWorked}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Часов отработано
                </div>
              </div>
              <div className="bg-secondary/20 rounded-xl p-3.5 text-center border border-border/10 hover:bg-secondary/30 transition-all duration-200">
                <div className="text-lg font-bold text-foreground font-mono animate-count-up">
                  {store.completedCount}/{store.totalCount}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Задач выполнено
                </div>
              </div>
              <div className="bg-secondary/20 rounded-xl p-3.5 text-center col-span-2 border border-border/10 hover:bg-secondary/30 transition-all duration-200">
                <div className="flex items-center justify-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <span className="text-sm font-bold text-foreground">
                    {store.mostProductivePeriod}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Самый продуктивный период
                </div>
              </div>
            </div>

            {/* Summary button */}
            {!store.daySummary && !showSummary ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSummary(true)}
                className="w-full text-primary hover:text-primary hover:bg-primary/10 gap-1.5 rounded-xl"
              >
                <CheckCircle2 className="w-4 h-4" />
                Подвести итог дня
              </Button>
            ) : showSummary ? (
              <div className="flex flex-col gap-2 animate-scale-in">
                <textarea
                  value={summaryText}
                  onChange={(e) => setSummaryText(e.target.value)}
                  placeholder="Как прошел день? Что получилось? Что улучшить?"
                  className="bg-secondary/20 border border-border/20 text-foreground text-xs rounded-xl px-3 py-2 resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSummary}
                    disabled={!summaryText.trim()}
                    className="flex-1 h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
                  >
                    Сохранить
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowSummary(false)}
                    className="h-8 text-xs text-muted-foreground"
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10 animate-fade-in">
                <MessageSquareQuote className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-foreground/80 italic leading-relaxed">
                  {store.daySummary}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Procrastination Analysis */}
      <ProcrastinationAnalysis dayDataMap={store.dayDataMap} />
    </div>
  )
}
