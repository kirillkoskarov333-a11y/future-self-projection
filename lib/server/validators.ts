import type {
  BudgetState,
  DayPlannerData,
  DayPlannerState,
  GoalsState,
  HabitsState,
} from "@/lib/state-types"
import type {
  BudgetGoal,
  BudgetGoalCategory,
  BUDGET_CATEGORIES,
  DayTask,
  EnergyLevel,
  Goal,
  GoalStatus,
  Habit,
  HabitCompletions,
  ImportanceLevel,
  IncomeEntry,
  LinkedHabit,
  LinkedMonthlyGoal,
  SubTask,
  TaskPriority,
} from "@/lib/types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === "string"
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean"
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function isTaskPriority(value: unknown): value is TaskPriority {
  return value === "high" || value === "medium" || value === "low"
}

function isEnergyLevel(value: unknown): value is EnergyLevel {
  return value === "low" || value === "medium" || value === "high"
}

function isGoalStatus(value: unknown): value is GoalStatus {
  return value === "in-progress" || value === "completed" || value === "overdue"
}

function isGoalType(value: unknown): value is "month" | "year" {
  return value === "month" || value === "year"
}

function isHabit(value: unknown): value is Habit {
  if (!isRecord(value) || !isString(value.id) || !isString(value.name)) return false
  // weekDays is optional — array of numbers 0-6 for backward compat
  if (value.weekDays !== undefined) {
    if (!Array.isArray(value.weekDays) || !value.weekDays.every(isNumber)) return false
  }
  return true
}

function isCompletions(value: unknown): value is HabitCompletions {
  if (!isRecord(value)) return false

  return Object.values(value).every((habitData) => {
    if (!isRecord(habitData)) return false
    return Object.values(habitData).every((done) => isBoolean(done))
  })
}

function isSubTask(value: unknown): value is SubTask {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isBoolean(value.completed)
  )
}

// Validate linked habit object { habitId, target }
function isLinkedHabit(value: unknown): value is LinkedHabit {
  return isRecord(value) && isString(value.habitId) && isNumber(value.target)
}

// Validate linked monthly goal object { goalId }
function isLinkedMonthlyGoal(value: unknown): value is LinkedMonthlyGoal {
  return isRecord(value) && isString(value.goalId)
}

function isGoal(value: unknown): value is Goal {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.name) ||
    !isString(value.description) ||
    !isNumber(value.progress) ||
    !isString(value.deadline) ||
    !isGoalStatus(value.status) ||
    !Array.isArray(value.subtasks) ||
    !value.subtasks.every(isSubTask) ||
    !isString(value.whyImportant) ||
    !isGoalType(value.type)
  ) return false

  // Optional new fields — backward compatible
  if (value.target !== undefined && !isNumber(value.target)) return false
  if (value.linkedHabits !== undefined) {
    if (!Array.isArray(value.linkedHabits) || !value.linkedHabits.every(isLinkedHabit)) return false
  }
  if (value.linkedMonthlyGoals !== undefined) {
    if (!Array.isArray(value.linkedMonthlyGoals) || !value.linkedMonthlyGoals.every(isLinkedMonthlyGoal)) return false
  }
  return true
}

function isDayTask(value: unknown): value is DayTask {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.name) ||
    !isBoolean(value.completed) ||
    !isTaskPriority(value.priority) ||
    !isString(value.time) ||
    !isBoolean(value.isFocus) ||
    !isNumber(value.order)
  ) return false
  // carriedFrom is optional string
  if (value.carriedFrom !== undefined && !isString(value.carriedFrom)) return false
  return true
}

function isDayData(value: unknown): value is DayPlannerData {
  return (
    isRecord(value) &&
    Array.isArray(value.tasks) &&
    value.tasks.every(isDayTask) &&
    isEnergyLevel(value.energyLevel) &&
    (value.daySummary === null || isString(value.daySummary))
  )
}

export function isHabitsState(value: unknown): value is HabitsState {
  return (
    isRecord(value) &&
    isNumber(value.currentMonth) &&
    isNumber(value.currentYear) &&
    Array.isArray(value.habits) &&
    value.habits.every(isHabit) &&
    isCompletions(value.completions)
  )
}

export function isGoalsState(value: unknown): value is GoalsState {
  return (
    isRecord(value) &&
    Array.isArray(value.monthlyGoals) &&
    value.monthlyGoals.every(isGoal) &&
    Array.isArray(value.yearlyGoals) &&
    value.yearlyGoals.every(isGoal)
  )
}

export function isDayPlannerState(value: unknown): value is DayPlannerState {
  if (!isRecord(value) || !isRecord(value.dayDataMap)) return false
  if (!Object.values(value.dayDataMap).every(isDayData)) return false
  // All new fields are optional arrays — just check they are arrays if present
  if (value.customTemplates !== undefined && !Array.isArray(value.customTemplates)) return false
  if (value.weeklyHabits !== undefined && !Array.isArray(value.weeklyHabits)) return false
  if (value.habitCompletions !== undefined && !isRecord(value.habitCompletions)) return false
  if (value.weeklyGoals !== undefined && !Array.isArray(value.weeklyGoals)) return false
  if (value.pomodoroSessions !== undefined && !Array.isArray(value.pomodoroSessions)) return false
  return true
}

function isImportanceLevel(value: unknown): value is ImportanceLevel {
  return value === 1 || value === 2 || value === 3 || value === 4
}

