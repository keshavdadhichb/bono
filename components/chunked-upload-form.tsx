"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, FileUp, Github, Mail, AlertCircle, CheckCircle } from "lucide-react"
import QRCodeDisplay from "./qr-code-display"

const CHUNK_SIZE = 1024 * 1024 // 1MB chunks

export default function ChunkedUploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    setError("")
    setResult(null)
    setUploadProgress(0)

    if (!selectedFile) {
      setFile(null)
      return
    }

    if (selectedFile.type !== "application/pdf") {
      setFile(null)
      setError("Please select a valid PDF file.")
      return
    }

    const fileSizeMB = selectedFile.size / 1024 / 1024
    if (fileSizeMB > 100) {
      setFile(null)
      setError(`File too large (${fileSizeMB.toFixed(1)}MB). Maximum is 100MB.`)
      return
    }

    setFile(selectedFile)
  }

  const uploadFileInChunks = async (file: File) => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    const uploadId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9)

    setUploadStatus(`Uploading in ${totalChunks} chunks...`)

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, file.size)
      const chunk = file.slice(start, end)

      const formData = new FormData()
      formData.append("chunk", chunk)
      formData.append("chunkIndex", chunkIndex.toString())
      formData.append("totalChunks", totalChunks.toString())
      formData.append("fileName", file.name)
      formData.append("fileType", file.type)
      formData.append("uploadId", uploadId)

      const response = await fetch("/api/upload-chunk", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Chunk ${chunkIndex + 1} upload failed`)
      }

      const data = await response.json()
      const progress = ((chunkIndex + 1) / totalChunks) * 100
      setUploadProgress(progress)
      setUploadStatus(`Uploading chunk ${chunkIndex + 1}/${totalChunks}...`)

      if (data.complete) {
        return data
      }
    }

    throw new Error("Upload completed but no final response received")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsUploading(true)
    setError("")
    setResult(null)
    setUploadProgress(0)

    try {
      const fileSizeMB = file.size / 1024 / 1024
      console.log(`🚀 Starting chunked upload: ${file.name} (${fileSizeMB.toFixed(1)}MB)`)

      const data = await uploadFileInChunks(file)

      setUploadStatus("Generating QR code...")
      setUploadProgress(100)

      console.log(`✅ Upload complete: ${data.fileName}`)
      setResult(data)
      setUploadStatus("")
    } catch (err: any) {
      console.error("❌ Upload error:", err.message)
      setError(err.message || "Upload failed. Please try again.")
      setUploadStatus("")
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <Card className="mb-8 border border-gray-200">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileChange}
                accept="application/pdf"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <FileUp className="h-10 w-10 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700 text-center">
                  {file ? file.name : "Click to upload PDF"}
                </span>
                <span className="text-xs mt-1 text-gray-500">
                  {file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "PDF files only (Max: 100MB)"}
                </span>
              </label>
            </div>

            {/* Chunked Upload Info */}
            {file && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Chunked Upload Ready</p>
                    <p>
                      File will be uploaded in {Math.ceil(file.size / CHUNK_SIZE)} small chunks to bypass size limits
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  <p className="font-medium">Upload Error</p>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {/* Progress Display */}
            {isUploading && (
              <div className="text-center">
                <p className="text-sm text-blue-600 mb-2 font-medium">{uploadStatus}</p>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{uploadProgress.toFixed(0)}% complete</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-black hover:bg-gray-800 h-12 text-base font-medium"
              disabled={!file || isUploading}
            >
              {isUploading ? (
                <div className="flex items-center">
                  <Upload className="mr-2 h-5 w-5 animate-spin" />
                  Uploading...
                </div>
              ) : (
                <>
                  <FileUp className="mr-2 h-5 w-5" />
                  Upload PDF & Generate QR Code
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-700 font-medium">
                Chunked upload successful! QR code generated with filename in bold center.
              </p>
            </div>
          </div>

          <QRCodeDisplay url={result.url} fileName={result.fileName} />

          {result.fileSize && (
            <div className="text-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              📊 Uploaded {result.fileSize} using chunked upload
            </div>
          )}
        </div>
      )}

      <div className="mt-8 text-center border-t border-gray-200 pt-6">
        <p className="text-sm text-gray-600 mb-3">Created by - Keshav Dadhich</p>
        <div className="flex justify-center items-center space-x-6 text-xs text-gray-500">
          <a
            href="https://github.com/keshavdadhichb"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-gray-700 transition-colors"
          >
            <Github className="h-3 w-3" />
            keshavdadhichb
          </a>
          <a
            href="mailto:keshavdadhichb7@gmail.com"
            className="flex items-center gap-1 hover:text-gray-700 transition-colors"
          >
            <Mail className="h-3 w-3" />
            keshavdadhichb7@gmail.com
          </a>
        </div>
      </div>
    </div>
  )
}
