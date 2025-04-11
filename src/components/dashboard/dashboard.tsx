"use client"

import { useState, useEffect, useCallback } from "react"
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
import { SuccessAnimation } from "../ui/success-animation"
import {
  getSessions,
  getCurrentSession,
  createSession,
  setCurrentSession,
  updateSession,
  cloneSession,
  deleteSession,
  getIssues,
  addIssue,
  updateIssue,
  deleteIssue,
  deleteMultipleIssues,
} from "@/lib/session-manager-enhanced"
import { generateId } from "@/lib/utils"
import { generateTagsForIssue } from "@/lib/ai-service"
import { exportIssues, downloadExport, getFileExtension, getMimeType } from "@/lib/export-service"
import { motion, AnimatePresence } from "framer-motion"
import type { Issue, Session, User } from "@/lib/types"

// Declare chrome if it's not already defined (e.g., in a testing environment)
declare global {
  interface Window {
    chrome?: any
  }
}

interface DashboardProps {
  onLogout: () => void
  user: User | null
}

export function Dashboard({ onLogout, user }: DashboardProps) {
  // State
  const [activeTab, setActiveTab] = useState("inspector")
  const [currentSession, setCurrentSessionState] = useState<Session | null>(null)
  const [allSessions, setAllSessions] = useState<Session[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [isInspecting, setIsInspecting] = useState(false)
  const [isEditSessionOpen, setIsEditSessionOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isDeletingIssues, setIsDeletingIssues] = useState(false)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [isCloningSession, setIsCloningSession] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [showFirstIssueConfetti, setShowFirstIssueConfetti] = useState(false)
  const [showFirstExportConfetti, setShowFirstExportConfetti] = useState(false)

  const { toast } = useToast()

  // Load sessions and issues
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      setError(null)

      try {
        // Load sessions
        const loadedSessions = await getSessions()
        setAllSessions(loadedSessions)

        // Load current session
        const currentSession = await getCurrentSession()
        setCurrentSessionState(currentSession)

        // Load issues for current session
        if (currentSession) {
          const loadedIssues = await getIssues(currentSession.id)
          setIssues(loadedIssues)
        } else {
          setIssues([])
        }
      } catch (error) {
        console.error("Error loading data:", error)
        setError("Failed to load sessions and issues. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Handle session change
  const handleSwitchSession = useCallback(
    async (sessionId: string) => {
      try {
        const session = allSessions.find((s) => s.id === sessionId)
        if (!session) return

        await setCurrentSession(session)
        setCurrentSessionState(session)

        const loadedIssues = await getIssues(session.id)
        setIssues(loadedIssues)
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
    },
    [allSessions, toast],
  )

  // Create new session
  const handleCreateNewSession = useCallback(async () => {
    setIsCreatingSession(true)
    try {
      // Get current tab info
      const [tab] = await window.chrome?.tabs.query({ active: true, currentWindow: true })
      const url = tab?.url || "Unknown URL"
      const browserInfo = navigator.userAgent

      const newSession = await createSession(url, browserInfo)
      setAllSessions((prev) => [newSession, ...prev])
      setCurrentSessionState(newSession)
      setIssues([])
      setSelectedIssue(null)
      setSelectedIssueIds([])

      // Show success animation
      setSuccessMessage("Session created successfully!")
      setShowSuccessAnimation(true)

      // Play sound
      if (window.chrome?.runtime) {
        window.chrome.runtime.sendMessage({
          action: "playSound",
          soundUrl: "sounds/success.mp3",
        })
      }
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
  }, [toast])

  // Clone session
  const handleCloneSession = useCallback(
    async (sessionId: string) => {
      setIsCloningSession(true)
      try {
        const clonedSession = await cloneSession(sessionId)
        if (!clonedSession) throw new Error("Failed to clone session")

        setAllSessions((prev) => [clonedSession, ...prev])

        // Show success animation
        setSuccessMessage("Session cloned successfully!")
        setShowSuccessAnimation(true)
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
    },
    [toast],
  )

  // Edit session
  const handleEditSession = useCallback(() => {
    if (currentSession) {
      setIsEditSessionOpen(true)
    }
  }, [currentSession])

  // Update session
  const handleUpdateSession = useCallback(
    async (updatedSession: Session) => {
      try {
        await updateSession(updatedSession)

        setAllSessions((prev) => prev.map((session) => (session.id === updatedSession.id ? updatedSession : session)))
        setCurrentSessionState(updatedSession)

        // Show success animation
        setSuccessMessage("Session updated successfully!")
        setShowSuccessAnimation(true)
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
    },
    [toast],
  )

  // Delete session
  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      try {
        await deleteSession(sessionId)

        setAllSessions((prev) => prev.filter((session) => session.id !== sessionId))

        // If we deleted the current session, update current session
        if (currentSession?.id === sessionId) {
          const newCurrentSession = await getCurrentSession()
          setCurrentSessionState(newCurrentSession)

          if (newCurrentSession) {
            const loadedIssues = await getIssues(newCurrentSession.id)
            setIssues(loadedIssues)
          } else {
            setIssues([])
          }
        }

        setSelectedIssue(null)
        setSelectedIssueIds([])

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
    },
    [currentSession, toast],
  )

  // Start inspection
  const handleStartInspection = useCallback(async () => {
    try {
      // Check if we have a current session
      if (!currentSession) {
        await handleCreateNewSession()
      }

      // Send message to content script
      const [tab] = await window.chrome?.tabs.query({ active: true, currentWindow: true })
      if (tab?.id) {
        await window.chrome?.tabs.sendMessage(tab.id, { action: "startInspection" })
        setIsInspecting(true)
      }
    } catch (error) {
      console.error("Error starting inspection:", error)
      toast({
        title: "Error",
        description: "Failed to start inspection",
        variant: "destructive",
      })
    }
  }, [currentSession, handleCreateNewSession, toast])

  // Stop inspection
  const handleStopInspection = useCallback(async () => {
    try {
      const [tab] = await window.chrome?.tabs.query({ active: true, currentWindow: true })
      if (tab?.id) {
        await window.chrome?.tabs.sendMessage(tab.id, { action: "stopInspection" })
        setIsInspecting(false)
      }
    } catch (error) {
      console.error("Error stopping inspection:", error)
      toast({
        title: "Error",
        description: "Failed to stop inspection",
        variant: "destructive",
      })
    }
  }, [toast])

  // Take screenshot
  const handleTakeScreenshot = useCallback(async () => {
    try {
      // Check if we have a current session
      if (!currentSession) {
        await handleCreateNewSession()
      }

      // Send message to content script
      const [tab] = await window.chrome?.tabs.query({ active: true, currentWindow: true })
      if (tab?.id) {
        await window.chrome?.tabs.sendMessage(tab.id, { action: "takeScreenshot" })
      }
    } catch (error) {
      console.error("Error taking screenshot:", error)
      toast({
        title: "Error",
        description: "Failed to take screenshot",
        variant: "destructive",
      })
    }
  }, [currentSession, handleCreateNewSession, toast])

  // Find problems
  const handleFindProblems = useCallback(async () => {
    try {
      // Check if we have a current session
      if (!currentSession) {
        await handleCreateNewSession()
      }

      // TODO: Implement problem finding logic
      toast({
        title: "Find Problems",
        description: "This feature is coming soon!",
      })
    } catch (error) {
      console.error("Error finding problems:", error)
      toast({
        title: "Error",
        description: "Failed to find problems",
        variant: "destructive",
      })
    }
  }, [currentSession, handleCreateNewSession, toast])

  // Find slow elements
  const handleFindSlowElements = useCallback(async () => {
    try {
      // Check if we have a current session
      if (!currentSession) {
        await handleCreateNewSession()
      }

      // TODO: Implement slow elements finding logic
      toast({
        title: "Find Slow Elements",
        description: "This feature is coming soon!",
      })
    } catch (error) {
      console.error("Error finding slow elements:", error)
      toast({
        title: "Error",
        description: "Failed to find slow elements",
        variant: "destructive",
      })
    }
  }, [currentSession, handleCreateNewSession, toast])

  // Add note
  const handleAddNote = useCallback(async () => {
    try {
      // Check if we have a current session
      if (!currentSession) {
        await handleCreateNewSession()
      }

      // Create a new issue with just a note
      const newIssue: Issue = {
        id: generateId(),
        title: "Note",
        notes: "",
        severity: "low",
        timestamp: Date.now(),
        type: "note",
      }

      setSelectedIssue(newIssue)
      setActiveTab("issues")
    } catch (error) {
      console.error("Error adding note:", error)
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      })
    }
  }, [currentSession, handleCreateNewSession, toast])

  // Select issue
  const handleSelectIssue = useCallback((issue: Issue) => {
    setSelectedIssue(issue)
  }, [])

  // Save issue
  const handleSaveIssue = useCallback(
    async (issue: Issue) => {
      if (!currentSession) return

      try {
        // Check if this is a new issue
        const isNewIssue = !issues.some((i) => i.id === issue.id)

        // Generate tags if needed
        if (!issue.tags || issue.tags.length === 0) {
          try {
            const { tags } = await generateTagsForIssue(issue)
            issue.tags = tags
          } catch (error) {
            console.error("Error generating tags:", error)
          }
        }

        if (isNewIssue) {
          // Add new issue
          await addIssue(currentSession.id, issue)
          setIssues((prev) => [issue, ...prev])

          // Check if this is the first issue
          if (window.chrome?.storage) {
            window.chrome.storage.local.get(["fixhero_first_issue"], (result) => {
              if (result.fixhero_first_issue) {
                // Show confetti
                setShowFirstIssueConfetti(true)

                // Play sound
                if (window.chrome?.runtime) {
                  window.chrome.runtime.sendMessage({
                    action: "playSound",
                    soundUrl: "sounds/success.mp3",
                  })
                }

                // Mark first issue as complete
                window.chrome.storage.local.set({ fixhero_first_issue: false })
              }
            })
          }
        } else {
          // Update existing issue
          await updateIssue(currentSession.id, issue)
          setIssues((prev) => prev.map((i) => (i.id === issue.id ? issue : i)))
        }

        setSelectedIssue(null)

        // Show success animation
        setSuccessMessage(isNewIssue ? "Issue added successfully!" : "Issue updated successfully!")
        setShowSuccessAnimation(true)
      } catch (error) {
        console.error("Error saving issue:", error)
        toast({
          title: "Error",
          description: "Failed to save issue",
          variant: "destructive",
        })
      }
    },
    [currentSession, issues, toast],
  )

  // Delete issue
  const handleDeleteIssue = useCallback(
    async (issueId: string) => {
      if (!currentSession) return

      try {
        await deleteIssue(currentSession.id, issueId)
        setIssues((prev) => prev.filter((issue) => issue.id !== issueId))

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
    },
    [currentSession, selectedIssue, toast],
  )

  // Toggle issue selection
  const handleToggleIssueSelection = useCallback((issueId: string) => {
    setSelectedIssueIds((prev) => {
      if (prev.includes(issueId)) {
        return prev.filter((id) => id !== issueId)
      } else {
        return [...prev, issueId]
      }
    })
  }, [])

  // Select all issues
  const handleSelectAllIssues = useCallback(() => {
    if (selectedIssueIds.length === issues.length) {
      setSelectedIssueIds([])
    } else {
      setSelectedIssueIds(issues.map((issue) => issue.id))
    }
  }, [issues, selectedIssueIds.length])

  // Delete selected issues
  const handleDeleteSelectedIssues = useCallback(async () => {
    if (!currentSession || selectedIssueIds.length === 0) return

    setIsDeletingIssues(true)
    try {
      await deleteMultipleIssues(currentSession.id, selectedIssueIds)
      setIssues((prev) => prev.filter((issue) => !selectedIssueIds.includes(issue.id)))

      if (selectedIssue && selectedIssueIds.includes(selectedIssue.id)) {
        setSelectedIssue(null)
      }

      setSelectedIssueIds([])

      // Show success animation
      setSuccessMessage(`${selectedIssueIds.length} issues deleted successfully!`)
      setShowSuccessAnimation(true)
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
  }, [currentSession, selectedIssue, selectedIssueIds, toast])

  // Export selected issues
  const handleExportSelected = useCallback(
    async (format: "markdown" | "json" | "csv" | "github" | "cursor" | "notion") => {
      if (selectedIssueIds.length === 0) return

      setIsExporting(true)
      try {
        const selectedIssues = issues.filter((issue) => selectedIssueIds.includes(issue.id))
        const exportContent = await exportIssues(selectedIssues, currentSession, format)

        // Generate filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
        const sessionName = currentSession?.name.replace(/[^a-z0-9]/gi, "-").toLowerCase() || "session"
        const filename = `fixhero-${sessionName}-${timestamp}.${getFileExtension(format)}`

        // Download the file
        downloadExport(exportContent, filename, getMimeType(format))

        // Check if this is the first export
        if (window.chrome?.storage) {
          window.chrome.storage.local.get(["fixhero_first_export"], (result) => {
            if (result.fixhero_first_export) {
              // Show confetti
              setShowFirstExportConfetti(true)

              // Play sound
              if (window.chrome?.runtime) {
                window.chrome.runtime.sendMessage({
                  action: "playSound",
                  soundUrl: "sounds/success.mp3",
                })
              }

              // Mark first export as complete
              window.chrome.storage.local.set({ fixhero_first_export: false })
            }
          })
        }

        // Show success animation
        setSuccessMessage(`${selectedIssues.length} issues exported successfully!`)
        setShowSuccessAnimation(true)
      } catch (error) {
        console.error("Error exporting issues:", error)
        toast({
          title: "Error",
          description: "Failed to export issues",
          variant: "destructive",
        })
      } finally {
        setIsExporting(false)
      }
    },
    [currentSession, issues, selectedIssueIds, toast],
  )

  // Cancel issue editing
  const handleCancelIssue = useCallback(() => {
    setSelectedIssue(null)
  }, [])

  // Open settings
  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true)
  }, [])

  // If loading, show loading spinner
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">Loading FixHero Dev Inspector...</p>
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
    <>
      {/* Success Animation */}
      {showSuccessAnimation && (
        <SuccessAnimation message={successMessage} onComplete={() => setShowSuccessAnimation(false)} />
      )}

      {/* First Issue Confetti */}
      {showFirstIssueConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 100 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{
                top: "-10%",
                left: `${Math.random() * 100}%`,
                scale: Math.random() * 0.5 + 0.5,
              }}
              animate={{
                top: "100%",
                rotate: Math.random() * 360 * (Math.random() > 0.5 ? 1 : -1),
              }}
              transition={{
                duration: Math.random() * 2 + 1,
                ease: "easeOut",
              }}
              onAnimationComplete={() => {
                if (i === 99) setShowFirstIssueConfetti(false)
              }}
              style={{
                backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                borderRadius: Math.random() > 0.5 ? "50%" : "0",
              }}
            />
          ))}
        </div>
      )}

      {/* First Export Confetti */}
      {showFirstExportConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 100 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{
                top: "-10%",
                left: `${Math.random() * 100}%`,
                scale: Math.random() * 0.5 + 0.5,
              }}
              animate={{
                top: "100%",
                rotate: Math.random() * 360 * (Math.random() > 0.5 ? 1 : -1),
              }}
              transition={{
                duration: Math.random() * 2 + 1,
                ease: "easeOut",
              }}
              onAnimationComplete={() => {
                if (i === 99) setShowFirstExportConfetti(false)
              }}
              style={{
                backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                borderRadius: Math.random() > 0.5 ? "50%" : "0",
              }}
            />
          ))}
        </div>
      )}

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
          <AnimatePresence mode="wait">
            {activeTab === "inspector" ? (
              <motion.div
                key="inspector"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <Inspector
                  isInspecting={isInspecting}
                  startInspection={handleStartInspection}
                  stopInspection={handleStopInspection}
                  onTakeScreenshot={handleTakeScreenshot}
                  onFindProblems={handleFindProblems}
                  onFindSlowElements={handleFindSlowElements}
                  onAddNote={handleAddNote}
                />
              </motion.div>
            ) : selectedIssue ? (
              <motion.div
                key="issue-detail"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <IssueDetail issue={selectedIssue} onSave={handleSaveIssue} onCancel={handleCancelIssue} />
              </motion.div>
            ) : (
              <motion.div
                key="issue-list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
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
              </motion.div>
            )}
          </AnimatePresence>
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
    </>
  )
}
