"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, LinkIcon, ExternalLink } from "lucide-react"
import QRCode from "qrcode"

interface QRCodeDisplayProps {
  url: string
  fileName: string
}

export default function QRCodeDisplay({ url, fileName }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && url) {
      generateQRWithText()
    }
  }, [url, fileName])

  const generateQRWithText = async () => {
    if (!canvasRef.current) return

    try {
      const tempCanvas = document.createElement("canvas")
      await QRCode.toCanvas(tempCanvas, url, {
        width: 400,
        margin: 3,
        color: { dark: "#000000", light: "#FFFFFF" },
        errorCorrectionLevel: "M",
      })

      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const displayName = fileName.replace(/\.pdf$/i, "")
      const qrSize = 400
      const textHeight = 100
      const padding = 20
      const totalHeight = qrSize + textHeight + padding * 2

      canvas.width = qrSize
      canvas.height = totalHeight

      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(0, 0, qrSize, totalHeight)
      ctx.drawImage(tempCanvas, 0, padding)

      ctx.fillStyle = "#000000"
      ctx.font = "bold 28px Arial, sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      const textY = qrSize + padding + textHeight / 2
      ctx.fillText(displayName, qrSize / 2, textY)

      ctx.strokeStyle = "#CCCCCC"
      ctx.lineWidth = 2
      ctx.strokeRect(1, 1, qrSize - 2, totalHeight - 2)
    } catch (error) {
      console.error("QR generation failed:", error)
      if (canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, url, { width: 400, margin: 3 })
      }
    }
  }

  const downloadQRCode = () => {
    if (canvasRef.current) {
      const link = document.createElement("a")
      const cleanFileName = fileName.replace(/\.pdf$/i, "")
      link.download = `${cleanFileName}-QR.png`
      link.href = canvasRef.current.toDataURL("image/png", 1.0)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <Card className="w-full border border-gray-200">
      <CardContent className="flex flex-col items-center pt-6">
        <canvas
          ref={canvasRef}
          className="mb-4 border border-gray-200 rounded-lg shadow-sm"
          style={{ maxWidth: "100%", height: "auto" }}
        />

        <div className="w-full p-3 bg-gray-50 rounded-md border text-sm">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline flex items-center gap-2 break-all"
          >
            <LinkIcon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">View/Download PDF</span>
            <ExternalLink className="h-4 w-4 flex-shrink-0" />
          </a>
        </div>
      </CardContent>

      <CardFooter>
        <Button onClick={downloadQRCode} className="w-full bg-black hover:bg-gray-800">
          <Download className="mr-2 h-4 w-4" />
          Download QR Code
        </Button>
      </CardFooter>
    </Card>
  )
}
