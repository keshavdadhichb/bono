import { redirect } from "next/navigation"
import PasswordProtection from "@/components/password-protection"
import { cookies } from "next/headers"

export default function Home() {
  const cookieStore = cookies()
  const isAuthenticated = cookieStore.get("auth-token")?.value === "Bonostyle@1234"

  if (isAuthenticated) {
    redirect("/dashboard")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-white">
      <h1 className="text-3xl font-bold mb-8 text-black">BonoStyle Internal QR Generation Tool</h1>
      <PasswordProtection />
    </main>
  )
}
