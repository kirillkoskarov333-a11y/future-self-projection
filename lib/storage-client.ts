/**
 * Storage layer: IndexedDB (local) + Supabase (cloud sync)
 * - Всегда сначала пишем в IndexedDB (быстро, офлайн)
 * - Если пользователь авторизован — синхронизируем с Supabase
 */

import type { AppDatabase } from "@/lib/state-types"
import { supabase } from "@/lib/supabase"

const DB_NAME = "future-self-projection"
const DB_VERSION = 1
const STORE_NAME = "app-data"
const DATA_KEY = "main"
const SEED_FLAG = "fsp-seeded" // flag to avoid re-seeding

// ===================== Seed data (old mvp-db.json) =====================
// Embedded snapshot from data/mvp-db.json so IndexedDB starts with real data
// This only runs ONCE — if IndexedDB is empty and hasn't been seeded before
const SEED_DATA: AppDatabase = {
  goals: {
    monthlyGoals: [
      { id: "w8yy7jn", name: "Заработать 50 000 ₽", description: "Достичь дохода 50 000 рублей за месяц", progress: 0, deadline: "2026-02-27", status: "in-progress", subtasks: [{ id: "yenfczz", name: "Завершить проект для клиента", completed: false }, { id: "x0n0gpb", name: "Запустить рекламную кампанию", completed: false }, { id: "s7suzs6", name: "Найти 2 новых клиента", completed: false }], whyImportant: "Финансовая стабильность и возможность инвестировать в развитие.", type: "month" },
      { id: "xt95244", name: "Прочитать 3 книги", description: "Прочитать 3 книги по саморазвитию", progress: 0, deadline: "2026-02-27", status: "in-progress", subtasks: [{ id: "fqx9k1y", name: "\"Атомные привычки\"", completed: false }, { id: "kcqvosa", name: "\"Думай медленно, решай быстро\"", completed: false }, { id: "jb1inl0", name: "\"Поток\"", completed: false }], whyImportant: "Знания формируют мышление. Чтение расширяет горизонты.", type: "month" },
      { id: "ttipjzi", name: "20 тренировок", description: "Провести минимум 20 тренировок за месяц", progress: 0, deadline: "2026-02-27", status: "in-progress", subtasks: [{ id: "jelwqpw", name: "Неделя 1: 5 тренировок", completed: false }, { id: "cqv9qw5", name: "Неделя 2: 5 тренировок", completed: false }, { id: "ftww6qd", name: "Неделя 3: 5 тренировок", completed: false }, { id: "fsa4xzg", name: "Неделя 4: 5 тренировок", completed: false }], whyImportant: "Здоровое тело - основа продуктивности и энергии.", type: "month" },
      { id: "67z485g", name: "Запустить мини-проект", description: "Создать и запустить MVP собственного проекта", progress: 0, deadline: "2026-02-27", status: "in-progress", subtasks: [{ id: "6x4og1o", name: "Определить идею и MVP", completed: false }, { id: "8c08cvs", name: "Разработать прототип", completed: false }, { id: "p8ut8uh", name: "Запустить и получить первых пользователей", completed: false }], whyImportant: "Собственный проект - путь к независимости и росту навыков.", type: "month" },
    ],
    yearlyGoals: [
      { id: "qz2wp6e", name: "Доход 1 000 000 ₽/год", description: "Выйти на суммарный доход 1 миллион рублей за год", progress: 0, deadline: "2026-12-31", status: "in-progress", subtasks: [{ id: "2citkla", name: "Q1: 200 000 ₽", completed: false }, { id: "9o61plm", name: "Q2: 250 000 ₽", completed: false }, { id: "gmrvgzt", name: "Q3: 250 000 ₽", completed: false }, { id: "fsi5und", name: "Q4: 300 000 ₽", completed: false }], whyImportant: "Финансовая свобода и возможность масштабирования.", type: "year" },
      { id: "ccvo5nx", name: "Прочитать 30 книг", description: "Прочитать 30 книг за год для интеллектуального роста", progress: 0, deadline: "2026-12-31", status: "in-progress", subtasks: [{ id: "uvqinjl", name: "Q1: 8 книг", completed: false }, { id: "fq7a0f4", name: "Q2: 8 книг", completed: false }, { id: "saqytyw", name: "Q3: 7 книг", completed: false }, { id: "vsqzd7a", name: "Q4: 7 книг", completed: false }], whyImportant: "Непрерывное обучение - ключ к конкурентному преимуществу.", type: "year" },
      { id: "rco4win", name: "Запустить свой бизнес", description: "Создать и монетизировать собственный продукт", progress: 0, deadline: "2026-12-31", status: "in-progress", subtasks: [{ id: "04v44vr", name: "Исследование рынка", completed: false }, { id: "n1ii00f", name: "Разработка MVP", completed: false }, { id: "b73wmbg", name: "Привлечение первых клиентов", completed: false }, { id: "7vdv7by", name: "Масштабирование", completed: false }], whyImportant: "Предпринимательство - путь к настоящей свободе.", type: "year" },
    ],
  },
  habits: {
    currentMonth: 2, currentYear: 2026,
    habits: [
      { id: "7o0hnvg", name: "Тренировка от 20 минут", weekDays: [3] },
      { id: "r8x1rrf", name: "Работа 2+ часа" },
      { id: "2bx38xl", name: "Планирование дня" },
      { id: "vv61kq4", name: "Чтение 30 минут" },
    ],
    completions: {
      "2bx38xl": { "2026-1-17": false },
      "r8x1rrf": { "2026-1-17": false },
      "7o0hnvg": { "2026-1-17": false },
      "vv61kq4": { "2026-1-17": false },
    },
  },
  dayPlanner: {
    dayDataMap: {
      "2026-1-21": {
        tasks: [
          { id: "ohmi2av", name: "Утренняя тренировка", completed: false, priority: "high", time: "05:00", isFocus: true, order: 0 },
          { id: "f5ibdhr", name: "Глубокая работа над проектом", completed: false, priority: "high", time: "06:00", isFocus: true, order: 1 },
          { id: "ag717h6", name: "Планирование недели", completed: false, priority: "medium", time: "08:00", isFocus: false, order: 2 },
          { id: "8req2ez", name: "Изучение нового навыка", completed: false, priority: "high", time: "09:00", isFocus: true, order: 3 },
          { id: "trh954v", name: "Ответить на все письма", completed: false, priority: "medium", time: "10:00", isFocus: false, order: 4 },
          { id: "e2bqf2o", name: "Чтение — 30 минут", completed: false, priority: "low", time: "12:00", isFocus: false, order: 5 },
          { id: "i16eyri", name: "Вечерний обзор дня", completed: false, priority: "medium", time: "20:00", isFocus: false, order: 6 },
        ],
        energyLevel: "medium",
        daySummary: null,
      },
    },
  },
  budget: {
    balance: { cardBalance: 0, reserveTarget: 5000, reserveCurrent: 5000 },
    goals: [],
    incomeHistory: [
      { id: "u2eg6xv", amount: 5396, date: "2026-03-04T15:14:41.335Z", distributed: true },
      { id: "gi9l50u", amount: 5396, date: "2026-03-04T15:15:25.827Z", distributed: true },
      { id: "i13r0wb", amount: 5396, date: "2026-03-04T15:20:39.196Z", distributed: true },
      { id: "110yugo", amount: 2342, date: "2026-03-04T15:21:22.359Z", distributed: true },
      { id: "jmvx9el", amount: 23423423, date: "2026-03-04T15:21:26.182Z", distributed: true },
      { id: "m00zc2a", amount: 6453543, date: "2026-03-04T15:23:06.481Z", distributed: true },
      { id: "fxsitww", amount: 1.2342134123421423e+40, date: "2026-03-05T20:24:44.500Z", distributed: true },
    ],
    expenses: [],
    deposits: [],
  },
  learning: { skills: [], sessions: [] },
  updatedAt: "2026-03-12T07:22:33.071Z",
}

