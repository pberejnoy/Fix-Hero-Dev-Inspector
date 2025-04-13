"use client"

import { useState } from "react"
import { DashboardPreview } from "@/components/dashboard/dashboard-preview"
import { LoginScreenPreview } from "@/components/login-screen-preview"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Mock login function for preview
  const handleLogin = async (email: string, password: string) => {
    // Simulate login
    setUser({
      id: "preview-user-id",
      email: email,
      displayName: email.split("@")[0],
    })
    setIsLoggedIn(true)
    return { user: { email } }
  }

  // Mock logout function for preview
  const handleLogout = async () => {
    setUser(null)
    setIsLoggedIn(false)
  }

  return (
    <ThemeProvider>
      <main className="min-h-screen bg-background text-foreground">
        {isLoggedIn ? (
          <DashboardPreview onLogout={handleLogout} user={user} />
        ) : (
          <LoginScreenPreview onLogin={handleLogin} />
        )}
        <Toaster />

        {/* Preview environment indicator */}
        <div className="fixed bottom-2 right-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
          PREVIEW MODE
        </div>
      </main>
    </ThemeProvider>
  )
}
