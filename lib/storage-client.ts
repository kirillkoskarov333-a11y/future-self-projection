/**
 * IndexedDB storage layer for PWA
 * Replaces the server-side file storage (lib/server/storage.ts)
 * Same data structure — just stored in browser IndexedDB instead of JSON file
 */

import type { AppDatabase } from "@/lib/state-types"

const DB_NAME = "future-self-projection"
const DB_VERSION = 1
const STORE_NAME = "app-data"
const DATA_KEY = "main" // single key for the whole database object

// Open (or create) the IndexedDB database
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    // Create object store on first open or version upgrade
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

// Read the whole database object from IndexedDB
export async function readDatabase(): Promise<AppDatabase> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(DATA_KEY)

    request.onsuccess = () => {
      db.close()
      // If nothing stored yet, return empty object
      resolve((request.result as AppDatabase) ?? {})
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

// Write the whole database object to IndexedDB
export async function writeDatabase(data: AppDatabase): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const request = store.put({ ...data, updatedAt: new Date().toISOString() }, DATA_KEY)

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

// Read one section of the database (e.g. "habits", "goals")
export async function readSection<K extends keyof AppDatabase>(
  key: K
): Promise<AppDatabase[K] | undefined> {
  const db = await readDatabase()
  return db[key]
}

// Write one section — reads current DB, merges, writes back
export async function writeSection<K extends keyof AppDatabase>(
  key: K,
  value: AppDatabase[K]
): Promise<void> {
  const current = await readDatabase()
  current[key] = value
  await writeDatabase(current)
}