function isBudgetCategory(value: unknown): value is BudgetGoalCategory {
  const valid = [
    "Техника", "Авто", "Подарки", "Жильё",
    "Путешествия", "Образование", "Здоровье", "Другое",
  ]
  return isString(value) && valid.includes(value)
}

function isBudgetGoal(value: unknown): value is BudgetGoal {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isNumber(value.targetAmount) &&
    isNumber(value.currentAmount) &&
    isString(value.deadline) &&
    isBudgetCategory(value.category) &&
    isImportanceLevel(value.importance) &&
    isBoolean(value.completed) &&
    isString(value.createdAt)
  )
}

function isIncomeEntry(value: unknown): value is IncomeEntry {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isNumber(value.amount) &&
    isString(value.date) &&
    isBoolean(value.distributed)
  )
}

function isExpenseEntry(value: unknown): value is import("@/lib/types").ExpenseEntry {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isNumber(value.amount) &&
    isString(value.description) &&
    isString(value.date)
  )
}

function isDeposit(value: unknown): value is import("@/lib/types").Deposit {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.name) ||
    !isString(value.bankName) ||
    !isNumber(value.amount) ||
    !isNumber(value.interestRate) ||
    !isString(value.startDate) ||
    !isString(value.endDate) ||
    !isString(value.createdAt)
  ) return false
  // monthlyContribution added later — default 0 for old data
  if (value.monthlyContribution !== undefined && !isNumber(value.monthlyContribution)) return false
  return true
}

// === Learning validators ===

function isSkillStatus(value: unknown): value is import("@/lib/types").SkillStatus {
  return value === "active" || value === "completed" || value === "frozen"
}

function isSkillComplexity(value: unknown): value is import("@/lib/types").SkillComplexity {
  return value === "beginner" || value === "intermediate" || value === "advanced"
}

function isSkillPriority(value: unknown): value is import("@/lib/types").SkillPriority {
  return value === "high" || value === "medium" || value === "low"
}

function isSkill(value: unknown): value is import("@/lib/types").Skill {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.description) &&
    isSkillComplexity(value.complexity) &&
    isSkillPriority(value.priority) &&
    isSkillStatus(value.status) &&
    isNumber(value.hoursGoal) &&
    isNumber(value.currentHours) &&
    isString(value.startDate) &&
    isString(value.endDate) &&
    (value.parentId === null || isString(value.parentId)) &&
    Array.isArray(value.dependencies) &&
    value.dependencies.every(isString) &&
    isString(value.createdAt)
  )
}

function isLearningSession(value: unknown): value is import("@/lib/types").LearningSession {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.skillId) &&
    isString(value.date) &&
    isNumber(value.durationMinutes) &&
    isString(value.notes)
  )
}

export function isLearningState(value: unknown): value is import("@/lib/state-types").LearningState {
  return (
    isRecord(value) &&
    Array.isArray(value.skills) &&
    value.skills.every(isSkill) &&
    Array.isArray(value.sessions) &&
    value.sessions.every(isLearningSession)
  )
}

export function isBudgetState(value: unknown): value is BudgetState {
  if (!isRecord(value)) return false
  if (!isRecord(value.balance)) return false
  const b = value.balance
  if (!isNumber(b.cardBalance) || !isNumber(b.reserveTarget) || !isNumber(b.reserveCurrent))
    return false
  if (!Array.isArray(value.goals) || !value.goals.every(isBudgetGoal)) return false
  if (!Array.isArray(value.incomeHistory) || !value.incomeHistory.every(isIncomeEntry))
    return false
  // expenses and deposits are optional for backwards compat
  if (value.expenses !== undefined && (!Array.isArray(value.expenses) || !value.expenses.every(isExpenseEntry)))
    return false
  if (value.deposits !== undefined && (!Array.isArray(value.deposits) || !value.deposits.every(isDeposit)))
    return false
  return true
}

// === Reading validators ===

function isBookStatus(value: unknown): value is import("@/lib/types").BookStatus {
  return value === "reading" || value === "completed" || value === "overdue"
}

function isBookNote(value: unknown): value is import("@/lib/types").BookNote {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.text) &&
    (value.tag === "note" || value.tag === "insight") &&
    isString(value.createdAt)
  )
}

function isBookQuote(value: unknown): value is import("@/lib/types").BookQuote {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.text) &&
    isNumber(value.page) &&
    isString(value.createdAt)
  )
}

function isReadingSession(value: unknown): value is import("@/lib/types").ReadingSession {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isNumber(value.durationMinutes) &&
    isString(value.date)
  )
}

function isBook(value: unknown): value is import("@/lib/types").Book {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.title) ||
    !isNumber(value.totalPages) ||
    !isNumber(value.currentPage) ||
    !isNumber(value.deadlineDays) ||
    !isBoolean(value.withBuffer) ||
    !isString(value.addedAt) ||
    !isBookStatus(value.status)
  ) return false
  // Опциональные поля
  if (value.coverPath !== undefined && !isString(value.coverPath)) return false
  if (value.completedAt !== undefined && !isString(value.completedAt)) return false
  if (!Array.isArray(value.notes) || !value.notes.every(isBookNote)) return false
  if (!Array.isArray(value.quotes) || !value.quotes.every(isBookQuote)) return false
  if (!Array.isArray(value.sessions) || !value.sessions.every(isReadingSession)) return false
  return true
}

export function isReadingState(value: unknown): value is import("@/lib/state-types").ReadingState {
  return (
    isRecord(value) &&
    Array.isArray(value.books) &&
    value.books.every(isBook)
  )
}
