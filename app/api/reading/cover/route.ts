import { NextResponse } from "next/server"
import { promises as fs } from "node:fs"
import path from "node:path"
import { ensureCoversDir, COVERS_DIR } from "@/lib/server/storage"

export const runtime = "nodejs"

// Разрешённые MIME-типы изображений
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

// POST /api/reading/cover — загрузить обложку книги
// Принимает multipart/form-data с полями file и bookId
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
