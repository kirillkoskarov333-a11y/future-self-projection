export interface Habit {
  id: string
  name: string
  weekDays?: number[] // days when habit is active (0=Mon, 1=Tue, ..., 6=Sun). Empty/undefined = every day
}

export interface HabitCompletions {
  [habitId: string]: {
    [dayIndex: string]: boolean
  }
}

export interface MonthData {
  habits: Habit[]
  completions: HabitCompletions
}

export const DAYS_OF_WEEK = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const

export const MONTH_NAMES = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
] as const

export type GoalStatus = "in-progress" | "completed" | "overdue"

export interface SubTask {
  id: string
  name: string
  completed: boolean
}

// Habit linked to a goal — completions count toward goal's target
export interface LinkedHabit {
  habitId: string
  target: number // how many completions = fully done (e.g. 20)
}

// Monthly goal linked to a yearly goal — completed items add up
export interface LinkedMonthlyGoal {
  goalId: string
}

export interface Goal {
  id: string
  name: string
  description: string
  progress: number
  deadline: string
  status: GoalStatus
  subtasks: SubTask[]
  whyImportant: string
  type: "month" | "year"
  target?: number // target count (e.g. 20 workouts). undefined = use subtask percentage
  linkedHabits?: LinkedHabit[] // habits contributing to progress
  linkedMonthlyGoals?: LinkedMonthlyGoal[] // monthly goals contributing to yearly progress
}

export type TaskPriority = "high" | "medium" | "low"
export type EnergyLevel = "low" | "medium" | "high"

export interface DayTask {
  id: string
  name: string
  completed: boolean
  priority: TaskPriority
  time: string
  isFocus: boolean
  order: number
  carriedFrom?: string // dateKey of the day this task was carried from
}

// === Day Planner extended types ===

// Template for quickly filling a day with tasks
export interface DayTemplate {
  id: string
  name: string
  tasks: Omit<DayTask, "id" | "completed" | "order" | "carriedFrom">[]
  isBuiltIn: boolean
}

// Built-in templates
export const BUILT_IN_TEMPLATES: DayTemplate[] = [
  {
    id: "study",
    name: "Учебный день",
    isBuiltIn: true,
    tasks: [
      { name: "Утренняя тренировка", priority: "high", time: "07:00", isFocus: true },
      { name: "Глубокая учёба — блок 1", priority: "high", time: "09:00", isFocus: true },
      { name: "Глубокая учёба — блок 2", priority: "high", time: "11:00", isFocus: true },
      { name: "Обед и отдых", priority: "low", time: "13:00", isFocus: false },
      { name: "Повторение материала", priority: "medium", time: "15:00", isFocus: false },
      { name: "Практика / задачи", priority: "medium", time: "17:00", isFocus: false },
      { name: "Вечерний обзор", priority: "medium", time: "20:00", isFocus: false },
    ],
  },
  {
    id: "productive",
    name: "Продуктивный день",
    isBuiltIn: true,
    tasks: [
      { name: "Утренняя рутина", priority: "medium", time: "06:00", isFocus: false },
      { name: "Главная задача дня", priority: "high", time: "07:00", isFocus: true },
      { name: "Важная задача 2", priority: "high", time: "09:00", isFocus: true },
      { name: "Важная задача 3", priority: "high", time: "11:00", isFocus: true },
      { name: "Обед", priority: "low", time: "13:00", isFocus: false },
      { name: "Email и коммуникации", priority: "medium", time: "14:00", isFocus: false },
      { name: "Рутинные задачи", priority: "medium", time: "16:00", isFocus: false },
      { name: "Планирование завтра", priority: "medium", time: "19:00", isFocus: false },
    ],
  },
  {
    id: "recovery",
    name: "Восстановление",
    isBuiltIn: true,
    tasks: [
      { name: "Долгий сон", priority: "high", time: "09:00", isFocus: true },
      { name: "Лёгкая прогулка", priority: "medium", time: "11:00", isFocus: false },
      { name: "Чтение для удовольствия", priority: "low", time: "13:00", isFocus: false },
      { name: "Хобби / творчество", priority: "low", time: "15:00", isFocus: false },
      { name: "Растяжка / йога", priority: "medium", time: "18:00", isFocus: false },
      { name: "Рефлексия и планы", priority: "medium", time: "20:00", isFocus: false },
    ],
  },
]

// Weekly habit for day planner (separate from monthly habits tab)
export interface WeeklyHabit {
  id: string
  name: string
}

// Completions for weekly habits: habitId -> dateKey -> boolean
export interface WeeklyHabitCompletions {
  [habitId: string]: {
    [dateKey: string]: boolean
  }
}

// Weekly goal that can be linked to day tasks
export interface WeeklyGoal {
  id: string
  name: string
  progress: number // 0-100
  linkedTaskIds: string[] // task ids from dayDataMap
  autoProgress: boolean // true = auto-calc from linked tasks
  weekStart: string // "2026-3-10" key for the Monday of the week
}

// Pomodoro session record
export interface PomodoroSession {
  id: string
  taskId: string | null // which task was being worked on
  durationMinutes: number // usually 25
  dateKey: string // "2026-3-13"
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
}

