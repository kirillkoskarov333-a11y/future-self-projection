"use client"

import { useState, useRef, useEffect } from "react"
import {
  BookOpen, Plus, X, Play, Square, Check, ChevronDown,
  ChevronRight, Copy, Flame, Trophy, Clock, Trash2,
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

// Форматирует дату как "13 мар"
function formatShortDate(date: Date): string {
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
}

// Строит план чтения: для каждого дня — до какой страницы нужно дочитать
function buildReadingPlan(book: Book): { dayOffset: number; targetPage: number; date: Date }[] {
  const pagesPerDay = calcPagesPerDay(book)
  const daysLeft = Math.max(calcDaysLeft(book), 1)
  const today = new Date()
  const plan: { dayOffset: number; targetPage: number; date: Date }[] = []

  for (let i = 0; i < daysLeft; i++) {
    const targetPage = Math.min(book.currentPage + pagesPerDay * (i + 1), book.totalPages)
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    plan.push({ dayOffset: i, targetPage, date })
    if (targetPage >= book.totalPages) break
  }

  return plan
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
  const [imgError, setImgError] = useState(false)
  const progress = Math.round((book.currentPage / book.totalPages) * 100)
  const coverUrl = `https://covers.openlibrary.org/b/title/${encodeURIComponent(book.title)}-M.jpg`

  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 focus:outline-none
        ${selected ? "ring-2 ring-primary shadow-lg shadow-primary/20" : "ring-1 ring-border/30 hover:ring-primary/40"}`}
      style={{ aspectRatio: "2/3" }}
    >
      {/* Обложка — Open Library, fallback если не найдена или 1px-заглушка */}
      {!imgError ? (
        <img
          src={coverUrl}
          alt={book.title}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          onLoad={(e) => {
            // Open Library возвращает 1×1 пиксель если обложки нет
            const img = e.currentTarget
            if (img.naturalWidth <= 1) setImgError(true)
          }}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-secondary to-secondary/50 flex flex-col items-center justify-center p-2 gap-1">
          <BookOpen className="w-6 h-6 text-muted-foreground" />
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
  onRemove: () => void
}) {
  const [activePanel, setActivePanel] = useState<"notes" | "quotes" | "sessions">("notes")
  const [progressInput, setProgressInput] = useState("")
  const [showProgressInput, setShowProgressInput] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [noteTag, setNoteTag] = useState<"note" | "insight">("note")
  const [quoteText, setQuoteText] = useState("")
  const [quotePage, setQuotePage] = useState("")
  const [showFullPlan, setShowFullPlan] = useState(false)
  const [coverError, setCoverError] = useState(false)

  const progress = Math.round((book.currentPage / book.totalPages) * 100)
  const daysLeft = calcDaysLeft(book)
  const totalMinutes = book.sessions.reduce((sum, s) => sum + s.durationMinutes, 0)
  const totalHours = Math.floor(totalMinutes / 60)
  const remainingMins = totalMinutes % 60
  const readingPlan = book.status !== "completed" ? buildReadingPlan(book) : []
  const coverUrl = `https://covers.openlibrary.org/b/title/${encodeURIComponent(book.title)}-M.jpg`

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
          {/* Миниатюра обложки — Open Library */}
          <div
            className="w-20 shrink-0 rounded-lg overflow-hidden border border-border/30"
            style={{ aspectRatio: "2/3" }}
          >
            {!coverError ? (
              <img
                src={coverUrl}
                alt={book.title}
                className="w-full h-full object-cover"
                onError={() => setCoverError(true)}
                onLoad={(e) => {
                  if (e.currentTarget.naturalWidth <= 1) setCoverError(true)
                }}
              />
            ) : (
              <div className="w-full h-full bg-secondary/50 flex flex-col items-center justify-center gap-1 p-1">
                <BookOpen className="w-5 h-5 text-muted-foreground" />
                <span className="text-[8px] text-muted-foreground text-center leading-tight">{book.title}</span>
              </div>
            )}
          </div>

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
            {/* План чтения по дням */}
            {book.status !== "completed" && readingPlan.length > 0 && (
              <div className="flex flex-col gap-0.5">
                {/* Сегодня — крупнее, зелёным */}
                <div className="text-sm font-bold text-primary">
                  Сегодня: до стр. {readingPlan[0].targetPage}
                </div>
                {/* Завтра */}
                {readingPlan[1] && (
                  <div className="text-xs text-muted-foreground/80">
                    Завтра: до стр. {readingPlan[1].targetPage}
                  </div>
                )}
                {/* Послезавтра */}
                {readingPlan[2] && (
                  <div className="text-xs text-muted-foreground/50">
                    Послезавтра: до стр. {readingPlan[2].targetPage}
                  </div>
                )}
                {/* Кнопка "Показать весь план" */}
                <button
                  onClick={() => setShowFullPlan(!showFullPlan)}
                  className="text-[10px] text-muted-foreground hover:text-foreground mt-1 text-left underline underline-offset-2 transition-colors"
                >
                  {showFullPlan ? "Скрыть план" : "Показать весь план"}
                </button>
                {showFullPlan && (
                  <div className="mt-2 flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
                    {readingPlan.map((entry) => (
                      <div key={entry.dayOffset} className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">
                          День {entry.dayOffset + 1} ({formatShortDate(entry.date)})
                        </span>
                        <span className="font-mono text-foreground">→ стр. {entry.targetPage}</span>
                      </div>
                    ))}
                  </div>
                )}
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
