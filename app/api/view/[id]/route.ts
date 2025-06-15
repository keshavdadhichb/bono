import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Global file store (same as in upload)
declare global {
  var __fileStore:
    | Map<
        string,
        {
          name: string
          data: Buffer
          type: string
          uploadTime: number
        }
      >
    | undefined
}

const getFileStore = () => {
  if (!global.__fileStore) {
    global.__fileStore = new Map()
  }
  return global.__fileStore
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const fileId = params.id
    const fileStore = getFileStore()

    // Get file from storage
    const fileData = fileStore.get(fileId)

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
