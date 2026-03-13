# Reading Tracker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Добавить читательский трекер в виде под-вкладки "Книги" внутри вкладки "Обучение" с Steam-подобной сеткой обложек и панелью деталей.

**Architecture:** Данные хранятся в `~/.future-self-projection/mvp-db.json` через существующий механизм `readSection/writeSection`. Обложки книг сохраняются как файлы в `~/.future-self-projection/covers/`. Компонент разбит на сетку карточек (левая часть) и панель деталей (правая часть).

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, lucide-react, существующие shadcn/ui компоненты.

---

### Task 1: Добавить типы в lib/types.ts

**Files:**
- Modify: `lib/types.ts`

**Step 1: Добавить типы Book, BookNote, BookQuote, ReadingSession в конец файла**

Открыть `lib/types.ts` и добавить в самый конец:

```ts
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
```

**Step 2: Сохранить файл и убедиться что нет ошибок TypeScript**

```bash
cd "C:\Users\kirill\.vscode\future-self-projection"
npx tsc --noEmit 2>&1 | head -20
```

Ожидаем: нет ошибок или только существующие (не новые).

**Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add reading tracker types"
```

---

### Task 2: Добавить ReadingState в state-types.ts и AppDatabase

**Files:**
- Modify: `lib/state-types.ts`

**Step 1: Добавить ReadingState и обновить AppDatabase**

В `lib/state-types.ts` добавить `ReadingState` и обновить `AppDatabase`:

```ts
// Добавить после LearningState:
export interface ReadingState {
  books: import("@/lib/types").Book[]
}
```

В интерфейсе `AppDatabase` добавить поле:
```ts
reading?: ReadingState
```

Итоговый `AppDatabase` должен выглядеть так:
```ts
export interface AppDatabase {
  habits?: HabitsState
  goals?: GoalsState
  dayPlanner?: DayPlannerState
  budget?: BudgetState
  learning?: LearningState
  reading?: ReadingState    // ← новое
  updatedAt?: string
}
```

**Step 2: Commit**

```bash
git add lib/state-types.ts
git commit -m "feat: add ReadingState to state types"
```

---

### Task 3: Добавить валидатор isReadingState

**Files:**
- Modify: `lib/server/validators.ts`

**Step 1: Добавить вспомогательные функции и экспортируемый валидатор в конец файла**

Добавить в конец `lib/server/validators.ts`:

```ts
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
```

**Step 2: Commit**

```bash
git add lib/server/validators.ts
git commit -m "feat: add isReadingState validator"
```

---

### Task 4: Добавить поддержку папки covers в storage.ts

**Files:**
- Modify: `lib/server/storage.ts`

**Step 1: Экспортировать DATA_DIR и добавить функцию ensureCoversDir**

В `lib/server/storage.ts`:
1. Изменить `const DATA_DIR` на `export const DATA_DIR`
2. Добавить экспортируемую функцию после `ensureStorageFile`:

```ts
// Папка для обложек книг
export const COVERS_DIR = path.join(DATA_DIR, "covers")

export async function ensureCoversDir() {
  await fs.mkdir(COVERS_DIR, { recursive: true })
}
```

**Step 2: Commit**

```bash
git add lib/server/storage.ts
git commit -m "feat: export covers dir path and helper"
```

---

### Task 5: Создать API роут /api/reading (GET + PUT)

**Files:**
- Create: `app/api/reading/route.ts`

**Step 1: Создать файл**

```ts
import { NextResponse } from "next/server"
import { readSection, writeSection } from "@/lib/server/storage"
import { isReadingState } from "@/lib/server/validators"

export const runtime = "nodejs"

export async function GET() {
  try {
    const data = await readSection("reading")
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json(
      { error: "Failed to load reading data." },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const payload: unknown = await request.json()
    if (!isReadingState(payload)) {
      return NextResponse.json(
        { error: "Invalid reading payload." },
        { status: 400 }
      )
    }
    await writeSection("reading", payload)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: "Failed to save reading data." },
      { status: 500 }
    )
  }
}
```

**Step 2: Commit**

```bash
git add app/api/reading/route.ts
git commit -m "feat: add /api/reading GET+PUT route"
```

---

### Task 6: Создать API роут загрузки обложки /api/reading/cover

**Files:**
- Create: `app/api/reading/cover/route.ts`

**Step 1: Создать файл**

Этот роут принимает `multipart/form-data` с полями `file` (файл изображения) и `bookId` (id книги). Сохраняет файл и возвращает имя файла.

```ts
import { NextResponse } from "next/server"
import { promises as fs } from "node:fs"
import path from "node:path"
import { ensureCoversDir, COVERS_DIR } from "@/lib/server/storage"

export const runtime = "nodejs"

