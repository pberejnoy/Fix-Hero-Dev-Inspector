"use client"

import { useState } from "react"
import { Sidebar } from "../sidebar"
import { Inspector } from "./inspector"
import { IssueDetail } from "./issue-detail"
import { IssueList } from "./issue-list"
import { SessionEditDialog } from "./session-edit-dialog"
import { SettingsDialog } from "./settings-dialog"
import { useToast } from "../ui/use-toast"
import { LoadingSpinner } from "../ui/loading-spinner"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import { AlertCircle } from "lucide-react"
import type { Issue, Session, User } from "@/lib/types"

// Mock data for preview
const mockSessions: Session[] = [
  {
    id: "session-1",
    name: "Homepage Inspection",
    url: "https://example.com",
    browserInfo: "Chrome 98.0.4758.102",
    created: Date.now() - 86400000, // 1 day ago
    lastUpdated: Date.now() - 3600000, // 1 hour ago
    issueCount: 3,
  },
  {
    id: "session-2",
    name: "Login Page Testing",
    url: "https://example.com/login",
    browserInfo: "Chrome 98.0.4758.102",
    created: Date.now() - 172800000, // 2 days ago
    lastUpdated: Date.now() - 7200000, // 2 hours ago
    issueCount: 2,
  },
]

const mockIssues: Record<string, Issue[]> = {
  "session-1": [
    {
      id: "issue-1",
      title: "Button not accessible",
      notes: "The submit button doesn't have proper ARIA attributes",
      severity: "high",
      timestamp: Date.now() - 4000000,
      type: "bug",
      tags: ["accessibility", "button", "form"],
      url: "https://example.com",
    },
    {
      id: "issue-2",
      title: "Contrast ratio too low",
      notes: "Text color doesn't have enough contrast with background",
      severity: "medium",
      timestamp: Date.now() - 5000000,
      type: "bug",
      tags: ["accessibility", "contrast", "design"],
      url: "https://example.com",
    },
    {
      id: "issue-3",
      title: "Missing alt text",
      notes: "Hero image is missing alt text",
      severity: "medium",
      timestamp: Date.now() - 6000000,
      type: "bug",
      tags: ["accessibility", "image"],
      url: "https://example.com",
    },
  ],
  "session-2": [
    {
      id: "issue-4",
      title: "Form validation error",
      notes: "Error messages not displayed properly",
      severity: "critical",
      timestamp: Date.now() - 7000000,
      type: "bug",
      tags: ["form", "validation", "UX"],
      url: "https://example.com/login",
    },
    {
      id: "issue-5",
      title: "Slow response time",
      notes: "Login form submission takes too long",
      severity: "high",
      timestamp: Date.now() - 8000000,
      type: "bug",
      tags: ["performance", "form"],
      url: "https://example.com/login",
    },
  ],
}

interface DashboardProps {
  onLogout: () => void
  user: User | null
}

