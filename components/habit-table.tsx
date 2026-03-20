"use client"

import { useState } from "react"
import {
  Plus,
  X,
  Pencil,
  Check,
  GripVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Habit } from "@/lib/types"
import { DAYS_OF_WEEK } from "@/lib/types"

interface HabitTableProps {
  habits: Habit[]
  daysInMonth: number
  currentMonth: number
  currentYear: number
  weeks: { day: number; dayOfWeek: number }[][]
  isCompleted: (habitId: string, day: number) => boolean
  toggleCompletion: (habitId: string, day: number) => void
  getHabitCompletionRate: (habitId: string) => number
  getDayCompletionRate: (day: number) => number
  addHabit: (name: string, weekDays?: number[]) => void
  removeHabit: (id: string) => void
  updateHabit: (id: string, name: string) => void
}

function HabitCheckbox({
  checked,
  onToggle,
}: {
  checked: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
        checked
          ? "bg-primary/20 border border-primary/50 neon-glow"
          : "bg-secondary/30 border border-border/40 hover:border-muted-foreground/30 hover:bg-secondary/60"
      }`}
    >
      {checked && (
        <Check className="w-3.5 h-3.5 text-primary animate-checkmark" />
      )}
    </button>
  )
}

function HabitRow({
  habit,
  daysInMonth,
  isCompleted,
  toggleCompletion,
  completionRate,
  onRemove,
  onUpdate,
}: {
  habit: Habit
  daysInMonth: number
  isCompleted: (day: number) => boolean
  toggleCompletion: (day: number) => void
  completionRate: number
  onRemove: () => void
  onUpdate: (name: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(habit.name)
  const [isHovered, setIsHovered] = useState(false)

  const handleSave = () => {
    if (editName.trim()) {
      onUpdate(editName.trim())
    } else {
      setEditName(habit.name)
    }
    setIsEditing(false)
  }

  return (
    <tr
      className="group border-b border-border/20 hover:bg-secondary/20 transition-colors duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <td className="py-3 px-4 sticky left-0 z-10 bg-card">
        <div className="flex items-center gap-2">
          <GripVertical
            className={`w-3.5 h-3.5 text-muted-foreground/30 shrink-0 transition-opacity ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          />
          {isEditing ? (
            <div className="flex items-center gap-1">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave()
                  if (e.key === "Escape") {
                    setEditName(habit.name)
                    setIsEditing(false)
                  }
                }}
                onBlur={handleSave}
                className="h-7 text-sm bg-secondary border-border/50 text-foreground w-40"
                autoFocus
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground font-medium truncate max-w-[150px]">
                {habit.name}
              </span>
              <div
                className={`flex items-center gap-0.5 transition-opacity ${
                  isHovered ? "opacity-100" : "opacity-0"
                }`}
              >
                <button
                  onClick={() => {
                    setEditName(habit.name)
                    setIsEditing(true)
                  }}
                  className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={onRemove}
                  className="p-1 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </td>
      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
        <td key={day} className="py-3 px-1 text-center">
          <div className="flex justify-center">
            <HabitCheckbox
              checked={isCompleted(day)}
              onToggle={() => toggleCompletion(day)}
            />
          </div>
        </td>
      ))}
      <td className="py-3 px-4 sticky right-0 z-10 bg-card">
        <div className="flex items-center gap-3">
          <div className="w-20 h-2 rounded-full bg-secondary/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{
                width: `${completionRate}%`,
                boxShadow:
                  completionRate > 0
                    ? "0 0 6px hsl(var(--primary) / 0.3)"
                    : "none",
              }}
            />
          </div>
          <span
            className={`text-xs font-mono font-medium min-w-[32px] text-right ${
              completionRate >= 80
                ? "text-primary neon-text"
                : completionRate >= 50
                  ? "text-foreground"
                  : "text-muted-foreground"
            }`}
          >
            {completionRate}%
          </span>
        </div>
      </td>
    </tr>
  )
}