// ===================== IndexedDB (local) =====================

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Read from IndexedDB (with seed migration on first run)
async function readLocal(): Promise<AppDatabase> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(DATA_KEY)
    request.onsuccess = () => {
      db.close()
      const data = request.result as AppDatabase | undefined
      if (data && Object.keys(data).length > 1) {
        // IndexedDB has real data — use it
        resolve(data)
      } else {
        // IndexedDB is empty — try seeding from embedded snapshot
        seedIfNeeded().then((seeded) => resolve(seeded ?? {})).catch(() => resolve({}))
      }
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

// Seed IndexedDB with old data (runs only once)
async function seedIfNeeded(): Promise<AppDatabase | null> {
  // Check if we already seeded to avoid overwriting user changes
  if (typeof localStorage !== "undefined" && localStorage.getItem(SEED_FLAG)) {
    return null
  }
  console.log("[sync] Seeding IndexedDB with embedded snapshot data")
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(
      { ...SEED_DATA, updatedAt: new Date().toISOString() },
      DATA_KEY
    )
    request.onsuccess = () => {
      db.close()
      if (typeof localStorage !== "undefined") localStorage.setItem(SEED_FLAG, "1")
      resolve(SEED_DATA)
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

// Write to IndexedDB
async function writeLocal(data: AppDatabase): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(
      { ...data, updatedAt: new Date().toISOString() },
      DATA_KEY
    )
    request.onsuccess = () => {
      db.close()
      resolve()
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

// ===================== Supabase (cloud) =====================

// Push local data to cloud (if logged in)
async function pushToCloud(data: AppDatabase): Promise<void> {
  const { data: session } = await supabase.auth.getSession()
  if (!session?.session?.user) return // not logged in — skip

  const userId = session.session.user.id
  const keys = Object.keys(data).filter((k) => k !== "updatedAt")
  console.log("[sync] Pushing to cloud, sections:", keys)

  const { error } = await supabase.from("user_data").upsert({
    user_id: userId,
    data: data,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error("[sync] Push to cloud failed:", error.message)
    throw new Error(error.message)
  }
  console.log("[sync] Push to cloud success, sections:", keys)
}

// Pull data from cloud (if logged in), returns null if not logged in or no data
export async function pullFromCloud(): Promise<AppDatabase | null> {
  const { data: session } = await supabase.auth.getSession()
  if (!session?.session?.user) return null

  const userId = session.session.user.id
  console.log("[sync] Pulling from cloud for user:", userId)

  const { data, error } = await supabase
    .from("user_data")
    .select("data")
    .eq("user_id", userId)
    .single()

  if (error) {
    console.error("[sync] Pull from cloud failed:", error.message)
    return null
  }
  if (!data) {
    console.log("[sync] No cloud data found")
    return null
  }

  const cloudData = data.data as AppDatabase
  const keys = Object.keys(cloudData).filter((k) => k !== "updatedAt")
  console.log("[sync] Cloud data sections:", keys)
  return cloudData
}

// ===================== Public API (same interface) =====================

// Read database — from IndexedDB
export async function readDatabase(): Promise<AppDatabase> {
  return readLocal()
}

// Write database — to IndexedDB + cloud sync
export async function writeDatabase(data: AppDatabase): Promise<void> {
  await writeLocal(data)
  // Cloud sync in background (don't block UI, but log errors)
  pushToCloud(data).catch((err) => {
    console.warn("[sync] Background push failed:", err?.message ?? err)
  })
}

// Read one section
export async function readSection<K extends keyof AppDatabase>(
  key: K
): Promise<AppDatabase[K] | undefined> {
  const db = await readLocal()
  return db[key]
}

// Write one section — to IndexedDB + cloud
export async function writeSection<K extends keyof AppDatabase>(
  key: K,
  value: AppDatabase[K]
): Promise<void> {
  const current = await readLocal()
  current[key] = value
  await writeDatabase(current)
}

// Sync: pull cloud data into local (called on login)
// Returns: "pulled" if cloud was newer, "pushed" if local was newer, "none" if no cloud data
export async function syncFromCloud(): Promise<"pulled" | "pushed" | "none"> {
  const cloudData = await pullFromCloud()
  if (!cloudData) return "none"

  const localData = await readLocal()

  // Use newer data (compare updatedAt timestamps)
  const cloudTime = cloudData.updatedAt ? new Date(cloudData.updatedAt).getTime() : 0
  const localTime = localData.updatedAt ? new Date(localData.updatedAt).getTime() : 0

  console.log("[sync] Cloud time:", new Date(cloudTime).toISOString(), "Local time:", new Date(localTime).toISOString())

  if (cloudTime > localTime) {
    // Cloud is newer — merge: take cloud as base, fill missing sections from local
    const merged = { ...localData, ...cloudData, updatedAt: cloudData.updatedAt }
    console.log("[sync] Cloud is newer — saving merged data locally")
    await writeLocal(merged)
    return "pulled"
  } else if (localTime > cloudTime) {
    // Local is newer — push to cloud
    console.log("[sync] Local is newer — pushing to cloud")
    await pushToCloud(localData)
    return "pushed"
  }
  console.log("[sync] Timestamps equal — no action needed")
  return "none"
}

// Push all local data to cloud (called on first login to upload existing data)
export async function pushAllToCloud(): Promise<void> {
  const localData = await readLocal()
  await pushToCloud(localData)
}
