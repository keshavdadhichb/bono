"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, FileUp, Github, Mail, AlertCircle, CheckCircle, Clock } from "lucide-react"
import QRCodeDisplay from "./qr-code-display"

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")
  const [uploadProgress, setUploadProgress] = useState("")
  const [timeElapsed, setTimeElapsed] = useState(0)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    setError("")
    setResult(null)

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
    if (fileSizeMB > 30) {
      setFile(null)
      setError(`File too large (${fileSizeMB.toFixed(1)}MB). Maximum is 30MB.`)
      return
    }

    setFile(selectedFile)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsUploading(true)
    setError("")
    setResult(null)
    setTimeElapsed(0)

    // Start timer
    const startTime = Date.now()
    const timer = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    try {
      const fileSizeMB = file.size / 1024 / 1024

      // Set progress messages based on file size
      if (fileSizeMB > 20) {
        setUploadProgress("Uploading large file... This may take 45-60 seconds")
      } else if (fileSizeMB > 10) {
        setUploadProgress("Uploading file... This may take 30-45 seconds")
      } else if (fileSizeMB > 5) {
        setUploadProgress("Uploading file... This may take 15-30 seconds")
      } else {
        setUploadProgress("Uploading file...")
      }

      const formData = new FormData()
      formData.append("file", file)

      console.log(`🚀 Starting upload: ${file.name} (${fileSizeMB.toFixed(1)}MB)`)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(timer)

      if (!response.ok) {
        let errorMessage = "Upload failed"

        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          if (response.status === 413) {
            errorMessage = "File too large. Please try a smaller file (max 30MB)."
          } else if (response.status === 500) {
            errorMessage = "Server error. Please try again."
          } else if (response.status === 504) {
            errorMessage = "Upload timeout. File may be too large or connection too slow."
          }
        }

        throw new Error(errorMessage)
      }

      setUploadProgress("Generating QR code...")
      const data = await response.json()

      console.log(`✅ Upload complete: ${data.fileName}`)
      setResult(data)
      setUploadProgress("")
    } catch (err: any) {
      console.error("❌ Upload error:", err.message)
      setError(err.message || "Upload failed. Please try again.")
      setUploadProgress("")
      clearInterval(timer)
    } finally {
      setIsUploading(false)
    }
  }

  const getFileSizeInfo = (file: File) => {
    const sizeMB = file.size / 1024 / 1024

    if (sizeMB > 20) {
      return {
        color: "text-red-600",
        icon: <Clock className="h-3 w-3" />,
        message: "Large file - may take 45-60 seconds",
        bgColor: "bg-red-50 border-red-200",
      }
    } else if (sizeMB > 10) {
      return {
        color: "text-orange-600",
        icon: <Clock className="h-3 w-3" />,
        message: "Medium file - may take 30-45 seconds",
        bgColor: "bg-orange-50 border-orange-200",
      }
    } else if (sizeMB > 5) {
      return {
        color: "text-yellow-600",
        icon: <Clock className="h-3 w-3" />,
        message: "Small file - may take 15-30 seconds",
        bgColor: "bg-yellow-50 border-yellow-200",
      }
    } else {
      return {
        color: "text-green-600",
        icon: <CheckCircle className="h-3 w-3" />,
        message: "Very small file - fast upload",
        bgColor: "bg-green-50 border-green-200",
      }
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
                <span
                  className={`text-xs mt-1 flex items-center gap-1 ${file ? getFileSizeInfo(file).color : "text-gray-500"}`}
                >
                  {file && getFileSizeInfo(file).icon}
                  {file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "PDF files only (Max: 30MB)"}
                </span>
              </label>
            </div>

            {/* File Size Warning */}
            {file && file.size > 5 * 1024 * 1024 && (
              <div className={`flex items-start gap-2 p-3 rounded-lg border ${getFileSizeInfo(file).bgColor}`}>
                {getFileSizeInfo(file).icon}
                <div
                  className={`text-sm ${getFileSizeInfo(file).color.replace("text-", "text-").replace("-600", "-700")}`}
                >
                  <p className="font-medium">Large File Upload</p>
                  <p>{getFileSizeInfo(file).message}</p>
                  <p className="text-xs mt-1">💡 Keep browser open during upload - do not close or refresh</p>
                </div>
              </div>
            )}

            {/* Vercel Limits Info */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-700">
                <p className="font-medium">Vercel Processing Limits</p>
                <p>Maximum file size: 30MB | Maximum processing time: 60 seconds</p>
                <p className="text-xs mt-1">💡 For larger files, consider compressing your PDF first</p>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  <p className="font-medium">Upload Error</p>
                  <p>{error}</p>
                  {error.includes("too large") && (
                    <p className="text-xs mt-1">💡 Try compressing your PDF or use a smaller file</p>
                  )}
                </div>
              </div>
            )}

            {/* Progress Display */}
            {isUploading && (
              <div className="text-center">
                <p className="text-sm text-blue-600 mb-2 font-medium">{uploadProgress}</p>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full animate-pulse"
                    style={{ width: "75%" }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">
                  Time elapsed: {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, "0")}
                </p>
                <p className="text-xs text-gray-500 mt-1">Please keep this page open</p>
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
                Upload successful! QR code generated with filename in bold center.
              </p>
            </div>
          </div>

          <QRCodeDisplay url={result.url} fileName={result.fileName} />

          {result.fileSize && result.uploadTime && (
            <div className="text-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              📊 Uploaded {result.fileSize} in {result.uploadTime}
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
