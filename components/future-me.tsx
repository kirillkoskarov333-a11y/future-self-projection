"use client"

import { useState, useMemo } from "react"
import {
  TrendingUp,
  Brain,
  Clock,
  Flame,
  Target,
  ChevronRight,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts"
import { Slider } from "@/components/ui/slider"
import { MONTH_NAMES } from "@/lib/types"

type Scenario = "current" | "boost" | "lazy" | "max"

interface FutureMeProps {
  overallProgress: number
  streak: number
  habitsCount: number
  completionRate: number
  dailyTasksAvg: number
  hoursWorkedAvg: number
  goalsProgress: number
  daysUntilEndOfYear: number
}

const SCENARIO_CONFIG: Record<
  Scenario,
  {
    label: string
    icon: React.ReactNode
    modifier: number
    color: string
    colorHex: string
    description: string
  }
> = {
  current: {
    label: "Текущий темп",
    icon: <Target className="w-4 h-4" />,
    modifier: 1.0,
    color: "text-primary",
    colorHex: "hsl(var(--primary))",
    description: "Прогноз при текущей дисциплине",
  },
  boost: {
    label: "+10% дисциплины",
    icon: <TrendingUp className="w-4 h-4" />,
    modifier: 1.1,
    color: "text-cyan-400",
    colorHex: "hsl(190, 80%, 55%)",
    description: "Небольшое усиление дисциплины",
  },
  lazy: {
    label: "-20% активности",
    icon: <ArrowDownRight className="w-4 h-4" />,
    modifier: 0.8,
    color: "text-yellow-400",
    colorHex: "hsl(45, 80%, 55%)",
    description: "Снижение темпа и мотивации",
  },
  max: {
    label: "Максимальный режим",
    icon: <Flame className="w-4 h-4" />,
    modifier: 1.3,
    color: "text-red-400",
    colorHex: "hsl(0, 80%, 60%)",
    description: "Полная отдача каждый день",
  },
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-xs">
      <p className="text-foreground font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-mono">
          {Math.round(p.value)}%
        </p>
      ))}
    </div>
  )
}

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  return (
    <span className="animate-count-up font-mono font-bold">
      {value}{suffix}
    </span>
  )
}

function StatCard({
  icon,
  label,
  currentValue,
  futureValue,
  suffix,
  color,
  delay,
}: {
  icon: React.ReactNode
  label: string
  currentValue: number
  futureValue: number
  suffix: string
  color: string
  delay: string
}) {
  const growth = futureValue - currentValue
  const isPositive = growth >= 0

  return (
    <div
      className="glass rounded-[14px] p-4 glass-hover opacity-0 animate-slide-up"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl text-foreground">
            <AnimatedNumber value={futureValue} suffix={suffix} />
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            сейчас: {currentValue}{suffix}
          </div>
        </div>
        <div
          className={`flex items-center gap-0.5 text-xs font-mono font-medium px-1.5 py-0.5 rounded ${
            isPositive
              ? "text-primary bg-primary/10"
              : "text-red-400 bg-red-500/10"
          }`}
        >
          {isPositive ? (
            <ArrowUpRight className="w-3 h-3" />
          ) : (
            <ArrowDownRight className="w-3 h-3" />
          )}
          {isPositive ? "+" : ""}{growth}{suffix}
        </div>
      </div>
    </div>
  )
}

