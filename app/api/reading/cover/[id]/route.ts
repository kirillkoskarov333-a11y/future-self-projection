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

// GET /api/reading/cover/[id] — отдать обложку книги по id
// Перебирает расширения и возвращает найденный файл
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
