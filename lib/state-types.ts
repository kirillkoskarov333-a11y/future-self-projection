import type {
  DayTask,
  DayTemplate,
  EnergyLevel,
  Goal,
  Habit,
  HabitCompletions,
  PomodoroSession,
  WeeklyGoal,
  WeeklyHabit,
  WeeklyHabitCompletions,
} from "@/lib/types"

export interface HabitsState {
  currentMonth: number
  currentYear: number
  habits: Habit[]
  completions: HabitCompletions
}

export interface GoalsState {
  monthlyGoals: Goal[]
  yearlyGoals: Goal[]
}

export interface DayPlannerData {
  tasks: DayTask[]
  energyLevel: EnergyLevel
  daySummary: string | null
}

export interface DayPlannerState {
  dayDataMap: Record<string, DayPlannerData>
  customTemplates?: DayTemplate[]
  weeklyHabits?: WeeklyHabit[]
  habitCompletions?: WeeklyHabitCompletions
  weeklyGoals?: WeeklyGoal[]
  pomodoroSessions?: PomodoroSession[]
}

export interface BudgetState {
  balance: import("@/lib/types").BudgetBalance
  goals: import("@/lib/types").BudgetGoal[]
  incomeHistory: import("@/lib/types").IncomeEntry[]
  expenses: import("@/lib/types").ExpenseEntry[]
  deposits: import("@/lib/types").Deposit[]
}

export interface LearningState {
  skills: import("@/lib/types").Skill[]
  sessions: import("@/lib/types").LearningSession[]
}

// Состояние читательского трекера
export interface ReadingState {
  books: import("@/lib/types").Book[]
}

export interface AppDatabase {
  habits?: HabitsState
  goals?: GoalsState
  dayPlanner?: DayPlannerState
  budget?: BudgetState
  learning?: LearningState
  reading?: ReadingState    // ← читательский трекер
  updatedAt?: string
}
