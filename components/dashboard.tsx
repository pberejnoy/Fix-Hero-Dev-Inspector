"use client"

import { useState, useEffect } from "react"
import { InspectionPanel } from "@/components/inspection-panel"
import { Sidebar } from "@/components/sidebar"
import { SessionSettingsDialog } from "@/components/session-settings-dialog"
import { ExportConfirmationDialog } from "@/components/export-confirmation-dialog"
import { ExportToCursorDialog } from "@/components/export-to-cursor-dialog"
import { SettingsDialog } from "@/components/settings-dialog"
import type { Issue, Session, User } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import {
  initializeInspector,
  captureElement,
  takeScreenshot,
  captureConsoleErrors,
  captureNetworkErrors,
  getBrowserInfo,
  highlightProblematicElements,
  identifySlowElements,
} from "@/lib/inspector"
import { generateId } from "@/lib/utils"
import {
  createSession,
  getCurrentSession,
  getSessions,
  getIssues,
  addIssue,
  updateIssue,
  deleteIssue,
  deleteMultipleIssues,
  setCurrentSession,
  getSessionById,
  cloneSession,
  cleanupStorage,
  checkStorageQuota,
} from "@/lib/session-manager-enhanced"
import { initSyncService } from "@/lib/sync-service"
import { generateTagsForIssue } from "@/lib/ai-service"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DashboardProps {
  onLogout: () => void
  user: User | null
}

