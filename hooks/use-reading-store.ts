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
    // Считаем pagesPerDay из активных книг как среднее
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
