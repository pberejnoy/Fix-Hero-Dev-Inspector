"use client"

import type React from "react"

import { useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"

interface GlobalErrorHandlerProps {
  children: React.ReactNode
  onError?: (error: Error | PromiseRejectionEvent) => void
}

export function GlobalErrorHandler({ children, onError }: GlobalErrorHandlerProps) {
  const { toast } = useToast()

  useEffect(() => {
    // Handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason)

      // Call the onError callback if provided
      if (onError) {
        onError(event)
      }

      toast({
        title: "An error occurred",
        description: "Something went wrong. Please try again or refresh the page.",
        variant: "destructive",
      })

      // Prevent the default browser behavior
      event.preventDefault()
    }

    // Handler for uncaught exceptions
    const handleError = (event: ErrorEvent) => {
      console.error("Uncaught error:", event.error || event.message)

      // Call the onError callback if provided
      if (onError && event.error) {
        onError(event.error)
      }

      // Don't show toast for syntax errors as they're usually caught during development
      if (!event.message.includes("SyntaxError")) {
        toast({
          title: "An error occurred",
          description: "Something went wrong. Please try again or refresh the page.",
          variant: "destructive",
        })
      }

      // Prevent the default browser behavior
      event.preventDefault()
    }

    // Add event listeners
    window.addEventListener("unhandledrejection", handleUnhandledRejection)
    window.addEventListener("error", handleError)

    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
      window.removeEventListener("error", handleError)
    }
  }, [toast, onError])

  return children
}
