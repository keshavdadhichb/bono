"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, HardDrive, Clock } from "lucide-react"

export default function StatusPage() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/status")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      setStatus({ success: false, error: "Failed to check status" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-6 w-6" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button onClick={checkStatus} disabled={loading} className="w-full">
            {loading ? "Checking..." : "Refresh Status"}
          </Button>

          {status && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold text-blue-600">{status.filesStored || 0}</div>
                <div className="text-sm text-blue-700">Files Stored</div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Clock className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold text-green-600">{status.uptime || "0s"}</div>
                <div className="text-sm text-green-700">Uptime</div>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <HardDrive className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold text-purple-600">
                  {status.memoryUsage ? `${status.memoryUsage}MB` : "N/A"}
                </div>
                <div className="text-sm text-purple-700">Memory Usage</div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">System Information</h3>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>✅ No external dependencies required</li>
              <li>✅ Files stored in server memory</li>
              <li>✅ Automatic cleanup (keeps last 100 files)</li>
              <li>✅ Supports up to 100MB PDF files</li>
              <li>⚠️ Files are temporary and may be cleared on restart</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
