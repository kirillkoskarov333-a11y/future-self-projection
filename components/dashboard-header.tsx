"use client"

import { ChevronLeft, ChevronRight, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MONTH_NAMES } from "@/lib/types"
import { ThemeSwitcher } from "@/components/theme-switcher"

interface DashboardHeaderProps {
  currentMonth: number
  currentYear: number
  overallProgress: number
  onPreviousMonth: () => void
  onNextMonth: () => void
}

export function DashboardHeader({
  currentMonth,
  currentYear,
  overallProgress,
  onPreviousMonth,
  onNextMonth,
}: DashboardHeaderProps) {
  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (overallProgress / 100) * circumference

  return (
    <header className="glass-strong rounded-2xl p-5 lg:p-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10">
          <Target className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground text-balance">
            Путь к успеху
          </h1>
          <p className="text-sm text-muted-foreground">
            Трекер привычек и продуктивности
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ThemeSwitcher />
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPreviousMonth}
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-foreground min-w-[160px] text-center">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNextMonth}
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="hsl(var(--secondary))"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="hsl(var(--primary))"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700 ease-out"
                style={{
                  filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.4))",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-foreground">
                {overallProgress}%
              </span>
            </div>
          </div>
          <div className="hidden sm:block">
            <p className="text-xs text-muted-foreground">Общий прогресс</p>
            <div className="w-32 h-2 rounded-full bg-secondary mt-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary animate-fill"
                style={{
                  width: `${overallProgress}%`,
                  boxShadow: "0 0 8px hsl(var(--primary) / 0.4)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
