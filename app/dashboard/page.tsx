import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import UploadForm from "@/components/upload-form"

export default function Dashboard() {
  const cookieStore = cookies()
  const isAuthenticated = cookieStore.get("auth-token")?.value === "Bonostyle@1234"

  if (!isAuthenticated) {
    redirect("/")
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-white">
      <h1 className="text-3xl font-bold mb-8 text-black">BonoStyle Internal QR Generation Tool</h1>
      <UploadForm />
    </main>
  )
}
