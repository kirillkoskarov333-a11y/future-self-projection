/**
 * API client — now uses IndexedDB instead of HTTP fetch
 * Same interface as before, so hooks don't need any changes
 */

import type {
  BudgetState,
  DayPlannerState,
  GoalsState,
  HabitsState,
  LearningState,
  ReadingState,
} from "@/lib/state-types"
import { readSection, writeSection } from "@/lib/storage-client"

// === Habits ===
export async function fetchHabitsState(): Promise<HabitsState | null> {
  const data = await readSection("habits")
  return data ?? null
}

export async function saveHabitsState(payload: HabitsState): Promise<void> {
  await writeSection("habits", payload)
}

// === Goals ===
export async function fetchGoalsState(): Promise<GoalsState | null> {
  const data = await readSection("goals")
  return data ?? null
}

export async function saveGoalsState(payload: GoalsState): Promise<void> {
  await writeSection("goals", payload)
}

// === Day Planner ===
export async function fetchDayPlannerState(): Promise<DayPlannerState | null> {
  const data = await readSection("dayPlanner")
  return data ?? null
}

export async function saveDayPlannerState(payload: DayPlannerState): Promise<void> {
  await writeSection("dayPlanner", payload)
}

// === Budget ===
export async function fetchBudgetState(): Promise<BudgetState | null> {
  const data = await readSection("budget")
  return data ?? null
}

export async function saveBudgetState(payload: BudgetState): Promise<void> {
  await writeSection("budget", payload)
}

// === Learning ===
export async function fetchLearningState(): Promise<LearningState | null> {
  const data = await readSection("learning")
  return data ?? null
}

export async function saveLearningState(payload: LearningState): Promise<void> {
  await writeSection("learning", payload)
}

// === Reading ===
export async function fetchReadingState(): Promise<ReadingState | null> {
  const data = await readSection("reading")
  return data ?? null
}

export async function saveReadingState(payload: ReadingState): Promise<void> {
  await writeSection("reading", payload)
}

// Book cover upload — now converts to Base64 data URL directly
// No server needed, the data URL is stored in the book's coverPath field
export async function uploadBookCover(bookId: string, file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string) // returns data:image/...;base64,...
    reader.onerror = () => reject(new Error("Failed to read cover file"))
    reader.readAsDataURL(file)
  })
}
