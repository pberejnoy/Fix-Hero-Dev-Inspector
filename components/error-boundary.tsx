"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console or error reporting service
    console.error("Uncaught error:", error, errorInfo)
    this.setState({ errorInfo })

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  private handleRefresh = (): void => {
    window.location.reload()
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Otherwise, use the default error UI
      return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-6 w-6" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">
                  An unexpected error occurred in the application. This could be due to a temporary issue or a bug.
                </p>

                {this.state.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md overflow-auto">
                    <p className="font-mono text-sm text-red-800">{this.state.error.toString()}</p>
                  </div>
                )}

                <p className="text-sm text-gray-500">
                  Try refreshing the page or clicking the reset button below. If the problem persists, please contact
                  support.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={this.handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
              <Button onClick={this.handleReset} className="bg-orange-500 hover:bg-orange-600">
                Try Again
              </Button>
            </CardFooter>
          </Card>
        </div>
      )
    }

    // If there's no error, render children normally
    return this.props.children
  }
}

export default ErrorBoundary
