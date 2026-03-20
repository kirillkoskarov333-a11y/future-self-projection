# Привязка привычек к целям — План реализации

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Каскадная система прогресса: привычки → месячные цели → годовые цели. Выполнения привычек и подзадач считаются как абсолютные числа к целевому числу (target).

**Architecture:** Добавляем поля `target`, `linkedHabits` в Goal и `linkedMonthlyGoals` в Goal (для годовых). Формула прогресса: completedCount / target * 100. Хук целей получает функцию подсчёта из хука привычек. UI показывает привязанные элементы как особые строки в списке подзадач.

**Tech Stack:** Next.js, React hooks, TypeScript, Tailwind CSS, shadcn/ui, lucide-react icons

---

### Task 1: Обновить типы данных

**Files:**
- Modify: `lib/types.ts:43-65`

**Step 1: Добавить новые поля в интерфейсы**

В `Goal` добавить:
```typescript
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
  // New fields for linking
  target?: number  // target count (e.g. 20 workouts, 100 books). undefined = use subtask percentage
  linkedHabits?: LinkedHabit[]  // habits contributing to this goal's progress
  linkedMonthlyGoals?: LinkedMonthlyGoal[]  // monthly goals contributing to yearly goal's progress
}

// Habit linked to a goal with a target count
export interface LinkedHabit {
  habitId: string
  target: number  // how many completions count as "done" (e.g. 20)
}

// Monthly goal linked to a yearly goal
export interface LinkedMonthlyGoal {
  goalId: string
}
```

Remove `YearlyGoal` interface (no longer needed — `Goal` now has all fields).

**Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add target, linkedHabits, linkedMonthlyGoals fields to Goal type"
```

---

### Task 2: Обновить валидатор

**Files:**
- Modify: `lib/server/validators.ts:83-97`

**Step 1: Обновить isGoal для новых опциональных полей**

```typescript
function isLinkedHabit(value: unknown): value is LinkedHabit {
  return isRecord(value) && isString(value.habitId) && isNumber(value.target)
}

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
```

**Step 2: Добавить импорты LinkedHabit, LinkedMonthlyGoal**

**Step 3: Commit**

```bash
git add lib/server/validators.ts
git commit -m "feat: update isGoal validator for linkedHabits and linkedMonthlyGoals"
```

---

### Task 3: Обновить хук целей — новая формула прогресса и методы привязки

**Files:**
- Modify: `hooks/use-goals-store.ts`

**Step 1: Добавить функцию подсчёта прогресса с target**

Заменить `computeProgress` на новую функцию:

```typescript
// Count completed items for a goal
// completedSubtasks = number of completed subtasks
// habitCounts = array of { completed, target } for each linked habit
// linkedMonthlyCompletedCount = total completed items from linked monthly goals
function computeProgressWithTarget(
  goal: Goal,
  getHabitCompletionCount?: (habitId: string) => number,
  getMonthlyGoalCompletedCount?: (goalId: string) => number,
): number {
  // If no target — use old subtask percentage formula
  if (!goal.target) {
    return computeProgress(goal.subtasks)
  }

  // Count completed subtasks
  let completedCount = goal.subtasks.filter(s => s.completed).length

  // Add habit completions (capped at each habit's target)
  if (goal.linkedHabits && getHabitCompletionCount) {
    for (const lh of goal.linkedHabits) {
      const count = getHabitCompletionCount(lh.habitId)
      completedCount += Math.min(count, lh.target)
    }
  }

  // Add linked monthly goals' completed subtasks
  if (goal.linkedMonthlyGoals && getMonthlyGoalCompletedCount) {
    for (const lm of goal.linkedMonthlyGoals) {
      completedCount += getMonthlyGoalCompletedCount(lm.goalId)
    }
  }

  return Math.min(Math.round((completedCount / goal.target) * 100), 100)
}
```

**Step 2: Добавить методы привязки/отвязки**

```typescript
// Link a habit to a goal
const linkHabit = useCallback((type: "month" | "year", goalId: string, habitId: string, target: number) => {
  const setter = type === "month" ? setMonthlyGoals : setYearlyGoals
  setter(prev => prev.map(g => {
    if (g.id !== goalId) return g
    const existing = g.linkedHabits || []
    // Don't add duplicate
    if (existing.some(lh => lh.habitId === habitId)) return g
    return { ...g, linkedHabits: [...existing, { habitId, target }] }
  }))
}, [])

