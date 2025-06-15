"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, FileUp, Github, Mail, AlertCircle } from "lucide-react"
import QRCodeDisplay from "./qr-code-display"

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<{
    url: string
    fileName: string
    fileSize?: string
    uploadTime?: string
  } | null>(null)
  const [error, setError] = useState("")
  const [uploadProgress, setUploadProgress] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]

    setError("")

    if (!selectedFile) {
      setFile(null)
      return
    }

    if (selectedFile.type !== "application/pdf") {
      setFile(null)
      setError("Please select a valid PDF file.")
      return
    }

    // Increased limit for better hosting
    const fileSizeMB = selectedFile.size / 1024 / 1024
    if (fileSizeMB > 50) {
      setFile(null)
      setError(`File too large (${fileSizeMB.toFixed(2)} MB). Maximum size is 50MB.`)
      return
    }

    setFile(selectedFile)

    console.log("File selected:", {
      name: selectedFile.name,
      size: selectedFile.size,
      sizeMB: fileSizeMB.toFixed(2),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsUploading(true)
    setError("")
    setUploadProgress("Preparing upload...")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const fileSizeMB = file.size / 1024 / 1024
      if (fileSizeMB > 20) {
        setUploadProgress("Large file detected. This may take several minutes...")
      } else if (fileSizeMB > 10) {
        setUploadProgress("Medium file detected. This may take up to a minute...")
      } else {
        setUploadProgress("Uploading to Google Drive...")
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minute timeout

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        if (response.status === 413) {
          throw new Error("File too large for server processing.")
        }
        throw new Error("Server error. Please try again.")
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload file")
      }

      setUploadProgress("Generating QR code...")
      const data = await response.json()
      setResult(data)
      setUploadProgress("")
    } catch (err: any) {
      console.error("Upload error:", err)
      if (err.name === "AbortError") {
        setError("Upload timeout. Please try again with a smaller file.")
      } else {
        setError(err.message || "Failed to upload file. Please try again.")
      }
      setUploadProgress("")
    } finally {
      setIsUploading(false)
    }
  }

  const getFileSizeColor = (file: File) => {
    const sizeMB = file.size / 1024 / 1024
    if (sizeMB > 30) return "text-red-600"
    if (sizeMB > 20) return "text-orange-600"
    if (sizeMB > 10) return "text-yellow-600"
    return "text-gray-500"
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
                <span className="text-sm font-medium text-gray-700">{file ? file.name : "Click to upload PDF"}</span>
                <span className={`text-xs mt-1 ${file ? getFileSizeColor(file) : "text-gray-500"}`}>
                  {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "PDF files only (Max: 50MB)"}
                </span>
              </label>
            </div>

            {file && file.size > 10 * 1024 * 1024 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-700">
                  <p className="font-medium">Large file detected</p>
                  <p>Files over 10MB may take longer to upload. Please be patient and don't close the browser.</p>
                </div>
              </div>
            )}

            {file && file.size > 30 * 1024 * 1024 && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  <p className="font-medium">Very large file</p>
                  <p>Consider compressing your PDF for faster upload, though this file should work.</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {uploadProgress && (
              <div className="text-center">
                <p className="text-sm text-blue-600 mb-2">{uploadProgress}</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: "70%" }}></div>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full bg-black hover:bg-gray-800" disabled={!file || isUploading}>
              {isUploading ? (
                <div className="flex items-center">
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  {uploadProgress || "Uploading..."}
                </div>
              ) : (
                "Upload PDF & Generate QR"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <QRCodeDisplay url={result.url} fileName={result.fileName} />
          {result.fileSize && result.uploadTime && (
            <div className="text-center text-xs text-gray-500">
              Uploaded {result.fileSize} in {result.uploadTime}
            </div>
          )}
        </div>
      )}

      {/* Credits Section */}
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