export function FutureMe({
  overallProgress,
  streak,
  habitsCount,
  completionRate,
  dailyTasksAvg,
  hoursWorkedAvg,
  goalsProgress,
  daysUntilEndOfYear,
}: FutureMeProps) {
  const [scenario, setScenario] = useState<Scenario>("current")
  const [extraHours, setExtraHours] = useState([0])

  const config = SCENARIO_CONFIG[scenario]
  const mod = config.modifier + (extraHours[0] * 0.05)

  // Predictions
  const predictions = useMemo(() => {
    const baseRate = Math.min(completionRate, 100)
    const projectedRate = Math.min(Math.round(baseRate * mod), 100)
    const disciplineGrowth = Math.round((mod - 1) * 100)
    const totalProductiveHours = Math.round((hoursWorkedAvg + extraHours[0]) * 365)
    const projectedStreak = Math.min(Math.round(streak * mod * 3), 365)
    const goalCompletion = Math.min(Math.round(goalsProgress * mod * (365 / Math.max(daysUntilEndOfYear, 1))), 100)
    const probability = Math.min(Math.round(projectedRate * 0.85 + disciplineGrowth * 0.3), 99)

    return {
      projectedRate,
      disciplineGrowth,
      totalProductiveHours,
      projectedStreak,
      goalCompletion,
      probability: Math.max(probability, 5),
    }
  }, [completionRate, mod, hoursWorkedAvg, extraHours, streak, goalsProgress, daysUntilEndOfYear])

  // Chart data - 12 months projection
  const chartData = useMemo(() => {
    const now = new Date()
    const currentMonthIdx = now.getMonth()
    const data = []

    for (let i = 0; i < 12; i++) {
      const monthIdx = (currentMonthIdx + i) % 12
      const isFuture = i > 0

      // Current progress curve
      const currentProgress = isFuture
        ? Math.min(Math.round(completionRate * (1 + i * 0.02 * (mod - 0.3))), 100)
        : completionRate

      // Projection curve
      const projectedProgress = isFuture
        ? Math.min(Math.round(completionRate * mod * (1 + i * 0.015)), 100)
        : completionRate

      data.push({
        name: MONTH_NAMES[monthIdx].substring(0, 3),
        current: currentProgress,
        projected: projectedProgress,
        isQuarter: monthIdx % 3 === 0,
      })
    }

    return data
  }, [completionRate, mod])

  // Milestones
  const milestones = useMemo(() => {
    const items = []
    if (predictions.projectedRate >= 50) {
      items.push({ label: "50% привычек", achieved: true })
    }
    if (predictions.projectedRate >= 75) {
      items.push({ label: "75% привычек", achieved: true })
    }
    if (predictions.projectedRate >= 90) {
      items.push({ label: "90% привычек", achieved: true })
    }
    if (predictions.projectedStreak >= 30) {
      items.push({ label: "30 дней серия", achieved: true })
    }
    if (predictions.projectedStreak >= 100) {
      items.push({ label: "100 дней серия", achieved: true })
    }
    if (predictions.goalCompletion >= 80) {
      items.push({ label: "80% целей", achieved: true })
    }
    return items
  }, [predictions])

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Main prediction card */}
      <div className="glass-strong rounded-[14px] p-6 neon-border animate-slide-up relative overflow-hidden">
        <div className="absolute inset-0 animate-shimmer pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Твоя жизнь через 365 дней при текущем темпе
              </h2>
              <p className="text-xs text-muted-foreground">
                Холодный математический прогноз на основе твоих данных
              </p>
            </div>
          </div>

          {/* Main forecast numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-5">
            <div className="bg-secondary/20 rounded-xl p-3 border border-border/10 text-center">
              <div className="text-xs text-muted-foreground mb-1">
                Годовая цель
              </div>
              <div className={`text-xl font-bold font-mono ${config.color} animate-count-up`}>
                {predictions.goalCompletion}%
              </div>
              <TrendingUp className="w-3.5 h-3.5 mx-auto mt-1 text-muted-foreground/40" />
            </div>
            <div className="bg-secondary/20 rounded-xl p-3 border border-border/10 text-center">
              <div className="text-xs text-muted-foreground mb-1">
                Дисциплина
              </div>
              <div className={`text-xl font-bold font-mono ${config.color} animate-count-up`}>
                {predictions.disciplineGrowth >= 0 ? "+" : ""}{predictions.disciplineGrowth}%
              </div>
              <Brain className="w-3.5 h-3.5 mx-auto mt-1 text-muted-foreground/40" />
            </div>
            <div className="bg-secondary/20 rounded-xl p-3 border border-border/10 text-center">
              <div className="text-xs text-muted-foreground mb-1">
                Продуктивные часы
              </div>
              <div className={`text-xl font-bold font-mono ${config.color} animate-count-up`}>
                {predictions.totalProductiveHours}
              </div>
              <Clock className="w-3.5 h-3.5 mx-auto mt-1 text-muted-foreground/40" />
            </div>
            <div className="bg-secondary/20 rounded-xl p-3 border border-border/10 text-center">
              <div className="text-xs text-muted-foreground mb-1">
                Streak
              </div>
              <div className={`text-xl font-bold font-mono ${config.color} animate-count-up`}>
                {predictions.projectedStreak}
              </div>
              <Flame className="w-3.5 h-3.5 mx-auto mt-1 text-muted-foreground/40" />
            </div>
            <div className="bg-secondary/20 rounded-xl p-3 border border-border/10 text-center sm:col-span-3 lg:col-span-1">
              <div className="text-xs text-muted-foreground mb-1">
                Шанс успеха
              </div>
              <div className={`text-xl font-bold font-mono ${config.color} animate-count-up`}>
                {predictions.probability}%
              </div>
              <Target className="w-3.5 h-3.5 mx-auto mt-1 text-muted-foreground/40" />
            </div>
          </div>
        </div>
      </div>

      {/* Projection chart + scenario switcher */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart - 2 cols */}
        <div className="lg:col-span-2 glass rounded-[14px] p-4 glass-hover opacity-0 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <h3 className="text-sm font-semibold text-foreground mb-4">
            График проекции
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="projectedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={config.colorHex} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={config.colorHex} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 0%, 40%)" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="hsl(0, 0%, 40%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.04)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "hsl(0,0%,55%)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "hsl(0,0%,55%)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                {/* Q markers */}
                <ReferenceLine x="Янв" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" label={{ value: "Q1", fill: "hsl(0,0%,40%)", fontSize: 10 }} />
                <ReferenceLine x="Апр" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" label={{ value: "Q2", fill: "hsl(0,0%,40%)", fontSize: 10 }} />
                <ReferenceLine x="Июл" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" label={{ value: "Q3", fill: "hsl(0,0%,40%)", fontSize: 10 }} />
                <ReferenceLine x="Окт" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" label={{ value: "Q4", fill: "hsl(0,0%,40%)", fontSize: 10 }} />
                {/* Current line */}
                <Area
                  type="monotone"
                  dataKey="current"
                  stroke="hsl(0, 0%, 40%)"
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                  fill="url(#currentGradient)"
                  dot={false}
                  name="Текущий"
                />
                {/* Projected line */}
                <Area
                  type="monotone"
                  dataKey="projected"
                  stroke={config.colorHex}
                  strokeWidth={2.5}
                  fill="url(#projectedGradient)"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: config.colorHex,
                    stroke: "hsl(var(--card))",
                    strokeWidth: 2,
                  }}
                  name="Прогноз"
                  style={{
                    filter: `drop-shadow(0 0 6px ${config.colorHex})`,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scenario switcher - 1 col */}
        <div className="flex flex-col gap-5">
          <div className="glass rounded-[14px] p-4 glass-hover opacity-0 animate-slide-up" style={{ animationDelay: "0.15s" }}>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Сценарии развития
            </h3>
            <div className="flex flex-col gap-2">
              {(Object.keys(SCENARIO_CONFIG) as Scenario[]).map((s) => {
                const cfg = SCENARIO_CONFIG[s]
                const isActive = scenario === s
                return (
                  <button
                    key={s}
                    onClick={() => setScenario(s)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-300 ${
                      isActive
                        ? `bg-secondary/60 border border-border/40 ${cfg.color}`
                        : "bg-secondary/20 border border-border/10 text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                    }`}
                  >
                    <div className={`shrink-0 ${isActive ? cfg.color : ""}`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-medium ${isActive ? cfg.color : ""}`}>
                        {cfg.label}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {cfg.description}
                      </div>
                    </div>
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Slider */}
          <div className="glass rounded-[14px] p-4 glass-hover opacity-0 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Дополнительные часы в день
            </h3>
            <div className="flex items-center gap-3 mb-2">
              <Slider
                value={extraHours}
                onValueChange={setExtraHours}
                min={0}
                max={4}
                step={0.5}
                className="flex-1"
              />
              <span className="text-sm font-bold font-mono text-primary min-w-[3ch] text-right">
                +{extraHours[0]}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {extraHours[0] > 0
                ? `+${Math.round(extraHours[0] * 365)} часов в год (+${Math.round(extraHours[0] * 5)}% дисциплины)`
                : "Перетащите ползунок для моделирования"}
            </p>
          </div>
        </div>
      </div>

      {/* Current vs Future comparison + milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Current vs Future */}
        <div className="glass rounded-[14px] overflow-hidden glass-hover opacity-0 animate-slide-up" style={{ animationDelay: "0.25s" }}>
          <div className="grid grid-cols-2 h-full">
            {/* Left - current */}
            <div className="p-5 border-r border-border/20">
              <div className="text-xs text-muted-foreground mb-4 uppercase tracking-wider font-medium">
                Текущий ты
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <div className="text-2xl font-bold font-mono text-foreground">
                    {completionRate}%
                  </div>
                  <div className="text-[10px] text-muted-foreground">Выполнение привычек</div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-foreground">
                    {streak}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Дней серия</div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-foreground">
                    {hoursWorkedAvg}ч
                  </div>
                  <div className="text-[10px] text-muted-foreground">Часов в день</div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-foreground">
                    {goalsProgress}%
                  </div>
                  <div className="text-[10px] text-muted-foreground">Прогресс целей</div>
                </div>
              </div>
            </div>

            {/* Right - future */}
            <div className="p-5 bg-primary/3">
              <div className={`text-xs mb-4 uppercase tracking-wider font-medium ${config.color}`}>
                Будущий ты
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <div className={`text-2xl font-bold font-mono ${config.color}`}>
                    {predictions.projectedRate}%
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    Выполнение привычек
                    <ArrowUpRight className="w-2.5 h-2.5 text-primary" />
                  </div>
                </div>
                <div>
                  <div className={`text-2xl font-bold font-mono ${config.color}`}>
                    {predictions.projectedStreak}
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    Дней серия
                    <ArrowUpRight className="w-2.5 h-2.5 text-primary" />
                  </div>
                </div>
                <div>
                  <div className={`text-2xl font-bold font-mono ${config.color}`}>
                    {(hoursWorkedAvg + extraHours[0]).toFixed(1)}ч
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    Часов в день
                    {extraHours[0] > 0 && <ArrowUpRight className="w-2.5 h-2.5 text-primary" />}
                  </div>
                </div>
                <div>
                  <div className={`text-2xl font-bold font-mono ${config.color}`}>
                    {predictions.goalCompletion}%
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    Прогресс целей
                    <ArrowUpRight className="w-2.5 h-2.5 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Milestones + text analysis */}
        <div className="flex flex-col gap-5">
          {/* Milestones */}
          <div className="glass rounded-[14px] p-4 glass-hover opacity-0 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Ключевые milestones
            </h3>
            <div className="flex flex-col gap-2">
              {milestones.length > 0 ? (
                milestones.map((m, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10"
                  >
                    <div className="w-5 h-5 rounded-md bg-primary/20 border border-primary/40 flex items-center justify-center">
                      <Zap className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-xs text-foreground">{m.label}</span>
                    <span className="ml-auto text-[10px] text-primary font-mono">
                      Достижимо
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground text-center py-4">
                  Увеличьте дисциплину для достижения milestones
                </div>
              )}
            </div>
          </div>

          {/* Text analysis */}
          <div className="glass rounded-[14px] p-4 glass-hover opacity-0 animate-slide-up" style={{ animationDelay: "0.35s" }}>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Анализ
            </h3>
            <div className="space-y-2">
              <p className="text-xs text-foreground/80 leading-relaxed">
                При текущем темпе ты достигнешь{" "}
                <span className={`font-bold ${config.color}`}>
                  {predictions.goalCompletion}%
                </span>{" "}
                своей годовой цели.
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">
                За год ты накопишь{" "}
                <span className={`font-bold ${config.color}`}>
                  {predictions.totalProductiveHours}
                </span>{" "}
                продуктивных часов и построишь серию из{" "}
                <span className={`font-bold ${config.color}`}>
                  {predictions.projectedStreak}
                </span>{" "}
                дней.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                {predictions.probability >= 70
                  ? "Ты на правильном пути. Не останавливайся."
                  : predictions.probability >= 40
                    ? "Есть потенциал. Нужно усилить дисциплину."
                    : "Требуется серьезное изменение привычек."}
              </p>
            </div>
            {/* Probability bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                <span>Вероятность достижения цели</span>
                <span className={`font-mono font-bold ${config.color}`}>
                  {predictions.probability}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-secondary/50 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${predictions.probability}%`,
                    background: config.colorHex,
                    boxShadow: `0 0 8px ${config.colorHex}`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Привычки"
          currentValue={completionRate}
          futureValue={predictions.projectedRate}
          suffix="%"
          color="text-primary"
          delay="0.4s"
        />
        <StatCard
          icon={<Flame className="w-4 h-4" />}
          label="Серия"
          currentValue={streak}
          futureValue={predictions.projectedStreak}
          suffix=" дн"
          color="text-orange-400"
          delay="0.45s"
        />
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Часы за год"
          currentValue={Math.round(hoursWorkedAvg * 30)}
          futureValue={predictions.totalProductiveHours}
          suffix="ч"
          color="text-cyan-400"
          delay="0.5s"
        />
        <StatCard
          icon={<Target className="w-4 h-4" />}
          label="Цели"
          currentValue={goalsProgress}
          futureValue={predictions.goalCompletion}
          suffix="%"
          color="text-yellow-400"
          delay="0.55s"
        />
      </div>
    </div>
  )
}
