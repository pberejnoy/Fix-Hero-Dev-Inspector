import { db, storage } from "./firebase-config"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore"
import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage"
import type { Issue, Session } from "./types"

// Sync status type
export type SyncStatus = "idle" | "syncing" | "success" | "error"

// Sync state
let syncStatus: SyncStatus = "idle"
let lastSyncTime: number | null = null
let syncError: string | null = null
let syncListeners: Array<(status: SyncStatus, time: number | null, error: string | null) => void> = []

// Initialize the sync service
export function initSyncService() {
  // Check if we have a user
  const userEmail = localStorage.getItem("fixhero_user_email")
  if (!userEmail) {
    console.warn("Sync service initialized without user. Sync will be limited.")
    return
  }

  // Set up listeners for changes
  setupSyncListeners(userEmail)

  // Perform initial sync
  syncLocalToFirebase(userEmail)
    .then(() => {
      console.log("Initial sync completed successfully")
      updateSyncStatus("success")
    })
    .catch((error) => {
      console.error("Initial sync failed:", error)
      updateSyncStatus("error", error.message)
    })
}

// Set up listeners for Firestore changes
function setupSyncListeners(userEmail: string) {
  // Listen for session changes
  const sessionsRef = collection(db, "users", userEmail, "sessions")
  const q = query(sessionsRef, orderBy("lastUpdated", "desc"))

  onSnapshot(
    q,
    (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added" || change.type === "modified") {
          const session = { id: change.doc.id, ...change.doc.data() } as Session

          // Check if this is newer than our local version
          const localSessions = JSON.parse(localStorage.getItem("fixhero_sessions") || "[]")
          const localSession = localSessions.find((s: Session) => s.id === session.id)

          if (!localSession || localSession.lastUpdated < session.lastUpdated) {
            // Update local storage with the newer version
            const updatedSessions = localSessions.filter((s: Session) => s.id !== session.id)
            updatedSessions.push(session)
            localStorage.setItem("fixhero_sessions", JSON.stringify(updatedSessions))

            // Also update issues for this session
            await syncIssuesFromFirebase(userEmail, session.id)
          }
        }

        if (change.type === "removed") {
          // Remove from local storage
          const localSessions = JSON.parse(localStorage.getItem("fixhero_sessions") || "[]")
          const updatedSessions = localSessions.filter((s: Session) => s.id !== change.doc.id)
          localStorage.setItem("fixhero_sessions", JSON.stringify(updatedSessions))

          // Also remove issues for this session
          localStorage.setItem(`fixhero_issues_${change.doc.id}`, JSON.stringify([]))
        }
      })
    },
    (error) => {
      console.error("Error listening to sessions:", error)
      updateSyncStatus("error", "Failed to listen for session changes")
    },
  )
}

// Sync issues for a specific session from Firebase to local storage
async function syncIssuesFromFirebase(userEmail: string, sessionId: string) {
  try {
    const issuesRef = collection(db, "users", userEmail, "sessions", sessionId, "issues")
    const q = query(issuesRef, orderBy("timestamp", "desc"))
    const snapshot = await getDocs(q)

    const issues: Issue[] = []
    for (const doc of snapshot.docs) {
      const issue = { id: doc.id, ...doc.data() } as Issue

      // If the issue has a screenshot reference, fetch it
      if (issue.screenshotRef && !issue.screenshot) {
        try {
          const url = await getDownloadURL(ref(storage, issue.screenshotRef))
          // Convert URL to data URL (in a real app, you might want to keep the URL)
          const response = await fetch(url)
          const blob = await response.blob()
          const reader = new FileReader()
          issue.screenshot = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(blob)
          })
        } catch (error) {
          console.error(`Failed to fetch screenshot for issue ${issue.id}:`, error)
        }
      }

      issues.push(issue)
    }

    localStorage.setItem(`fixhero_issues_${sessionId}`, JSON.stringify(issues))
  } catch (error) {
    console.error(`Error syncing issues for session ${sessionId}:`, error)
    throw error
  }
}

// Sync local storage data to Firebase
export async function syncLocalToFirebase(userEmail: string) {
  updateSyncStatus("syncing")

  try {
    // Sync sessions
    const localSessions = JSON.parse(localStorage.getItem("fixhero_sessions") || "[]")
    const batch = writeBatch(db)

    for (const session of localSessions) {
      const sessionRef = doc(db, "users", userEmail, "sessions", session.id)

      // Check if the session exists in Firestore
      const sessionDoc = await getDoc(sessionRef)
      if (!sessionDoc.exists() || sessionDoc.data()?.lastUpdated < session.lastUpdated) {
        // Local version is newer, update Firestore
        batch.set(sessionRef, {
          ...session,
          lastUpdated: session.lastUpdated || Date.now(),
          syncedAt: serverTimestamp(),
        })

        // Sync issues for this session
        await syncSessionIssuesToFirebase(userEmail, session.id)
      }
    }

    await batch.commit()

    // Update sync status
    updateSyncStatus("success")
    return true
  } catch (error) {
    console.error("Error syncing to Firebase:", error)
    updateSyncStatus("error", error.message)
    throw error
  }
}

