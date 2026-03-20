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

// Read from IndexedDB
async function readLocal(): Promise<AppDatabase> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(DATA_KEY)
    request.onsuccess = () => {
      db.close()
      resolve((request.result as AppDatabase) ?? {})
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
  await supabase.from("user_data").upsert({
    user_id: userId,
    data: data,
    updated_at: new Date().toISOString(),
  })
}

// Pull data from cloud (if logged in), returns null if not logged in or no data
export async function pullFromCloud(): Promise<AppDatabase | null> {
  const { data: session } = await supabase.auth.getSession()
  if (!session?.session?.user) return null

  const userId = session.session.user.id
  const { data, error } = await supabase
    .from("user_data")
    .select("data")
    .eq("user_id", userId)
    .single()

  if (error || !data) return null
  return data.data as AppDatabase
}

// ===================== Public API (same interface) =====================

// Read database — from IndexedDB
export async function readDatabase(): Promise<AppDatabase> {
  return readLocal()
}

// Write database — to IndexedDB + cloud sync
export async function writeDatabase(data: AppDatabase): Promise<void> {
  await writeLocal(data)
  // Cloud sync in background (don't block UI)
  pushToCloud(data).catch(() => {})
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
export async function syncFromCloud(): Promise<boolean> {
  const cloudData = await pullFromCloud()
  if (!cloudData) return false

  const localData = await readLocal()

  // Use newer data (compare updatedAt timestamps)
  const cloudTime = cloudData.updatedAt ? new Date(cloudData.updatedAt).getTime() : 0
  const localTime = localData.updatedAt ? new Date(localData.updatedAt).getTime() : 0

  if (cloudTime > localTime) {
    // Cloud is newer — overwrite local
    await writeLocal(cloudData)
    return true // data changed, need to reload
  } else if (localTime > cloudTime) {
    // Local is newer — push to cloud
    pushToCloud(localData).catch(() => {})
  }
  return false
}

// Push all local data to cloud (called on first login to upload existing data)
export async function pushAllToCloud(): Promise<void> {
  const localData = await readLocal()
  await pushToCloud(localData)
}