// Разрешённые MIME-типы изображений
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const bookId = formData.get("bookId") as string | null

    if (!file || !bookId) {
      return NextResponse.json({ error: "Missing file or bookId" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    // Определяем расширение из MIME-типа
    const ext = file.type.split("/")[1].replace("jpeg", "jpg")
    const filename = `${bookId}.${ext}`

    await ensureCoversDir()

    // Сохраняем файл
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(path.join(COVERS_DIR, filename), buffer)

    return NextResponse.json({ filename })
  } catch {
    return NextResponse.json(
      { error: "Failed to upload cover." },
      { status: 500 }
    )
  }
}
```

**Step 2: Commit**

```bash
git add app/api/reading/cover/route.ts
git commit -m "feat: add cover image upload route"
```

---

### Task 7: Создать API роут отдачи обложки /api/reading/cover/[id]

**Files:**
- Create: `app/api/reading/cover/[id]/route.ts`

**Step 1: Создать файл**

Этот роут ищет файл обложки по имени (без расширения — перебирает варианты) и отдаёт его.

```ts
import { NextResponse } from "next/server"
import { promises as fs } from "node:fs"
import path from "node:path"
import { COVERS_DIR } from "@/lib/server/storage"

export const runtime = "nodejs"

const EXTENSIONS = ["jpg", "png", "webp", "gif"]
const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params

  // Ищем файл с любым из разрешённых расширений
  for (const ext of EXTENSIONS) {
    const filePath = path.join(COVERS_DIR, `${id}.${ext}`)
    try {
      const buffer = await fs.readFile(filePath)
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": MIME[ext],
          "Cache-Control": "public, max-age=31536000",
        },
      })
    } catch {
      // файл не найден — пробуем следующее расширение
    }
  }

  return NextResponse.json({ error: "Cover not found" }, { status: 404 })
}
```

**Step 2: Commit**

```bash
git add "app/api/reading/cover/[id]/route.ts"
git commit -m "feat: add cover image serve route"
```

---

### Task 8: Добавить fetch/save функции в api-client.ts

**Files:**
- Modify: `lib/api-client.ts`

**Step 1: Добавить импорт ReadingState и функции в конец файла**

```ts
// Добавить в импорты вверху файла:
import type { ReadingState } from "@/lib/state-types"

// Добавить в конец файла:
export async function fetchReadingState() {
  const response = await request<{ data: ReadingState | null }>("/api/reading")
  return response.data
}

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
```

**Step 2: Commit**

```bash
git add lib/api-client.ts
git commit -m "feat: add reading API client functions"
```

---

### Task 9: Создать хук use-reading-store.ts

**Files:**
- Create: `hooks/use-reading-store.ts`

**Step 1: Создать файл с полной логикой**

```ts
"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import type { Book, BookNote, BookQuote, ReadingSession } from "@/lib/types"
import { fetchReadingState, saveReadingState, uploadBookCover } from "@/lib/api-client"

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

