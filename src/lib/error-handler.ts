/**
 * Error Handler
 * Comprehensive error handling and reporting system
 */

// Type declaration for the global chrome object
declare const chrome: any

// Error severity levels
export enum ErrorSeverity {
  CRITICAL = "critical",
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
}

// Error categories
export enum ErrorCategory {
  NETWORK = "network",
  STORAGE = "storage",
  UI = "ui",
  SYNC = "sync",
  AUTHENTICATION = "authentication",
  EXTENSION = "extension",
  UNKNOWN = "unknown",
}

// Error interface
export interface ErrorReport {
  id: string
  message: string
  stack?: string
  category: ErrorCategory
  severity: ErrorSeverity
  timestamp: number
  context?: Record<string, any>
  userAgent?: string
  url?: string
  handled: boolean
}

// Check if we're in a Chrome extension environment
const isExtensionEnvironment = typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id

// Error handler class
export class ErrorHandler {
  private errors: ErrorReport[] = []
  private maxErrors = 100
  private errorListeners: Array<(error: ErrorReport) => void> = []

  constructor() {
    // Initialize error handler
    this.initialize()
  }

  // Initialize error handler
  private initialize(): void {
    if (!isExtensionEnvironment) {
      console.log("Error handler is only fully functional in the extension environment")
      return
    }

    // Set up global error handlers
    this.setupGlobalErrorHandlers()

    // Load existing errors from storage
    this.loadErrors()
  }

  // Set up global error handlers
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled errors
    window.addEventListener("error", (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        category: ErrorCategory.UNKNOWN,
        severity: ErrorSeverity.ERROR,
        url: event.filename,
        handled: false,
      })

      // Don't prevent default behavior
      return false
    })

    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.reportError({
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        category: ErrorCategory.UNKNOWN,
        severity: ErrorSeverity.ERROR,
        handled: false,
      })

      // Don't prevent default behavior
      return false
    })

    // Listen for error messages from content scripts
    if (chrome.runtime) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "reportError") {
          this.reportError({
            ...message.error,
            url: sender.url,
            handled: true,
          })

          sendResponse({ success: true })
        }
      })
    }
  }

  // Load errors from storage
  private async loadErrors(): Promise<void> {
    if (!isExtensionEnvironment) return

    try {
      return new Promise((resolve) => {
        chrome.storage.local.get("errorReports", (result) => {
          if (result.errorReports) {
            this.errors = result.errorReports
          }
          resolve()
        })
      })
    } catch (error) {
      console.error("Failed to load errors from storage:", error)
    }
  }

  // Save errors to storage
  private async saveErrors(): Promise<void> {
    if (!isExtensionEnvironment) return

    try {
      return new Promise((resolve) => {
        chrome.storage.local.set({ errorReports: this.errors }, () => {
          resolve()
        })
      })
    } catch (error) {
      console.error("Failed to save errors to storage:", error)
    }
  }

  // Report an error
  public reportError(error: Partial<ErrorReport>): ErrorReport {
    // Generate a unique ID if not provided
    const id = error.id || this.generateErrorId()

    // Create the error report
    const errorReport: ErrorReport = {
      id,
      message: error.message || "Unknown error",
      stack: error.stack,
      category: error.category || ErrorCategory.UNKNOWN,
      severity: error.severity || ErrorSeverity.ERROR,
      timestamp: error.timestamp || Date.now(),
      context: error.context,
      userAgent: error.userAgent || navigator.userAgent,
      url: error.url,
      handled: error.handled || false,
    }

    // Add to errors list
    this.errors.unshift(errorReport)

    // Trim the list if it's too long
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors)
    }

    // Save to storage
    this.saveErrors()

    // Log to console
    this.logError(errorReport)

    // Notify listeners
    this.notifyErrorListeners(errorReport)

    return errorReport
  }

  // Log error to console
  private logError(error: ErrorReport): void {
    const logMethod =
      error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.ERROR
        ? console.error
        : error.severity === ErrorSeverity.WARNING
          ? console.warn
          : console.info

    logMethod(
      `[${error.severity.toUpperCase()}] [${error.category}] ${error.message}`,
      error.stack ? { stack: error.stack } : "",
      error.context ? { context: error.context } : "",
    )
  }

  // Generate a unique error ID
  private generateErrorId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
  }

  // Get all errors
  public getErrors(): ErrorReport[] {
    return [...this.errors]
  }

  // Get errors by category
  public getErrorsByCategory(category: ErrorCategory): ErrorReport[] {
    return this.errors.filter((error) => error.category === category)
  }

  // Get errors by severity
  public getErrorsBySeverity(severity: ErrorSeverity): ErrorReport[] {
    return this.errors.filter((error) => error.severity === severity)
  }

  // Clear all errors
  public clearErrors(): void {
    this.errors = []
    this.saveErrors()
  }

  // Add error listener
  public addErrorListener(listener: (error: ErrorReport) => void): () => void {
    this.errorListeners.push(listener)

    // Return a function to remove the listener
    return () => {
      this.errorListeners = this.errorListeners.filter((l) => l !== listener)
    }
  }

  // Notify all error listeners
  private notifyErrorListeners(error: ErrorReport): void {
    this.errorListeners.forEach((listener) => {
      try {
        listener(error)
      } catch (err) {
        console.error("Error in error listener:", err)
      }
    })
  }

  // Send error reports to server
  public async sendErrorReports(): Promise<void> {
    if (!isExtensionEnvironment) return

    // Get unsent error reports
    const unsentErrors = this.errors.filter((error) => !error.context?.sent)

    if (unsentErrors.length === 0) return

    try {
      // In a real implementation, this would send the errors to a server
      console.log(`Sending ${unsentErrors.length} error reports to server`)

      // Mark errors as sent
      unsentErrors.forEach((error) => {
        if (!error.context) error.context = {}
        error.context.sent = true
      })

      // Save to storage
      this.saveErrors()
    } catch (error) {
      console.error("Failed to send error reports:", error)
    }
  }
}

