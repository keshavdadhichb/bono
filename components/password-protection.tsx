"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock } from "lucide-react"

export default function PasswordProtection() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password === "Bonostyle@1234") {
      document.cookie = `auth-token=${password}; path=/; max-age=${60 * 60 * 24}`
      router.push("/dashboard")
      router.refresh()
    } else {
      setError("Incorrect password. Please try again.")
    }
  }

  return (
    <Card className="w-full max-w-md border border-gray-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Password Protected
        </CardTitle>
        <CardDescription>Enter the password to access the QR generation tool</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="grid gap-4">
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-gray-300"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-black hover:bg-gray-800">
            Access Tool
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
