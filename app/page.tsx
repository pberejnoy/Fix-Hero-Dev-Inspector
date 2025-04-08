"use client"

import { useState, useEffect } from "react"
import { LoginScreen } from "@/components/login-screen"
import { Dashboard } from "@/components/dashboard"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import { generateSecureToken, validateCredentials, verifyToken } from "@/lib/auth"
import ErrorBoundary from "@/components/error-boundary"
import { GlobalErrorHandler } from "@/components/global-error-handler"

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<{ email: string } | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Check if user is already logged in
    const authToken = localStorage.getItem("fixhero_auth_token")
    const userEmail = localStorage.getItem("fixhero_user_email")

    if (authToken && userEmail) {
      // Validate the token
      const isValid = verifyToken(authToken)

      if (isValid) {
        setIsLoggedIn(true)
        setUser({ email: userEmail })
      } else {
        // Token is invalid or expired, clear it
        localStorage.removeItem("fixhero_auth_token")
        localStorage.removeItem("fixhero_user_email")
        localStorage.removeItem("fixhero_login_time")

        toast({
          title: "Session expired",
          description: "Your session has expired. Please log in again.",
        })
      }
    }
    setIsLoading(false)
  }, [toast])

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true)

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Validate credentials (in a real app, this would be a secure API call)
      const isValid = validateCredentials(email, password)

      if (isValid) {
        // Create a secure token (in a real app, this would be a JWT from a server)
        const token = generateSecureToken(email)

        // Store auth data
        localStorage.setItem("fixhero_auth_token", token)
        localStorage.setItem("fixhero_user_email", email)
        localStorage.setItem("fixhero_login_time", Date.now().toString())

        setUser({ email })
        setIsLoggedIn(true)

        toast({
          title: "Login successful",
          description: `Welcome to FixHero Dev Inspector, ${email.split("@")[0]}`,
        })
      } else {
        throw new Error("Invalid credentials")
      }
    } catch (error) {
      // Error is handled by the login component
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("fixhero_auth_token")
    localStorage.removeItem("fixhero_user_email")
    localStorage.removeItem("fixhero_login_time")
    setIsLoggedIn(false)
    setUser(null)

    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <GlobalErrorHandler>
        <main className="min-h-screen bg-gray-50">
          {!isLoggedIn ? <LoginScreen onLogin={handleLogin} /> : <Dashboard onLogout={handleLogout} user={user} />}
          <Toaster />
        </main>
      </GlobalErrorHandler>
    </ErrorBoundary>
  )
}
