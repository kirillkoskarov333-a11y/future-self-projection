"use client"

import { useMemo, useState } from "react"
import {
  BarChart3,
  Lightbulb,
  CheckCircle2,
  Clock,
  TrendingUp,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import type { DayPlannerData } from "@/lib/state-types"
import type { TaskPriority } from "@/lib/types"

const DAY_NAMES_SHORT = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"] as const

interface Props {
  dayDataMap: Record<string, DayPlannerData>
}

export function ProcrastinationAnalysis({ dayDataMap }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  const analysis = useMemo(() => {
    const entries = Object.entries(dayDataMap)
    if (entries.length === 0) {
      return null
    }

    let totalTasks = 0
    let completedTasks = 0
    let incompleteTasks = 0

    // Productivity by hour (0-23)
    const hourCompletions: Record<number, number> = {}
    // Productivity by day of week (0=Sun ... 6=Sat)
    const dayOfWeekCompletions: Record<number, { total: number; completed: number }> = {}
    for (let i = 0; i < 7; i++) dayOfWeekCompletions[i] = { total: 0, completed: 0 }

    // Priority breakdown
    const priorityStats: Record<TaskPriority, { total: number; completed: number }> = {
      high: { total: 0, completed: 0 },
      medium: { total: 0, completed: 0 },
      low: { total: 0, completed: 0 },
    }

    for (const [key, dayData] of entries) {
      // Parse date key format: "YYYY-M-D"
      const parts = key.split("-").map(Number)
      if (parts.length < 3) continue
      const date = new Date(parts[0], parts[1], parts[2])
      const dow = date.getDay()

      for (const task of dayData.tasks) {
        totalTasks++
        priorityStats[task.priority].total++
        dayOfWeekCompletions[dow].total++

        if (task.completed) {
          completedTasks++
          priorityStats[task.priority].completed++
          dayOfWeekCompletions[dow].completed++

          // Track completion hour
          const [h] = task.time.split(":").map(Number)
          hourCompletions[h] = (hourCompletions[h] || 0) + 1
        } else {
          incompleteTasks++
        }
      }
    }

    if (totalTasks === 0) return null

    const completionRate = Math.round((completedTasks / totalTasks) * 100)
    const incompleteRate = Math.round((incompleteTasks / totalTasks) * 100)

    // Find peak productivity hour
    let peakHour = 9
    let maxCompletions = 0
    for (const [h, count] of Object.entries(hourCompletions)) {
      if (count > maxCompletions) {
        maxCompletions = count
        peakHour = Number(h)
      }
    }
    const peakPeriod = peakHour < 12 ? "Утро" : peakHour < 18 ? "День" : "Вечер"

    // Best day of week
    let bestDow = 1
    let bestDowRate = 0
    for (const [dow, data] of Object.entries(dayOfWeekCompletions)) {
      if (data.total > 0) {
        const rate = data.completed / data.total
        if (rate > bestDowRate) {
          bestDowRate = rate
          bestDow = Number(dow)
        }
      }
    }

    // Day of week chart data
    const dowChartData = [1, 2, 3, 4, 5, 6, 0].map((dow) => ({
      day: DAY_NAMES_SHORT[dow],
      rate: dayOfWeekCompletions[dow].total > 0
        ? Math.round((dayOfWeekCompletions[dow].completed / dayOfWeekCompletions[dow].total) * 100)
        : 0,
    }))

    // Avg tasks per day
    const avgTasksPerDay = Math.round(totalTasks / entries.length * 10) / 10

    // Recommendations
    const recommendations: string[] = []

    if (incompleteRate > 40) {
      recommendations.push("Более 40% задач остаются невыполненными. Попробуйте уменьшить количество задач на день.")
    }

    if (priorityStats.high.total > 0) {
      const highRate = Math.round((priorityStats.high.completed / priorityStats.high.total) * 100)
      if (highRate < 60) {
        recommendations.push("Важные задачи часто откладываются. Попробуйте начинать день с них.")
      }
    }

    if (peakPeriod === "Утро") {
      recommendations.push(`Ваш пик продуктивности — утро (${peakHour}:00). Планируйте сложные задачи на это время.`)
    } else if (peakPeriod === "Вечер") {
      recommendations.push(`Вы наиболее продуктивны вечером (${peakHour}:00). Учтите это при планировании.`)
    }

    // Find worst day
    let worstDow = 0
    let worstRate = 100
    for (const [dow, data] of Object.entries(dayOfWeekCompletions)) {
      if (data.total >= 3) {
        const rate = data.completed / data.total
        if (rate < worstRate) {
          worstRate = rate
          worstDow = Number(dow)
        }
      }
    }
    if (worstRate < 0.5 && dayOfWeekCompletions[worstDow].total >= 3) {
      recommendations.push(`${DAY_NAMES_SHORT[worstDow]} — ваш самый сложный день. Запланируйте меньше задач или лёгкие.`)
    }

    if (avgTasksPerDay > 8) {
      recommendations.push("У вас в среднем больше 8 задач в день. Попробуйте сфокусироваться на 3-5 ключевых.")
    }

    if (recommendations.length === 0) {
      recommendations.push("Отличная работа! Продолжайте в том же духе.")
    }

    // Priority failure rates
    const hardestPriority = (["high", "medium", "low"] as TaskPriority[])
      .filter((p) => priorityStats[p].total > 0)
      .sort((a, b) => {
        const rateA = priorityStats[a].completed / priorityStats[a].total
        const rateB = priorityStats[b].completed / priorityStats[b].total
        return rateA - rateB
      })[0]

    return {
      completionRate,
      incompleteRate,
      peakPeriod,
      peakHour,
      bestDow: DAY_NAMES_SHORT[bestDow],
      avgTasksPerDay,
      dowChartData,
      recommendations,
      hardestPriority,
      totalTasks,
      completedTasks,
      daysAnalyzed: entries.length,
    }
  }, [dayDataMap])

  if (!analysis) return null

  return (
    <div className="glass-strong rounded-2xl overflow-hidden animate-fade-in">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full p-5 flex items-center justify-between hover:bg-secondary/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Аналитика продуктивности</h3>
          <span className="text-xs text-muted-foreground font-mono">
            {analysis.daysAnalyzed} дней
          </span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {isOpen && (
        <div className="px-5 pb-5 flex flex-col gap-5">
          {/* Score cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle2 className="w-3 h-3 text-primary" />
                <span className="text-[10px] text-muted-foreground">Выполнено</span>
              </div>
              <span className="text-lg font-bold text-primary font-mono">{analysis.completionRate}%</span>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-3 h-3 text-destructive/70" />
                <span className="text-[10px] text-muted-foreground">Не выполнено</span>
              </div>
              <span className="text-lg font-bold text-foreground font-mono">{analysis.incompleteRate}%</span>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-primary" />
                <span className="text-[10px] text-muted-foreground">Пик продуктивности</span>
              </div>
              <span className="text-sm font-bold text-foreground">{analysis.peakPeriod}</span>
              <span className="text-[10px] text-muted-foreground block">{analysis.peakHour}:00</span>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="w-3 h-3 text-primary" />
                <span className="text-[10px] text-muted-foreground">Лучший день</span>
              </div>
              <span className="text-sm font-bold text-foreground">{analysis.bestDow}</span>
            </div>
          </div>

          {/* Day of week chart */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-3">Продуктивность по дням недели</h4>
            <div className="w-full h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.dowChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    axisLine={{ stroke: "hsl(var(--border) / 0.3)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value: number) => [`${value}%`, "Выполнение"]}
                  />
                  <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-3">Рекомендации</h4>
            <div className="flex flex-col gap-2">
              {analysis.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/10"
                >
                  <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-xs text-foreground/80 leading-relaxed">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
