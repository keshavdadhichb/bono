import { type NextRequest, NextResponse } from "next/server"

// Render.com free tier configuration
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Global file storage
declare global {
  var __fileStore: Map<string, { name: string; data: Buffer; type: string; uploadTime: number }> | undefined
}

function getFileStore() {
  if (!global.__fileStore) {
    global.__fileStore = new Map()
  }
  return global.__fileStore
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== RENDER FREE TIER UPLOAD ===")

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log(`Processing file: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(1)}MB`)

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files allowed" }, { status: 400 })
    }

    // Render free tier - generous limits
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 100MB.`,
        },
        { status: 413 },
      )
    }

    const startTime = Date.now()

    // Convert to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const fileData = Buffer.from(arrayBuffer)

    console.log("File processed successfully on Render")

    // Generate unique ID
    const fileId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9)

    // Store in memory
    const fileStore = getFileStore()
    fileStore.set(fileId, {
      name: file.name,
      data: fileData,
      type: file.type,
      uploadTime: Date.now(),
    })

    // Clean up (keep last 20 files on free tier)
    if (fileStore.size > 20) {
      const entries = Array.from(fileStore.entries())
      entries.sort((a, b) => a[1].uploadTime - b[1].uploadTime)
      const toRemove = entries.slice(0, entries.length - 20)
      toRemove.forEach(([key]) => fileStore.delete(key))
      console.log(`Cleaned up ${toRemove.length} old files`)
    }

    const uploadTime = Date.now() - startTime
    const viewUrl = `${request.nextUrl.origin}/api/view/${fileId}`

    console.log(`✅ Render upload successful: ${fileId} (${uploadTime}ms)`)

    return NextResponse.json({
      url: viewUrl,
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      uploadTime: `${(uploadTime / 1000).toFixed(1)}s`,
      fileId: fileId,
    })
  } catch (error: any) {
    console.error("❌ Render upload failed:", error)
    return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 })
  }
}
