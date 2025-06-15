"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, LinkIcon } from "lucide-react"
import QRCode from "qrcode"

interface QRCodeDisplayProps {
  url: string
  fileName: string
}

export default function QRCodeDisplay({ url, fileName }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 240,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })
    }
  }, [url])

  const downloadQRCode = () => {
    if (canvasRef.current) {
      const link = document.createElement("a")
      link.download = `${fileName.replace(/\.[^/.]+$/, "")}-QR.png`
      link.href = canvasRef.current.toDataURL("image/png")
      link.click()
    }
  }

  return (
    <Card className="w-full border border-gray-200">
      <CardContent className="flex flex-col items-center pt-6">
        <div className="flex flex-col items-center mb-4">
          <canvas ref={canvasRef} className="mb-2" />
          <p className="text-sm text-center font-medium text-gray-700 mt-2 max-w-[240px] break-words">{fileName}</p>
        </div>

        <div className="flex items-center gap-2 mt-4 w-full">
          <div className="flex-1 p-3 bg-gray-50 rounded-md border border-gray-200 text-sm truncate">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              <LinkIcon className="h-3 w-3" />
              <span className="truncate">{url}</span>
            </a>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={downloadQRCode} className="w-full flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download QR Code
        </Button>
      </CardFooter>
    </Card>
  )
}
