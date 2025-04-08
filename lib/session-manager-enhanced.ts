import { generateId } from "@/lib/utils"
import type { Session, Issue } from "@/lib/types"
import { syncSession, syncIssue, deleteSessionFromCloud, deleteIssueFromCloud, isOnline } from "./sync-service"

// Storage keys
const SESSIONS_KEY = "fixhero_sessions"
const CURRENT_SESSION_KEY = "fixhero_current_session"
const ISSUE_PREFIX = "fixhero_issue_"
const SETTINGS_KEY = "fixhero_settings"

// Default settings
const DEFAULT_SETTINGS = {
  maxSessionsCount: 10,
  maxIssuesPerSession: 100,
  storageWarningThreshold: 0.8, // 80% of quota
  autoCleanupEnabled: true,
  syncEnabled: true,
  autoTaggingEnabled: true,
}

// Get settings
export async function getSettings() {
  try {
    const settingsJson = localStorage.getItem(SETTINGS_KEY)
    return settingsJson ? { ...DEFAULT_SETTINGS, ...JSON.parse(settingsJson) } : DEFAULT_SETTINGS
  } catch (error) {
    console.error("Error getting settings:", error)
    return DEFAULT_SETTINGS
  }
}

// Save settings
export async function saveSettings(settings: any) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, ...settings }))
  } catch (error) {
    console.error("Error saving settings:", error)
  }
}

/**
 * Creates a new session
 */
export async function createSession(url: string, browserInfo: string): Promise<Session> {
  // Clean up old sessions first to make room
  await cleanupStorage()

  const session: Session = {
    id: generateId(),
    startTime: Date.now(),
    url,
    browserInfo,
    issues: [],
  }

  // Save to storage
  await saveSession(session)
  await setCurrentSession(session)

  // Also update the sessions list
  const sessions = await getSessions()
  await saveSessions([...sessions, session])

  // Sync to cloud if enabled
  const settings = await getSettings()
  if (settings.syncEnabled && isOnline()) {
    syncSession(session).catch(console.error)
  }

  return session
}

/**
 * Gets all sessions
 */
export async function getSessions(): Promise<Session[]> {
  try {
    const sessionsJson = localStorage.getItem(SESSIONS_KEY)
    return sessionsJson ? JSON.parse(sessionsJson) : []
  } catch (error) {
    console.error("Error getting sessions:", error)
    return []
  }
}

/**
 * Saves all sessions
 */
export async function saveSessions(sessions: Session[]): Promise<void> {
  try {
    // Store only session metadata in the sessions list, not the full issues
    const lightSessions = sessions.map((session) => ({
      id: session.id,
      startTime: session.startTime,
      url: session.url,
      browserInfo: session.browserInfo,
      name: session.name,
      description: session.description,
      lastUpdated: session.lastUpdated,
      createdBy: session.createdBy,
      issueCount: session.issues?.length || 0,
    }))

    localStorage.setItem(SESSIONS_KEY, JSON.stringify(lightSessions))
  } catch (error) {
    console.error("Error saving sessions:", error)
    // Check if we're hitting storage limits
    checkStorageQuota()
  }
}

/**
 * Gets the current session
 */
export async function getCurrentSession(): Promise<Session | null> {
  try {
    const sessionJson = localStorage.getItem(CURRENT_SESSION_KEY)
    if (!sessionJson) return null

    const session = JSON.parse(sessionJson)

    // Load the issues for this session
    session.issues = await getIssues(session.id)

    return session
  } catch (error) {
    console.error("Error getting current session:", error)
    return null
  }
}

/**
 * Sets the current session
 */
export async function setCurrentSession(session: Session): Promise<void> {
  try {
    // Store a lightweight version without issues
    const lightSession = {
      id: session.id,
      startTime: session.startTime,
      url: session.url,
      browserInfo: session.browserInfo,
      name: session.name,
      description: session.description,
      lastUpdated: session.lastUpdated,
      createdBy: session.createdBy,
    }

    localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(lightSession))
  } catch (error) {
    console.error("Error setting current session:", error)
    // If we hit a quota error, try to clean up and retry
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      await cleanupStorage()
      try {
        const lightSession = {
          id: session.id,
          startTime: session.startTime,
          url: session.url,
          browserInfo: session.browserInfo,
          name: session.name,
          description: session.description,
          lastUpdated: session.lastUpdated,
          createdBy: session.createdBy,
        }
        localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(lightSession))
      } catch (retryError) {
        console.error("Failed to set current session even after cleanup:", retryError)
        showStorageError()
      }
    }
  }
}