// Create and export a singleton instance
export const errorHandler = new ErrorHandler()

// Utility function to wrap async functions with error handling
export function withErrorHandling<T>(
  fn: (...args: any[]) => Promise<T>,
  category: ErrorCategory,
  severity: ErrorSeverity = ErrorSeverity.ERROR
): (...args: any[]) => Promise<T> {
  return async (...args: any[]) => {
    try {
      return await fn(...args)\
    } catch (error  {
  return async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      // Report the error
      errorHandler.reportError({
        message: error.message,
        stack: error.stack,
        category,
        severity,
        context: { args },
        handled: true
      })
      
      // Re-throw the error
      throw error
    }
  }
}

// Utility function to create a user-friendly error message
export function getUserFriendlyErrorMessage(error: Error | string, fallback = "An unexpected error occurred"): string {
  if (typeof error === 'string') {
    return error
  }
  
  // Map common error messages to user-friendly messages
  const errorMap: Record<string, string> = {
    'Failed to fetch': 'Network connection error. Please check your internet connection and try again.',
    'NetworkError': 'Network connection error. Please check your internet connection and try again.',
    'Unauthorized': 'You are not authorized to perform this action. Please log in and try again.',
    'Permission denied': 'You do not have permission to perform this action.',
    'Not found': 'The requested resource was not found.',
    'Timeout': 'The operation timed out. Please try again later.',
    'Quota exceeded': 'Storage quota exceeded. Please free up some space and try again.',
  }
  
  // Check if the error message contains any of the keys in the error map
  for (const [key, message] of Object.entries(errorMap)) {
    if (error.message.includes(key)) {
      return message
    }
  }
  
  // Return the original error message or fallback
  return error.message || fallback
}
