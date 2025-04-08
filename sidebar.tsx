"use client"

import { useEffect, useState } from "react"
import ReactDOM from "react-dom/client"
import { Button } from "./components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { Badge } from "./components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./components/ui/accordion"
import { Bug, Camera, FileText, X, Clipboard, Github } from "lucide-react"

// Declare chrome variable to avoid errors
declare const chrome: any

type Issue = {
  id: string
  timestamp: number
  url: string
  title: string
  elementDetails?: ElementDetails
  screenshot?: string
  consoleErrors?: ConsoleError[]
  networkErrors?: NetworkError[]
  notes?: string
  severity?: "low" | "medium" | "high"
  category?: string
  tags?: string[]
}

type ElementDetails = {
  selector: string
  xpath: string
  text: string
  attributes: Record<string, string>
  styles: Record<string, string>
  position: { x: number; y: number; width: number; height: number }
  html: string
}

type ConsoleError = {
  message: string
  source: string
  lineNumber: number
  timestamp: number
}

type NetworkError = {
  url: string
  status: number
  statusText: string
  method: string
  timestamp: number
}

type Session = {
  id: string
  startTime: number
  issues: Issue[]
  url: string
}

function Sidebar() {
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [isInspecting, setIsInspecting] = useState(false)
  const [activeTab, setActiveTab] = useState("issues")
  const [chromeApiAvailable, setChromeApiAvailable] = useState(false)

  useEffect(() => {
    // Check if Chrome API is available
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      setChromeApiAvailable(true)

      // Get current session
      try {
        chrome.runtime.sendMessage({ type: "GET_CURRENT_SESSION" }, (response) => {
          if (response && response.session) {
            setCurrentSession(response.session)
          }
        })
      } catch (error) {
        console.error("Error getting current session:", error)
      }

      // Listen for messages from content script
      window.addEventListener("message", (event) => {
        if (event.data.type === "ELEMENT_CAPTURED") {
          // Refresh session data
          try {
            chrome.runtime.sendMessage({ type: "GET_CURRENT_SESSION" }, (response) => {
              if (response && response.session) {
                setCurrentSession(response.session)
              }
            })
          } catch (error) {
            console.error("Error refreshing session data:", error)
          }
        }
      })

      // Listen for session updates
      try {
        chrome.runtime.onMessage.addListener((message) => {
          if (message.type === "SESSION_UPDATED") {
            chrome.runtime.sendMessage({ type: "GET_CURRENT_SESSION" }, (response) => {
              if (response && response.session) {
                setCurrentSession(response.session)
              }
            })
          }
          return true
        })
      } catch (error) {
        console.error("Error setting up message listener:", error)
      }
    } else {
      console.warn("Chrome API not available. Sidebar functionality will be limited.")
    }
  }, [])

  const startInspection = () => {
    setIsInspecting(true)
    window.parent.postMessage({ type: "START_INSPECTION" }, "*")
  }

  const stopInspection = () => {
    setIsInspecting(false)
    window.parent.postMessage({ type: "STOP_INSPECTION" }, "*")
  }

  const takeScreenshot = () => {
    window.parent.postMessage({ type: "TAKE_SCREENSHOT" }, "*")
  }

  const addNote = () => {
    window.parent.postMessage({ type: "add-note" }, "*")
  }

  const exportToMarkdown = () => {
    if (!currentSession) return

    let markdown = `# Bug Report: ${new URL(currentSession.url).hostname}\n\n`
    markdown += `**Date:** ${new Date(currentSession.startTime).toLocaleString()}\n\n`
    markdown += `**URL:** ${currentSession.url}\n\n`
    markdown += `## Issues (${currentSession.issues.length})\n\n`

    currentSession.issues.forEach((issue, index) => {
      markdown += `### Issue ${index + 1}: ${issue.title}\n\n`
      markdown += `**Time:** ${new Date(issue.timestamp).toLocaleString()}\n\n`

      if (issue.notes) {
        markdown += `**Notes:** ${issue.notes}\n\n`
      }

      if (issue.severity) {
        markdown += `**Severity:** ${issue.severity}\n\n`
      }

      if (issue.elementDetails) {
        markdown += `**Element Details:**\n\n`
        markdown += `- Selector: \`${issue.elementDetails.selector}\`\n`
        markdown += `- XPath: \`${issue.elementDetails.xpath}\`\n`
        markdown += `- Text: "${issue.elementDetails.text}"\n\n`

        markdown += `**HTML:**\n\n\`\`\`html\n${issue.elementDetails.html}\n\`\`\`\n\n`
      }

      if (issue.consoleErrors && issue.consoleErrors.length > 0) {
        markdown += `**Console Errors:**\n\n`
        issue.consoleErrors.forEach((error) => {
          markdown += `- ${error.message}\n`
        })
        markdown += "\n"
      }

      if (issue.networkErrors && issue.networkErrors.length > 0) {
        markdown += `**Network Errors:**\n\n`
        issue.networkErrors.forEach((error) => {
          markdown += `- ${error.method} ${error.url} - ${error.status} ${error.statusText}\n`
        })
        markdown += "\n"
      }

      if (issue.screenshot) {
        markdown += `**Screenshot:**\n\n`
        markdown += `![Screenshot](${issue.screenshot})\n\n`
      }

      markdown += "---\n\n"
    })

    const blob = new Blob([markdown], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `bug-report-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToGitHub = () => {
    // This would normally open a dialog to configure GitHub export
    // For the MVP, we'll just show an alert
    alert("GitHub export would be configured here. For the MVP, use Markdown export and paste into GitHub.")
  }

  return (
    <div className="h-screen flex flex-col bg-white text-gray-900">
      <div className="border-b p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-orange-500" />
          <h1 className="font-semibold text-sm sm:text-base">FixHero Dev Inspector</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => window.parent.postMessage({ type: "TOGGLE_SIDEBAR" }, "*")}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-3 border-b">
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          <Button
            onClick={isInspecting ? stopInspection : startInspection}
            className={`flex items-center gap-1 text-xs ${isInspecting ? "bg-red-500 hover:bg-red-600" : ""}`}
            size="sm"
          >
            <Bug className="h-3 w-3" />
            <span className="hidden xs:inline">{isInspecting ? "Stop" : "Inspect"}</span>
          </Button>
          <Button onClick={takeScreenshot} variant="outline" size="sm" className="flex items-center gap-1 text-xs">
            <Camera className="h-3 w-3" />
            <span className="hidden xs:inline">Screenshot</span>
          </Button>
          <Button onClick={addNote} variant="outline" size="sm" className="flex items-center gap-1 text-xs">
            <FileText className="h-3 w-3" />
            <span className="hidden xs:inline">Note</span>
          </Button>
        </div>
      </div>

      {!chromeApiAvailable ? (
        <div className="flex-1 flex items-center justify-center p-4 text-center">
          <div>
            <p className="text-red-500">Chrome extension API not available.</p>
            <p className="text-gray-500 text-sm mt-1">
              This extension must be loaded as a Chrome extension to function properly.
            </p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-2 px-3 pt-3">
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="issues" className="flex-1 overflow-auto p-3">
            {currentSession?.issues.length ? (
              <div className="space-y-3">
                {currentSession.issues.map((issue, index) => (
                  <Card key={issue.id}>
                    <CardHeader className="p-3 pb-0">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>Issue #{index + 1}</span>
                        {issue.severity && (
                          <Badge
                            variant={
                              issue.severity === "high"
                                ? "destructive"
                                : issue.severity === "medium"
                                  ? "default"
                                  : "outline"
                            }
                          >
                            {issue.severity}
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-2">
                      <div className="text-xs text-gray-500 mb-2">{new Date(issue.timestamp).toLocaleString()}</div>

                      {issue.notes && <div className="mb-2 text-sm border-l-2 border-gray-300 pl-2">{issue.notes}</div>}

                      <Accordion type="single" collapsible className="w-full">
                        {issue.elementDetails && (
                          <AccordionItem value="element">
                            <AccordionTrigger className="text-xs py-1">Element Details</AccordionTrigger>
                            <AccordionContent className="text-xs">
                              <div className="space-y-1">
                                <div>
                                  <span className="font-medium">Selector:</span> {issue.elementDetails.selector}
                                </div>
                                <div>
                                  <span className="font-medium">XPath:</span> {issue.elementDetails.xpath}
                                </div>
                                <div>
                                  <span className="font-medium">Text:</span> {issue.elementDetails.text}
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )}

                        {issue.consoleErrors?.length > 0 && (
                          <AccordionItem value="console">
                            <AccordionTrigger className="text-xs py-1">
                              Console Errors ({issue.consoleErrors.length})
                            </AccordionTrigger>
                            <AccordionContent className="text-xs">
                              <div className="space-y-1">
                                {issue.consoleErrors.map((error, i) => (
                                  <div key={i} className="text-red-500">
                                    {error.message}
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )}

                        {issue.networkErrors?.length > 0 && (
                          <AccordionItem value="network">
                            <AccordionTrigger className="text-xs py-1">
                              Network Errors ({issue.networkErrors.length})
                            </AccordionTrigger>
                            <AccordionContent className="text-xs">
                              <div className="space-y-1">
                                {issue.networkErrors.map((error, i) => (
                                  <div key={i} className="text-red-500">
                                    {error.method} {new URL(error.url).pathname} - {error.status} {error.statusText}
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )}
                      </Accordion>

                      {issue.screenshot && (
                        <div className="mt-2">
                          <img
                            src={issue.screenshot || "/placeholder.svg"}
                            alt="Screenshot"
                            className="w-full h-auto border rounded"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <p>No issues captured yet</p>
                  <Button onClick={startInspection} className="mt-2">
                    Start Inspection
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="export" className="flex-1 overflow-auto p-3">
            <Card>
              <CardHeader className="p-3 pb-0">
                <CardTitle className="text-sm">Export Options</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium mb-1">Markdown</h3>
                    <p className="text-xs text-gray-500 mb-2">
                      Export as Markdown file with all details and screenshots
                    </p>
                    <Button
                      onClick={exportToMarkdown}
                      className="w-full flex items-center justify-center gap-2"
                      disabled={!currentSession?.issues.length}
                    >
                      <Clipboard className="h-4 w-4" />
                      Export to Markdown
                    </Button>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-1">GitHub Issues</h3>
                    <p className="text-xs text-gray-500 mb-2">Create GitHub issues from your captured data</p>
                    <Button
                      onClick={exportToGitHub}
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2"
                      disabled={!currentSession?.issues.length}
                    >
                      <Github className="h-4 w-4" />
                      Export to GitHub
                    </Button>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-gray-500">
                      Session: {currentSession ? new URL(currentSession.url).hostname : "None"}
                      <br />
                      Issues: {currentSession?.issues.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

const root = ReactDOM.createRoot(document.getElementById("root")!)
root.render(<Sidebar />)
