"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, X } from "lucide-react"
import { errorHandler, type ErrorReport, ErrorSeverity } from "@/lib/error-handler"
import { getUserFriendlyErrorMessage } from "@/lib/error-handler"

interface ErrorDisplayProps {
  error?: Error | string
  title?: string
  severity?: ErrorSeverity
  onClose?: () => void
  autoClose?: boolean
  autoCloseDelay?: number
}

export function ErrorDisplay({
  error,
  title = "Error",
  severity = ErrorSeverity.ERROR,
  onClose,
  autoClose = false,
  autoCloseDelay = 5000,
}: ErrorDisplayProps) {
  const [visible, setVisible] = useState(true)

  // Auto-close the error after a delay
  useEffect(() => {
    if (autoClose && visible) {
      const timer = setTimeout(() => {
        handleClose()
      }, autoCloseDelay)

      return () => clearTimeout(timer)
    }
  }, [autoClose, visible, autoCloseDelay])

  // Handle close
  const handleClose = () => {
    setVisible(false)
    if (onClose) onClose()
  }

  // If not visible, don't render
  if (!visible || !error) return null

  // Get user-friendly error message
  const errorMessage = getUserFriendlyErrorMessage(error)

  return (
    <Alert
      variant={severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.ERROR ? "destructive" : "default"}
      className="relative"
    >
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{errorMessage}</AlertDescription>
      <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0" onClick={handleClose}>
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </Button>
    </Alert>
  )
}

// Component to display the most recent error from the error handler
export function LatestErrorDisplay() {
  const [latestError, setLatestError] = useState<ErrorReport | null>(null)

  useEffect(() => {
    // Get the latest error
    const errors = errorHandler.getErrors()
    if (errors.length > 0) {
      setLatestError(errors[0])
    }

    // Subscribe to new errors
    const unsubscribe = errorHandler.addErrorListener((error) => {
      setLatestError(error)
    })

    return unsubscribe
  }, [])

  if (!latestError) return null

  return (
    <ErrorDisplay
      error={latestError.message}
      title={`${latestError.severity.charAt(0).toUpperCase() + latestError.severity.slice(1)}: ${latestError.category}`}
      severity={latestError.severity}
      autoClose={true}
    />
  )
}