export const ENERGY_LABELS: Record<EnergyLevel, string> = {
  low: "Низкая",
  medium: "Средняя",
  high: "Высокая",
}

// === Budget types ===

export type BudgetGoalCategory =
  | "Техника"
  | "Авто"
  | "Подарки"
  | "Жильё"
  | "Путешествия"
  | "Образование"
  | "Здоровье"
  | "Другое"

export const BUDGET_CATEGORIES: BudgetGoalCategory[] = [
  "Техника",
  "Авто",
  "Подарки",
  "Жильё",
  "Путешествия",
  "Образование",
  "Здоровье",
  "Другое",
]

/** Importance level 1–4, where 4 is the highest priority */
export type ImportanceLevel = 1 | 2 | 3 | 4

export interface BudgetGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string // ISO date
  category: BudgetGoalCategory
  importance: ImportanceLevel
  completed: boolean
  createdAt: string
}

export interface BudgetBalance {
  cardBalance: number      // current card balance
  reserveTarget: number    // user-set reserve amount
  reserveCurrent: number   // how much reserve remains
}

export interface IncomeEntry {
  id: string
  amount: number
  date: string
  distributed: boolean
}

export interface DistributionResult {
  goalId: string
  goalName: string
  amount: number
}

export interface ExpenseEntry {
  id: string
  amount: number
  description: string
  date: string
}

export interface Deposit {
  id: string
  name: string
  bankName: string
  amount: number
  interestRate: number   // годовой % (например 12 = 12%)
  monthlyContribution: number  // ежемесячный взнос
  startDate: string
  endDate: string
  createdAt: string
}

// === Savings Goal (smart accumulation with adaptive recommendations) ===

export interface EarningEntry {
  id: string
  amount: number
  date: string  // ISO date
}

export interface SavingsGoal {
  id: string
  name: string
  targetAmount: number       // целевая сумма (например 350000)
  deadline: string           // дедлайн (ISO date)
  workDaysPerWeek: number    // начальный план дней работы в неделю
  earnings: EarningEntry[]   // лог заработков по дням
  createdAt: string
}

export const IMPORTANCE_LABELS: Record<ImportanceLevel, string> = {
  4: "Критический",
  3: "Высокий",
  2: "Средний",
  1: "Низкий",
}

// === Learning / Skill types ===

export type SkillStatus = "active" | "completed" | "frozen"
export type SkillComplexity = "beginner" | "intermediate" | "advanced"
export type SkillPriority = "high" | "medium" | "low"

export interface Skill {
  id: string
  name: string
  description: string
  complexity: SkillComplexity
  priority: SkillPriority
  status: SkillStatus
  hoursGoal: number
  currentHours: number
  startDate: string
  endDate: string
  parentId: string | null
  dependencies: string[]
  createdAt: string
}

export interface LearningSession {
  id: string
  skillId: string
  date: string
  durationMinutes: number
  notes: string
}

export const SKILL_STATUS_LABELS: Record<SkillStatus, string> = {
  active: "Активный",
  completed: "Изучен",
  frozen: "Заморожен",
}

export const SKILL_COMPLEXITY_LABELS: Record<SkillComplexity, string> = {
  beginner: "Начальный",
  intermediate: "Средний",
  advanced: "Продвинутый",
}

export const SKILL_PRIORITY_LABELS: Record<SkillPriority, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
}

// === Reading Tracker types ===

export type BookStatus = "reading" | "completed" | "overdue"

export interface BookNote {
  id: string
  text: string
  tag: "note" | "insight" // "Заметка" | "Что понял"
  createdAt: string       // ISO date
}

export interface BookQuote {
  id: string
  text: string
  page: number
  createdAt: string       // ISO date
}

export interface ReadingSession {
  id: string
  durationMinutes: number
  date: string            // ISO date
}

export interface Book {
  id: string
  title: string
  totalPages: number
  currentPage: number     // текущая страница (обновляется пользователем)
  deadlineDays: number    // N дней на прочтение от addedAt
  withBuffer: boolean     // true = pagesPerDay × 1.2
  coverPath?: string      // имя файла в папке covers, например "abc123.jpg"
  addedAt: string         // ISO date — точка отсчёта дедлайна
  status: BookStatus
  completedAt?: string    // ISO date
  notes: BookNote[]
  quotes: BookQuote[]
  sessions: ReadingSession[]
}

export const MOTIVATIONAL_QUOTES = [
  "Дисциплина — это мост между целями и достижениями.",
  "Каждый день — это шанс стать лучшей версией себя.",
  "Привычки определяют твою судьбу.",
  "Сила — в постоянстве, а не в интенсивности.",
  "Путь в тысячу миль начинается с одного шага.",
  "Не жди идеального момента — создай его.",
  "Успех — это сумма маленьких усилий, повторяемых изо дня в день.",
  "Твоя единственная конкуренция — это ты вчерашний.",
  "Победи утро — победишь весь день.",
  "Результат приходит к тем, кто не сдаётся.",
  "Маленький прогресс — это тоже прогресс.",
  "Сегодняшние усилия — завтрашняя награда.",
] as const
