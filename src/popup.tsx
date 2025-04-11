"use client"

import React, { useEffect, useState } from "react"
import ReactDOM from "react-dom/client"
import { Dashboard } from "./components/dashboard/dashboard"
import { LoginScreen } from "./components/login-screen"
import { Toaster } from "./components/ui/toaster"
import { useToast } from "./components/ui/use-toast"
import { getCurrentUser, loginUser, logoutUser } from "./lib/auth-service"
import { initSyncService } from "./lib/sync-service"
import ErrorBoundary from "./components/error-boundary"
import { GlobalErrorHandler } from "./components/global-error-handler"
import { ThemeProvider } from "./components/theme-provider"
import { Confetti } from "./components/ui/confetti"
import { motion, AnimatePresence } from "framer-motion"
import type { User } from "./lib/types"

// Declare chrome if it's not already defined (e.g., in a testing environment)
declare const chrome: any

function Popup() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [showFirstLoginConfetti, setShowFirstLoginConfetti] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
          setIsLoggedIn(true)

          // Initialize sync service
          initSyncService()
        }
      } catch (error) {
        console.error("Error checking auth:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true)

    try {
      const { user } = await loginUser(email, password)
      setUser(user)
      setIsLoggedIn(true)

      // Initialize sync service
      initSyncService()

      // Check if this is the first login
      chrome.storage.local.get(["fixhero_first_login"], (result) => {
        if (result.fixhero_first_login) {
          // Show confetti
          setShowFirstLoginConfetti(true)

          // Play sound
          chrome.runtime.sendMessage({
            action: "playSound",
            soundUrl: "sounds/success.mp3",
          })

          // Mark first login as complete
          chrome.storage.local.set({ fixhero_first_login: false })
        }
      })

      toast({
        title: "Login successful",
        description: `Welcome back, ${user.displayName || email.split("@")[0]}`,
      })
    } catch (error) {
      console.error("Login error:", error)
      // Error is handled by the login component
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logoutUser()
      setIsLoggedIn(false)
      setUser(null)

      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      })
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      })
    }
  }

  return (
    <ErrorBoundary>
      <GlobalErrorHandler>
        <ThemeProvider>
          <main className="min-h-screen bg-background text-foreground transition-colors duration-300">
            {showFirstLoginConfetti && <Confetti />}

            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center min-h-screen"
                >
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </motion.div>
              ) : !isLoggedIn ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <LoginScreen onLogin={handleLogin} />
                </motion.div>
              ) : (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Dashboard onLogout={handleLogout} user={user} />
                </motion.div>
              )}
            </AnimatePresence>

            <Toaster />
          </main>
        </ThemeProvider>
      </GlobalErrorHandler>
    </ErrorBoundary>
  )
}

// Initialize the popup
const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement)
root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
)
