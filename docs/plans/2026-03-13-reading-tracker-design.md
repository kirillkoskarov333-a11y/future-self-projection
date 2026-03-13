# Reading Tracker — Design Document
Date: 2026-03-13

## Overview

Add a "Книги" sub-tab inside the "Обучение" tab. The UI is Steam-like: a grid of book covers on the left, a detail panel on the right when a book is selected.

## Placement

Inside `LearningTab`, add a sub-tab toggle `Навыки | Книги`. The existing skills content moves under "Навыки". "Книги" renders the new `ReadingTab` component.

## Data Types (lib/types.ts)

```ts
interface Book {
  id: string
  title: string
  totalPages: number
  currentPage: number       // starting page (updated on progress)
  deadlineDays: number      // N days from addedAt
  withBuffer: boolean       // true = pagesPerDay × 1.2
  coverPath?: string        // filename stored in covers dir
  addedAt: string           // ISO date
  status: "reading" | "completed" | "overdue"
  completedAt?: string
  notes: BookNote[]
  quotes: BookQuote[]
  sessions: ReadingSession[]
}

interface BookNote {
  id: string
  text: string
  tag: "note" | "insight"  // "Заметка" | "Что понял"
  createdAt: string
}

interface BookQuote {
  id: string
  text: string
  page: number
  createdAt: string
}

interface ReadingSession {
  id: string
  durationMinutes: number
  date: string
}
```

Computed (not stored):
- `pagesLeft = totalPages - currentPage`
- `daysLeft = deadlineDays - daysSince(addedAt)`
- `pagesPerDay = ceil(pagesLeft / max(daysLeft, 1)) * (withBuffer ? 1.2 : 1)`

## Storage

- State: API route `/api/reading` → file `~/.future-self-projection/reading.json`
- Covers: `POST /api/reading/cover` → saves to `~/.future-self-projection/covers/<id>.<ext>`
- Serve cover: `GET /api/reading/cover/[id]` → streams the file

## UI Structure

### Grid view (left side)
- Cards in a responsive grid (aspect ratio 2:3, like book covers)
- Each card: cover image (or placeholder), title, thin progress bar at bottom, status badge
- Active card is highlighted with green border

### Detail panel (right side, opens on card click)
- Cover image + title
- Progress bar with `X / Y стр (Z%)`
- Green callout: "Читай N стр сегодня — успеешь за M дней"
- Buttons: `▶ Читать` (timer), `✏ Прогресс`, `✓ Завершить`
- Timer: shows elapsed time, Stop saves a ReadingSession
- Tabs inside panel: Заметки | Цитаты | Сессии
  - Notes: add with tag (Заметка / Что понял), collapsible list
  - Quotes: text + page number, copy button, card style with quotes
  - Sessions: list of past reading sessions

### Stats bar (top)
- 🔥 Streak (consecutive days read)
- Books completed total
- Avg pages/day (last 7 days)
- Fastest book

### Archived section (bottom)
- Collapsible "Прочитанные (N)" showing completed books in smaller grid

## Files to Create / Modify

| File | Action |
|------|--------|
| `lib/types.ts` | Add Book, BookNote, BookQuote, ReadingSession types |
| `lib/state-types.ts` | Add ReadingState |
| `lib/server/validators.ts` | Add isReadingState |
| `lib/server/storage.ts` | Ensure covers dir creation |
| `app/api/reading/route.ts` | GET + PUT for reading state |
| `app/api/reading/cover/route.ts` | POST — upload cover image |
| `app/api/reading/cover/[id]/route.ts` | GET — serve cover image |
| `lib/api-client.ts` | fetchReadingState, saveReadingState |
| `hooks/use-reading-store.ts` | All reading logic + computed values |
| `components/reading-tab.tsx` | Full reading tab component |
| `components/learning-tab.tsx` | Add Навыки/Книги sub-tabs |
