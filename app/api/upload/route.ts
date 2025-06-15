import { type NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"
import { Readable } from "stream"

export const maxDuration = 60
export const dynamic = "force-dynamic"

const cleanFolderId = (folderId: string): string => {
  return folderId.replace(/['"]/g, "").trim()
}

const formatPrivateKey = (key: string): string => {
  let formattedKey = key.replace(/^["']|["']$/g, "")
  formattedKey = formattedKey.replace(/\\n/g, "\n")

  if (!formattedKey.includes("\n")) {
    formattedKey = formattedKey
      .replace("-----BEGIN PRIVATE KEY-----", "-----BEGIN PRIVATE KEY-----\n")
      .replace("-----END PRIVATE KEY-----", "\n-----END PRIVATE KEY-----")
  }

  return formattedKey
}

const initializeDriveClient = () => {
  try {
    const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY || ""
    const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL || ""

    const formattedPrivateKey = formatPrivateKey(GOOGLE_PRIVATE_KEY)

    const auth = new google.auth.GoogleAuth({
      credentials: {
        private_key: formattedPrivateKey,
        client_email: GOOGLE_CLIENT_EMAIL,
      },
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    })

    return google.drive({ version: "v3", auth })
  } catch (error) {
    console.error("Error initializing Google Drive client:", error)
    throw new Error("Failed to initialize Google Drive client")
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== UPLOAD API STARTED ===")

    const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY || ""
    const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL || ""
    const GOOGLE_DRIVE_FOLDER_ID_RAW = process.env.GOOGLE_DRIVE_FOLDER_ID || ""
    const GOOGLE_DRIVE_FOLDER_ID = cleanFolderId(GOOGLE_DRIVE_FOLDER_ID_RAW)

    if (!GOOGLE_PRIVATE_KEY || !GOOGLE_CLIENT_EMAIL || !GOOGLE_DRIVE_FOLDER_ID) {
      console.error("Missing Google Drive credentials")
      return NextResponse.json({ error: "Google Drive API credentials are not configured properly" }, { status: 500 })
    }

    let formData: FormData
    try {
      formData = await request.formData()
      console.log("Form data parsed successfully")
    } catch (error: any) {
      console.error("Error parsing form data:", error)
      return NextResponse.json(
        {
          error: "File too large for processing. Please use a file smaller than 50MB.",
        },
        { status: 413 },
      )
    }

    const file = formData.get("file") as File

    if (!file) {
      console.error("No file in form data")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("File received:", {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeMB: (file.size / 1024 / 1024).toFixed(2),
    })

    if (file.type !== "application/pdf") {
      console.error("Invalid file type:", file.type)
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 })
    }

    // Increased limit for Pro plan
    const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB for Pro plan
    if (file.size > MAX_FILE_SIZE) {
      console.error("File too large:", file.size, "bytes")
      return NextResponse.json(
        {
          error: `File too large. Maximum size is 50MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
        },
        { status: 413 },
      )
    }

    console.log("File validation passed, initializing Google Drive...")
    const drive = initializeDriveClient()

    console.log("Converting file to buffer...")
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log("Starting Google Drive upload...")
    const startTime = Date.now()

    const response = await drive.files.create(
      {
        requestBody: {
          name: file.name,
          mimeType: file.type,
          parents: [GOOGLE_DRIVE_FOLDER_ID],
        },
        media: {
          mimeType: file.type,
          body: Readable.from(buffer),
        },
        fields: "id,name,webViewLink,size",
      },
      {
        uploadType: "resumable",
        timeout: 55000, // 55 second timeout
      },
    )

    const uploadTime = Date.now() - startTime
    console.log("Upload completed in", uploadTime, "ms")

    console.log("Setting file permissions...")
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    })

    const fileUrl = `https://drive.google.com/file/d/${response.data.id}/view`

    console.log("=== UPLOAD SUCCESS ===")
    return NextResponse.json({
      url: fileUrl,
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      uploadTime: `${(uploadTime / 1000).toFixed(1)}s`,
    })
  } catch (error: any) {
    console.error("=== UPLOAD ERROR ===", error)

    if (error.code === 404) {
      return NextResponse.json(
        {
          error: "Google Drive folder not found. Please check folder permissions.",
        },
        { status: 500 },
      )
    }

    if (error.message?.includes("timeout") || error.code === "ETIMEDOUT") {
      return NextResponse.json(
        {
          error: "Upload timeout. Please try again.",
        },
        { status: 408 },
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
