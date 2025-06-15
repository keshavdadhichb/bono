"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testSystem = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/status")
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>System Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testSystem} disabled={loading} className="w-full">
            {loading ? "Testing..." : "Test System"}
          </Button>

          {result && (
            <div className="mt-4">
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