/**
 * Saves a session
 */
export async function saveSession(session: Session): Promise<void> {
  try {
    // Update the session in the sessions list
    const sessions = await getSessions()
    const updatedSessions = sessions.map((s) => (s.id === session.id ? session : s))

    // If the session doesn't exist in the list, add it
    if (!sessions.some((s) => s.id === session.id)) {
      updatedSessions.push(session)
    }

    await saveSessions(updatedSessions)

    // If this is the current session, update it
    const currentSession = await getCurrentSession()
    if (currentSession && currentSession.id === session.id) {
      await setCurrentSession(session)
    }

    // Save all issues individually
    for (const issue of session.issues) {
      await saveIssueIndividually(session.id, issue)
    }

    // Sync to cloud if enabled
    const settings = await getSettings()
    if (settings.syncEnabled && isOnline()) {
      syncSession(session).catch(console.error)
    }
  } catch (error) {
    console.error("Error saving session:", error)
    checkStorageQuota()
  }
}

/**
 * Gets all issues for a session
 */
export async function getIssues(sessionId: string): Promise<Issue[]> {
  try {
    const issues: Issue[] = []

    // Get all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(`${ISSUE_PREFIX}${sessionId}_`)) {
        try {
          const issueJson = localStorage.getItem(key)
          if (issueJson) {
            const issue = JSON.parse(issueJson)
            issues.push(issue)
          }
        } catch (parseError) {
          console.error(`Error parsing issue from key ${key}:`, parseError)
        }
      }
    }

    // Sort issues by timestamp
    return issues.sort((a, b) => a.timestamp - b.timestamp)
  } catch (error) {
    console.error("Error getting issues:", error)
    return []
  }
}

/**
 * Saves an individual issue
 */
async function saveIssueIndividually(sessionId: string, issue: Issue): Promise<void> {
  try {
    const key = `${ISSUE_PREFIX}${sessionId}_${issue.id}`
    localStorage.setItem(key, JSON.stringify(issue))

    // Sync to cloud if enabled
    const settings = await getSettings()
    if (settings.syncEnabled && isOnline()) {
      syncIssue(sessionId, issue).catch(console.error)
    }
  } catch (error) {
    console.error("Error saving issue:", error)

    // If we hit quota error, try to compress the screenshot
    if (error instanceof DOMException && error.name === "QuotaExceededError" && issue.screenshot) {
      try {
        // Compress the screenshot
        issue.screenshot = await compressScreenshot(issue.screenshot)

        // Try saving again
        const key = `${ISSUE_PREFIX}${sessionId}_${issue.id}`
        localStorage.setItem(key, JSON.stringify(issue))

        // Sync to cloud if enabled
        const settings = await getSettings()
        if (settings.syncEnabled && isOnline()) {
          syncIssue(sessionId, issue).catch(console.error)
        }
      } catch (compressionError) {
        console.error("Error compressing and saving issue:", compressionError)

        // Last resort: remove the screenshot
        issue.screenshot = undefined
        try {
          const key = `${ISSUE_PREFIX}${sessionId}_${issue.id}`
          localStorage.setItem(key, JSON.stringify(issue))

          // Sync to cloud if enabled
          const settings = await getSettings()
          if (settings.syncEnabled && isOnline()) {
            syncIssue(sessionId, issue).catch(console.error)
          }
        } catch (finalError) {
          console.error("Failed to save issue even without screenshot:", finalError)
          showStorageError()
        }
      }
    }
  }
}

/**
 * Compresses a screenshot to reduce storage size
 */
async function compressScreenshot(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      // Determine target dimensions (max 1200px in any dimension)
      let width = img.width
      let height = img.height
      const maxDimension = 1200

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }

      // Create canvas and draw image
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        reject(new Error("Could not get canvas context"))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      // Convert to JPEG with reduced quality
      resolve(canvas.toDataURL("image/jpeg", 0.7))
    }

    img.onerror = () => {
      reject(new Error("Failed to load image for compression"))
    }

    img.src = dataUrl
  })
}

/**
 * Adds an issue to a session
 */
