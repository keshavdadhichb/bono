import { google } from "googleapis"

// Initialize Google Drive API
function getGoogleDriveService() {
  const credentials = {
    type: "service_account",
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GOOGLE_CLIENT_EMAIL}`,
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  })

  return google.drive({ version: "v3", auth })
}

export async function uploadToGoogleDrive(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
  try {
    const drive = getGoogleDriveService()

    // Upload file to Google Drive
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
      },
      media: {
        mimeType,
        body: Buffer.from(fileBuffer),
      },
    })

    const fileId = response.data.id!

    // Make file publicly accessible
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    })

    // Return the direct download URL
    return `https://drive.google.com/file/d/${fileId}/view`
  } catch (error) {
    console.error("Google Drive upload failed:", error)
    throw new Error(`Failed to upload to Google Drive: ${error.message}`)
  }
}
