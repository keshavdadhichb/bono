import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Global file store (same as in other APIs)
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

export async function GET() {
  try {
    const fileStore = getFileStore()
    const memoryUsage = process.memoryUsage()

    return NextResponse.json({
      success: true,
      filesStored: fileStore.size,
      memoryUsage: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      uptime: `${Math.round(process.uptime())}s`,
      timestamp: new Date().toISOString(),
      message: "System running perfectly - no external dependencies!",
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    })
  }
}
