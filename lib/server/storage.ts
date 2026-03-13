import { promises as fs } from "node:fs"
import path from "node:path"
import os from "node:os"
import type { AppDatabase } from "@/lib/state-types"

// Data is stored in ~/.future-self-projection/ so it persists
// across app rebuilds and version updates
export const DATA_DIR = process.env.APP_DATA_DIR
  ? path.resolve(process.env.APP_DATA_DIR)
  : path.join(os.homedir(), ".future-self-projection")

const DATA_FILE = path.join(DATA_DIR, "mvp-db.json")

// Папка для обложек книг
export const COVERS_DIR = path.join(DATA_DIR, "covers")

export async function ensureCoversDir() {
  await fs.mkdir(COVERS_DIR, { recursive: true })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

async function ensureStorageFile() {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(DATA_FILE)
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({}, null, 2), "utf-8")
  }
}

export async function readDatabase(): Promise<AppDatabase> {
  await ensureStorageFile()

  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8")
    if (!raw.trim()) return {}

    const parsed: unknown = JSON.parse(raw)
    return isRecord(parsed) ? (parsed as AppDatabase) : {}
  } catch {
    return {}
  }
}

export async function writeDatabase(next: AppDatabase) {
  await ensureStorageFile()

  const payload: AppDatabase = {
    ...next,
    updatedAt: new Date().toISOString(),
  }

  const tempFile = `${DATA_FILE}.tmp`
  await fs.writeFile(tempFile, JSON.stringify(payload, null, 2), "utf-8")
  await fs.rename(tempFile, DATA_FILE)
}

export async function readSection<K extends keyof AppDatabase>(
  key: K
): Promise<AppDatabase[K] | null> {
  const db = await readDatabase()
  return db[key] ?? null
}

export async function writeSection<K extends keyof AppDatabase>(
  key: K,
  value: AppDatabase[K]
) {
  const db = await readDatabase()
  const next: AppDatabase = {
    ...db,
    [key]: value,
  }
  await writeDatabase(next)
}
