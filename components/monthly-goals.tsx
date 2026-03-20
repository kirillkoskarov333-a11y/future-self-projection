"use client"

import { useState } from "react"
import {
  Plus,
  X,
  Check,
  Pencil,
  ChevronDown,
  ChevronUp,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquareQuote,
  RefreshCw,
  Link2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Goal, Habit } from "@/lib/types"

interface MonthlyGoalsProps {
  goals: Goal[]
  habits: Habit[] // all habits for linking
  addGoal: (type: "month" | "year", name: string) => void
  removeGoal: (type: "month" | "year", id: string) => void
  updateGoal: (type: "month" | "year", id: string, updates: Partial<Goal>) => void
  toggleSubtask: (type: "month" | "year", goalId: string, subtaskId: string) => void
  addSubtask: (type: "month" | "year", goalId: string, name: string) => void
  removeSubtask: (type: "month" | "year", goalId: string, subtaskId: string) => void
  linkHabit: (type: "month" | "year", goalId: string, habitId: string, target: number) => void
  unlinkHabit: (type: "month" | "year", goalId: string, habitId: string) => void
  getHabitCompletionCount: (habitId: string) => number
}

function getDaysUntilDeadline(deadline: string) {
  const now = new Date()
  const d = new Date(deadline)
  const diff = d.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function getDeadlineColor(daysLeft: number): string {
  if (daysLeft <= 0) return "text-destructive"
  if (daysLeft <= 7) return "text-orange-400"
  if (daysLeft <= 14) return "text-yellow-400"
  return "text-primary"
}

function getProgressBarColor(daysLeft: number): string {
  if (daysLeft <= 0) return "bg-destructive"
  if (daysLeft <= 7) return "bg-orange-400"
  if (daysLeft <= 14) return "bg-yellow-400"
  return "bg-primary"
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-4 h-4 text-primary" />
    case "overdue":
      return <AlertTriangle className="w-4 h-4 text-destructive" />
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "completed":
      return "Выполнено"
    case "overdue":
      return "Просрочено"
    default:
      return "В процессе"
  }
}