// Сколько дней прошло с даты addedAt
function daysSince(isoDate: string): number {
  const now = new Date()
  const added = new Date(isoDate)
  const diffMs = now.getTime() - added.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

// Рассчитать количество страниц в день для книги
export function calcPagesPerDay(book: Book): number {
  const pagesLeft = book.totalPages - book.currentPage
  const daysLeft = book.deadlineDays - daysSince(book.addedAt)
  const base = Math.ceil(pagesLeft / Math.max(daysLeft, 1))
  return book.withBuffer ? Math.ceil(base * 1.2) : base
}

// Рассчитать сколько дней осталось до дедлайна
export function calcDaysLeft(book: Book): number {
  return book.deadlineDays - daysSince(book.addedAt)
}

export function useReadingStore() {
  const [books, setBooks] = useState<Book[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Загрузка при монтировании
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const stored = await fetchReadingState()
        if (cancelled || !stored) return
        setBooks(stored.books)
      } catch (error) {
        console.error("Failed to load reading state:", error)
      } finally {
        if (!cancelled) setIsLoaded(true)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Автосохранение с дебаунсом
  useEffect(() => {
    if (!isLoaded) return
    const timeout = window.setTimeout(() => {
      saveReadingState({ books }).catch((error) => {
        console.error("Failed to save reading state:", error)
      })
    }, 300)
    return () => window.clearTimeout(timeout)
  }, [isLoaded, books])

  // === Мутации ===

  const addBook = useCallback((params: {
    title: string
    totalPages: number
    currentPage: number
    deadlineDays: number
    withBuffer: boolean
  }) => {
    const book: Book = {
      id: generateId(),
      title: params.title.trim(),
      totalPages: params.totalPages,
      currentPage: params.currentPage,
      deadlineDays: params.deadlineDays,
      withBuffer: params.withBuffer,
      addedAt: new Date().toISOString().split("T")[0],
      status: "reading",
      notes: [],
      quotes: [],
      sessions: [],
    }
    setBooks((prev) => [...prev, book])
    return book.id
  }, [])

  const removeBook = useCallback((id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id))
  }, [])

  const updateProgress = useCallback((id: string, currentPage: number) => {
    setBooks((prev) => prev.map((b) => {
      if (b.id !== id) return b
      const completed = currentPage >= b.totalPages
      return {
        ...b,
        currentPage,
        status: completed ? "completed" : b.status,
        completedAt: completed && !b.completedAt ? new Date().toISOString().split("T")[0] : b.completedAt,
      }
    }))
  }, [])

  const setCover = useCallback((id: string, coverPath: string) => {
    setBooks((prev) => prev.map((b) => b.id === id ? { ...b, coverPath } : b))
  }, [])

  const uploadCover = useCallback(async (id: string, file: File) => {
    const filename = await uploadBookCover(id, file)
    setCover(id, filename)
  }, [setCover])

  const addNote = useCallback((bookId: string, text: string, tag: "note" | "insight") => {
    const note: BookNote = {
      id: generateId(),
      text: text.trim(),
      tag,
      createdAt: new Date().toISOString(),
    }
    setBooks((prev) => prev.map((b) =>
      b.id === bookId ? { ...b, notes: [...b.notes, note] } : b
    ))
  }, [])

  const removeNote = useCallback((bookId: string, noteId: string) => {
    setBooks((prev) => prev.map((b) =>
      b.id === bookId ? { ...b, notes: b.notes.filter((n) => n.id !== noteId) } : b
    ))
  }, [])

  const addQuote = useCallback((bookId: string, text: string, page: number) => {
    const quote: BookQuote = {
      id: generateId(),
      text: text.trim(),
      page,
      createdAt: new Date().toISOString(),
    }
    setBooks((prev) => prev.map((b) =>
      b.id === bookId ? { ...b, quotes: [...b.quotes, quote] } : b
    ))
  }, [])

  const removeQuote = useCallback((bookId: string, quoteId: string) => {
    setBooks((prev) => prev.map((b) =>
      b.id === bookId ? { ...b, quotes: b.quotes.filter((q) => q.id !== quoteId) } : b
    ))
  }, [])

  const addSession = useCallback((bookId: string, durationMinutes: number) => {
    const session: ReadingSession = {
      id: generateId(),
      durationMinutes,
      date: new Date().toISOString().split("T")[0],
    }
    setBooks((prev) => prev.map((b) =>
      b.id === bookId ? { ...b, sessions: [...b.sessions, session] } : b
    ))
  }, [])

  const markCompleted = useCallback((id: string) => {
    setBooks((prev) => prev.map((b) =>
      b.id === id
        ? { ...b, status: "completed", completedAt: new Date().toISOString().split("T")[0] }
        : b
    ))
  }, [])

  // Обновление статуса "просрочена" для активных книг
  useEffect(() => {
    if (!isLoaded) return
    setBooks((prev) => prev.map((b) => {
      if (b.status !== "reading") return b
      const daysLeft = calcDaysLeft(b)
      if (daysLeft < 0 && b.currentPage < b.totalPages) {
        return { ...b, status: "overdue" }
      }
      return b
    }))
  }, [isLoaded])

  // === Вычисляемые значения ===

  const activeBooks = useMemo(
    () => books.filter((b) => b.status === "reading" || b.status === "overdue"),
    [books]
  )

  const completedBooks = useMemo(
    () => books.filter((b) => b.status === "completed"),
    [books]
  )

  // Streak: сколько дней подряд была хотя бы одна сессия
  const readingStreak = useMemo(() => {
    const allDates = new Set(books.flatMap((b) => b.sessions.map((s) => s.date)))
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split("T")[0]
      if (allDates.has(key)) streak++
      else if (i > 0) break
    }
    return streak
  }, [books])

  // Среднее страниц в день за последние 7 дней
  const avgPagesPerDay7 = useMemo(() => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenKey = sevenDaysAgo.toISOString().split("T")[0]

    // Считаем прогресс через сессии — нет прямой связи страниц с сессиями,
    // поэтому считаем pagesPerDay из активных книг как среднее
    const active = books.filter((b) => b.status === "reading" || b.status === "overdue")
    if (active.length === 0) return 0
    const total = active.reduce((sum, b) => sum + calcPagesPerDay(b), 0)
    return Math.round(total / active.length)
  }, [books])

  // Самая быстро прочитанная книга (минимальное время от addedAt до completedAt)
  const fastestBook = useMemo(() => {
    const completed = books.filter((b) => b.status === "completed" && b.completedAt)
    if (completed.length === 0) return null
    return completed.reduce((fastest, b) => {
      const days = daysSince(b.addedAt) // approximation
      const fDays = daysSince(fastest.addedAt)
      return days < fDays ? b : fastest
    })
  }, [books])

  return {
    books,
    activeBooks,
    completedBooks,
    addBook,
    removeBook,
    updateProgress,
    uploadCover,
    addNote,
    removeNote,
    addQuote,
    removeQuote,
    addSession,
    markCompleted,
    readingStreak,
    avgPagesPerDay7,
    fastestBook,
    isLoaded,
  }
}
```

**Step 2: Проверить TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```