// Unlink a habit from a goal
const unlinkHabit = useCallback((type: "month" | "year", goalId: string, habitId: string) => {
  const setter = type === "month" ? setMonthlyGoals : setYearlyGoals
  setter(prev => prev.map(g => {
    if (g.id !== goalId) return g
    return { ...g, linkedHabits: (g.linkedHabits || []).filter(lh => lh.habitId !== habitId) }
  }))
}, [])

// Link a monthly goal to a yearly goal
const linkMonthlyGoal = useCallback((yearlyGoalId: string, monthlyGoalId: string) => {
  setYearlyGoals(prev => prev.map(g => {
    if (g.id !== yearlyGoalId) return g
    const existing = g.linkedMonthlyGoals || []
    if (existing.some(lm => lm.goalId === monthlyGoalId)) return g
    return { ...g, linkedMonthlyGoals: [...existing, { goalId: monthlyGoalId }] }
  }))
}, [])

// Unlink a monthly goal from a yearly goal
const unlinkMonthlyGoal = useCallback((yearlyGoalId: string, monthlyGoalId: string) => {
  setYearlyGoals(prev => prev.map(g => {
    if (g.id !== yearlyGoalId) return g
    return { ...g, linkedMonthlyGoals: (g.linkedMonthlyGoals || []).filter(lm => lm.goalId !== monthlyGoalId) }
  }))
}, [])
```

**Step 3: Обновить updateGoal чтобы использовал новую формулу**

`updateGoal` и `toggleSubtask` должны пересчитывать прогресс через `computeProgressWithTarget`. Для этого хук получает `getHabitCompletionCount` через параметр (передаётся из habit-tracker.tsx).

Изменить сигнатуру `useGoalsStore`:
```typescript
export function useGoalsStore(getHabitCompletionCount?: (habitId: string) => number)
```

**Step 4: Добавить getter для подсчёта выполненных элементов месячной цели**

```typescript
// Get count of completed items in a monthly goal (for yearly goal linking)
const getMonthlyGoalCompletedCount = useCallback((goalId: string): number => {
  const goal = monthlyGoals.find(g => g.id === goalId)
  if (!goal) return 0
  let count = goal.subtasks.filter(s => s.completed).length
  if (goal.linkedHabits && getHabitCompletionCount) {
    for (const lh of goal.linkedHabits) {
      count += Math.min(getHabitCompletionCount(lh.habitId), lh.target)
    }
  }
  return count
}, [monthlyGoals, getHabitCompletionCount])
```

**Step 5: Обновить return объект**

Добавить: `linkHabit`, `unlinkHabit`, `linkMonthlyGoal`, `unlinkMonthlyGoal`, `getMonthlyGoalCompletedCount`

**Step 6: Commit**

```bash
git add hooks/use-goals-store.ts
git commit -m "feat: add habit/goal linking methods and target-based progress formula"
```

---

### Task 4: Обновить habit-tracker.tsx — передать данные привычек в хук целей

**Files:**
- Modify: `components/habit-tracker.tsx`

**Step 1: Создать функцию подсчёта выполнений привычки**

В `HabitTracker` компоненте создать функцию, которая считает количество `true` записей для привычки за текущий месяц:

```typescript
// Count how many days a habit was completed in current month
const getHabitCompletionCount = useCallback((habitId: string): number => {
  const habitCompletions = store.completions[habitId]
  if (!habitCompletions) return 0
  return Object.entries(habitCompletions)
    .filter(([key, done]) => {
      // Key format: "YYYY-M-D"
      const parts = key.split("-")
      const year = parseInt(parts[0])
      const month = parseInt(parts[1])
      return done && year === store.currentYear && month === store.currentMonth
    })
    .length
}, [store.completions, store.currentMonth, store.currentYear])
```

**Step 2: Передать в useGoalsStore**

```typescript
const goalsStore = useGoalsStore(getHabitCompletionCount)
```

**Step 3: Передать новые пропсы в MonthlyGoals и YearlyGoals**

MonthlyGoals получает: `habits` (список привычек для выбора), `linkHabit`, `unlinkHabit`, `getHabitCompletionCount`

YearlyGoals получает: `monthlyGoals` (для выбора), `linkMonthlyGoal`, `unlinkMonthlyGoal`, `getMonthlyGoalCompletedCount`

**Step 4: Commit**

```bash
git add components/habit-tracker.tsx
git commit -m "feat: wire habit completion counts into goals store"
```

---

### Task 5: Обновить UI месячных целей — привязка привычек

**Files:**
- Modify: `components/monthly-goals.tsx`

**Step 1: Обновить MonthlyGoalsProps**

Добавить пропсы:
```typescript
interface MonthlyGoalsProps {
  // ...existing props
  habits: Habit[]  // list of all habits for selection
  linkHabit: (type: "month" | "year", goalId: string, habitId: string, target: number) => void
  unlinkHabit: (type: "month" | "year", goalId: string, habitId: string) => void
  getHabitCompletionCount: (habitId: string) => number
}
```

**Step 2: Обновить GoalCard — показать привязанные привычки**

В развёрнутом виде (expanded) после списка подзадач добавить:
- Список привязанных привычек (из `goal.linkedHabits`):
  - Иконка 🔄 + имя привычки + мини прогресс-бар + "15/20" + кнопка ✕
- Кнопка "Привязать привычку":
  - Показывает select с привычками (исключая уже привязанные)
  - Поле ввода target (число)
  - Кнопка подтверждения

**Step 3: Добавить поле target в форму редактирования цели**

В editing режиме добавить Input для target:
```tsx
<Input
  type="number"
  value={editTarget}
  onChange={(e) => setEditTarget(e.target.value)}
  placeholder="Целевое число (необязательно)"
  className="..."
