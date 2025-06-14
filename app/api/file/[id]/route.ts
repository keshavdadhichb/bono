import { type NextRequest, NextResponse } from "next/server"

export const runtime = "edge"
export const dynamic = "force-dynamic"

// Global file storage (same structure as upload)
declare global {
  var fileStorage: Map<string, { name: string; data: Uint8Array; type: string; time: number }> | undefined
}

function getStorage() {
  if (!global.fileStorage) {
    global.fileStorage = new Map()
  }
  return global.fileStorage
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const storage = getStorage()
    const fileData = storage.get(params.id)

    if (!fileData) {
      return NextResponse.json({ error: "File not found or expired" }, { status: 404 })
    }

    console.log(`📄 Serving file: ${fileData.name}`)

    // Return the file with proper headers
    return new NextResponse(fileData.data, {
      headers: {
        "Content-Type": fileData.type,
        "Content-Disposition": `inline; filename="${fileData.name}"`,
        "Content-Length": fileData.data.length.toString(),
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error: any) {
    console.error("❌ File serve failed:", error)
    return NextResponse.json({ error: `File serve failed: ${error.message}` }, { status: 500 })
  }
}