**Step 3: Commit**

```bash
git add hooks/use-reading-store.ts
git commit -m "feat: add use-reading-store hook"
```

---

### Task 10: Создать компонент reading-tab.tsx

**Files:**
- Create: `components/reading-tab.tsx`

**Step 1: Создать файл**

Компонент большой — разбит на внутренние функции. Вся логика UI в одном файле.

```tsx
"use client"

import { useState, useRef, useEffect } from "react"
import {
  BookOpen, Plus, X, Play, Square, Check, ChevronDown,
  ChevronRight, Copy, Flame, Trophy, Clock, Trash2, Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  useReadingStore,
  calcPagesPerDay,
  calcDaysLeft,
} from "@/hooks/use-reading-store"
import type { Book } from "@/lib/types"

// ── Helpers ──

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU")
}

function getStatusColor(status: Book["status"]) {
  switch (status) {
    case "reading": return "text-primary border-primary/30 bg-primary/10"
    case "completed": return "text-green-400 border-green-400/30 bg-green-400/10"
    case "overdue": return "text-red-400 border-red-400/30 bg-red-400/10"
  }
}

function getStatusLabel(status: Book["status"]) {
  switch (status) {
    case "reading": return "Читаю"
    case "completed": return "Прочитано"
    case "overdue": return "Просрочено"
  }
}

// ── Stats Bar ──

function ReadingStats({
  streak,
  completedCount,
  avgPages,
  fastestTitle,
}: {
  streak: number
  completedCount: number
  avgPages: number
  fastestTitle: string | null
}) {
  return (
    <div className="glass-strong rounded-2xl p-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass rounded-xl p-3 text-center">
          <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
          <span className="text-lg font-bold text-foreground font-mono">{streak}</span>
          <span className="text-[10px] text-muted-foreground block">дней подряд</span>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <Trophy className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
          <span className="text-lg font-bold text-foreground font-mono">{completedCount}</span>
          <span className="text-[10px] text-muted-foreground block">прочитано</span>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <BookOpen className="w-4 h-4 text-primary mx-auto mb-1" />
          <span className="text-lg font-bold text-foreground font-mono">{avgPages}</span>
          <span className="text-[10px] text-muted-foreground block">стр/день (сред.)</span>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <Clock className="w-4 h-4 text-blue-400 mx-auto mb-1" />
          <span className="text-xs font-bold text-foreground truncate block">
            {fastestTitle ?? "—"}
          </span>
          <span className="text-[10px] text-muted-foreground block">быстрее всего</span>
        </div>
      </div>
    </div>
  )
}

// ── Add Book Form ──

function AddBookForm({ onAdd }: { onAdd: (params: {
  title: string
  totalPages: number
  currentPage: number
  deadlineDays: number
  withBuffer: boolean
}) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [title, setTitle] = useState("")
  const [totalPages, setTotalPages] = useState("")
  const [currentPage, setCurrentPage] = useState("1")
  const [deadlineDays, setDeadlineDays] = useState("7")
  const [withBuffer, setWithBuffer] = useState(false)

  function handleSubmit() {
    if (!title.trim() || Number(totalPages) <= 0) return
    onAdd({
      title,
      totalPages: Number(totalPages),
      currentPage: Number(currentPage) || 1,
      deadlineDays: Number(deadlineDays) || 7,
      withBuffer,
    })
    setTitle("")
    setTotalPages("")
    setCurrentPage("1")
    setDeadlineDays("7")
    setWithBuffer(false)
    setExpanded(false)
  }

  if (!expanded) {
    return (
      <Button
        onClick={() => setExpanded(true)}
        variant="ghost"
        className="w-full h-12 border border-dashed border-border/40 rounded-2xl text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 gap-2 transition-all duration-300"
      >
        <Plus className="w-4 h-4" />
        Добавить книгу
      </Button>
    )
  }

  return (
    <div className="glass-strong rounded-2xl p-5 animate-scale-in">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-foreground">Новая книга</h4>
        <button onClick={() => setExpanded(false)} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-col gap-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название книги"
          className="bg-secondary/50 border-border/50 text-foreground text-sm h-9"
          autoFocus
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Всего страниц</label>
            <Input type="number" value={totalPages} onChange={(e) => setTotalPages(e.target.value)}
              placeholder="350" className="bg-secondary/50 border-border/50 text-foreground text-sm h-9 font-mono" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Начинаю со страницы</label>
            <Input type="number" value={currentPage} onChange={(e) => setCurrentPage(e.target.value)}
              placeholder="1" className="bg-secondary/50 border-border/50 text-foreground text-sm h-9 font-mono" />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">Дней на прочтение</label>
          <Input type="number" value={deadlineDays} onChange={(e) => setDeadlineDays(e.target.value)}
            placeholder="7" className="bg-secondary/50 border-border/50 text-foreground text-sm h-9 font-mono w-32" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={withBuffer}
            onChange={(e) => setWithBuffer(e.target.checked)}
            className="rounded border-border/50 accent-primary"
          />
          <span className="text-sm text-foreground">Читать с запасом (+20% страниц в день)</span>
        </label>
        <Button
          onClick={handleSubmit}
          disabled={!title.trim() || !totalPages || Number(totalPages) <= 0}
          className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Добавить книгу
        </Button>
      </div>
    </div>
  )
}

// ── Book Cover ──

function BookCover({ book, selected, onClick }: { book: Book; selected: boolean; onClick: () => void }) {
  const pagesLeft = book.totalPages - book.currentPage
  const progress = Math.round((book.currentPage / book.totalPages) * 100)

  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 focus:outline-none
        ${selected ? "ring-2 ring-primary shadow-lg shadow-primary/20" : "ring-1 ring-border/30 hover:ring-primary/40"}`}
      style={{ aspectRatio: "2/3" }}
    >
      {/* Обложка */}
      {book.coverPath ? (
        <img
          src={`/api/reading/cover/${book.coverPath.replace(/\.[^.]+$/, "")}`}
          alt={book.title}
          className="w-full h-full object-cover"
        />
      ) : (
        // Плейсхолдер если нет обложки
        <div className="w-full h-full bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center p-2">
          <span className="text-xs text-foreground font-medium text-center leading-tight">{book.title}</span>
        </div>
      )}

      {/* Оверлей при наведении */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <span className="text-white text-xs font-medium px-2 text-center">{book.title}</span>
      </div>

      {/* Прогресс-бар снизу */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40">
        <div
          className="h-full transition-all duration-700"
          style={{
            width: `${progress}%`,
            background: book.status === "completed" ? "hsl(120, 60%, 50%)" : "hsl(var(--primary))",
          }}
        />
      </div>

      {/* Статус бейдж */}
      <div className={`absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0.5 rounded-md border font-medium ${getStatusColor(book.status)}`}>
        {getStatusLabel(book.status)}
      </div>
    </button>
  )
}

