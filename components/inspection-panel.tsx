"use client"

import { useState, useEffect } from "react"
import { Bug, Clipboard, Github, AlertTriangle, Zap, Edit, Save, X, Camera, Download, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Issue, Session, ExportOptions } from "@/lib/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FlowCoverageMap } from "@/components/flow-coverage-map"
import { useToast } from "@/components/ui/use-toast"
import { exportToMarkdown, exportToJSON, exportToCSV, downloadAsFile } from "@/lib/export-utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

// Add imports for AI components
import { AITagSuggestions } from "@/components/ai-tag-suggestions"
import { AISummaryComponent } from "@/components/ai-summary"

interface InspectionPanelProps {
  activeTab: string
  issues: Issue[]
  currentSession: Session | null
  selectedIssue: Issue | null
  onUpdateIssue: (issue: Issue) => void
  onAddIssue: (issue: Issue) => void
  onDeleteIssue: (issueId: string) => void
  onTakeScreenshot: () => void
  onStartInspection: () => void
  onStopInspection: () => void
  isInspecting: boolean
}

export function InspectionPanel({
  activeTab,
  issues,
  currentSession,
  selectedIssue,
  onUpdateIssue,
  onAddIssue,
  onDeleteIssue,
  onTakeScreenshot,
  onStartInspection,
  onStopInspection,
  isInspecting,
}: InspectionPanelProps) {
  const [editMode, setEditMode] = useState(false)
  const [editedIssue, setEditedIssue] = useState<Issue | null>(null)
  const [newTag, setNewTag] = useState("")
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeScreenshots: true,
    includeConsoleErrors: true,
    includeNetworkErrors: true,
    includeElementDetails: true,
    format: "markdown",
  })
  const [githubOptions, setGithubOptions] = useState({
    repo: "",
    token: "",
    labels: [] as string[],
    assignees: [] as string[],
  })
  const [exportTab, setExportTab] = useState("markdown")
  const { toast } = useToast()

  useEffect(() => {
    // Reset edit mode when selected issue changes
    setEditMode(false)
    setEditedIssue(null)
  }, [selectedIssue])

  const handleEditStart = () => {
    setEditedIssue(selectedIssue)
    setEditMode(true)
  }

  const handleEditCancel = () => {
    setEditMode(false)
    setEditedIssue(null)
  }

  const handleEditSave = () => {
    if (editedIssue) {
      onUpdateIssue(editedIssue)
      setEditMode(false)
      setEditedIssue(null)
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && editedIssue) {
      const updatedTags = [...(editedIssue.tags || []), newTag.trim()]
      setEditedIssue({
        ...editedIssue,
        tags: updatedTags,
      })
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    if (editedIssue) {
      const updatedTags = editedIssue.tags?.filter((tag) => tag !== tagToRemove) || []
      setEditedIssue({
        ...editedIssue,
        tags: updatedTags,
      })
    }
  }

  const handleExportMarkdown = () => {
    if (!currentSession || issues.length === 0) return

    const markdown = exportToMarkdown(issues, currentSession, exportOptions)
    downloadAsFile(markdown, `bug-report-${new Date().toISOString().slice(0, 10)}.md`, "text/markdown")

    toast({
      title: "Export successful",
      description: "Markdown file has been downloaded",
    })
  }

  const handleExportJSON = () => {
    if (!currentSession || issues.length === 0) return

    const json = exportToJSON(issues, currentSession, exportOptions)
    downloadAsFile(json, `bug-report-${new Date().toISOString().slice(0, 10)}.json`, "application/json")

    toast({
      title: "Export successful",
      description: "JSON file has been downloaded",
    })
  }

  const handleExportCSV = () => {
    if (!currentSession || issues.length === 0) return

    const csv = exportToCSV(issues, currentSession)
    downloadAsFile(csv, `bug-report-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv")

    toast({
      title: "Export successful",
      description: "CSV file has been downloaded",
    })
  }

  const handleExportGitHub = () => {
    if (!currentSession || issues.length === 0) return

    if (!githubOptions.repo || !githubOptions.token) {
      toast({
        title: "Export failed",
        description: "Please provide a repository name and GitHub token",
        variant: "destructive",
      })
      return
    }

    // In a real implementation, this would make API calls to GitHub
    // For now, we'll just show a success message
    toast({
      title: "GitHub export initiated",
      description: `Creating ${issues.length} issues in ${githubOptions.repo}`,
    })
  }

  const handleDeleteIssue = () => {
    if (selectedIssue) {
      if (confirm("Are you sure you want to delete this issue?")) {
        onDeleteIssue(selectedIssue.id)
      }
    }
  }

  return (
    <div className="flex-1 overflow-hidden">
      {activeTab === "inspector" && (
        <div className="h-full flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Element Inspector</h2>
              <p className="text-sm text-gray-500">Click on any element to inspect it and capture details</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={onTakeScreenshot} variant="outline" className="flex items-center gap-1">
                <Camera className="h-4 w-4" />
                Screenshot
              </Button>
              <Button
                onClick={isInspecting ? onStopInspection : onStartInspection}
                className={cn(
                  "flex items-center gap-1",
                  isInspecting ? "bg-red-500 hover:bg-red-600" : "bg-orange-500 hover:bg-orange-600",
                )}
              >
                <Bug className="h-4 w-4" />
                {isInspecting ? "Stop Inspection" : "Start Inspection"}
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0 p-4 flex items-center justify-center bg-gray-100">
              <div className="relative w-full max-w-3xl h-[80vh] border shadow-lg rounded-md overflow-hidden">
                <div className="h-8 bg-gray-200 flex items-center px-2 border-b">
                  <div className="flex space-x-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="mx-auto text-xs text-gray-600">{currentSession?.url || window.location.href}</div>
                </div>
                <div className="h-[calc(100%-2rem)] overflow-auto bg-white">
                  <iframe src="about:blank" className="w-full h-full border-0" title="Website Preview" />
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80">
                    <div className="text-center p-6 bg-white rounded-lg shadow-lg">
                      <Bug className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Inspector Ready</h3>
                      <p className="text-gray-600 mb-4">
                        {isInspecting
                          ? "Click on any element on the page to inspect it."
                          : 'Click "Start Inspection" to begin inspecting elements on this page.'}
                      </p>
                      <div className="flex justify-center gap-2">
                        <Button
                          onClick={isInspecting ? onStopInspection : onStartInspection}
                          className={isInspecting ? "bg-red-500 hover:bg-red-600" : "bg-orange-500 hover:bg-orange-600"}
                        >
                          {isInspecting ? "Stop Inspection" : "Start Inspection"}
                        </Button>
                        <Button onClick={onTakeScreenshot} variant="outline">
                          Take Screenshot
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-4">
                        Keyboard shortcuts: Ctrl+Shift+I to start/stop inspection, Ctrl+Shift+S for screenshot
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "issues" && (
        <div className="h-full flex flex-col">
          {selectedIssue ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold">{selectedIssue.title}</h2>
                  <p className="text-sm text-gray-500">{new Date(selectedIssue.timestamp).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  {!editMode ? (
                    <>
                      <Button
                        onClick={handleDeleteIssue}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1 text-red-500 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                      <Button onClick={handleEditStart} size="sm" variant="outline" className="flex items-center gap-1">
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={handleEditCancel}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleEditSave}
                        size="sm"
                        className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600"
                      >
                        <Save className="h-4 w-4" />
                        Save
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                {!editMode ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {selectedIssue.severity && (
                        <Badge
                          variant={
                            selectedIssue.severity === "critical"
                              ? "destructive"
                              : selectedIssue.severity === "high"
                                ? "destructive"
                                : selectedIssue.severity === "medium"
                                  ? "default"
                                  : "outline"
                          }
                        >
                          {selectedIssue.severity} severity
                        </Badge>
                      )}
                      {selectedIssue.tags?.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="p-3 border rounded-md">
                      <h3 className="text-sm font-medium mb-2">URL</h3>
                      <p className="text-sm font-mono break-all">{selectedIssue.url}</p>
                    </div>

                    {selectedIssue.notes && (
                      <div className="p-3 border rounded-md">
                        <h3 className="text-sm font-medium mb-2">Notes</h3>
                        <p className="text-sm whitespace-pre-wrap">{selectedIssue.notes}</p>
                      </div>
                    )}

                    {selectedIssue.elementDetails && (
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="element-details">
                          <AccordionTrigger className="text-sm font-medium">Element Details</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium">Type:</span> {selectedIssue.elementDetails.type}
                              </div>
                              <div>
                                <span className="font-medium">Selector:</span>{" "}
                                <code className="text-xs bg-gray-100 p-1 rounded">
                                  {selectedIssue.elementDetails.selector}
                                </code>
                              </div>
                              <div>
                                <span className="font-medium">XPath:</span>{" "}
                                <code className="text-xs bg-gray-100 p-1 rounded">
                                  {selectedIssue.elementDetails.xpath}
                                </code>
                              </div>
                              <div>
                                <span className="font-medium">Text:</span> {selectedIssue.elementDetails.text}
                              </div>
                              {selectedIssue.elementDetails.componentName && (
                                <div>
                                  <span className="font-medium">Component:</span>{" "}
                                  {selectedIssue.elementDetails.componentName}
                                </div>
                              )}

                              {selectedIssue.elementDetails.accessibility && (
                                <div>
                                  <span className="font-medium">Accessibility:</span>
                                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                                    {JSON.stringify(selectedIssue.elementDetails.accessibility, null, 2)}
                                  </pre>
                                </div>
                              )}

                              {selectedIssue.elementDetails.parent && (
                                <div>
                                  <span className="font-medium">Parent:</span>
                                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                                    {JSON.stringify(selectedIssue.elementDetails.parent, null, 2)}
                                  </pre>
                                </div>
                              )}

                              {selectedIssue.elementDetails.children &&
                                selectedIssue.elementDetails.children.length > 0 && (
                                  <div>
                                    <span className="font-medium">Children:</span>
                                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                                      {JSON.stringify(selectedIssue.elementDetails.children, null, 2)}
                                    </pre>
                                  </div>
                                )}

                              <div>
                                <span className="font-medium">HTML:</span>
                                <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                                  {selectedIssue.elementDetails.html}
                                </pre>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}

                    {selectedIssue.consoleErrors && selectedIssue.consoleErrors.length > 0 && (
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="console-errors">
                          <AccordionTrigger className="text-sm font-medium">
                            Console Errors ({selectedIssue.consoleErrors.length})
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2">
                              {selectedIssue.consoleErrors.map((error, index) => (
                                <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                                  <div className="font-medium text-red-700">{error.message}</div>
                                  <div className="text-gray-600 mt-1">
                                    {error.source}:{error.lineNumber} • {new Date(error.timestamp).toLocaleTimeString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}

                    {selectedIssue.networkErrors && selectedIssue.networkErrors.length > 0 && (
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="network-errors">
                          <AccordionTrigger className="text-sm font-medium">
                            Network Errors ({selectedIssue.networkErrors.length})
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2">
                              {selectedIssue.networkErrors.map((error, index) => (
                                <div key={index} className="p-2 bg-orange-50 border border-orange-200 rounded text-xs">
                                  <div className="font-medium text-orange-700">
                                    {error.method} {error.url} - {error.status} {error.statusText}
                                  </div>
                                  <div className="text-gray-600 mt-1">
                                    {new Date(error.timestamp).toLocaleTimeString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}

                    {selectedIssue.browserInfo && (
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="browser-info">
                          <AccordionTrigger className="text-sm font-medium">Browser Information</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium">Browser:</span> {selectedIssue.browserInfo.name}{" "}
                                {selectedIssue.browserInfo.version}
                              </div>
                              <div>
                                <span className="font-medium">OS:</span> {selectedIssue.browserInfo.os}
                              </div>
                              <div>
                                <span className="font-medium">Screen:</span> {selectedIssue.browserInfo.screen}
                              </div>
                              <div>
                                <span className="font-medium">User Agent:</span>{" "}
                                <span className="text-xs">{selectedIssue.browserInfo.userAgent}</span>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}

                    {selectedIssue.pageMetadata && (
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="page-metadata">
                          <AccordionTrigger className="text-sm font-medium">Page Metadata</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium">Title:</span> {selectedIssue.pageMetadata.title}
                              </div>
                              <div>
                                <span className="font-medium">Path:</span> {selectedIssue.pageMetadata.path}
                              </div>
                              <div>
                                <span className="font-medium">Query:</span> {selectedIssue.pageMetadata.query || "None"}
                              </div>
                              <div>
                                <span className="font-medium">Hash:</span> {selectedIssue.pageMetadata.hash || "None"}
                              </div>
                              <div>
                                <span className="font-medium">Viewport:</span>{" "}
                                {selectedIssue.pageMetadata.viewport.width}x{selectedIssue.pageMetadata.viewport.height}
                              </div>
                              <div>
                                <span className="font-medium">Timestamp:</span>{" "}
                                {new Date(selectedIssue.pageMetadata.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}

                    {/* Add AI components */}
                    <AITagSuggestions
                      issue={selectedIssue}
                      onAcceptTags={(tags) => {
                        const updatedIssue = { ...selectedIssue, tags }
                        onUpdateIssue(updatedIssue)
                      }}
                    />

                    <AISummaryComponent
                      issue={selectedIssue}
                      onUpdateSeverity={(severity) => {
                        const updatedIssue = { ...selectedIssue, severity }
                        onUpdateIssue(updatedIssue)
                      }}
                    />

                    {selectedIssue.screenshot && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium mb-2">Screenshot</h3>
                        <img
                          src={selectedIssue.screenshot || "/placeholder.svg"}
                          alt="Issue Screenshot"
                          className="w-full border rounded-md"
                        />
                      </div>
                    )}

                    {selectedIssue.aiSuggestion && (
                      <div className="p-3 border rounded-md bg-blue-50 border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-blue-500" />
                          <h3 className="text-sm font-medium text-blue-700">AI Suggestions</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Suggested Priority:</span>{" "}
                            {selectedIssue.aiSuggestion.priority}
                          </div>
                          <div>
                            <span className="font-medium">Suggested Tags:</span>{" "}
                            {selectedIssue.aiSuggestion.tags.join(", ")}
                          </div>
                          <div>
                            <span className="font-medium">Analysis:</span> {selectedIssue.aiSuggestion.analysis}
                          </div>
                          {selectedIssue.aiSuggestion.suggestedFix && (
                            <div>
                              <span className="font-medium">Suggested Fix:</span>{" "}
                              {selectedIssue.aiSuggestion.suggestedFix}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedIssue.reportedBy && (
                      <div className="mt-4 text-xs text-gray-500">
                        Reported by: {selectedIssue.reportedBy} • {new Date(selectedIssue.timestamp).toLocaleString()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={editedIssue?.title || ""}
                        onChange={(e) => setEditedIssue((prev) => (prev ? { ...prev, title: e.target.value } : null))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="severity">Severity</Label>
                      <Select
                        value={editedIssue?.severity || ""}
                        onValueChange={(value) =>
                          setEditedIssue((prev) => (prev ? { ...prev, severity: value as any } : null))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={editedIssue?.notes || ""}
                        onChange={(e) => setEditedIssue((prev) => (prev ? { ...prev, notes: e.target.value } : null))}
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tags</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {editedIssue?.tags?.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 h-3 w-3 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a tag"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              handleAddTag()
                            }
                          }}
                        />
                        <Button type="button" onClick={handleAddTag} size="sm" variant="outline">
                          Add
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category (Optional)</Label>
                      <Select
                        value={editedIssue?.category || ""}
                        onValueChange={(value) =>
                          setEditedIssue((prev) => (prev ? { ...prev, category: value } : null))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ui">UI Issue</SelectItem>
                          <SelectItem value="functionality">Functionality</SelectItem>
                          <SelectItem value="performance">Performance</SelectItem>
                          <SelectItem value="accessibility">Accessibility</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-8">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h2 className="text-xl font-semibold mb-2">No Issue Selected</h2>
                <p className="text-gray-500 max-w-md">
                  Select an issue from the sidebar to view its details, or start inspection to capture new issues.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="h-full flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Analytics Dashboard</h2>
            <p className="text-sm text-gray-500">Insights and statistics about your testing session</p>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Error Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center">
                    <div className="w-full max-w-xs">
                      <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-orange-600 bg-orange-200">
                              Console Errors
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-orange-600">
                              {issues.reduce((count, issue) => count + (issue.consoleErrors?.length || 0), 0)}
                            </span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-orange-200">
                          <div
                            style={{ width: "30%" }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-orange-500"
                          ></div>
                        </div>
                      </div>
                      <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-red-600 bg-red-200">
                              Network Errors
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-red-600">
                              {issues.reduce((count, issue) => count + (issue.networkErrors?.length || 0), 0)}
                            </span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-red-200">
                          <div
                            style={{ width: "45%" }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500"
                          ></div>
                        </div>
                      </div>
                      <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                              UI Issues
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-blue-600">
                              {
                                issues.filter((issue) => !issue.consoleErrors?.length && !issue.networkErrors?.length)
                                  .length
                              }
                            </span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                          <div
                            style={{ width: "25%" }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Severity Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center">
                    <div className="w-full max-w-xs">
                      {["critical", "high", "medium", "low"].map((severity) => {
                        const count = issues.filter((issue) => issue.severity === severity).length
                        const percentage = Math.round((count / (issues.length || 1)) * 100)

                        return (
                          <div key={severity} className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                              <div>
                                <span
                                  className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full 
                                 ${
                                   severity === "critical"
                                     ? "text-red-700 bg-red-100"
                                     : severity === "high"
                                       ? "text-red-600 bg-red-100"
                                       : severity === "medium"
                                         ? "text-orange-600 bg-orange-100"
                                         : "text-blue-600 bg-blue-100"
                                 }`}
                                >
                                  {severity}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-semibold inline-block">
                                  {count} ({percentage}%)
                                </span>
                              </div>
                            </div>
                            <div
                              className={`overflow-hidden h-2 mb-4 text-xs flex rounded 
                             ${
                               severity === "critical"
                                 ? "bg-red-200"
                                 : severity === "high"
                                   ? "bg-red-200"
                                   : severity === "medium"
                                     ? "bg-orange-200"
                                     : "bg-blue-200"
                             }`}
                            >
                              <div
                                style={{ width: `${percentage}%` }}
                                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center 
                                 ${
                                   severity === "critical"
                                     ? "bg-red-700"
                                     : severity === "high"
                                       ? "bg-red-500"
                                       : severity === "medium"
                                         ? "bg-orange-500"
                                         : "bg-blue-500"
                                 }`}
                              ></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">User Flow Coverage Map</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <FlowCoverageMap />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Popular Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(issues.flatMap((issue) => issue.tags || []))).map((tag, index) => {
                      const count = issues.filter((issue) => issue.tags?.includes(tag)).length
                      return (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag} ({count})
                        </Badge>
                      )
                    })}
                    {Array.from(new Set(issues.flatMap((issue) => issue.tags || []))).length === 0 && (
                      <p className="text-sm text-gray-500">No tags found</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Session Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {issues
                      .sort((a, b) => a.timestamp - b.timestamp)
                      .map((issue, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-12 text-xs text-gray-500">
                            {new Date(issue.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          <div className="text-xs truncate">{issue.title}</div>
                        </div>
                      ))}
                    {issues.length === 0 && <p className="text-sm text-gray-500">No issues recorded yet</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      )}

      {activeTab === "export" && (
        <div className="h-full flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Export Options</h2>
            <p className="text-sm text-gray-500">Export your issues and test results in various formats</p>
          </div>

          <ScrollArea className="flex-1 p-4">
            <Tabs defaultValue={exportTab} onValueChange={setExportTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="markdown">Markdown</TabsTrigger>
                <TabsTrigger value="github">GitHub</TabsTrigger>
                <TabsTrigger value="data">JSON/CSV</TabsTrigger>
              </TabsList>

              <TabsContent value="markdown" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clipboard className="h-5 w-5 text-orange-500" />
                      Markdown Export
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-500">
                      Export a comprehensive report with all issue details, screenshots, and technical information in
                      Markdown format.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="include-screenshots"
                          checked={exportOptions.includeScreenshots}
                          onCheckedChange={(checked) =>
                            setExportOptions({ ...exportOptions, includeScreenshots: checked as boolean })
                          }
                        />
                        <Label htmlFor="include-screenshots" className="text-sm">
                          Include Screenshots
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="include-console-errors"
                          checked={exportOptions.includeConsoleErrors}
                          onCheckedChange={(checked) =>
                            setExportOptions({ ...exportOptions, includeConsoleErrors: checked as boolean })
                          }
                        />
                        <Label htmlFor="include-console-errors" className="text-sm">
                          Include Console Errors
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="include-network-errors"
                          checked={exportOptions.includeNetworkErrors}
                          onCheckedChange={(checked) =>
                            setExportOptions({ ...exportOptions, includeNetworkErrors: checked as boolean })
                          }
                        />
                        <Label htmlFor="include-network-errors" className="text-sm">
                          Include Network Errors
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="include-element-details"
                          checked={exportOptions.includeElementDetails}
                          onCheckedChange={(checked) =>
                            setExportOptions({ ...exportOptions, includeElementDetails: checked as boolean })
                          }
                        />
                        <Label htmlFor="include-element-details" className="text-sm">
                          Include Element Details
                        </Label>
                      </div>
                    </div>
                    <Button
                      onClick={handleExportMarkdown}
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      disabled={issues.length === 0}
                    >
                      Export to Markdown
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="github" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Github className="h-5 w-5" />
                      GitHub Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-500">
                      Create GitHub issues directly from your captured data with all relevant details and context.
                    </p>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label htmlFor="github-repo" className="text-sm">
                          Repository
                        </Label>
                        <Input
                          id="github-repo"
                          placeholder="username/repository"
                          value={githubOptions.repo}
                          onChange={(e) => setGithubOptions({ ...githubOptions, repo: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="github-token" className="text-sm">
                          GitHub Token
                        </Label>
                        <Input
                          id="github-token"
                          type="password"
                          placeholder="ghp_xxxxxxxxxxxx"
                          value={githubOptions.token}
                          onChange={(e) => setGithubOptions({ ...githubOptions, token: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Requires a token with 'repo' scope.{" "}
                          <a
                            href="https://github.com/settings/tokens"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            Create one here
                          </a>
                          .
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="github-labels" className="text-sm">
                          Labels (Optional)
                        </Label>
                        <Input
                          id="github-labels"
                          placeholder="bug, documentation, etc."
                          value={githubOptions.labels.join(", ")}
                          onChange={(e) =>
                            setGithubOptions({
                              ...githubOptions,
                              labels: e.target.value
                                .split(",")
                                .map((label) => label.trim())
                                .filter(Boolean),
                            })
                          }
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleExportGitHub}
                      variant="outline"
                      className="w-full"
                      disabled={issues.length === 0}
                    >
                      Create GitHub Issues
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="data" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5 text-blue-500" />
                      Data Export
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-500">
                      Export your data in JSON or CSV format for use in other tools and systems.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 border rounded-md p-4">
                        <h3 className="text-sm font-medium">JSON Export</h3>
                        <p className="text-xs text-gray-500">
                          Complete data with all details in structured JSON format.
                        </p>
                        <Button
                          onClick={handleExportJSON}
                          variant="outline"
                          className="w-full"
                          disabled={issues.length === 0}
                        >
                          Export JSON
                        </Button>
                      </div>

                      <div className="space-y-2 border rounded-md p-4">
                        <h3 className="text-sm font-medium">CSV Export</h3>
                        <p className="text-xs text-gray-500">Tabular data format for spreadsheets and data analysis.</p>
                        <Button
                          onClick={handleExportCSV}
                          variant="outline"
                          className="w-full"
                          disabled={issues.length === 0}
                        >
                          Export CSV
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="include-screenshots-data"
                          checked={exportOptions.includeScreenshots}
                          onCheckedChange={(checked) =>
                            setExportOptions({ ...exportOptions, includeScreenshots: checked as boolean })
                          }
                        />
                        <Label htmlFor="include-screenshots-data" className="text-sm">
                          Include Screenshots
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="include-console-errors-data"
                          checked={exportOptions.includeConsoleErrors}
                          onCheckedChange={(checked) =>
                            setExportOptions({ ...exportOptions, includeConsoleErrors: checked as boolean })
                          }
                        />
                        <Label htmlFor="include-console-errors-data" className="text-sm">
                          Include Console Errors
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="include-element-details-data"
                          checked={exportOptions.includeElementDetails}
                          onCheckedChange={(checked) =>
                            setExportOptions({ ...exportOptions, includeElementDetails: checked as boolean })
                          }
                        />
                        <Label htmlFor="include-element-details-data" className="text-sm">
                          Include Element Details
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
