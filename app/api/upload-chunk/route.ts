import { type NextRequest, NextResponse } from "next/server"

export const maxDuration = 60
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Global storage for chunks and completed files
declare global {
  var fileChunks: Map<string, { chunks: Buffer[]; totalChunks: number; fileName: string; fileType: string }> | undefined
  var fileStorage: Map<string, { name: string; data: Buffer; type: string; time: number }> | undefined
}

function getChunkStorage() {
  if (!global.fileChunks) {
    global.fileChunks = new Map()
  }
  return global.fileChunks
}

function getFileStorage() {
  if (!global.fileStorage) {
    global.fileStorage = new Map()
  }
  return global.fileStorage
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const chunk = formData.get("chunk") as File
    const chunkIndex = Number.parseInt(formData.get("chunkIndex") as string)
    const totalChunks = Number.parseInt(formData.get("totalChunks") as string)
    const fileName = formData.get("fileName") as string
    const fileType = formData.get("fileType") as string
    const uploadId = formData.get("uploadId") as string

    if (!chunk || !fileName || !uploadId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const chunkStorage = getChunkStorage()
    const chunkBuffer = Buffer.from(await chunk.arrayBuffer())

    // Initialize or get existing upload
    if (!chunkStorage.has(uploadId)) {
      chunkStorage.set(uploadId, {
        chunks: new Array(totalChunks),
        totalChunks,
        fileName,
        fileType,
      })
    }

    const upload = chunkStorage.get(uploadId)!
    upload.chunks[chunkIndex] = chunkBuffer

    console.log(`Received chunk ${chunkIndex + 1}/${totalChunks} for ${fileName}`)

    // Check if all chunks are received
    const receivedChunks = upload.chunks.filter(Boolean).length

    if (receivedChunks === totalChunks) {
      // Combine all chunks
      const completeFile = Buffer.concat(upload.chunks)

      // Store the complete file
      const fileStorage = getFileStorage()
      const fileId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9)

      fileStorage.set(fileId, {
        name: fileName,
        data: completeFile,
        type: fileType,
        time: Date.now(),
      })

      // Clean up chunks
      chunkStorage.delete(uploadId)

      // Clean up old files
      if (fileStorage.size > 20) {
        const entries = Array.from(fileStorage.entries())
        entries.sort((a, b) => a[1].time - b[1].time)
        const toRemove = entries.slice(0, entries.length - 20)
        toRemove.forEach(([key]) => fileStorage.delete(key))
      }

      const viewUrl = `${request.nextUrl.origin}/api/file/${fileId}`

      console.log(`✅ File complete: ${fileName} (${(completeFile.length / 1024 / 1024).toFixed(1)}MB)`)

      return NextResponse.json({
        complete: true,
        url: viewUrl,
        fileName,
        fileSize: `${(completeFile.length / 1024 / 1024).toFixed(1)} MB`,
        fileId,
      })
    }

    return NextResponse.json({
      complete: false,
      received: receivedChunks,
      total: totalChunks,
    })
  } catch (error: any) {
    console.error("Chunk upload error:", error)
    return NextResponse.json({ error: `Chunk upload failed: ${error.message}` }, { status: 500 })
  }
}
