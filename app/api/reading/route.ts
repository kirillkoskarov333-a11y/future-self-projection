import { NextResponse } from "next/server"
import { readSection, writeSection } from "@/lib/server/storage"
import { isReadingState } from "@/lib/server/validators"

export const runtime = "nodejs"

// GET /api/reading — загрузить данные о книгах
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

// PUT /api/reading — сохранить данные о книгах
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