export function Dashboard({ onLogout, user }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("inspector")
  const [currentSession, setCurrentSessionState] = useState<Session | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [isInspecting, setIsInspecting] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false)
  const [newSessionData, setNewSessionData] = useState({ name: "", description: "" })
  const [showAddNoteDialog, setShowAddNoteDialog] = useState(false)
  const [noteData, setNoteData] = useState({ title: "", notes: "", severity: "medium" })
  const [showSessionSettingsDialog, setShowSessionSettingsDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showExportToCursorDialog, setShowExportToCursorDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [exportFormat, setExportFormat] = useState<"markdown" | "json" | "csv" | "github">("markdown")
  const { toast } = useToast()

  // Initialize sync service
  useEffect(() => {
    initSyncService()
  }, [])

  // Load sessions and current session on mount
  useEffect(() => {
    async function loadData() {
      try {
        const allSessions = await getSessions()
        setSessions(allSessions)

        const session = await getCurrentSession()
        if (session) {
          setCurrentSessionState(session)
          const sessionIssues = await getIssues(session.id)
          setIssues(sessionIssues)
        } else if (allSessions.length > 0) {
          // If no current session but sessions exist, use the first one
          setCurrentSessionState(allSessions[0])
          const sessionIssues = await getIssues(allSessions[0].id)
          setIssues(sessionIssues)
        } else {
          // If no sessions at all, create a new one
          createNewSession()
        }
      } catch (error) {
        console.error("Error loading sessions:", error)
        toast({
          title: "Error loading sessions",
          description: "Failed to load your sessions. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()

    // Initialize console and network error capturing
    const cleanupConsole = captureConsoleErrors()
    const cleanupNetwork = captureNetworkErrors()

    // Listen for storage events
    const handleStorageWarning = (event: CustomEvent) => {
      toast({
        title: "Storage Warning",
        description: event.detail.message,
        variant: event.detail.type || "warning",
      })
    }

    const handleStorageError = (event: CustomEvent) => {
      toast({
        title: "Storage Error",
        description: event.detail.message,
        variant: "destructive",
      })
    }

    const handleStorageCleanup = (event: CustomEvent) => {
      toast({
        title: "Storage Cleanup",
        description: `Removed ${event.detail.count} old sessions to free up storage space.`,
      })
    }

    const handleBulkDeleteSuccess = (event: CustomEvent) => {
      toast({
        title: "Issues Deleted",
        description: `Successfully deleted ${event.detail.count} issues.`,
      })
    }

    const handleBulkDeleteError = () => {
      toast({
        title: "Deletion Failed",
        description: "Failed to delete the selected issues.",
        variant: "destructive",
      })
    }

    const handleSessionUpdateSuccess = () => {
      toast({
        title: "Session Updated",
        description: "Session details have been updated successfully.",
      })
    }

    const handleSessionUpdateError = () => {
      toast({
        title: "Update Failed",
        description: "Failed to update session details.",
        variant: "destructive",
      })
    }

    window.addEventListener("storage-warning", handleStorageWarning as EventListener)
    window.addEventListener("storage-error", handleStorageError as EventListener)
    window.addEventListener("storage-cleanup", handleStorageCleanup as EventListener)
    window.addEventListener("bulk-delete-success", handleBulkDeleteSuccess as EventListener)
    window.addEventListener("bulk-delete-error", handleBulkDeleteError as EventListener)
    window.addEventListener("session-update-success", handleSessionUpdateSuccess as EventListener)
    window.addEventListener("session-update-error", handleSessionUpdateError as EventListener)

    return () => {
      cleanupConsole()
      cleanupNetwork()
      window.removeEventListener("storage-warning", handleStorageWarning as EventListener)
      window.removeEventListener("storage-error", handleStorageError as EventListener)
      window.removeEventListener("storage-cleanup", handleStorageCleanup as EventListener)
      window.removeEventListener("bulk-delete-success", handleBulkDeleteSuccess as EventListener)
      window.removeEventListener("bulk-delete-error", handleBulkDeleteError as EventListener)
      window.removeEventListener("session-update-success", handleSessionUpdateSuccess as EventListener)
      window.removeEventListener("session-update-error", handleSessionUpdateError as EventListener)
    }
  }, [])

  // Check storage quota periodically
  useEffect(() => {
    const checkQuota = () => {
      checkStorageQuota()
    }

    // Check immediately
    checkQuota()

    // Then check every 5 minutes
    const interval = setInterval(checkQuota, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  // Add storage cleanup to the createNewSession function
  const createNewSession = async () => {
    setIsLoading(true)

    try {
      // Clean up storage before creating a new session
      await cleanupStorage()

      const browserInfo = await getBrowserInfo()
      const browserInfoString = `${browserInfo.name} ${browserInfo.version} / ${browserInfo.os}`

      const newSession = await createSession(window.location.href, browserInfoString)

      // Update the new session with additional metadata
      if (newSession) {
        newSession.name = newSessionData.name || `Session ${new Date().toLocaleString()}`
        newSession.description = newSessionData.description || ""
        newSession.lastUpdated = Date.now()
        newSession.createdBy = user?.email || "anonymous"

        await setCurrentSession(newSession)
        setCurrentSessionState(newSession)
        setSessions((prev) => [...prev, newSession])
        setIssues([])
      }

      toast({
        title: "New session created",
        description: `Session "${newSession.name}" started at ${new Date().toLocaleTimeString()}`,
      })

      setShowNewSessionDialog(false)
      setNewSessionData({ name: "", description: "" })
    } catch (error) {
      console.error("Error creating new session:", error)
      toast({
        title: "Session creation failed",
        description: "Failed to create a new session. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Add storage cleanup to the handleAddIssue function
  const handleAddIssue = async (issue: Issue) => {
    if (!currentSession) return

    try {
      // Check if we need to compress the screenshot to save space
      if (issue.screenshot && issue.screenshot.length > 100000) {
        // If screenshot is larger than ~100KB, reduce its quality
        issue.screenshot = await compressScreenshot(issue.screenshot)
      }

      // Auto-tag the issue if enabled
      try {
        const settings = await getSettings()
        if (settings.autoTaggingEnabled) {
          const tagSuggestions = await generateTagsForIssue(issue)
          if (tagSuggestions.tags.length > 0) {
            // Add AI-suggested tags to the issue
            issue.tags = [...(issue.tags || []), ...tagSuggestions.tags]

            // Remove duplicates
            issue.tags = Array.from(new Set(issue.tags))
          }
        }
      } catch (tagError) {
        console.error("Error auto-tagging issue:", tagError)
      }

      await addIssue(currentSession.id, issue)
      setIssues((prev) => [...prev, issue])

      toast({
        title: "Issue added",
        description: "New issue has been added to the session",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedIssue(issue)
              setActiveTab("issues")
            }}
          >
            View Issue
          </Button>
        ),
      })
    } catch (error) {
      console.error("Error adding issue:", error)
      toast({
        title: "Failed to add issue",
        description: "An error occurred while adding the issue",
        variant: "destructive",
      })
    }
  }

  // Add a helper function to compress screenshots
  const compressScreenshot = async (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        // Set canvas dimensions to match image but cap at reasonable size
        const maxDimension = 1200
        let width = img.width
        let height = img.height

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round(height * (maxDimension / width))
            width = maxDimension
          } else {
            width = Math.round(width * (maxDimension / height))
            height = maxDimension
          }
        }

        canvas.width = width
        canvas.height = height

        ctx?.drawImage(img, 0, 0, width, height)

        // Reduce quality to save space
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7)
        resolve(compressedDataUrl)
      }

      img.src = dataUrl
    })
  }

  const startInspection = () => {
    if (!currentSession) {
      toast({
        title: "No active session",
        description: "Please create a session first",
        variant: "destructive",
      })
      return
    }

    setIsInspecting(true)

    initializeInspector({
      onElementSelected: async (element) => {
        try {
          const elementData = await captureElement(element)

          const newIssue: Issue = {
            id: generateId(),
            timestamp: Date.now(),
            url: window.location.href,
            title: `Issue with ${elementData.elementDetails.type} element`,
            elementDetails: elementData.elementDetails,
            screenshot: elementData.screenshot,
            consoleErrors: elementData.consoleErrors,
            networkErrors: elementData.networkErrors,
            severity: "medium",
            tags: ["Auto-Captured", elementData.elementDetails.type],
            browserInfo: await getBrowserInfo(),
            pageMetadata: elementData.pageMetadata,
            reportedBy: user?.email || "anonymous",
          }

          await addIssue(currentSession.id, newIssue)
          setIssues((prev) => [...prev, newIssue])

          // Show capture confirmation tooltip
          showCaptureConfirmation(element)

          toast({
            title: "Element captured",
            description: `${elementData.elementDetails.type} element details saved`,
            action: (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedIssue(newIssue)
                  setActiveTab("issues")
                }}
              >
                View Issue
              </Button>
            ),
          })
        } catch (error) {
          console.error("Error capturing element:", error)
          toast({
            title: "Capture failed",
            description: "Failed to capture element details",
            variant: "destructive",
          })
        } finally {
          setIsInspecting(false)
        }
      },
    })

    toast({
      title: "Inspection mode started",
      description: "Click on any element to inspect it",
    })
  }

  // Show capture confirmation tooltip
  const showCaptureConfirmation = (element: HTMLElement) => {
    // Add a visual highlight to the element
    const originalOutline = element.style.outline
    const originalOutlineOffset = element.style.outlineOffset

    element.style.outline = "3px solid #ff5722"
    element.style.outlineOffset = "2px"

    // Create and show tooltip
    const tooltip = document.createElement("div")
    tooltip.style.cssText = `
      position: absolute;
      background: #ff5722;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 9999;
      pointer-events: none;
      white-space: nowrap;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `
    tooltip.textContent = "Element Captured!"

    // Position the tooltip
    const rect = element.getBoundingClientRect()
    tooltip.style.top = `${rect.top + window.scrollY - 30}px`
    tooltip.style.left = `${rect.left + window.scrollX + (rect.width / 2) - 60}px`

    document.body.appendChild(tooltip)

    // Remove highlight and tooltip after 2 seconds
    setTimeout(() => {
      element.style.outline = originalOutline
      element.style.outlineOffset = originalOutlineOffset
      if (document.body.contains(tooltip)) {
        document.body.removeChild(tooltip)
      }
    }, 2000)
  }

  const stopInspection = () => {
    setIsInspecting(false)

    // Cleanup inspection event listeners
    initializeInspector({ cleanup: true })

    toast({
      title: "Inspection mode stopped",
      description: "Element inspection has been disabled",
    })
  }

  const handleUpdateIssue = async (updatedIssue: Issue) => {
    if (!currentSession) return

    try {
      await updateIssue(currentSession.id, updatedIssue)
      setIssues((prev) => prev.map((issue) => (issue.id === updatedIssue.id ? updatedIssue : issue)))

      // If the selected issue was updated, update it as well
      if (selectedIssue && selectedIssue.id === updatedIssue.id) {
        setSelectedIssue(updatedIssue)
      }

      toast({
        title: "Issue updated",
        description: "The issue has been successfully updated",
      })
    } catch (error) {
      console.error("Error updating issue:", error)
      toast({
        title: "Update failed",
        description: "Failed to update the issue",
        variant: "destructive",
      })
    }
  }

  const handleDeleteIssue = async (issueId: string) => {
    if (!currentSession) return

    try {
      await deleteIssue(currentSession.id, issueId)
      setIssues((prev) => prev.filter((issue) => issue.id !== issueId))

      // If the selected issue was deleted, clear the selection
      if (selectedIssue && selectedIssue.id === issueId) {
        setSelectedIssue(null)
      }

      // Clear from selected issues if it was selected
      if (selectedIssueIds.includes(issueId)) {
        setSelectedIssueIds((prev) => prev.filter((id) => id !== issueId))
      }

      toast({
        title: "Issue deleted",
        description: "The issue has been permanently removed",
      })
    } catch (error) {
      console.error("Error deleting issue:", error)
      toast({
        title: "Deletion failed",
        description: "Failed to delete the issue",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSelectedIssues = async () => {
    if (!currentSession || selectedIssueIds.length === 0) return

    try {
      await deleteMultipleIssues(currentSession.id, selectedIssueIds)

      // Update local state
      setIssues((prev) => prev.filter((issue) => !selectedIssueIds.includes(issue.id)))

      // If the selected issue was deleted, clear the selection
      if (selectedIssue && selectedIssueIds.includes(selectedIssue.id)) {
        setSelectedIssue(null)
      }

      // Clear selection
      setSelectedIssueIds([])

      toast({
        title: "Issues deleted",
        description: `Successfully deleted ${selectedIssueIds.length} issues`,
      })
    } catch (error) {
      console.error("Error deleting multiple issues:", error)
      toast({
        title: "Deletion failed",
        description: "Failed to delete the selected issues",
        variant: "destructive",
      })
    }
  }

  const handleAddNote = async () => {
    setShowAddNoteDialog(true)
  }

  const handleSaveNote = async () => {
    if (!currentSession) return

    try {
      const screenshotData = await takeScreenshot()

      const newIssue: Issue = {
        id: generateId(),
        timestamp: Date.now(),
        url: window.location.href,
        title: noteData.title || `Note: ${new Date().toLocaleTimeString()}`,
        notes: noteData.notes,
        screenshot: screenshotData,
        severity: noteData.severity as "critical" | "high" | "medium" | "low",
        tags: ["Note"],
        browserInfo: await getBrowserInfo(),
        reportedBy: user?.email || "anonymous",
      }

      await addIssue(currentSession.id, newIssue)
      setIssues((prev) => [...prev, newIssue])

      toast({
        title: "Note added",
        description: "Your note has been saved with a screenshot",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedIssue(newIssue)
              setActiveTab("issues")
            }}
          >
            View Note
          </Button>
        ),
      })

      setShowAddNoteDialog(false)
      setNoteData({ title: "", notes: "", severity: "medium" })
    } catch (error) {
      console.error("Error adding note:", error)
      toast({
        title: "Failed to add note",
        description: "An error occurred while adding the note",
        variant: "destructive",
      })
    }
  }

  const handleSwitchSession = async (sessionId: string) => {
    try {
      const session = await getSessionById(sessionId)
      if (session) {
        await setCurrentSession(session)
        setCurrentSessionState(session)

        const sessionIssues = await getIssues(session.id)
        setIssues(sessionIssues)
        setSelectedIssue(null)
        setSelectedIssueIds([])

        toast({
          title: "Session switched",
          description: `Switched to session "${session.name || "Unnamed"}"`,
        })
      }
    } catch (error) {
      console.error("Error switching session:", error)
      toast({
        title: "Session switch failed",
        description: "Failed to switch to the selected session",
        variant: "destructive",
      })
    }
  }

  const handleCloneSession = async (sessionId: string) => {
    try {
      const clonedSession = await cloneSession(sessionId)
      if (clonedSession) {
        // Update the cloned session with a new name
        clonedSession.name = `${clonedSession.name || "Session"} (Copy)`
        clonedSession.lastUpdated = Date.now()

        await setCurrentSession(clonedSession)
        setCurrentSessionState(clonedSession)
        setSessions((prev) => [...prev, clonedSession])
        setIssues([])

        toast({
          title: "Session cloned",
          description: `Created a copy of the session "${clonedSession.name}"`,
        })
      }
    } catch (error) {
      console.error("Error cloning session:", error)
      toast({
        title: "Session clone failed",
        description: "Failed to clone the selected session",
        variant: "destructive",
      })
    }
  }

  const handleTakeScreenshot = async () => {
    if (!currentSession) return

    try {
      const screenshotData = await takeScreenshot()

      const newIssue: Issue = {
        id: generateId(),
        timestamp: Date.now(),
        url: window.location.href,
        title: `Screenshot: ${new Date().toLocaleTimeString()}`,
        screenshot: screenshotData,
        severity: "low",
        tags: ["Screenshot"],
        browserInfo: await getBrowserInfo(),
        reportedBy: user?.email || "anonymous",
      }

      await addIssue(currentSession.id, newIssue)
      setIssues((prev) => [...prev, newIssue])

      toast({
        title: "Screenshot captured",
        description: "Screenshot has been saved as an issue",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedIssue(newIssue)
              setActiveTab("issues")
            }}
          >
            View Screenshot
          </Button>
        ),
      })
    } catch (error) {
      console.error("Error taking screenshot:", error)
      toast({
        title: "Screenshot failed",
        description: "Failed to capture screenshot",
        variant: "destructive",
      })
    }
  }

  const handleFindProblems = async () => {
    if (!currentSession) return

    try {
      // Highlight problematic elements
      const cleanup = highlightProblematicElements()

      toast({
        title: "Problem detection active",
        description: "Problematic elements are now highlighted in red",
      })

      // Automatically clean up after 10 seconds
      setTimeout(() => {
        cleanup()
        toast({
          title: "Problem detection ended",
          description: "Element highlighting has been removed",
        })
      }, 10000)
    } catch (error) {
      console.error("Error finding problems:", error)
      toast({
        title: "Problem detection failed",
        description: "Failed to highlight problematic elements",
        variant: "destructive",
      })
    }
  }

  const handleFindSlowElements = async () => {
    if (!currentSession) return

    try {
      // Highlight slow elements
      const cleanup = identifySlowElements()

      toast({
        title: "Performance analysis active",
        description: "Potentially slow elements are now highlighted in yellow",
      })

      // Automatically clean up after 10 seconds
      setTimeout(() => {
        cleanup()
        toast({
          title: "Performance analysis ended",
          description: "Element highlighting has been removed",
        })
      }, 10000)
    } catch (error) {
      console.error("Error finding slow elements:", error)
      toast({
        title: "Performance analysis failed",
        description: "Failed to highlight slow elements",
        variant: "destructive",
      })
    }
  }

  const handleEditSession = () => {
    if (currentSession) {
      setShowSessionSettingsDialog(true)
    }
  }

  const handleSessionUpdated = async () => {
    try {
      // Refresh sessions list
      const allSessions = await getSessions()
      setSessions(allSessions)

      // Refresh current session
      const session = await getCurrentSession()
      if (session) {
        setCurrentSessionState(session)
      }
    } catch (error) {
      console.error("Error refreshing sessions after update:", error)
    }
  }

  const handleExport = (format: "markdown" | "json" | "csv" | "github" | "cursor") => {
    if (format === "cursor") {
      setShowExportToCursorDialog(true)
    } else {
      setExportFormat(format)
      setShowExportDialog(true)
    }
  }

  const handleExportSelected = (format: "markdown" | "json" | "csv" | "github" | "cursor") => {
    if (selectedIssueIds.length === 0) {
      toast({
        title: "No issues selected",
        description: "Please select at least one issue to export",
        variant: "destructive",
      })
      return
    }

    if (format === "cursor") {
      setShowExportToCursorDialog(true)
    } else {
      setExportFormat(format)
      setShowExportDialog(true)
    }
  }

  const toggleIssueSelection = (issueId: string) => {
    setSelectedIssueIds((prev) => {
      if (prev.includes(issueId)) {
        return prev.filter((id) => id !== issueId)
      } else {
        return [...prev, issueId]
      }
    })
  }

  const selectAllIssues = () => {
    if (selectedIssueIds.length === issues.length) {
      // If all are selected, deselect all
      setSelectedIssueIds([])
    } else {
      // Otherwise, select all
      setSelectedIssueIds(issues.map((issue) => issue.id))
    }
  }

  // Helper function to get settings
  const getSettings = async () => {
    // This would normally come from your settings service
    return {
      autoTaggingEnabled: true,
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        issues={issues}
        currentSession={currentSession}
        allSessions={sessions}
        isInspecting={isInspecting}
        startInspection={startInspection}
        stopInspection={stopInspection}
        onSelectIssue={setSelectedIssue}
        onDeleteIssue={handleDeleteIssue}
        onAddNote={handleAddNote}
        onCreateNewSession={() => setShowNewSessionDialog(true)}
        onSwitchSession={handleSwitchSession}
        onCloneSession={handleCloneSession}
        onTakeScreenshot={handleTakeScreenshot}
        onFindProblems={handleFindProblems}
        onFindSlowElements={handleFindSlowElements}
        onLogout={onLogout}
        onEditSession={handleEditSession}
        onOpenSettings={() => setShowSettingsDialog(true)}
        user={user}
        selectedIssueIds={selectedIssueIds}
        onToggleIssueSelection={toggleIssueSelection}
        onSelectAllIssues={selectAllIssues}
        onDeleteSelectedIssues={handleDeleteSelectedIssues}
        onExportSelected={handleExportSelected}
      />

      <InspectionPanel
        activeTab={activeTab}
        issues={issues}
        currentSession={currentSession}
        selectedIssue={selectedIssue}
        onUpdateIssue={handleUpdateIssue}
        onAddIssue={handleAddIssue}
        onDeleteIssue={handleDeleteIssue}
        onTakeScreenshot={handleTakeScreenshot}
        onStartInspection={startInspection}
        onStopInspection={stopInspection}
        isInspecting={isInspecting}
        onExport={handleExport}
      />

      {/* New Session Dialog */}
      <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Session</DialogTitle>
            <DialogDescription>Create a new bug reporting session to capture and organize issues.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="session-name">Session Name</Label>
              <Input
                id="session-name"
                placeholder="e.g., Homepage Testing"
                value={newSessionData.name}
                onChange={(e) => setNewSessionData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-description">Description (Optional)</Label>
              <Textarea
                id="session-description"
                placeholder="What are you testing in this session?"
                value={newSessionData.description}
                onChange={(e) => setNewSessionData((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSessionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createNewSession} className="bg-orange-500 hover:bg-orange-600">
              Create Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={showAddNoteDialog} onOpenChange={setShowAddNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>Add a note with optional screenshot to document your observations.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note-title">Title</Label>
              <Input
                id="note-title"
                placeholder="e.g., Navigation Issue"
                value={noteData.title}
                onChange={(e) => setNoteData((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note-content">Note Content</Label>
              <Textarea
                id="note-content"
                placeholder="Describe what you've observed..."
                value={noteData.notes}
                onChange={(e) => setNoteData((prev) => ({ ...prev, notes: e.target.value }))}
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note-severity">Severity</Label>
              <Select
                value={noteData.severity}
                onValueChange={(value) => setNoteData((prev) => ({ ...prev, severity: value }))}
              >
                <SelectTrigger id="note-severity">
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddNoteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNote} className="bg-orange-500 hover:bg-orange-600">
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Settings Dialog */}
      <SessionSettingsDialog
        open={showSessionSettingsDialog}
        onOpenChange={setShowSessionSettingsDialog}
        session={currentSession}
        onSessionUpdated={handleSessionUpdated}
      />

      {/* Export Confirmation Dialog */}
      <ExportConfirmationDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        issues={issues}
        session={currentSession}
        format={exportFormat}
        selectedIssueIds={selectedIssueIds.length > 0 ? selectedIssueIds : undefined}
      />

      {/* Export to Cursor Dialog */}
      <ExportToCursorDialog
        open={showExportToCursorDialog}
        onOpenChange={setShowExportToCursorDialog}
        issues={issues}
        session={currentSession}
        selectedIssueIds={selectedIssueIds.length > 0 ? selectedIssueIds : undefined}
      />

      {/* Settings Dialog */}
      <SettingsDialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog} />
    </div>
  )
}