export async function addIssue(sessionId: string, issue: Issue): Promise<void> {
  try {
    // Get current issues
    const issues = await getIssues(sessionId)

    // Check if we're at the limit
    const settings = await getSettings()
    if (issues.length >= settings.maxIssuesPerSession) {
      // Remove oldest issue
      const oldestIssue = issues.reduce(
        (oldest, current) => (current.timestamp < oldest.timestamp ? current : oldest),
        issues[0],
      )

      if (oldestIssue) {
        await deleteIssue(sessionId, oldestIssue.id)

        // Show warning
        if (typeof window !== "undefined") {
          const event = new CustomEvent("storage-warning", {
            detail: {
              message: `Removed oldest issue to stay within the limit of ${settings.maxIssuesPerSession} issues per session.`,
              type: "warning",
            },
          })
          window.dispatchEvent(event)
        }
      }
    }

    // Compress screenshot if it exists
    if (issue.screenshot) {
      issue.screenshot = await compressScreenshot(issue.screenshot)
    }

    // Save the individual issue
    await saveIssueIndividually(sessionId, issue)

    // Update the session's issue list
    const updatedIssues = await getIssues(sessionId)

    // Update the session
    const session = await getSessionById(sessionId)
    if (session) {
      session.issues = updatedIssues

      // Update the session metadata without saving all issues again
      const sessions = await getSessions()
      const updatedSessions = sessions.map((s) => {
        if (s.id === sessionId) {
          return {
            ...s,
            issueCount: updatedIssues.length,
            lastUpdated: Date.now(),
          }
        }
        return s
      })

      await saveSessions(updatedSessions)

      // Update current session if needed
      const currentSession = await getCurrentSession()
      if (currentSession && currentSession.id === sessionId) {
        await setCurrentSession(session)
      }
    }

    // Check storage quota after adding
    checkStorageQuota()
  } catch (error) {
    console.error("Error adding issue:", error)
    checkStorageQuota()
  }
}

/**
 * Updates an issue
 */
export async function updateIssue(sessionId: string, updatedIssue: Issue): Promise<void> {
  try {
    // Save the updated issue
    await saveIssueIndividually(sessionId, updatedIssue)

    // Get all issues and update the specific one
    const issues = await getIssues(sessionId)
    const updatedIssues = issues.map((issue) => (issue.id === updatedIssue.id ? updatedIssue : issue))

    // Update the session
    const session = await getSessionById(sessionId)
    if (session) {
      session.issues = updatedIssues
      session.lastUpdated = Date.now()

      // Update session metadata
      const sessions = await getSessions()
      const updatedSessions = sessions.map((s) => {
        if (s.id === sessionId) {
          return {
            ...s,
            lastUpdated: Date.now(),
          }
        }
        return s
      })

      await saveSessions(updatedSessions)

      // Update current session if needed
      const currentSession = await getCurrentSession()
      if (currentSession && currentSession.id === sessionId) {
        await setCurrentSession(session)
      }
    }
  } catch (error) {
    console.error("Error updating issue:", error)
    checkStorageQuota()
  }
}

/**
 * Deletes an issue
 */
export async function deleteIssue(sessionId: string, issueId: string): Promise<void> {
  try {
    // Remove the issue from localStorage
    const key = `${ISSUE_PREFIX}${sessionId}_${issueId}`
    localStorage.removeItem(key)

    // Update the session's issue list
    const issues = await getIssues(sessionId)
    const filteredIssues = issues.filter((issue) => issue.id !== issueId)

    // Update the session
    const session = await getSessionById(sessionId)
    if (session) {
      session.issues = filteredIssues
      session.lastUpdated = Date.now()

      // Update session metadata
      const sessions = await getSessions()
      const updatedSessions = sessions.map((s) => {
        if (s.id === sessionId) {
          return {
            ...s,
            issueCount: filteredIssues.length,
            lastUpdated: Date.now(),
          }
        }
        return s
      })

      await saveSessions(updatedSessions)

      // Update current session if needed
      const currentSession = await getCurrentSession()
      if (currentSession && currentSession.id === sessionId) {
        await setCurrentSession(session)
      }
    }

    // Delete from cloud if sync is enabled
    const settings = await getSettings()
    if (settings.syncEnabled && isOnline()) {
      deleteIssueFromCloud(sessionId, issueId).catch(console.error)
    }
  } catch (error) {
    console.error("Error deleting issue:", error)
  }
}

/**
 * Deletes multiple issues
 */