// Sync issues for a specific session to Firebase
async function syncSessionIssuesToFirebase(userEmail: string, sessionId: string) {
  try {
    const localIssues = JSON.parse(localStorage.getItem(`fixhero_issues_${sessionId}`) || "[]")
    const batch = writeBatch(db)

    for (const issue of localIssues) {
      const issueRef = doc(db, "users", userEmail, "sessions", sessionId, "issues", issue.id)

      // Check if the issue exists in Firestore
      const issueDoc = await getDoc(issueRef)

      // If issue doesn't exist or local version is newer
      if (!issueDoc.exists() || issueDoc.data()?.timestamp < issue.timestamp) {
        // Handle screenshot separately
        const issueData = { ...issue }

        if (issue.screenshot && !issue.screenshotRef) {
          // Upload screenshot to Storage
          const screenshotRef = `users/${userEmail}/screenshots/${sessionId}/${issue.id}.jpg`
          await uploadString(ref(storage, screenshotRef), issue.screenshot, "data_url")

          // Store reference instead of data URL
          issueData.screenshotRef = screenshotRef
          delete issueData.screenshot
        }

        batch.set(issueRef, {
          ...issueData,
          syncedAt: serverTimestamp(),
        })
      }
    }

    await batch.commit()
    return true
  } catch (error) {
    console.error(`Error syncing issues for session ${sessionId}:`, error)
    throw error
  }
}

// Delete an issue from Firebase
export async function deleteIssueFromFirebase(userEmail: string, sessionId: string, issueId: string) {
  try {
    updateSyncStatus("syncing")

    // Delete the issue document
    await deleteDoc(doc(db, "users", userEmail, "sessions", sessionId, "issues", issueId))

    // Delete the screenshot if it exists
    try {
      await deleteObject(ref(storage, `users/${userEmail}/screenshots/${sessionId}/${issueId}.jpg`))
    } catch (error) {
      // Ignore errors if screenshot doesn't exist
      console.log("No screenshot found to delete or error deleting:", error)
    }

    updateSyncStatus("success")
    return true
  } catch (error) {
    console.error("Error deleting issue from Firebase:", error)
    updateSyncStatus("error", error.message)
    throw error
  }
}

// Delete a session from Firebase
export async function deleteSessionFromFirebase(userEmail: string, sessionId: string) {
  try {
    updateSyncStatus("syncing")

    // First, get all issues for this session
    const issuesRef = collection(db, "users", userEmail, "sessions", sessionId, "issues")
    const snapshot = await getDocs(issuesRef)

    // Delete all issues
    const batch = writeBatch(db)
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })
    await batch.commit()

    // Delete all screenshots
    for (const doc of snapshot.docs) {
      try {
        await deleteObject(ref(storage, `users/${userEmail}/screenshots/${sessionId}/${doc.id}.jpg`))
      } catch (error) {
        // Ignore errors if screenshot doesn't exist
        console.log(`No screenshot found for issue ${doc.id} or error deleting:`, error)
      }
    }

    // Delete the session document
    await deleteDoc(doc(db, "users", userEmail, "sessions", sessionId))

    updateSyncStatus("success")
    return true
  } catch (error) {
    console.error("Error deleting session from Firebase:", error)
    updateSyncStatus("error", error.message)
    throw error
  }
}

// Update sync status and notify listeners
function updateSyncStatus(status: SyncStatus, errorMessage: string | null = null) {
  syncStatus = status
  lastSyncTime = Date.now()
  syncError = errorMessage

  // Notify all listeners
  syncListeners.forEach((listener) => {
    listener(syncStatus, lastSyncTime, syncError)
  })
}

// Subscribe to sync status changes
export function subscribeSyncStatus(callback: (status: SyncStatus, time: number | null, error: string | null) => void) {
  syncListeners.push(callback)

  // Immediately call with current status
  callback(syncStatus, lastSyncTime, syncError)

  // Return unsubscribe function
  return () => {
    syncListeners = syncListeners.filter((listener) => listener !== callback)
  }
}

// Get current sync status
export function getSyncStatus() {
  return {
    status: syncStatus,
    lastSyncTime,
    error: syncError,
  }
}

// Force a manual sync
export async function forceSync() {
  const userEmail = localStorage.getItem("fixhero_user_email")
  if (!userEmail) {
    throw new Error("No user logged in")
  }

  return syncLocalToFirebase(userEmail)
}
