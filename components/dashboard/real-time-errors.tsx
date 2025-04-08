"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, BellOff, XCircle, AlertTriangle, Info, X } from "lucide-react"

export function RealTimeErrors() {
  const [isOpen, setIsOpen] = useState(false)
  const [errors, setErrors] = useState<any[]>([])
  const [isActive, setIsActive] = useState(true)

  // Simulate receiving real-time errors
  useEffect(() => {
    if (!isActive) return

    // Mock error types
    const errorTypes = [
      { type: "error", message: "Uncaught TypeError: Cannot read property of undefined", source: "app.js", line: 42 },
      {
        type: "error",
        message: "Failed to load resource: the server responded with a status of 404",
        source: "api/data",
        line: 0,
      },
      {
        type: "warning",
        message: "Resource interpreted as Image but transferred with MIME type text/html",
        source: "images/logo.png",
        line: 0,
      },
      {
        type: "info",
        message: "A cookie associated with a cross-site resource was set without the `SameSite` attribute",
        source: "",
        line: 0,
      },
      { type: "error", message: "Uncaught SyntaxError: Unexpected token", source: "bundle.js", line: 1337 },
      { type: "warning", message: "Synchronous XMLHttpRequest is deprecated", source: "utils.js", line: 24 },
    ]

    // Simulate random errors coming in
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        // 30% chance of new error
        const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)]
        const newError = {
          ...randomError,
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
        }
        setErrors((prev) => [newError, ...prev].slice(0, 50)) // Keep last 50 errors

        // Auto-open on new error
        if (!isOpen) {
          setIsOpen(true)
        }
      }
    }, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [isActive, isOpen])

  const handleDismiss = (id: number) => {
    setErrors((prev) => prev.filter((error) => error.id !== id))
  }

  const handleClearAll = () => {
    setErrors([])
  }

  const getErrorIcon = (type: string) => {
    switch (type) {
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="rounded-full h-12 w-12 bg-background shadow-md"
        onClick={() => setIsOpen(true)}
      >
        <Bell className="h-5 w-5" />
        {errors.length > 0 && (
          <Badge
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
            variant="destructive"
          >
            {errors.length}
          </Badge>
        )}
      </Button>
    )
  }

  return (
    <Card className="w-80 shadow-lg">
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="font-medium">Real-Time Errors</span>
            {errors.length > 0 && <Badge variant="outline">{errors.length}</Badge>}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsActive(!isActive)}
              title={isActive ? "Pause monitoring" : "Resume monitoring"}
            >
              {isActive ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)} title="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-80">
          {errors.length > 0 ? (
            <div className="divide-y">
              {errors.map((error) => (
                <div key={error.id} className="p-3 hover:bg-muted">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      {getErrorIcon(error.type)}
                      <div>
                        <div className="font-mono text-xs">{error.message}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {error.source && <span className="mr-2">{error.source}</span>}
                          {error.line > 0 && <span>Line: {error.line}</span>}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDismiss(error.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 text-right">{error.timestamp}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">No errors to display</div>
          )}
        </ScrollArea>

        {errors.length > 0 && (
          <div className="p-2 border-t">
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={handleClearAll}>
              Clear All
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
