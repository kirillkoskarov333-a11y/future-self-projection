"use client"

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { MONTH_NAMES } from "@/lib/types"
import type { Goal } from "@/lib/types"
import { Flame, Target, TrendingUp, Hourglass } from "lucide-react"
import { useState, useEffect } from "react"

interface GoalsAnalyticsProps {
  monthlyGoals: Goal[]
  yearlyGoals: Goal[]
  overallMonthlyProgress: number
  overallYearlyProgress: number
  daysUntilEndOfYear: number
  monthlyProgressByMonth: { month: number; progress: number }[]
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; name: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-xs">
      <p className="text-foreground font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-primary">
          {p.value}%
        </p>
      ))}
    </div>
  )
}

export function GoalsAnalytics({
  monthlyGoals,
  yearlyGoals,
  overallMonthlyProgress,
  overallYearlyProgress,
  daysUntilEndOfYear,
  monthlyProgressByMonth,
}: GoalsAnalyticsProps) {
  const lineData = monthlyProgressByMonth.map((d) => ({
    month: MONTH_NAMES[d.month].substring(0, 3),
    progress: d.progress,
  }))

  const goalBarData = yearlyGoals.map((g) => ({
    name: g.name.length > 14 ? g.name.substring(0, 14) + "..." : g.name,
    progress: g.progress,
  }))

  const monthlyCompletedCount = monthlyGoals.filter(
    (g) => g.status === "completed"
  ).length
  const yearlyCompletedCount = yearlyGoals.filter(
    (g) => g.status === "completed"
  ).length

  const [yearProgressPercent, setYearProgressPercent] = useState(0)

  useEffect(() => {
    const now = new Date()
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
    )
    setYearProgressPercent(Math.round((dayOfYear / 365) * 100))
  }, [])

  return (
    <div className="flex flex-col gap-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="glass rounded-2xl p-5 flex flex-col gap-3 glass-hover">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Цели за месяц</span>
          </div>
          <span className="text-2xl font-bold text-foreground font-mono">
            {monthlyCompletedCount}/{monthlyGoals.length}
          </span>
          <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{
                width: `${overallMonthlyProgress}%`,
                boxShadow: "0 0 8px hsl(var(--primary) / 0.4)",
              }}
            />
          </div>
        </div>

        <div className="glass rounded-2xl p-5 flex flex-col gap-3 glass-hover">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            <span className="text-xs text-muted-foreground">Цели за год</span>
          </div>
          <span className="text-2xl font-bold text-foreground font-mono">
            {yearlyCompletedCount}/{yearlyGoals.length}
          </span>
          <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-orange-400 transition-all duration-700"
              style={{
                width: `${overallYearlyProgress}%`,
                boxShadow: "0 0 8px rgba(251, 146, 60, 0.4)",
              }}
            />
          </div>
        </div>

        <div className="glass rounded-2xl p-5 flex flex-col gap-3 glass-hover">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-yellow-400" />
            </div>
            <span className="text-xs text-muted-foreground">Прошло года</span>
          </div>
          <span className="text-2xl font-bold text-foreground font-mono">
            {yearProgressPercent}%
          </span>
          <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-yellow-400 transition-all duration-700"
              style={{
                width: `${yearProgressPercent}%`,
                boxShadow: "0 0 8px rgba(250, 204, 21, 0.4)",
              }}
            />
          </div>
        </div>

        <div className="glass rounded-2xl p-5 flex flex-col gap-3 glass-hover">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Hourglass className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Дней до конца года</span>
          </div>
          <span className="text-2xl font-bold text-foreground font-mono">
            {daysUntilEndOfYear}
          </span>
          <p className="text-[11px] text-muted-foreground">
            Каждый день на счету. Действуй!
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="glass rounded-2xl p-5 glass-hover">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Рост по месяцам
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border) / 0.3)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Line
                  type="monotone"
                  dataKey="progress"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{
                    r: 4,
                    fill: "hsl(var(--primary))",
                    stroke: "hsl(var(--card))",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 6,
                    fill: "hsl(var(--primary))",
                    stroke: "hsl(var(--card))",
                    strokeWidth: 2,
                  }}
                  style={{
                    filter: "drop-shadow(0 0 6px rgba(var(--theme-glow), 0.4))",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 glass-hover">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Прогресс годовых целей
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={goalBarData} barSize={32} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border) / 0.3)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Bar
                  dataKey="progress"
                  radius={[0, 6, 6, 0]}
                  fill="hsl(var(--primary))"
                  fillOpacity={0.8}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
