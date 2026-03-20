"use client"

import { useState, useCallback } from "react"
import { useHabitStore } from "@/hooks/use-habit-store"
import { useGoalsStore } from "@/hooks/use-goals-store"
import { DashboardHeader } from "@/components/dashboard-header"
import { WeekView } from "@/components/week-view"
import { StatsCards } from "@/components/stats-cards"
import { AnalyticsCharts, DayCards } from "@/components/analytics-charts"
import { MonthlyGoals } from "@/components/monthly-goals"
import { YearlyGoals } from "@/components/yearly-goals"
import { GoalsAnalytics } from "@/components/goals-analytics"
import { DayPlanner } from "@/components/day-planner"
import { BudgetTab } from "@/components/budget-tab"
import { LearningTab } from "@/components/learning-tab"
import { LayoutGrid, Target, CalendarDays, Wallet, GraduationCap } from "lucide-react"

type Tab = "habits" | "goals" | "day" | "budget" | "learning"

export function HabitTracker() {
  const store = useHabitStore()

  // Count how many days a habit was completed in current month
  // This function is passed to goalsStore so it can calculate progress
  const getHabitCompletionCount = useCallback(
    (habitId: string): number => {
      const habitCompletions = store.completions[habitId]
      if (!habitCompletions) return 0
      return Object.entries(habitCompletions).filter(([key, done]) => {
        // Key format: "YYYY-M-D"
        const parts = key.split("-")
        const year = parseInt(parts[0])
        const month = parseInt(parts[1])
        return done && year === store.currentYear && month === store.currentMonth
      }).length
    },
    [store.completions, store.currentMonth, store.currentYear]
  )

  const goalsStore = useGoalsStore(getHabitCompletionCount)
  const [activeTab, setActiveTab] = useState<Tab>("habits")

  const overallProgress = store.getOverallProgress()
  const weekdayStats = store.getWeekdayStats()
  const dailyStats = store.getDailyStats()
  const streak = store.getStreak()
  const bestDay = store.getBestDay()

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1440px] mx-auto px-4 py-6 lg:px-8 lg:py-8 flex flex-col gap-8">
        <DashboardHeader
          currentMonth={store.currentMonth}
          currentYear={store.currentYear}
          overallProgress={overallProgress}
          onPreviousMonth={store.goToPreviousMonth}
          onNextMonth={store.goToNextMonth}
        />

        {/* Tab Navigation */}
        <nav className="glass-strong rounded-2xl p-1.5 flex items-center gap-1">
          <button
            onClick={() => setActiveTab("day")}
            className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === "day"
                ? "bg-primary/10 text-primary neon-text shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Планировка недели</span>
          </button>
          <button
            onClick={() => setActiveTab("habits")}
            className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === "habits"
                ? "bg-primary/10 text-primary neon-text shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Привычки</span>
          </button>
          <button
            onClick={() => setActiveTab("goals")}
            className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === "goals"
                ? "bg-primary/10 text-primary neon-text shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Мои цели</span>
          </button>
          <button
            onClick={() => setActiveTab("learning")}
            className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === "learning"
                ? "bg-primary/10 text-primary neon-text shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Обучение</span>
          </button>
          <button
            onClick={() => setActiveTab("budget")}
            className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === "budget"
                ? "bg-primary/10 text-primary neon-text shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Бюджет</span>
          </button>
        </nav>

        {activeTab === "day" && <DayPlanner />}

        {activeTab === "habits" && (
          <div className="flex flex-col gap-8">
            <StatsCards
              overallProgress={overallProgress}
              streak={streak}
              bestDay={bestDay}
              currentMonth={store.currentMonth}
              habitsCount={store.habits.length}
            />

            <WeekView
              habits={store.habits}
              currentMonth={store.currentMonth}
              currentYear={store.currentYear}
              daysInMonth={store.daysInMonth}
              isCompleted={store.isCompleted}
              toggleCompletion={store.toggleCompletion}
              getHabitCompletionRate={store.getHabitCompletionRate}
              getDayCompletionRate={store.getDayCompletionRate}
              addHabit={store.addHabit}
              removeHabit={store.removeHabit}
              updateHabit={store.updateHabit}
              updateHabitDays={store.updateHabitDays}
              getHabitsForDay={store.getHabitsForDay}
            />

            <AnalyticsCharts
              weekdayStats={weekdayStats}
              dailyStats={dailyStats}
              overallProgress={overallProgress}
            />

            <DayCards
              dailyStats={dailyStats}
              currentMonth={store.currentMonth}
              currentYear={store.currentYear}
            />
          </div>
        )}

        {activeTab === "goals" && (
          <div className="flex flex-col gap-8">
            <GoalsAnalytics
              monthlyGoals={goalsStore.monthlyGoals}
              yearlyGoals={goalsStore.yearlyGoals}
              overallMonthlyProgress={goalsStore.overallMonthlyProgress}
              overallYearlyProgress={goalsStore.overallYearlyProgress}
              daysUntilEndOfYear={goalsStore.daysUntilEndOfYear}
              monthlyProgressByMonth={goalsStore.monthlyProgressByMonth}
            />

            <MonthlyGoals
              goals={goalsStore.monthlyGoals}
              habits={store.habits}
              addGoal={goalsStore.addGoal}
              removeGoal={goalsStore.removeGoal}
              updateGoal={goalsStore.updateGoal}
              toggleSubtask={goalsStore.toggleSubtask}
              addSubtask={goalsStore.addSubtask}
              removeSubtask={goalsStore.removeSubtask}
              linkHabit={goalsStore.linkHabit}
              unlinkHabit={goalsStore.unlinkHabit}
              getHabitCompletionCount={getHabitCompletionCount}
            />

            <YearlyGoals
              goals={goalsStore.yearlyGoals}
              monthlyGoals={goalsStore.monthlyGoals}
              overallYearlyProgress={goalsStore.overallYearlyProgress}
              daysUntilEndOfYear={goalsStore.daysUntilEndOfYear}
              addGoal={goalsStore.addGoal}
              removeGoal={goalsStore.removeGoal}
              updateGoal={goalsStore.updateGoal}
              toggleSubtask={goalsStore.toggleSubtask}
              addSubtask={goalsStore.addSubtask}
              removeSubtask={goalsStore.removeSubtask}
              linkMonthlyGoal={goalsStore.linkMonthlyGoal}
              unlinkMonthlyGoal={goalsStore.unlinkMonthlyGoal}
              getMonthlyGoalCompletedCount={goalsStore.getMonthlyGoalCompletedCount}
            />
          </div>
        )}

        {activeTab === "learning" && <LearningTab />}

        {activeTab === "budget" && <BudgetTab />}
      </div>
    </div>
  )
}
