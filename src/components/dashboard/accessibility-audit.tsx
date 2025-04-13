"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { AlertCircle, CheckCircle, AlertTriangle, Info, Accessibility } from "lucide-react"
import { checkAccessibility, type AccessibilityResult } from "@/lib/accessibility-checker"

interface AccessibilityAuditProps {
  elementSelector?: string
}

export function AccessibilityAudit({ elementSelector }: AccessibilityAuditProps) {
  const [result, setResult] = useState<AccessibilityResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runAudit = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get the element to audit
      let element: HTMLElement | null = null

      if (elementSelector) {
        element = document.querySelector(elementSelector) as HTMLElement
      } else {
        // If no selector provided, ask user to click on an element
        element = await new Promise((resolve) => {
          const overlay = document.createElement("div")
          overlay.style.position = "fixed"
          overlay.style.top = "0"
          overlay.style.left = "0"
          overlay.style.width = "100%"
          overlay.style.height = "100%"
          overlay.style.backgroundColor = "rgba(0, 0, 0, 0.3)"
          overlay.style.zIndex = "9999"
          overlay.style.cursor = "crosshair"
          overlay.style.display = "flex"
          overlay.style.alignItems = "center"
          overlay.style.justifyContent = "center"

          const message = document.createElement("div")
          message.style.backgroundColor = "white"
          message.style.padding = "20px"
          message.style.borderRadius = "8px"
          message.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)"
          message.style.maxWidth = "400px"
          message.style.textAlign = "center"
          message.innerHTML =
            "<h3>Click on an element to audit</h3><p>Click any element on the page to check its accessibility</p>"

          overlay.appendChild(message)
          document.body.appendChild(overlay)

          const handleClick = (e: MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()

            // Don't select the overlay or message
            if (e.target === overlay || overlay.contains(e.target as Node)) {
              return
            }

            document.body.removeChild(overlay)
            document.removeEventListener("click", handleClick, true)
            resolve(e.target as HTMLElement)
          }

          document.addEventListener("click", handleClick, true)
        })
      }

      if (!element) {
        throw new Error("No element selected for audit")
      }

      // Run the accessibility check
      const auditResult = checkAccessibility(element)
      setResult(auditResult)
    } catch (err) {
      console.error("Error running accessibility audit:", err)
      setError("Failed to run accessibility audit. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "high":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case "medium":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "low":
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  // Get score color
  const getScoreColor = (score: number): string => {
    if (score >= 90) return "text-green-500"
    if (score >= 70) return "text-yellow-500"
    if (score >= 50) return "text-orange-500"
    return "text-red-500"
  }

  // Get score rating
  const getScoreRating = (score: number): string => {
    if (score >= 90) return "Excellent"
    if (score >= 70) return "Good"
    if (score >= 50) return "Needs Improvement"
    return "Poor"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Accessibility Audit</h2>
        <Button onClick={runAudit} disabled={loading}>
          {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <Accessibility className="mr-2 h-4 w-4" />}
          Run Audit
        </Button>
      </div>

      {error && <div className="rounded-md bg-destructive/10 p-4 text-destructive">{error}</div>}

      {loading && !result && (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
          <span className="ml-2">Running accessibility audit...</span>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Results</CardTitle>
              <CardDescription>Element: {result.element}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-4xl font-bold ${getScoreColor(result.score)}`}>{result.score}</div>
                  <p className="text-sm text-muted-foreground">Accessibility Score</p>
                </div>
                <Badge variant={result.score >= 70 ? "default" : "destructive"} className="text-lg px-3 py-1">
                  {getScoreRating(result.score)}
                </Badge>
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium">Issues Found: {result.issues.length}</p>
                {result.issues.length === 0 && (
                  <div className="mt-2 flex items-center text-green-500">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    <span>No accessibility issues detected!</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {result.issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Issues</CardTitle>
                <CardDescription>Accessibility issues found in the selected element</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList>
                    <TabsTrigger value="all">All Issues</TabsTrigger>
                    <TabsTrigger value="critical">Critical</TabsTrigger>
                    <TabsTrigger value="high">High</TabsTrigger>
                    <TabsTrigger value="medium">Medium</TabsTrigger>
                    <TabsTrigger value="low">Low</TabsTrigger>
                  </TabsList>

                  {["all", "critical", "high", "medium", "low"].map((severity) => (
                    <TabsContent key={severity} value={severity} className="space-y-4">
                      {result.issues
                        .filter((issue) => severity === "all" || issue.severity === severity)
                        .map((issue, index) => (
                          <div key={index} className="rounded-md border p-4">
                            <div className="flex items-start">
                              <div className="mr-3 mt-0.5">{getSeverityIcon(issue.severity)}</div>
                              <div>
                                <h4 className="font-medium">{issue.type}</h4>
                                <p className="mt-1 text-sm text-muted-foreground">{issue.description}</p>
                                {issue.helpUrl && (
                                  <a
                                    href={issue.helpUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-block text-sm text-blue-500 hover:underline"
                                  >
                                    Learn more
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                      {result.issues.filter((issue) => severity === "all" || issue.severity === severity).length ===
                        0 && (
                        <div className="rounded-md bg-muted p-4 text-center">
                          No {severity !== "all" ? severity : ""} issues found
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