export async function deleteMultipleIssues(sessionId: string, issueIds: string[]): Promise<void> {
  try {
    // Remove each issue from localStorage
    for (const issueId of issueIds) {
      const key = `${ISSUE_PREFIX}${sessionId}_${issueId}`
      localStorage.removeItem(key)

      // Delete from cloud if sync is enabled
      const settings = await getSettings()
      if (settings.syncEnabled && isOnline()) {
        deleteIssueFromCloud(sessionId, issueId).catch(console.error)
      }
    }

    // Update the session's issue list
    const issues = await getIssues(sessionId)
    const filteredIssues = issues.filter((issue) => !issueIds.includes(issue.id))

    // Update the session
    const session = await getSessionById(sessionId)
    if (session) {
      session.issues = filteredIssues
      session.lastUpdated = Date.now()

      // Update session metadata
      const sessions = await getSessions()
      const updatedSessions = sessions.map((s) => {
        if (s.id === sessionId) {
          return {
            ...s,
            issueCount: filteredIssues.length,
            lastUpdated: Date.now(),
          }
        }
        return s
      })

      await saveSessions(updatedSessions)

      // Update current session if needed
      const currentSession = await getCurrentSession()
      if (currentSession && currentSession.id === sessionId) {
        await setCurrentSession(session)
      }
    }

    // Show success toast
    if (typeof window !== "undefined") {
      const event = new CustomEvent("bulk-delete-success", {
        detail: {
          count: issueIds.length,
        },
      })
      window.dispatchEvent(event)
    }
  } catch (error) {
    console.error("Error deleting multiple issues:", error)

    // Show error toast
    if (typeof window !== "undefined") {
      const event = new CustomEvent("bulk-delete-error")
      window.dispatchEvent(event)
    }
  }
}

/**
 * Gets a session by ID
 */
export async function getSessionById(sessionId: string): Promise<Session | null> {
  try {
    const sessions = await getSessions()
    const session = sessions.find((session) => session.id === sessionId)

    if (!session) return null

    // Load the issues for this session
    const issues = await getIssues(sessionId)
    return {
      ...session,
      issues,
    }
  } catch (error) {
    console.error("Error getting session by ID:", error)
    return null
  }
}

/**
 * Updates session metadata
 */
export async function updateSessionMetadata(sessionId: string, metadata: Partial<Session>): Promise<void> {
  try {
    // Get the session
    const sessions = await getSessions()
    const sessionIndex = sessions.findIndex((s) => s.id === sessionId)

    if (sessionIndex === -1) {
      console.error("Session not found:", sessionId)
      return
    }

    // Update the session metadata
    const updatedSession = {
      ...sessions[sessionIndex],
      ...metadata,
      lastUpdated: Date.now(),
    }

    // Update in sessions list
    const updatedSessions = [...sessions]
    updatedSessions[sessionIndex] = updatedSession

    // Save updated sessions
    await saveSessions(updatedSessions)

    // Update current session if needed
    const currentSession = await getCurrentSession()
    if (currentSession && currentSession.id === sessionId) {
      await setCurrentSession({
        ...currentSession,
        ...metadata,
        lastUpdated: Date.now(),
      })
    }

    // Sync to cloud if enabled
    const settings = await getSettings()
    if (settings.syncEnabled && isOnline()) {
      const fullSession = await getSessionById(sessionId)
      if (fullSession) {
        syncSession(fullSession).catch(console.error)
      }
    }

    // Show success toast
    if (typeof window !== "undefined") {
      const event = new CustomEvent("session-update-success")
      window.dispatchEvent(event)
    }
  } catch (error) {
    console.error("Error updating session metadata:", error)

    // Show error toast
    if (typeof window !== "undefined") {
      const event = new CustomEvent("session-update-error")
      window.dispatchEvent(event)
    }
  }
}

/**
 * Deletes a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    // Remove from sessions list
    const sessions = await getSessions()
    const filteredSessions = sessions.filter((session) => session.id !== sessionId)
    await saveSessions(filteredSessions)

    // Remove all issues for this session
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(`${ISSUE_PREFIX}${sessionId}_`)) {
        localStorage.removeItem(key)
      }
    }

    // If this was the current session, set a new one
    const currentSession = await getCurrentSession()
    if (currentSession && currentSession.id === sessionId) {
      if (filteredSessions.length > 0) {
        const newCurrentSession = await getSessionById(filteredSessions[0].id)
        if (newCurrentSession) {
          await setCurrentSession(newCurrentSession)
        }
      } else {
        localStorage.removeItem(CURRENT_SESSION_KEY)
      }
    }

    // Delete from cloud if sync is enabled
    const settings = await getSettings()
    if (settings.syncEnabled && isOnline()) {
      deleteSessionFromCloud(sessionId).catch(console.error)
    }
  } catch (error) {
    console.error("Error deleting session:", error)
  }
}

/**
 * Clones a session
 */
