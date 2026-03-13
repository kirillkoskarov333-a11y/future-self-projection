import type {
  BudgetState,
  DayPlannerState,
  GoalsState,
  HabitsState,
  LearningState,
  ReadingState,
} from "@/lib/state-types"

async function parseJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T
  return body
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    ...init,
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  return parseJson<T>(response)
}

async function save(url: string, payload: unknown) {
  await request<{ ok: boolean }>(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export async function fetchHabitsState() {
  const response = await request<{ data: HabitsState | null }>("/api/habits")
  return response.data
}

export async function saveHabitsState(payload: HabitsState) {
  await save("/api/habits", payload)
}

export async function fetchGoalsState() {
  const response = await request<{ data: GoalsState | null }>("/api/goals")
  return response.data
}

export async function saveGoalsState(payload: GoalsState) {
  await save("/api/goals", payload)
}

export async function fetchDayPlannerState() {
  const response = await request<{ data: DayPlannerState | null }>(
    "/api/day-planner"
  )
  return response.data
}

export async function saveDayPlannerState(payload: DayPlannerState) {
  await save("/api/day-planner", payload)
}

export async function fetchBudgetState() {
  const response = await request<{ data: BudgetState | null }>("/api/budget")
  return response.data
}

export async function saveBudgetState(payload: BudgetState) {
  await save("/api/budget", payload)
}

export async function fetchLearningState() {
  const response = await request<{ data: LearningState | null }>("/api/learning")
  return response.data
}

export async function saveLearningState(payload: LearningState) {
  await save("/api/learning", payload)
}

// Загрузить данные о книгах
export async function fetchReadingState() {
  const response = await request<{ data: ReadingState | null }>("/api/reading")
  return response.data
}

// Сохранить данные о книгах
export async function saveReadingState(payload: ReadingState) {
  await save("/api/reading", payload)
}

// Загрузить обложку книги, вернуть имя файла
export async function uploadBookCover(bookId: string, file: File): Promise<string> {
  const formData = new FormData()
  formData.append("bookId", bookId)
  formData.append("file", file)

  const response = await fetch("/api/reading/cover", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) throw new Error("Failed to upload cover")
  const data = await response.json() as { filename: string }
  return data.filename
}