export function HabitTable({
  habits,
  daysInMonth,
  currentMonth,
  currentYear,
  isCompleted,
  toggleCompletion,
  getHabitCompletionRate,
  getDayCompletionRate,
  addHabit,
  removeHabit,
  updateHabit,
}: HabitTableProps) {
  const [newHabitName, setNewHabitName] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  const today = new Date()
  const isCurrentMonth =
    currentYear === today.getFullYear() && currentMonth === today.getMonth()

  const handleAdd = () => {
    if (newHabitName.trim()) {
      addHabit(newHabitName)
      setNewHabitName("")
      setIsAdding(false)
    }
  }

  return (
    <div className="glass-strong rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-border/30">
        <h2 className="text-base font-semibold text-foreground">
          Распорядок дня
        </h2>
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

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border/20">
              <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider sticky left-0 z-10 bg-card min-w-[200px]">
                Привычка
              </th>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                (day) => {
                  const date = new Date(currentYear, currentMonth, day)
                  const dow = date.getDay() === 0 ? 6 : date.getDay() - 1
                  const isToday = isCurrentMonth && day === today.getDate()
                  const isWeekend = dow >= 5

                  return (
                    <th
                      key={day}
                      className={`py-3 px-1 text-center min-w-[36px] ${
                        isToday ? "bg-primary/5" : ""
                      }`}
                    >
                      <div
                        className={`text-[10px] font-medium ${
                          isWeekend
                            ? "text-muted-foreground/50"
                            : "text-muted-foreground"
                        }`}
                      >
                        {DAYS_OF_WEEK[dow]}
                      </div>
                      <div
                        className={`text-xs font-semibold mt-0.5 ${
                          isToday
                            ? "text-primary neon-text"
                            : isWeekend
                              ? "text-muted-foreground/50"
                              : "text-foreground"
                        }`}
                      >
                        {day}
                      </div>
                    </th>
                  )
                }
              )}
              <th className="py-3 px-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider sticky right-0 z-10 bg-card min-w-[120px]">
                Прогресс
              </th>
            </tr>
          </thead>
          <tbody>
            {habits.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                daysInMonth={daysInMonth}
                isCompleted={(day) => isCompleted(habit.id, day)}
                toggleCompletion={(day) => toggleCompletion(habit.id, day)}
                completionRate={getHabitCompletionRate(habit.id)}
                onRemove={() => removeHabit(habit.id)}
                onUpdate={(name) => updateHabit(habit.id, name)}
              />
            ))}
            {isAdding && (
              <tr className="border-b border-border/20">
                <td className="py-3 px-4 sticky left-0 z-10 bg-card" colSpan={daysInMonth + 2}>
                  <div className="flex items-center gap-2">
                    <Input
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAdd()
                        if (e.key === "Escape") {
                          setNewHabitName("")
                          setIsAdding(false)
                        }
                      }}
                      placeholder="Название привычки..."
                      className="h-8 text-sm bg-secondary border-border/50 text-foreground max-w-xs placeholder:text-muted-foreground/50"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={handleAdd}
                      disabled={!newHabitName.trim()}
                      className="h-8 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setNewHabitName("")
                        setIsAdding(false)
                      }}
                      className="h-8 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-border/20">
              <td className="py-3 px-4 text-xs font-medium text-muted-foreground sticky left-0 z-10 bg-card">
                Итого за день
              </td>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                (day) => {
                  const rate = getDayCompletionRate(day)
                  const isToday = isCurrentMonth && day === today.getDate()
                  return (
                    <td
                      key={day}
                      className={`py-3 px-1 text-center ${isToday ? "bg-primary/5" : ""}`}
                    >
                      <span
                        className={`text-[10px] font-mono font-semibold ${
                          rate >= 80
                            ? "text-primary"
                            : rate >= 50
                              ? "text-foreground"
                              : rate > 0
                                ? "text-muted-foreground"
                                : "text-muted-foreground/30"
                        }`}
                      >
                        {rate > 0 ? `${rate}` : "-"}
                      </span>
                    </td>
                  )
                }
              )}
              <td className="py-3 px-4 sticky right-0 z-10 bg-card" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
