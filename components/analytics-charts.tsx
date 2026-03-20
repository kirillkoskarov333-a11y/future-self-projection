"use client"

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { DAYS_OF_WEEK } from "@/lib/types"
import { useState, useEffect } from "react"

interface AnalyticsChartsProps {
  weekdayStats: {
    name: string
    completed: number
    total: number
    rate: number
  }[]
  dailyStats: {
    day: number
    rate: number
    completed: number
    total: number
  }[]
  overallProgress: number
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
    <div className="glass-strong rounded-xl px-3 py-2 text-xs">
      <p className="text-foreground font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-primary">
          {p.value}%
        </p>
      ))}
    </div>
  )
}

export function AnalyticsCharts({
  weekdayStats,
  dailyStats,
  overallProgress,
}: AnalyticsChartsProps) {
  const pieData = [
    { name: "Выполнено", value: overallProgress },
    { name: "Не выполнено", value: 100 - overallProgress },
  ]

  const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--border))"]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
      {/* Bar chart - weekday stats */}
      <div className="glass rounded-2xl p-5 glass-hover">
        <h3 className="text-sm font-semibold text-foreground mb-5">
          Продуктивность по дням недели
        </h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekdayStats} barSize={28}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border) / 0.3)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
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
              <Bar
                dataKey="rate"
                radius={[6, 6, 0, 0]}
                fill="hsl(var(--primary))"
                fillOpacity={0.8}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line chart - daily productivity */}
      <div className="glass rounded-2xl p-5 glass-hover">
        <h3 className="text-sm font-semibold text-foreground mb-5">
          Динамика продуктивности
        </h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyStats}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border) / 0.3)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
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
                dataKey="rate"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
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

      {/* Pie chart */}
      <div className="glass rounded-2xl p-5 glass-hover">
        <h3 className="text-sm font-semibold text-foreground mb-5">
          Выполнено / Не выполнено
        </h3>
        <div className="h-52 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {pieData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={PIE_COLORS[i]}
                    style={
                      i === 0
                        ? {
                            filter:
                              "drop-shadow(0 0 8px rgba(var(--theme-glow), 0.3))",
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
                fontSize="24"
                fontWeight="bold"
                fontFamily="var(--font-jetbrains-mono)"
              >
                {overallProgress}%
              </text>
              <text
                x="50%"
                y="58%"
                textAnchor="middle"
                fill="hsl(var(--muted-foreground))"
                fontSize="11"
              >
                выполнено
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export function DayCards({
  dailyStats,
  currentMonth,
  currentYear,
}: {
  dailyStats: { day: number; rate: number; completed: number; total: number }[]
  currentMonth: number
  currentYear: number
}) {
  const [isCurrentMonth, setIsCurrentMonth] = useState(false)
  const [todayDay, setTodayDay] = useState(0)

  useEffect(() => {
    const today = new Date()
    setIsCurrentMonth(currentYear === today.getFullYear() && currentMonth === today.getMonth())
    setTodayDay(today.getDate())
  }, [currentYear, currentMonth])

  // Only show last 7 days with data
  const recentDays = dailyStats.slice(-7)

  return (
    <div className="glass rounded-2xl p-5 glass-hover">
      <h3 className="text-sm font-semibold text-foreground mb-5">
        Последние дни
      </h3>
      <div className="grid grid-cols-7 gap-3">
        {recentDays.map(({ day, rate, completed, total }) => {
          const isToday = isCurrentMonth && day === todayDay
          const date = new Date(currentYear, currentMonth, day)
          const dow = date.getDay() === 0 ? 6 : date.getDay() - 1

          return (
            <div
              key={day}
              className={`rounded-xl p-3.5 text-center transition-all duration-200 ${
                isToday
                  ? "bg-primary/10 border border-primary/30"
                  : "bg-secondary/20 border border-border/20"
              } ${rate === 100 ? "neon-glow" : ""}`}
            >
              <div className="text-[10px] text-muted-foreground uppercase">
                {DAYS_OF_WEEK[dow]}
              </div>
              <div
                className={`text-lg font-bold font-mono mt-1 ${
                  isToday ? "text-primary" : "text-foreground"
                }`}
              >
                {day}
              </div>
              <div
                className={`text-xs font-mono mt-1 ${
                  rate >= 80
                    ? "text-primary"
                    : rate >= 50
                      ? "text-foreground"
                      : "text-muted-foreground"
                }`}
              >
                {rate}%
              </div>
              <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                {completed}/{total}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
