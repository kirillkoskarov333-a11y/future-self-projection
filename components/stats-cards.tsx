"use client"

import { Flame, Trophy, TrendingUp, Zap } from "lucide-react"
import { MOTIVATIONAL_QUOTES, MONTH_NAMES } from "@/lib/types"
import { useState, useEffect } from "react"

interface StatsCardsProps {
  overallProgress: number
  streak: number
  bestDay: { day: number; rate: number }
  currentMonth: number
  habitsCount: number
}

export function StatsCards({
  overallProgress,
  streak,
  bestDay,
  currentMonth,
  habitsCount,
}: StatsCardsProps) {
  const [quote, setQuote] = useState(MOTIVATIONAL_QUOTES[0])

  useEffect(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
        86400000
    )
    setQuote(MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length])
  }, [])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      <div className="glass rounded-2xl p-5 flex flex-col gap-3 glass-hover">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground">
            Прогресс за {MONTH_NAMES[currentMonth].toLowerCase()}
          </span>
        </div>
        <span className="text-2xl font-bold text-foreground font-mono">
          {overallProgress}%
        </span>
        <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{
              width: `${overallProgress}%`,
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
          <span className="text-xs text-muted-foreground">Серия дней</span>
        </div>
        <span className="text-2xl font-bold text-foreground font-mono">
          {streak}
        </span>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {streak > 0
            ? "Без пропусков (80%+)"
            : "Выполняй задачи на 80%+ для серии"}
        </p>
      </div>

      <div className="glass rounded-2xl p-5 flex flex-col gap-3 glass-hover">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-yellow-400" />
          </div>
          <span className="text-xs text-muted-foreground">Лучший день</span>
        </div>
        <span className="text-2xl font-bold text-foreground font-mono">
          {bestDay.day > 0 ? `${bestDay.day}-е` : "-"}
        </span>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {bestDay.rate > 0
            ? `Выполнено ${bestDay.rate}% задач`
            : "Нет данных"}
        </p>
      </div>

      <div className="glass rounded-2xl p-5 flex flex-col gap-3 glass-hover">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground">Цитата дня</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed italic">
          {`"${quote}"`}
        </p>
      </div>
    </div>
  )
}