export function DashboardPreview({ onLogout, user }: DashboardProps) {
  // State
  const [activeTab, setActiveTab] = useState("inspector")
  const [currentSession, setCurrentSessionState] = useState<Session | null>(mockSessions[0])
  const [allSessions, setAllSessions] = useState<Session[]>(mockSessions)
  const [issues, setIssues] = useState<Issue[]>(mockIssues["session-1"])
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [isInspecting, setIsInspecting] = useState(false)
  const [isEditSessionOpen, setIsEditSessionOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isDeletingIssues, setIsDeletingIssues] = useState(false)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [isCloningSession, setIsCloningSession] = useState(false)

  const { toast } = useToast()

  // Handle session change
  const handleSwitchSession = async (sessionId: string) => {
    try {
      const session = allSessions.find((s) => s.id === sessionId)
      if (!session) return

      setCurrentSessionState(session)
      setIssues(mockIssues[sessionId] || [])
      setSelectedIssue(null)
      setSelectedIssueIds([])

      toast({
        title: "Session switched",
        description: `Now viewing: ${session.name}`,
      })
    } catch (error) {
      console.error("Error switching session:", error)
      toast({
        title: "Error",
        description: "Failed to switch session",
        variant: "destructive",
      })
    }
  }

  // Create new session
  const handleCreateNewSession = async () => {
    setIsCreatingSession(true)
    try {
      const newSession: Session = {
        id: `session-${allSessions.length + 1}`,
        name: `New Session ${new Date().toLocaleString()}`,
        url: "https://example.com/new-page",
        browserInfo: "Chrome 98.0.4758.102",
        created: Date.now(),
        lastUpdated: Date.now(),
        issueCount: 0,
      }

      setAllSessions((prev) => [newSession, ...prev])
      setCurrentSessionState(newSession)
      setIssues([])
      setSelectedIssue(null)
      setSelectedIssueIds([])

      // Add to mock issues
      mockIssues[newSession.id] = []

      toast({
        title: "Session created",
        description: `New session: ${newSession.name}`,
      })
    } catch (error) {
      console.error("Error creating session:", error)
      toast({
        title: "Error",
        description: "Failed to create new session",
        variant: "destructive",
      })
    } finally {
      setIsCreatingSession(false)
    }
  }

  // Clone session
  const handleCloneSession = async (sessionId: string) => {
    setIsCloningSession(true)
    try {
      const sourceSession = allSessions.find((s) => s.id === sessionId)
      if (!sourceSession) throw new Error("Session not found")

      const newSession: Session = {
        ...sourceSession,
        id: `session-${allSessions.length + 1}`,
        created: Date.now(),
        lastUpdated: Date.now(),
        name: `${sourceSession.name} (Copy)`,
      }

      setAllSessions((prev) => [newSession, ...prev])

      // Clone issues
      mockIssues[newSession.id] = [...(mockIssues[sessionId] || [])]

      toast({
        title: "Session cloned",
        description: `Created: ${newSession.name}`,
      })
    } catch (error) {
      console.error("Error cloning session:", error)
      toast({
        title: "Error",
        description: "Failed to clone session",
        variant: "destructive",
      })
    } finally {
      setIsCloningSession(false)
    }
  }

  // Edit session
  const handleEditSession = () => {
    if (currentSession) {
      setIsEditSessionOpen(true)
    }
  }

  // Update session
  const handleUpdateSession = async (updatedSession: Session) => {
    try {
      setAllSessions((prev) => prev.map((session) => (session.id === updatedSession.id ? updatedSession : session)))
      setCurrentSessionState(updatedSession)

      toast({
        title: "Session updated",
        description: `Updated: ${updatedSession.name}`,
      })
    } catch (error) {
      console.error("Error updating session:", error)
      toast({
        title: "Error",
        description: "Failed to update session",
        variant: "destructive",
      })
    } finally {
      setIsEditSessionOpen(false)
    }
  }

  // Delete session
  const handleDeleteSession = async (sessionId: string) => {
    try {
      setAllSessions((prev) => prev.filter((session) => session.id !== sessionId))

      // If we deleted the current session, update current session
      if (currentSession?.id === sessionId) {
        const newCurrentSession = allSessions.find((s) => s.id !== sessionId)
        setCurrentSessionState(newCurrentSession || null)

        if (newCurrentSession) {
          setIssues(mockIssues[newCurrentSession.id] || [])
        } else {
          setIssues([])
        }
      }

      setSelectedIssue(null)
      setSelectedIssueIds([])

      // Remove from mock issues
      delete mockIssues[sessionId]

      toast({
        title: "Session deleted",
        description: "Session has been deleted",
      })
    } catch (error) {
      console.error("Error deleting session:", error)
      toast({
        title: "Error",
        description: "Failed to delete session",
        variant: "destructive",
      })
    }
  }

  // Start inspection
  const handleStartInspection = () => {
    setIsInspecting(true)
    toast({
      title: "Inspection started",
      description: "Click on elements to inspect them",
    })
  }

  // Stop inspection
  const handleStopInspection = () => {
    setIsInspecting(false)
    toast({
      title: "Inspection stopped",
      description: "Inspection mode deactivated",
    })
  }

  // Take screenshot
  const handleTakeScreenshot = () => {
    toast({
      title: "Screenshot captured",
      description: "Screenshot has been saved to the current session",
    })
  }

  // Find problems
  const handleFindProblems = () => {
    toast({
      title: "Find Problems",
      description: "This feature is coming soon!",
    })
  }

  // Find slow elements
  const handleFindSlowElements = () => {
    toast({
      title: "Find Slow Elements",
      description: "This feature is coming soon!",
    })
  }

  // Add note
  const handleAddNote = () => {
    // Create a new issue with just a note
    const newIssue: Issue = {
      id: `issue-${Date.now()}`,
      title: "Note",
      notes: "",
      severity: "low",
      timestamp: Date.now(),
      type: "note",
    }

    setSelectedIssue(newIssue)
    setActiveTab("issues")
  }

  // Select issue
  const handleSelectIssue = (issue: Issue) => {
    setSelectedIssue(issue)
  }

  // Save issue
  const handleSaveIssue = async (issue: Issue) => {
    if (!currentSession) return

    try {
      // Check if this is a new issue
      const isNewIssue = !issues.some((i) => i.id === issue.id)

      if (isNewIssue) {
        // Add new issue
        setIssues((prev) => [issue, ...prev])

        // Update mock issues
        mockIssues[currentSession.id] = [issue, ...(mockIssues[currentSession.id] || [])]

        // Update session issue count
        setAllSessions((prev) =>
          prev.map((s) =>
            s.id === currentSession.id ? { ...s, issueCount: s.issueCount + 1, lastUpdated: Date.now() } : s,
          ),
        )
      } else {
        // Update existing issue
        setIssues((prev) => prev.map((i) => (i.id === issue.id ? issue : i)))

        // Update mock issues
        mockIssues[currentSession.id] = mockIssues[currentSession.id].map((i) => (i.id === issue.id ? issue : i))
      }

      setSelectedIssue(null)

      toast({
        title: isNewIssue ? "Issue added" : "Issue updated",
        description: isNewIssue ? "New issue has been added" : "Issue has been updated",
      })
    } catch (error) {
      console.error("Error saving issue:", error)
      toast({
        title: "Error",
        description: "Failed to save issue",
        variant: "destructive",
      })
    }
  }

  // Delete issue
  const handleDeleteIssue = async (issueId: string) => {
    if (!currentSession) return

    try {
      setIssues((prev) => prev.filter((issue) => issue.id !== issueId))

      // Update mock issues
      mockIssues[currentSession.id] = mockIssues[currentSession.id].filter((i) => i.id !== issueId)

      // Update session issue count
      setAllSessions((prev) =>
        prev.map((s) =>
          s.id === currentSession.id ? { ...s, issueCount: Math.max(s.issueCount - 1, 0), lastUpdated: Date.now() } : s,
        ),
      )

      if (selectedIssue?.id === issueId) {
        setSelectedIssue(null)
      }

      setSelectedIssueIds((prev) => prev.filter((id) => id !== issueId))

      toast({
        title: "Issue deleted",
        description: "Issue has been deleted",
      })
    } catch (error) {
      console.error("Error deleting issue:", error)
      toast({
        title: "Error",
        description: "Failed to delete issue",
        variant: "destructive",
      })
    }
  }

  // Toggle issue selection
  const handleToggleIssueSelection = (issueId: string) => {
    setSelectedIssueIds((prev) => {
      if (prev.includes(issueId)) {
        return prev.filter((id) => id !== issueId)
      } else {
        return [...prev, issueId]
      }
    })
  }

  // Select all issues
  const handleSelectAllIssues = () => {
    if (selectedIssueIds.length === issues.length) {
      setSelectedIssueIds([])
    } else {
      setSelectedIssueIds(issues.map((issue) => issue.id))
    }
  }

  // Delete selected issues
  const handleDeleteSelectedIssues = async () => {
    if (!currentSession || selectedIssueIds.length === 0) return

    setIsDeletingIssues(true)
    try {
      setIssues((prev) => prev.filter((issue) => !selectedIssueIds.includes(issue.id)))

      // Update mock issues
      mockIssues[currentSession.id] = mockIssues[currentSession.id].filter((i) => !selectedIssueIds.includes(i.id))

      // Update session issue count
      setAllSessions((prev) =>
        prev.map((s) =>
          s.id === currentSession.id
            ? { ...s, issueCount: Math.max(s.issueCount - selectedIssueIds.length, 0), lastUpdated: Date.now() }
            : s,
        ),
      )

      if (selectedIssue && selectedIssueIds.includes(selectedIssue.id)) {
        setSelectedIssue(null)
      }

      setSelectedIssueIds([])

      toast({
        title: "Issues deleted",
        description: `${selectedIssueIds.length} issues have been deleted`,
      })
    } catch (error) {
      console.error("Error deleting issues:", error)
      toast({
        title: "Error",
        description: "Failed to delete issues",
        variant: "destructive",
      })
    } finally {
      setIsDeletingIssues(false)
    }
  }

  // Export selected issues
  const handleExportSelected = async (format: "markdown" | "json" | "csv" | "github" | "cursor" | "notion") => {
    if (selectedIssueIds.length === 0) return

    setIsExporting(true)
    try {
      // Simulate export
      setTimeout(() => {
        toast({
          title: "Export complete",
          description: `${selectedIssueIds.length} issues exported as ${format.toUpperCase()}`,
        })
        setIsExporting(false)
      }, 1000)
    } catch (error) {
      console.error("Error exporting issues:", error)
      toast({
        title: "Error",
        description: "Failed to export issues",
        variant: "destructive",
      })
      setIsExporting(false)
    }
  }

  // Cancel issue editing
  const handleCancelIssue = () => {
    setSelectedIssue(null)
  }

  // Open settings
  const handleOpenSettings = () => {
    setIsSettingsOpen(true)
  }

  // If loading, show loading spinner
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500">Loading FixHero Dev Inspector...</p>
        </div>
      </div>
    )
  }

  // If error, show error message
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
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
        allSessions={allSessions}
        isInspecting={isInspecting}
        startInspection={handleStartInspection}
        stopInspection={handleStopInspection}
        onSelectIssue={handleSelectIssue}
        onDeleteIssue={handleDeleteIssue}
        onAddNote={handleAddNote}
        onCreateNewSession={handleCreateNewSession}
        onSwitchSession={handleSwitchSession}
        onCloneSession={handleCloneSession}
        onTakeScreenshot={handleTakeScreenshot}
        onFindProblems={handleFindProblems}
        onFindSlowElements={handleFindSlowElements}
        onLogout={onLogout}
        onEditSession={handleEditSession}
        onOpenSettings={handleOpenSettings}
        user={user}
        selectedIssueIds={selectedIssueIds}
        onToggleIssueSelection={handleToggleIssueSelection}
        onSelectAllIssues={handleSelectAllIssues}
        onDeleteSelectedIssues={handleDeleteSelectedIssues}
        onExportSelected={handleExportSelected}
      />

      <div className="flex-1 overflow-hidden">
        {activeTab === "inspector" ? (
          <Inspector
            isInspecting={isInspecting}
            startInspection={handleStartInspection}
            stopInspection={handleStopInspection}
            onTakeScreenshot={handleTakeScreenshot}
            onFindProblems={handleFindProblems}
            onFindSlowElements={handleFindSlowElements}
            onAddNote={handleAddNote}
          />
        ) : selectedIssue ? (
          <IssueDetail issue={selectedIssue} onSave={handleSaveIssue} onCancel={handleCancelIssue} />
        ) : (
          <IssueList
            issues={issues}
            onSelectIssue={handleSelectIssue}
            onDeleteIssue={handleDeleteIssue}
            selectedIssueIds={selectedIssueIds}
            onToggleIssueSelection={handleToggleIssueSelection}
            onSelectAllIssues={handleSelectAllIssues}
            onDeleteSelectedIssues={handleDeleteSelectedIssues}
            onExportSelected={handleExportSelected}
            isExporting={isExporting}
            isDeletingIssues={isDeletingIssues}
          />
        )}
      </div>

      {/* Session Edit Dialog */}
      {isEditSessionOpen && currentSession && (
        <SessionEditDialog
          session={currentSession}
          onSave={handleUpdateSession}
          onDelete={handleDeleteSession}
          onCancel={() => setIsEditSessionOpen(false)}
          isOpen={isEditSessionOpen}
        />
      )}

      {/* Settings Dialog */}
      {isSettingsOpen && (
        <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} user={user} />
      )}
    </div>
  )
}