export async function cloneSession(sessionId: string): Promise<Session | null> {
  try {
    const session = await getSessionById(sessionId)
    if (!session) return null

    // Create a new session with the same data but new ID
    const clonedSession: Session = {
      ...session,
      id: generateId(),
      startTime: Date.now(),
      issues: [], // Start with no issues
    }

    // Save the cloned session
    await saveSession(clonedSession)

    return clonedSession
  } catch (error) {
    console.error("Error cloning session:", error)
    return null
  }
}

/**
 * Cleans up storage by removing old sessions when there are too many
 */
export async function cleanupStorage(): Promise<void> {
  try {
    const sessions = await getSessions()
    const settings = await getSettings()

    // If we have more than maxSessionsCount, remove the oldest ones
    if (sessions.length > settings.maxSessionsCount) {
      // Sort sessions by startTime (oldest first)
      const sortedSessions = [...sessions].sort((a, b) => a.startTime - b.startTime)

      // Get the sessions to remove
      const sessionsToRemove = sortedSessions.slice(0, sessions.length - settings.maxSessionsCount)

      // Delete each session
      for (const session of sessionsToRemove) {
        await deleteSession(session.id)
      }

      console.log(`Cleaned up ${sessionsToRemove.length} old sessions to free up storage space`)

      // Show notification
      if (typeof window !== "undefined") {
        const event = new CustomEvent("storage-cleanup", {
          detail: {
            count: sessionsToRemove.length,
          },
        })
        window.dispatchEvent(event)
      }
    }
  } catch (error) {
    console.error("Error cleaning up storage:", error)
  }
}

/**
 * Check storage quota and show warning if needed
 */
export async function checkStorageQuota(): Promise<void> {
  try {
    // Only works in secure contexts (HTTPS or localhost)
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate()
      const percentUsed = estimate.usage ? estimate.usage / (estimate.quota || Number.POSITIVE_INFINITY) : 0
      const settings = await getSettings()

      if (percentUsed > settings.storageWarningThreshold) {
        console.warn(`Storage usage: ${Math.round(percentUsed * 100)}% of quota`)

        // Show warning toast
        if (typeof window !== "undefined") {
          const event = new CustomEvent("storage-warning", {
            detail: {
              message: `You're using ${Math.round(percentUsed * 100)}% of available storage. Consider exporting and clearing old sessions.`,
              type: "warning",
            },
          })
          window.dispatchEvent(event)
        }

        // Auto cleanup if enabled
        if (settings.autoCleanupEnabled) {
          await cleanupStorage()
        }
      }
    }
  } catch (error) {
    console.error("Error checking storage quota:", error)
  }
}

/**
 * Show storage error toast
 */
function showStorageError(): void {
  if (typeof window !== "undefined") {
    const event = new CustomEvent("storage-error", {
      detail: {
        message: "Unable to save data due to storage limitations. Try exporting and clearing old sessions.",
      },
    })
    window.dispatchEvent(event)
  }
}

/**
 * Get storage usage statistics
 */
export async function getStorageStats(): Promise<{ used: number; total: number; percent: number }> {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate()
      const used = estimate.usage || 0
      const total = estimate.quota || 0
      const percent = total > 0 ? (used / total) * 100 : 0

      return {
        used: Math.round((used / 1024 / 1024) * 100) / 100, // MB with 2 decimal places
        total: Math.round((total / 1024 / 1024) * 100) / 100, // MB with 2 decimal places
        percent: Math.round(percent * 10) / 10, // Percentage with 1 decimal place
      }
    }

    return { used: 0, total: 0, percent: 0 }
  } catch (error) {
    console.error("Error getting storage stats:", error)
    return { used: 0, total: 0, percent: 0 }
  }
}

/**
 * Initialize the session manager
 */
export function initSessionManager(): void {
  // Listen for storage events from other components
  if (typeof window !== "undefined") {
    // Set up listeners for custom events
    window.addEventListener("storage-warning", (event: any) => {
      console.log("Storage warning event received:", event.detail)
    })

    window.addEventListener("storage-error", (event: any) => {
      console.error("Storage error event received:", event.detail)
    })

    window.addEventListener("storage-cleanup", (event: any) => {
      console.log("Storage cleanup event received:", event.detail)
    })

    window.addEventListener("bulk-delete-success", (event: any) => {
      console.log("Bulk delete success event received:", event.detail)
    })

    window.addEventListener("bulk-delete-error", () => {
      console.error("Bulk delete error event received")
    })

    window.addEventListener("session-update-success", () => {
      console.log("Session update success event received")
    })

    window.addEventListener("session-update-error", () => {
      console.error("Session update error event received")
    })
  }
}