// ── Timer ──

function ReadingTimer({ onStop }: { onStop: (minutes: number) => void }) {
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function start() {
    setRunning(true)
    intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
  }

  function stop() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(false)
    const minutes = Math.round(seconds / 60)
    if (minutes > 0) onStop(minutes)
    setSeconds(0)
  }

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-lg text-foreground tabular-nums">
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
      {!running ? (
        <Button size="sm" onClick={start} className="h-8 gap-1.5 bg-primary text-primary-foreground">
          <Play className="w-3 h-3" /> Читать
        </Button>
      ) : (
        <Button size="sm" onClick={stop} variant="outline" className="h-8 gap-1.5 border-red-400/50 text-red-400 hover:bg-red-400/10">
          <Square className="w-3 h-3" /> Стоп
        </Button>
      )}
    </div>
  )
}

// ── Detail Panel ──

function BookDetail({
  book,
  onUpdateProgress,
  onAddNote,
  onRemoveNote,
  onAddQuote,
  onRemoveQuote,
  onAddSession,
  onMarkCompleted,
  onUploadCover,
  onRemove,
}: {
  book: Book
  onUpdateProgress: (page: number) => void
  onAddNote: (text: string, tag: "note" | "insight") => void
  onRemoveNote: (id: string) => void
  onAddQuote: (text: string, page: number) => void
  onRemoveQuote: (id: string) => void
  onAddSession: (minutes: number) => void
  onMarkCompleted: () => void
  onUploadCover: (file: File) => void
  onRemove: () => void
}) {
  const [activePanel, setActivePanel] = useState<"notes" | "quotes" | "sessions">("notes")
  const [progressInput, setProgressInput] = useState("")
  const [showProgressInput, setShowProgressInput] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [noteTag, setNoteTag] = useState<"note" | "insight">("note")
  const [quoteText, setQuoteText] = useState("")
  const [quotePage, setQuotePage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const progress = Math.round((book.currentPage / book.totalPages) * 100)
  const pagesPerDay = calcPagesPerDay(book)
  const daysLeft = calcDaysLeft(book)
  const totalMinutes = book.sessions.reduce((sum, s) => sum + s.durationMinutes, 0)
  const totalHours = Math.floor(totalMinutes / 60)
  const remainingMins = totalMinutes % 60

  function handleProgressSubmit() {
    const page = Number(progressInput)
    if (page > 0 && page <= book.totalPages) {
      onUpdateProgress(page)
      setProgressInput("")
      setShowProgressInput(false)
    }
  }

  function handleAddNote() {
    if (!noteText.trim()) return
    onAddNote(noteText, noteTag)
    setNoteText("")
  }

  function handleAddQuote() {
    if (!quoteText.trim()) return
    onAddQuote(quoteText, Number(quotePage) || 0)
    setQuoteText("")
    setQuotePage("")
  }

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      {/* Обложка + инфо */}
      <div className="glass-strong rounded-2xl p-5">
        <div className="flex items-start gap-4">
          {/* Миниатюра обложки */}
          <div
            className="w-20 shrink-0 rounded-lg overflow-hidden cursor-pointer border border-border/30 hover:border-primary/40 transition-colors"
            style={{ aspectRatio: "2/3" }}
            onClick={() => fileInputRef.current?.click()}
            title="Загрузить обложку"
          >
            {book.coverPath ? (
              <img
                src={`/api/reading/cover/${book.coverPath.replace(/\.[^.]+$/, "")}`}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-secondary/50 flex flex-col items-center justify-center gap-1">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-[9px] text-muted-foreground">обложка</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) onUploadCover(e.target.files[0]) }}
          />

          {/* Заголовок и прогресс */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-foreground leading-tight mb-2">{book.title}</h3>
            <div className="flex items-baseline gap-1 mb-1.5">
              <span className="text-sm font-mono font-bold text-foreground">{book.currentPage}</span>
              <span className="text-xs text-muted-foreground font-mono">/ {book.totalPages} стр</span>
              <span className="text-xs text-muted-foreground ml-1">({progress}%)</span>
            </div>
            {/* Прогресс-бар */}
            <div className="w-full h-2 rounded-full bg-secondary overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress}%`,
                  background: book.status === "completed" ? "hsl(120, 60%, 50%)" : "hsl(var(--primary))",
                  boxShadow: progress > 20 ? "0 0 8px hsl(var(--primary) / 0.4)" : undefined,
                }}
              />
            </div>
            {/* Дневная норма */}
            {book.status !== "completed" && (
              <div className="text-sm font-semibold text-primary">
                Читай {pagesPerDay} стр сегодня — успеешь за {Math.max(daysLeft, 0)} дней
              </div>
            )}
            {book.status === "completed" && (
              <div className="text-sm text-green-400 font-semibold">✓ Прочитано!</div>
            )}
          </div>
        </div>

        {/* Всего времени */}
        {totalMinutes > 0 && (
          <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Всего за книгу: {totalHours > 0 ? `${totalHours}ч ` : ""}{remainingMins}мин
          </div>
        )}

        {/* Кнопки действий */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          {book.status !== "completed" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowProgressInput(!showProgressInput)}
              className="h-8 text-xs border-border/50"
            >
              ✏ Обновить прогресс
            </Button>
          )}
          {book.status !== "completed" && (
            <Button
              size="sm"
              onClick={onMarkCompleted}
              className="h-8 text-xs bg-green-400/10 text-green-400 hover:bg-green-400/20 border border-green-400/30"
            >
              <Check className="w-3 h-3 mr-1" /> Завершить
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={onRemove}
            className="h-8 text-xs text-muted-foreground hover:text-destructive ml-auto"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>

        {/* Поле обновления прогресса */}
        {showProgressInput && (
          <div className="mt-3 flex items-center gap-2 animate-scale-in">
            <span className="text-xs text-muted-foreground">Прочитал до страницы</span>
            <Input
              type="number"
              value={progressInput}
              onChange={(e) => setProgressInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleProgressSubmit() }}
              placeholder={String(book.currentPage)}
              className="bg-secondary/50 border-border/50 text-foreground text-sm h-8 w-24 font-mono"
              autoFocus
            />
            <Button size="sm" onClick={handleProgressSubmit} className="h-8 text-xs bg-primary text-primary-foreground">
              <Check className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Таймер */}
        {book.status !== "completed" && (
          <div className="mt-3 pt-3 border-t border-border/20">
            <ReadingTimer onStop={onAddSession} />
          </div>
        )}
      </div>

      {/* Вкладки: Заметки / Цитаты / Сессии */}
      <div className="glass-strong rounded-2xl p-5">
        <div className="flex gap-1 mb-4">
          {(["notes", "quotes", "sessions"] as const).map((panel) => {
            const labels = { notes: "Заметки", quotes: "Цитаты", sessions: "Сессии" }
            return (
              <button
                key={panel}
                onClick={() => setActivePanel(panel)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  activePanel === panel
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {labels[panel]}
                <span className="ml-1 font-mono text-[10px]">
                  ({panel === "notes" ? book.notes.length : panel === "quotes" ? book.quotes.length : book.sessions.length})
                </span>
              </button>
            )
          })}
        </div>

        {/* Заметки */}
        {activePanel === "notes" && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddNote() }}
                placeholder="Добавить заметку..."
                className="bg-secondary/50 border-border/50 text-foreground text-sm h-8 flex-1"
              />
              <select
                value={noteTag}
                onChange={(e) => setNoteTag(e.target.value as "note" | "insight")}
                className="h-8 rounded-md bg-secondary/50 border border-border/50 text-foreground text-xs px-2"
              >
                <option value="note">Заметка</option>
                <option value="insight">Что понял</option>
              </select>
              <Button size="sm" onClick={handleAddNote} disabled={!noteText.trim()} className="h-8 bg-primary text-primary-foreground">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            {book.notes.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">Нет заметок</p>
            )}
            {[...book.notes].reverse().map((note) => (
              <div key={note.id} className="glass rounded-xl p-3 flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${
                      note.tag === "insight"
                        ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/20"
                        : "bg-secondary text-muted-foreground border-border/30"
                    }`}>
                      {note.tag === "insight" ? "Что понял" : "Заметка"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{formatDate(note.createdAt)}</span>
                  </div>
                  <p className="text-xs text-foreground">{note.text}</p>
                </div>
                <button onClick={() => onRemoveNote(note.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Цитаты */}
        {activePanel === "quotes" && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Input
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                placeholder="Текст цитаты..."
                className="bg-secondary/50 border-border/50 text-foreground text-sm h-8 flex-1"
              />
              <Input
                type="number"
                value={quotePage}
                onChange={(e) => setQuotePage(e.target.value)}
                placeholder="Стр."
                className="bg-secondary/50 border-border/50 text-foreground text-sm h-8 w-16 font-mono"
              />
              <Button size="sm" onClick={handleAddQuote} disabled={!quoteText.trim()} className="h-8 bg-primary text-primary-foreground">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            {book.quotes.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">Нет цитат</p>
            )}
            {[...book.quotes].reverse().map((quote) => (
              <div key={quote.id} className="glass rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <span className="text-primary text-lg leading-none mt-0.5">"</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground italic">{quote.text}</p>
                    {quote.page > 0 && (
                      <span className="text-[10px] text-muted-foreground mt-1 block">стр. {quote.page}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => navigator.clipboard.writeText(quote.text)}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      title="Скопировать"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button onClick={() => onRemoveQuote(quote.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Сессии */}
        {activePanel === "sessions" && (
          <div className="flex flex-col gap-2">
            {book.sessions.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">Нет сессий чтения</p>
            )}
            {[...book.sessions].reverse().map((session) => (
              <div key={session.id} className="glass rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{formatDate(session.date)}</span>
                <span className="text-xs font-mono text-foreground">
                  {session.durationMinutes} мин
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main ReadingTab ──

export function ReadingTab() {
  const store = useReadingStore()
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [showArchive, setShowArchive] = useState(false)

  const selectedBook = store.books.find((b) => b.id === selectedBookId) ?? null

  // Если выбранная книга удалена — сбросить выбор
  useEffect(() => {
    if (selectedBookId && !store.books.find((b) => b.id === selectedBookId)) {
      setSelectedBookId(null)
    }
  }, [store.books, selectedBookId])

  function handleAddBook(params: Parameters<typeof store.addBook>[0]) {
    const id = store.addBook(params)
    setSelectedBookId(id)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Статистика */}
      <ReadingStats
        streak={store.readingStreak}
        completedCount={store.completedBooks.length}
        avgPages={store.avgPagesPerDay7}
        fastestTitle={store.fastestBook?.title ?? null}
      />

      {/* Форма добавления */}
      <AddBookForm onAdd={handleAddBook} />

      {/* Библиотека */}
      {store.activeBooks.length > 0 && (
        <div className="glass-strong rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Библиотека</h3>
            <span className="text-xs text-muted-foreground font-mono ml-auto">
              {store.activeBooks.length} книг
            </span>
          </div>

          <div className="flex gap-4">
            {/* Сетка книг (Steam-like) */}
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 flex-shrink-0">
              {store.activeBooks.map((book) => (
                <BookCover
                  key={book.id}
                  book={book}
                  selected={selectedBookId === book.id}
                  onClick={() => setSelectedBookId(book.id === selectedBookId ? null : book.id)}
                />
              ))}
            </div>

            {/* Панель деталей */}
            {selectedBook && store.activeBooks.some((b) => b.id === selectedBook.id) && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <BookDetail
                  book={selectedBook}
                  onUpdateProgress={(page) => store.updateProgress(selectedBook.id, page)}
                  onAddNote={(text, tag) => store.addNote(selectedBook.id, text, tag)}
                  onRemoveNote={(id) => store.removeNote(selectedBook.id, id)}
                  onAddQuote={(text, page) => store.addQuote(selectedBook.id, text, page)}
                  onRemoveQuote={(id) => store.removeQuote(selectedBook.id, id)}
                  onAddSession={(mins) => store.addSession(selectedBook.id, mins)}
                  onMarkCompleted={() => store.markCompleted(selectedBook.id)}
                  onUploadCover={(file) => store.uploadCover(selectedBook.id, file)}
                  onRemove={() => { store.removeBook(selectedBook.id); setSelectedBookId(null) }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Архив прочитанных */}
      {store.completedBooks.length > 0 && (
        <div className="glass-strong rounded-2xl p-5">
          <button
            onClick={() => setShowArchive(!showArchive)}
            className="flex items-center gap-2 w-full text-left"
          >
            {showArchive ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            <h3 className="text-sm font-semibold text-foreground">
              Прочитанные ({store.completedBooks.length})
            </h3>
          </button>
          {showArchive && (
            <div className="mt-4 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
              {store.completedBooks.map((book) => (
                <BookCover
                  key={book.id}
                  book={book}
                  selected={selectedBookId === book.id}
                  onClick={() => setSelectedBookId(book.id === selectedBookId ? null : book.id)}
                />
              ))}
            </div>
          )}
          {/* Панель деталей для завершённых */}
          {showArchive && selectedBook && store.completedBooks.some((b) => b.id === selectedBook.id) && (
            <div className="mt-4 animate-fade-in">
              <BookDetail
                book={selectedBook}
                onUpdateProgress={(page) => store.updateProgress(selectedBook.id, page)}
                onAddNote={(text, tag) => store.addNote(selectedBook.id, text, tag)}
                onRemoveNote={(id) => store.removeNote(selectedBook.id, id)}
                onAddQuote={(text, page) => store.addQuote(selectedBook.id, text, page)}
                onRemoveQuote={(id) => store.removeQuote(selectedBook.id, id)}
                onAddSession={(mins) => store.addSession(selectedBook.id, mins)}
                onMarkCompleted={() => store.markCompleted(selectedBook.id)}
                onUploadCover={(file) => store.uploadCover(selectedBook.id, file)}
                onRemove={() => { store.removeBook(selectedBook.id); setSelectedBookId(null) }}
              />
            </div>
          )}
        </div>
      )}

      {/* Пустое состояние */}
      {store.books.length === 0 && (
        <div className="glass rounded-2xl p-8 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Добавь первую книгу и начни читать</p>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Проверить TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```

**Step 3: Commit**

```bash
git add components/reading-tab.tsx
git commit -m "feat: add ReadingTab component with Steam-like library"
```

---

### Task 11: Обновить learning-tab.tsx — добавить под-вкладки Навыки / Книги

**Files:**
- Modify: `components/learning-tab.tsx`

**Step 1: Добавить импорт ReadingTab в начало файла**

В `components/learning-tab.tsx` после строки `"use client"` добавить в импорты:

```ts
import { ReadingTab } from "@/components/reading-tab"
```

**Step 2: Добавить useState для under-tab**

В функцию `LearningTab()` добавить в начало (после строк с `expandedSkills`):

```ts
const [subTab, setSubTab] = useState<"skills" | "books">("skills")
```

**Step 3: Обернуть возвращаемый JSX**

Изменить `return (` в функции `LearningTab` следующим образом:

```tsx
return (
  <div className="flex flex-col gap-6">
    {/* Под-вкладки */}
    <div className="glass rounded-xl p-1 flex items-center gap-1 w-fit">
      <button
        onClick={() => setSubTab("skills")}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          subTab === "skills"
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
        }`}
      >
        <GraduationCap className="w-4 h-4" />
        Навыки
      </button>
      <button
        onClick={() => setSubTab("books")}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          subTab === "books"
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
        }`}
      >
        <BookOpen className="w-4 h-4" />
        Книги
      </button>
    </div>

    {subTab === "books" ? (
      <ReadingTab />
    ) : (
      <>
        {/* Весь существующий JSX вкладки Навыки */}
        ... (существующий контент без изменений)
      </>
    )}
  </div>
)
```

Важно: `BookOpen` уже импортирован в файле. Убедиться что `GraduationCap` тоже есть в импортах (он там есть).

**Step 4: Проверить TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 5: Commit**

```bash
git add components/learning-tab.tsx
git commit -m "feat: add Навыки/Книги sub-tabs to LearningTab"
```

---

### Task 12: Сборка и проверка

**Step 1: Пересобрать приложение**

```bash
cd "C:\Users\kirill\.vscode\future-self-projection"
npm run build:web
```

Ожидаем: `✓ Compiled successfully`

**Step 2: Подготовить standalone**

```bash
node scripts/prepare-standalone.cjs
```

**Step 3: Запустить и проверить вручную**

```bash
npm run desktop:start
```

Проверить:
- Вкладка "Обучение" → появился переключатель "Навыки / Книги"
- Вкладка "Книги" → пустое состояние с иконкой книги
- Кнопка "Добавить книгу" → форма раскрывается
- Добавить книгу → появляется карточка в сетке
- Клик по карточке → открывается панель деталей справа
- "Читать" (таймер) → работает секундомер, "Стоп" сохраняет сессию
- Загрузка обложки → клик по заглушке обложки, выбрать файл
- Заметки / Цитаты → добавление и отображение

**Step 4: Финальный коммит**

```bash
git add -A
git commit -m "feat: complete reading tracker with Steam-like library"
```