function GoalCard({
  goal,
  habits,
  onRemove,
  onUpdate,
  onToggleSubtask,
  onAddSubtask,
  onRemoveSubtask,
  onLinkHabit,
  onUnlinkHabit,
  getHabitCompletionCount,
}: {
  goal: Goal
  habits: Habit[]
  onRemove: () => void
  onUpdate: (updates: Partial<Goal>) => void
  onToggleSubtask: (subtaskId: string) => void
  onAddSubtask: (name: string) => void
  onRemoveSubtask: (subtaskId: string) => void
  onLinkHabit: (habitId: string, target: number) => void
  onUnlinkHabit: (habitId: string) => void
  getHabitCompletionCount: (habitId: string) => number
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(goal.name)
  const [editDesc, setEditDesc] = useState(goal.description)
  const [editWhy, setEditWhy] = useState(goal.whyImportant)
  const [editDeadline, setEditDeadline] = useState(goal.deadline)
  const [editTarget, setEditTarget] = useState(goal.target?.toString() || "")
  const [newSubtask, setNewSubtask] = useState("")
  // State for habit linking form
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [selectedHabitId, setSelectedHabitId] = useState("")
  const [habitTarget, setHabitTarget] = useState("")

  const daysLeft = getDaysUntilDeadline(goal.deadline)
  const deadlineColor = getDeadlineColor(daysLeft)
  const barColor = getProgressBarColor(daysLeft)

  // Habits available to link (not already linked)
  const linkedHabitIds = (goal.linkedHabits || []).map((lh) => lh.habitId)
  const availableHabits = habits.filter((h) => !linkedHabitIds.includes(h.id))

  function handleSaveEdit() {
    const targetNum = editTarget ? parseInt(editTarget) : undefined
    onUpdate({
      name: editName,
      description: editDesc,
      whyImportant: editWhy,
      deadline: editDeadline,
      target: targetNum && targetNum > 0 ? targetNum : undefined,
    })
    setEditing(false)
  }

  function handleAddSubtask() {
    if (!newSubtask.trim()) return
    onAddSubtask(newSubtask)
    setNewSubtask("")
  }

  function handleLinkHabit() {
    if (!selectedHabitId || !habitTarget) return
    const target = parseInt(habitTarget)
    if (target <= 0) return
    onLinkHabit(selectedHabitId, target)
    setSelectedHabitId("")
    setHabitTarget("")
    setShowLinkForm(false)
  }

  // Count linked items for the expand button label
  const linkedCount = (goal.linkedHabits || []).length
  const totalItems = goal.subtasks.length + linkedCount

  return (
    <div
      className={`glass rounded-2xl overflow-hidden transition-all duration-300 glass-hover ${
        goal.status === "completed" ? "border border-primary/20" : ""
      } ${goal.status === "overdue" ? "border border-destructive/20" : ""}`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex flex-col gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-secondary/50 border-border/50 text-foreground text-sm h-8"
                  placeholder="Название цели"
                />
                <Input
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="bg-secondary/50 border-border/50 text-foreground text-sm h-8"
                  placeholder="Описание"
                />
                <Input
                  type="number"
                  value={editTarget}
                  onChange={(e) => setEditTarget(e.target.value)}
                  className="bg-secondary/50 border-border/50 text-foreground text-sm h-8"
                  placeholder="Целевое число (например 20)"
                />
                <Input
                  type="date"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="bg-secondary/50 border-border/50 text-foreground text-sm h-8"
                />
                <textarea
                  value={editWhy}
                  onChange={(e) => setEditWhy(e.target.value)}
                  className="bg-secondary/50 border-border/50 text-foreground text-sm rounded-md px-3 py-2 resize-none h-16 focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Почему эта цель важна?"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Сохранить
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditing(false)}
                    className="h-7 text-xs text-muted-foreground"
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  {getStatusIcon(goal.status)}
                  <h4 className="text-sm font-semibold text-foreground truncate">
                    {goal.name}
                  </h4>
                  {/* Show target badge if set */}
                  {goal.target && (
                    <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                      цель: {goal.target}
                    </span>
                  )}
                </div>
                {goal.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {goal.description}
                  </p>
                )}
              </>
            )}
          </div>
          {!editing && (
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditing(true)}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <Pencil className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {!editing && (
          <>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                  style={{
                    width: `${goal.progress}%`,
                    boxShadow:
                      goal.progress > 0
                        ? `0 0 8px ${daysLeft <= 0 ? "hsl(0, 72%, 51%)" : daysLeft <= 7 ? "rgba(251, 146, 60, 0.4)" : "hsl(var(--primary) / 0.4)"}`
                        : undefined,
                  }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-foreground min-w-[36px] text-right">
                {goal.progress}%
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className={`text-[11px] font-mono ${deadlineColor}`}>
                  {daysLeft > 0
                    ? `${daysLeft} ${daysLeft === 1 ? "день" : daysLeft < 5 ? "дня" : "дней"}`
                    : daysLeft === 0
                      ? "Сегодня"
                      : "Просрочено"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-muted-foreground">
                  {getStatusLabel(goal.status)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {!editing && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-4 py-2 flex items-center justify-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors border-t border-border/30"
          >
            {expanded ? (
              <>
                Скрыть <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                Подзадачи ({goal.subtasks.filter((s) => s.completed).length}/
                {totalItems}) <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>

          {expanded && (
            <div className="px-4 pb-4 flex flex-col gap-2 border-t border-border/30 pt-3">
              {goal.whyImportant && (
                <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10 mb-1">
                  <MessageSquareQuote className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <p className="text-[11px] text-foreground/80 italic leading-relaxed">
                    {goal.whyImportant}
                  </p>
                </div>
              )}

              {/* Regular subtasks */}
              {goal.subtasks.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-2 group"
                >
                  <button
                    onClick={() => onToggleSubtask(sub.id)}
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all duration-200 ${
                      sub.completed
                        ? "bg-primary border-primary"
                        : "border-muted-foreground/30 hover:border-primary/50"
                    }`}
                  >
                    {sub.completed && (
                      <Check className="w-2.5 h-2.5 text-primary-foreground" />
                    )}
                  </button>
                  <span
                    className={`text-xs flex-1 ${
                      sub.completed
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    }`}
                  >
                    {sub.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveSubtask(sub.id)}
                    className="h-5 w-5 text-muted-foreground/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-2.5 h-2.5" />
                  </Button>
                </div>
              ))}

              {/* Linked habits — shown as special items with auto-progress */}
              {(goal.linkedHabits || []).map((lh) => {
                const habit = habits.find((h) => h.id === lh.habitId)
                if (!habit) return null
                const count = getHabitCompletionCount(lh.habitId)
                const cappedCount = Math.min(count, lh.target)
                const percent = Math.round((cappedCount / lh.target) * 100)

                return (
                  <div
                    key={`habit-${lh.habitId}`}
                    className="flex items-center gap-2 group"
                  >
                    {/* Icon instead of checkbox — auto-calculated */}
                    <RefreshCw className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-foreground truncate">
                          {habit.name}
                        </span>
                        <span className="text-[10px] font-mono text-primary">
                          {cappedCount}/{lh.target}
                        </span>
                      </div>
                      {/* Mini progress bar */}
                      <div className="h-1 rounded-full bg-secondary overflow-hidden mt-0.5">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onUnlinkHabit(lh.habitId)}
                      className="h-5 w-5 text-muted-foreground/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-2.5 h-2.5" />
                    </Button>
                  </div>
                )
              })}

              {/* Add subtask */}
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddSubtask()
                  }}
                  placeholder="Новая подзадача..."
                  className="bg-secondary/30 border-border/30 text-foreground text-xs h-7 flex-1"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleAddSubtask}
                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>

              {/* Link habit button + form */}
              {availableHabits.length > 0 && (
                <>
                  {!showLinkForm ? (
                    <button
                      onClick={() => setShowLinkForm(true)}
                      className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors mt-1"
                    >
                      <Link2 className="w-3 h-3" />
                      Привязать привычку
                    </button>
                  ) : (
                    <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-secondary/30 border border-border/30 mt-1">
                      <select
                        value={selectedHabitId}
                        onChange={(e) => setSelectedHabitId(e.target.value)}
                        className="bg-secondary/50 border border-border/50 text-foreground text-xs h-7 rounded-md px-2 focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="">Выбери привычку...</option>
                        {availableHabits.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={habitTarget}
                          onChange={(e) => setHabitTarget(e.target.value)}
                          placeholder="Цель (например 20)"
                          className="bg-secondary/50 border-border/50 text-foreground text-xs h-7 flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={handleLinkHabit}
                          disabled={!selectedHabitId || !habitTarget}
                          className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowLinkForm(false)}
                          className="h-7 text-xs text-muted-foreground"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function MonthlyGoals({
  goals,
  habits,
  addGoal,
  removeGoal,
  updateGoal,
  toggleSubtask,
  addSubtask,
  removeSubtask,
  linkHabit,
  unlinkHabit,
  getHabitCompletionCount,
}: MonthlyGoalsProps) {
  const [newGoalName, setNewGoalName] = useState("")

  function handleAdd() {
    if (!newGoalName.trim()) return
    addGoal("month", newGoalName)
    setNewGoalName("")
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Цели на месяц
        </h3>
        <span className="text-xs text-muted-foreground font-mono">
          {goals.filter((g) => g.status === "completed").length}/{goals.length} выполнено
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            habits={habits}
            onRemove={() => removeGoal("month", goal.id)}
            onUpdate={(updates) => updateGoal("month", goal.id, updates)}
            onToggleSubtask={(subtaskId) =>
              toggleSubtask("month", goal.id, subtaskId)
            }
            onAddSubtask={(name) => addSubtask("month", goal.id, name)}
            onRemoveSubtask={(subtaskId) =>
              removeSubtask("month", goal.id, subtaskId)
            }
            onLinkHabit={(habitId, target) =>
              linkHabit("month", goal.id, habitId, target)
            }
            onUnlinkHabit={(habitId) =>
              unlinkHabit("month", goal.id, habitId)
            }
            getHabitCompletionCount={getHabitCompletionCount}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={newGoalName}
          onChange={(e) => setNewGoalName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd()
          }}
          placeholder="Новая цель на месяц..."
          className="bg-secondary/30 border-border/30 text-foreground text-sm h-9 flex-1"
        />
        <Button
          onClick={handleAdd}
          size="sm"
          className="h-9 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-1" />
          Добавить
        </Button>
      </div>
    </div>
  )
}