/>
```

**Step 4: Commit**

```bash
git add components/monthly-goals.tsx
git commit -m "feat: add habit linking UI to monthly goals"
```

---

### Task 6: Обновить UI годовых целей — привязка месячных целей

**Files:**
- Modify: `components/yearly-goals.tsx`

**Step 1: Обновить YearlyGoalsProps**

Добавить пропсы:
```typescript
interface YearlyGoalsProps {
  // ...existing props
  monthlyGoals: Goal[]  // list of monthly goals for selection
  linkMonthlyGoal: (yearlyGoalId: string, monthlyGoalId: string) => void
  unlinkMonthlyGoal: (yearlyGoalId: string, monthlyGoalId: string) => void
  getMonthlyGoalCompletedCount: (goalId: string) => number
}
```

**Step 2: Обновить YearlyGoalCard — показать привязанные месячные цели**

В развёрнутом виде после этапов добавить:
- Список привязанных месячных целей (из `goal.linkedMonthlyGoals`):
  - Иконка 📅 + имя цели + прогресс-бар + "выполнено X" + кнопка ✕
- Кнопка "Привязать месячную цель":
  - Select с месячными целями (исключая уже привязанные)

**Step 3: Добавить поле target в форму редактирования**

Аналогично месячным целям.

**Step 4: Commit**

```bash
git add components/yearly-goals.tsx
git commit -m "feat: add monthly goal linking UI to yearly goals"
```

---

### Task 7: Пересборка и тестирование

**Step 1: Убить Electron процессы**

```bash
taskkill //F //IM "electron.exe" 2>/dev/null
```

**Step 2: Собрать проект**

```bash
cd C:\Users\kirill\.vscode\future-self-projection
npm run build
```

**Step 3: Скопировать static файлы**

```bash
cp -r .next/static .next/standalone/.next/static
```

**Step 4: Запустить Electron**

```bash
node scripts/launch-electron.cjs
```

**Step 5: Проверить функциональность**

- Открыть вкладку "Мои цели"
- На месячной цели нажать "Подзадачи" → должна быть кнопка "Привязать привычку"
- Привязать привычку и указать target
- Отметить привычку во вкладке "Привычки" → вернуться в цели → прогресс обновился
- На годовой цели привязать месячную цель → прогресс считается

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: complete habit-goal linking with cascading progress"
```
