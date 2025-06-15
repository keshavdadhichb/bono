import { type NextRequest, NextResponse } from "next/server"
import { uploadToGoogleDrive } from "@/lib/google-drive"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    console.log("=== GOOGLE DRIVE UPLOAD STARTED ===")

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log(`Processing file: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(1)}MB`)

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files allowed" }, { status: 400 })
    }

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
    const fileBuffer = Buffer.from(arrayBuffer)

    console.log("Uploading to Google Drive...")

    // Upload to Google Drive
    const driveUrl = await uploadToGoogleDrive(fileBuffer, file.name, file.type)

    const uploadTime = Date.now() - startTime

    console.log(`✅ Google Drive upload successful: ${driveUrl} (${uploadTime}ms)`)

    return NextResponse.json({
      url: driveUrl,
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      uploadTime: `${(uploadTime / 1000).toFixed(1)}s`,
      driveUrl: driveUrl,
    })
  } catch (error: any) {
    console.error("❌ Google Drive upload failed:", error)
    return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 })
  }
}
