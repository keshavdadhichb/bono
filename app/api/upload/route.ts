import { type NextRequest, NextResponse } from "next/server"

// Fix: Set to maximum allowed duration
export const runtime = "edge"
export const maxDuration = 60 // Maximum allowed on Vercel
export const dynamic = "force-dynamic"

// Global file storage
declare global {
  var fileStorage: Map<string, { name: string; data: Uint8Array; type: string; time: number }> | undefined
}

function getStorage() {
  if (!global.fileStorage) {
    global.fileStorage = new Map()
  }
  return global.fileStorage
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== LARGE FILE UPLOAD STARTED ===")

    // Use streaming approach
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log(`Processing file: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(1)}MB`)

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files allowed" }, { status: 400 })
    }

    // Reduce to 30MB for better reliability within 60 second limit
    if (file.size > 30 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 30MB.`,
        },
        { status: 413 },
      )
    }

    const startTime = Date.now()

    // Convert to Uint8Array for Edge Runtime compatibility
    const arrayBuffer = await file.arrayBuffer()
    const fileData = new Uint8Array(arrayBuffer)

    console.log("File converted to array buffer successfully")

    // Generate unique ID
    const fileId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9)

    // Store in global storage
    const storage = getStorage()
    storage.set(fileId, {
      name: file.name,
      data: fileData,
      type: file.type,
      time: Date.now(),
    })

    // Clean up old files (keep only last 10 for memory management)
    if (storage.size > 10) {
      const entries = Array.from(storage.entries())
      entries.sort((a, b) => a[1].time - b[1].time)
      const toRemove = entries.slice(0, entries.length - 10)
      toRemove.forEach(([key]) => storage.delete(key))
      console.log(`Cleaned up ${toRemove.length} old files`)
    }

    const uploadTime = Date.now() - startTime
    const viewUrl = `${request.nextUrl.origin}/api/file/${fileId}`

    console.log(`✅ Upload successful: ${fileId} (${uploadTime}ms)`)

    return NextResponse.json({
      url: viewUrl,
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      uploadTime: `${(uploadTime / 1000).toFixed(1)}s`,
      fileId: fileId,
    })
  } catch (error: any) {
    console.error("❌ Upload failed:", error)

    // Handle specific error types
    if (error.message?.includes("body") || error.message?.includes("size")) {
      return NextResponse.json(
        {
          error: "File too large for processing. Please try a smaller file.",
        },
        { status: 413 },
      )
    }

    return NextResponse.json(
      {
        error: `Upload failed: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
