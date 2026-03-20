"use client"

import { useState } from "react"
import {
  Plus,
  X,
  Check,
  Pencil,
  ChevronDown,
  ChevronUp,
  Trophy,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquareQuote,
  CalendarDays,
  Link2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts"
import type { Goal } from "@/lib/types"

interface YearlyGoalsProps {
  goals: Goal[]
  monthlyGoals: Goal[] // for linking monthly goals
  overallYearlyProgress: number
  daysUntilEndOfYear: number
  addGoal: (type: "month" | "year", name: string) => void
  removeGoal: (type: "month" | "year", id: string) => void
  updateGoal: (type: "month" | "year", id: string, updates: Partial<Goal>) => void
  toggleSubtask: (type: "month" | "year", goalId: string, subtaskId: string) => void
  addSubtask: (type: "month" | "year", goalId: string, name: string) => void
  removeSubtask: (type: "month" | "year", goalId: string, subtaskId: string) => void
  linkMonthlyGoal: (yearlyGoalId: string, monthlyGoalId: string) => void
  unlinkMonthlyGoal: (yearlyGoalId: string, monthlyGoalId: string) => void
  getMonthlyGoalCompletedCount: (goalId: string) => number
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

function YearlyGoalCard({
  goal,
  monthlyGoals,
  onRemove,
  onUpdate,
  onToggleSubtask,
  onAddSubtask,
  onRemoveSubtask,
  onLinkMonthly,
  onUnlinkMonthly,
  getMonthlyGoalCompletedCount,
}: {
  goal: Goal
  monthlyGoals: Goal[]
  onRemove: () => void
  onUpdate: (updates: Partial<Goal>) => void
  onToggleSubtask: (subtaskId: string) => void
  onAddSubtask: (name: string) => void
  onRemoveSubtask: (subtaskId: string) => void
  onLinkMonthly: (monthlyGoalId: string) => void
  onUnlinkMonthly: (monthlyGoalId: string) => void
  getMonthlyGoalCompletedCount: (goalId: string) => number
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(goal.name)
  const [editDesc, setEditDesc] = useState(goal.description)
  const [editWhy, setEditWhy] = useState(goal.whyImportant)
  const [editTarget, setEditTarget] = useState(goal.target?.toString() || "")
  const [newSubtask, setNewSubtask] = useState("")
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [selectedMonthlyId, setSelectedMonthlyId] = useState("")

  const pieData = [
    { name: "done", value: goal.progress },
    { name: "left", value: 100 - goal.progress },
  ]
  const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--border))"]

  // Monthly goals available to link (not already linked)
  const linkedMonthlyIds = (goal.linkedMonthlyGoals || []).map((lm) => lm.goalId)
  const availableMonthly = monthlyGoals.filter((g) => !linkedMonthlyIds.includes(g.id))

  const linkedCount = (goal.linkedMonthlyGoals || []).length
  const totalItems = goal.subtasks.length + linkedCount

  function handleSaveEdit() {
    const targetNum = editTarget ? parseInt(editTarget) : undefined
    onUpdate({
      name: editName,
      description: editDesc,
      whyImportant: editWhy,
      target: targetNum && targetNum > 0 ? targetNum : undefined,
    })
    setEditing(false)
  }

  function handleAddSubtask() {
    if (!newSubtask.trim()) return
    onAddSubtask(newSubtask)
    setNewSubtask("")
  }

  function handleLinkMonthly() {
    if (!selectedMonthlyId) return
    onLinkMonthly(selectedMonthlyId)
    setSelectedMonthlyId("")
    setShowLinkForm(false)
  }

  return (
    <div className="glass-strong rounded-2xl overflow-hidden transition-all duration-300">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={24}
                  outerRadius={36}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={PIE_COLORS[i]}
                      style={
                        i === 0
                          ? { filter: "drop-shadow(0 0 6px rgba(var(--theme-glow), 0.3))" }
                          : undefined
                      }
                    />
                  ))}
                </Pie>
                <text
                  x="50%"
                  y="54%"
                  textAnchor="middle"
                  fill="hsl(0,0%,93%)"
                  fontSize="14"
                  fontWeight="bold"
                  fontFamily="var(--font-jetbrains-mono)"
                >
                  {goal.progress}%
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>

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
                  placeholder="Целевое число (например 100)"
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
                  <h4 className="text-base font-bold text-foreground truncate">
                    {goal.name}
                  </h4>
                  {goal.target && (
                    <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                      цель: {goal.target}
                    </span>
                  )}
                </div>
                {goal.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {goal.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[11px] text-muted-foreground">
                    {getStatusLabel(goal.status)}
                  </span>
                </div>
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
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{
                  width: `${goal.progress}%`,
                  boxShadow:
                    goal.progress > 0
                      ? "0 0 8px hsl(var(--primary) / 0.4)"
                      : undefined,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {!editing && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-5 py-2 flex items-center justify-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors border-t border-border/30"
          >
            {expanded ? (
              <>
                Скрыть <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                Этапы ({goal.subtasks.filter((s) => s.completed).length}/
                {totalItems}) <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>

          {expanded && (
            <div className="px-5 pb-4 flex flex-col gap-2 border-t border-border/30 pt-3">
              {goal.whyImportant && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10 mb-1">
                  <MessageSquareQuote className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <p className="text-[11px] text-foreground/80 italic leading-relaxed">
                    {goal.whyImportant}
                  </p>
                </div>
              )}

              {/* Regular subtasks (etapy) */}
              {goal.subtasks.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2 group">
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

              {/* Linked monthly goals */}
              {(goal.linkedMonthlyGoals || []).map((lm) => {
                const monthlyGoal = monthlyGoals.find((g) => g.id === lm.goalId)
                if (!monthlyGoal) return null
                const completedCount = getMonthlyGoalCompletedCount(lm.goalId)

                return (
                  <div
                    key={`monthly-${lm.goalId}`}
                    className="flex items-center gap-2 group"
                  >
                    {/* Calendar icon — linked monthly goal */}
                    <CalendarDays className="w-4 h-4 text-blue-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-foreground truncate">
                          {monthlyGoal.name}
                        </span>
                        <span className="text-[10px] font-mono text-blue-400">
                          выполнено: {completedCount}
                        </span>
                      </div>
                      {/* Mini progress bar for the monthly goal */}
                      <div className="h-1 rounded-full bg-secondary overflow-hidden mt-0.5">
                        <div
                          className="h-full rounded-full bg-blue-400 transition-all duration-500"
                          style={{ width: `${monthlyGoal.progress}%` }}
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onUnlinkMonthly(lm.goalId)}
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
                  placeholder="Новый этап..."
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

              {/* Link monthly goal button + form */}
              {availableMonthly.length > 0 && (
                <>
                  {!showLinkForm ? (
                    <button
                      onClick={() => setShowLinkForm(true)}
                      className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-blue-400 transition-colors mt-1"
                    >
                      <Link2 className="w-3 h-3" />
                      Привязать месячную цель
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border/30 mt-1">
                      <select
                        value={selectedMonthlyId}
                        onChange={(e) => setSelectedMonthlyId(e.target.value)}
                        className="bg-secondary/50 border border-border/50 text-foreground text-xs h-7 rounded-md px-2 flex-1 focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="">Выбери цель...</option>
                        {availableMonthly.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        onClick={handleLinkMonthly}
                        disabled={!selectedMonthlyId}
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

export function YearlyGoals({
  goals,
  monthlyGoals,
  overallYearlyProgress,
  daysUntilEndOfYear,
  addGoal,
  removeGoal,
  updateGoal,
  toggleSubtask,
  addSubtask,
  removeSubtask,
  linkMonthlyGoal,
  unlinkMonthlyGoal,
  getMonthlyGoalCompletedCount,
}: YearlyGoalsProps) {
  const [newGoalName, setNewGoalName] = useState("")

  function handleAdd() {
    if (!newGoalName.trim()) return
    addGoal("year", newGoalName)
    setNewGoalName("")
  }

  const overallPieData = [
    { name: "done", value: overallYearlyProgress },
    { name: "left", value: 100 - overallYearlyProgress },
  ]
  const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--border))"]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Цели на год
        </h3>
        <span className="text-xs text-muted-foreground font-mono">
          {goals.filter((g) => g.status === "completed").length}/{goals.length} выполнено
        </span>
      </div>

      {/* Year summary card */}
      <div className="glass-strong rounded-2xl p-5 flex items-center gap-6">
        <div className="w-24 h-24 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={overallPieData}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={44}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {overallPieData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={PIE_COLORS[i]}
                    style={
                      i === 0
                        ? { filter: "drop-shadow(0 0 8px rgba(var(--theme-glow), 0.3))" }
                        : undefined
                    }
                  />
                ))}
              </Pie>
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                fill="hsl(0,0%,93%)"
                fontSize="16"
                fontWeight="bold"
                fontFamily="var(--font-jetbrains-mono)"
                dominantBaseline="central"
              >
                {overallYearlyProgress}%
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">
              Общий прогресс за год
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-secondary overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{
                width: `${overallYearlyProgress}%`,
                boxShadow: "0 0 8px hsl(var(--primary) / 0.4)",
              }}
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">
                До Нового года:{" "}
                <span className="text-foreground font-mono font-bold">
                  {daysUntilEndOfYear}
                </span>{" "}
                {daysUntilEndOfYear % 10 === 1 && daysUntilEndOfYear % 100 !== 11
                  ? "день"
                  : daysUntilEndOfYear % 10 >= 2 &&
                      daysUntilEndOfYear % 10 <= 4 &&
                      (daysUntilEndOfYear % 100 < 10 || daysUntilEndOfYear % 100 >= 20)
                    ? "дня"
                    : "дней"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {goals.map((goal) => (
          <YearlyGoalCard
            key={goal.id}
            goal={goal}
            monthlyGoals={monthlyGoals}
            onRemove={() => removeGoal("year", goal.id)}
            onUpdate={(updates) => updateGoal("year", goal.id, updates)}
            onToggleSubtask={(subtaskId) =>
              toggleSubtask("year", goal.id, subtaskId)
            }
            onAddSubtask={(name) => addSubtask("year", goal.id, name)}
            onRemoveSubtask={(subtaskId) =>
              removeSubtask("year", goal.id, subtaskId)
            }
            onLinkMonthly={(monthlyGoalId) =>
              linkMonthlyGoal(goal.id, monthlyGoalId)
            }
            onUnlinkMonthly={(monthlyGoalId) =>
              unlinkMonthlyGoal(goal.id, monthlyGoalId)
            }
            getMonthlyGoalCompletedCount={getMonthlyGoalCompletedCount}
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
          placeholder="Новая цель на год..."
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
