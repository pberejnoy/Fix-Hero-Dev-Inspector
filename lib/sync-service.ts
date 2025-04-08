import { db, storage } from "./firebase-config"
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  onSnapshot,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore"
import { ref, uploadString, getDownloadURL } from "firebase/storage"
import type { Session, Issue } from "./types"

// Sync status types
export type SyncStatus = "synced" | "syncing" | "offline" | "error"

// Singleton to track sync status
class SyncStatusTracker {
  private static instance: SyncStatusTracker
  private _status: SyncStatus = "offline"
  private _listeners: ((status: SyncStatus) => void)[] = []
  private _lastSynced: Date | null = null
  private _pendingChanges = 0

  private constructor() {}

  public static getInstance(): SyncStatusTracker {
    if (!SyncStatusTracker.instance) {
      SyncStatusTracker.instance = new SyncStatusTracker()
    }
    return SyncStatusTracker.instance
  }

  public get status(): SyncStatus {
    return this._status
  }

  public set status(newStatus: SyncStatus) {
    this._status = newStatus
    if (newStatus === "synced") {
      this._lastSynced = new Date()
    }
    this._notifyListeners()
  }

  public get lastSynced(): Date | null {
    return this._lastSynced
  }

  public get pendingChanges(): number {
    return this._pendingChanges
  }

  public incrementPendingChanges(): void {
    this._pendingChanges++
    this._notifyListeners()
  }

  public decrementPendingChanges(): void {
    if (this._pendingChanges > 0) {
      this._pendingChanges--
    }
    this._notifyListeners()
  }

  public resetPendingChanges(): void {
    this._pendingChanges = 0
    this._notifyListeners()
  }

  public addListener(listener: (status: SyncStatus) => void): void {
    this._listeners.push(listener)
  }

  public removeListener(listener: (status: SyncStatus) => void): void {
    this._listeners = this._listeners.filter((l) => l !== listener)
  }

  private _notifyListeners(): void {
    this._listeners.forEach((listener) => listener(this._status))
  }
}

export const syncStatusTracker = SyncStatusTracker.getInstance()

// Check if we're online
export function isOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine
}

// Listen for online/offline events
export function setupNetworkListeners(): void {
  if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
      syncStatusTracker.status = "synced"
      // Trigger sync when we come back online
      syncAllData()
    })

    window.addEventListener("offline", () => {
      syncStatusTracker.status = "offline"
    })
  }
}

// Sync a session to Firestore
export async function syncSession(session: Session): Promise<void> {
  if (!isOnline()) {
    syncStatusTracker.status = "offline"
    return
  }

  try {
    syncStatusTracker.status = "syncing"
    syncStatusTracker.incrementPendingChanges()

    // Create a clean version of the session without the issues array
    const sessionDoc = {
      id: session.id,
      startTime: Timestamp.fromMillis(session.startTime),
      url: session.url,
      browserInfo: session.browserInfo,
      name: session.name || "Unnamed Session",
      description: session.description || "",
      lastUpdated: session.lastUpdated ? Timestamp.fromMillis(session.lastUpdated) : serverTimestamp(),
      createdBy: session.createdBy || "anonymous",
      issueCount: session.issues?.length || 0,
      syncedAt: serverTimestamp(),
    }

    // Save to Firestore
    const sessionRef = doc(db, "sessions", session.id)
    await setDoc(sessionRef, sessionDoc, { merge: true })

    // Sync all issues for this session
    if (session.issues && session.issues.length > 0) {
      await Promise.all(session.issues.map((issue) => syncIssue(session.id, issue)))
    }

    syncStatusTracker.decrementPendingChanges()
    if (syncStatusTracker.pendingChanges === 0) {
      syncStatusTracker.status = "synced"
    }
  } catch (error) {
    console.error("Error syncing session:", error)
    syncStatusTracker.status = "error"
    syncStatusTracker.decrementPendingChanges()
    throw error
  }
}

// Sync an issue to Firestore
export async function syncIssue(sessionId: string, issue: Issue): Promise<void> {
  if (!isOnline()) {
    syncStatusTracker.status = "offline"
    return
  }

  try {
    syncStatusTracker.status = "syncing"
    syncStatusTracker.incrementPendingChanges()

    // Handle screenshot separately
    let screenshotUrl = issue.screenshot
    if (issue.screenshot && issue.screenshot.startsWith("data:")) {
      // Upload screenshot to Firebase Storage
      const screenshotRef = ref(storage, `screenshots/${sessionId}/${issue.id}.jpg`)
      await uploadString(screenshotRef, issue.screenshot, "data_url")
      screenshotUrl = await getDownloadURL(screenshotRef)
    }

    // Create a clean version of the issue
    const issueDoc = {
      ...issue,
      screenshot: screenshotUrl,
      timestamp: Timestamp.fromMillis(issue.timestamp),
      syncedAt: serverTimestamp(),
    }

    // Save to Firestore
    const issueRef = doc(db, "sessions", sessionId, "issues", issue.id)
    await setDoc(issueRef, issueDoc, { merge: true })

    syncStatusTracker.decrementPendingChanges()
    if (syncStatusTracker.pendingChanges === 0) {
      syncStatusTracker.status = "synced"
    }
  } catch (error) {
    console.error("Error syncing issue:", error)
    syncStatusTracker.status = "error"
    syncStatusTracker.decrementPendingChanges()
    throw error
  }
}

// Fetch a session from Firestore
export async function fetchSession(sessionId: string): Promise<Session | null> {
  if (!isOnline()) {
    syncStatusTracker.status = "offline"
    return null
  }

  try {
    syncStatusTracker.status = "syncing"

    // Get session document
    const sessionRef = doc(db, "sessions", sessionId)
    const sessionSnap = await getDoc(sessionRef)

    if (!sessionSnap.exists()) {
      syncStatusTracker.status = "synced"
      return null
    }

    const sessionData = sessionSnap.data()

    // Get all issues for this session
    const issuesQuery = query(collection(db, "sessions", sessionId, "issues"), orderBy("timestamp", "desc"))
    const issuesSnap = await getDocs(issuesQuery)

    const issues: Issue[] = []
    issuesSnap.forEach((doc) => {
      const issueData = doc.data() as any
      issues.push({
        ...issueData,
        timestamp: issueData.timestamp.toMillis(),
      })
    })

    // Construct the session object
    const session: Session = {
      id: sessionData.id,
      startTime: sessionData.startTime.toMillis(),
      url: sessionData.url,
      browserInfo: sessionData.browserInfo,
      name: sessionData.name,
      description: sessionData.description,
      lastUpdated: sessionData.lastUpdated?.toMillis() || null,
      createdBy: sessionData.createdBy,
      issues,
    }

    syncStatusTracker.status = "synced"
    return session
  } catch (error) {
    console.error("Error fetching session:", error)
    syncStatusTracker.status = "error"
    throw error
  }
}

// Fetch all sessions from Firestore
export async function fetchAllSessions(): Promise<Session[]> {
  if (!isOnline()) {
    syncStatusTracker.status = "offline"
    return []
  }

  try {
    syncStatusTracker.status = "syncing"

    // Get all sessions
    const sessionsQuery = query(collection(db, "sessions"), orderBy("lastUpdated", "desc"))
    const sessionsSnap = await getDocs(sessionsQuery)

    const sessions: Session[] = []

    // Process each session
    for (const sessionDoc of sessionsSnap.docs) {
      const sessionData = sessionDoc.data()

      // Get all issues for this session
      const issuesQuery = query(collection(db, "sessions", sessionDoc.id, "issues"), orderBy("timestamp", "desc"))
      const issuesSnap = await getDocs(issuesQuery)

      const issues: Issue[] = []
      issuesSnap.forEach((doc) => {
        const issueData = doc.data() as any
        issues.push({
          ...issueData,
          timestamp: issueData.timestamp.toMillis(),
        })
      })

      // Construct the session object
      sessions.push({
        id: sessionData.id,
        startTime: sessionData.startTime.toMillis(),
        url: sessionData.url,
        browserInfo: sessionData.browserInfo,
        name: sessionData.name,
        description: sessionData.description,
        lastUpdated: sessionData.lastUpdated?.toMillis() || null,
        createdBy: sessionData.createdBy,
        issues,
      })
    }

    syncStatusTracker.status = "synced"
    return sessions
  } catch (error) {
    console.error("Error fetching all sessions:", error)
    syncStatusTracker.status = "error"
    throw error
  }
}

// Delete a session from Firestore
export async function deleteSessionFromCloud(sessionId: string): Promise<void> {
  if (!isOnline()) {
    syncStatusTracker.status = "offline"
    return
  }

  try {
    syncStatusTracker.status = "syncing"

    // Get all issues for this session
    const issuesQuery = query(collection(db, "sessions", sessionId, "issues"))
    const issuesSnap = await getDocs(issuesQuery)

    // Delete all issues
    const deletePromises = issuesSnap.docs.map((doc) => deleteDoc(doc.ref))

    await Promise.all(deletePromises)

    // Delete the session document
    await deleteDoc(doc(db, "sessions", sessionId))

    syncStatusTracker.status = "synced"
  } catch (error) {
    console.error("Error deleting session from cloud:", error)
    syncStatusTracker.status = "error"
    throw error
  }
}

// Delete an issue from Firestore
export async function deleteIssueFromCloud(sessionId: string, issueId: string): Promise<void> {
  if (!isOnline()) {
    syncStatusTracker.status = "offline"
    return
  }

  try {
    syncStatusTracker.status = "syncing"

    // Delete the issue document
    await deleteDoc(doc(db, "sessions", sessionId, "issues", issueId))

    // Update the issue count in the session document
    const sessionRef = doc(db, "sessions", sessionId)
    const sessionSnap = await getDoc(sessionRef)

    if (sessionSnap.exists()) {
      const sessionData = sessionSnap.data()
      await setDoc(
        sessionRef,
        {
          ...sessionData,
          issueCount: Math.max(0, (sessionData.issueCount || 0) - 1),
          lastUpdated: serverTimestamp(),
        },
        { merge: true },
      )
    }

    syncStatusTracker.status = "synced"
  } catch (error) {
    console.error("Error deleting issue from cloud:", error)
    syncStatusTracker.status = "error"
    throw error
  }
}

// Sync all local data to the cloud
export async function syncAllData(): Promise<void> {
  if (!isOnline()) {
    syncStatusTracker.status = "offline"
    return
  }

  try {
    syncStatusTracker.status = "syncing"

    // Get all sessions from localStorage
    const sessionsJson = localStorage.getItem("fixhero_sessions")
    if (!sessionsJson) {
      syncStatusTracker.status = "synced"
      return
    }

    const sessions = JSON.parse(sessionsJson)

    // Sync each session
    for (const sessionMeta of sessions) {
      // Get full session with issues
      const sessionKey = `session_${sessionMeta.id}`
      const sessionJson = localStorage.getItem(sessionKey)

      if (sessionJson) {
        const session = JSON.parse(sessionJson)
        await syncSession(session)
      }
    }

    syncStatusTracker.status = "synced"
  } catch (error) {
    console.error("Error syncing all data:", error)
    syncStatusTracker.status = "error"
    throw error
  }
}

// Set up real-time sync for a session
export function setupRealtimeSync(sessionId: string, callback: (session: Session) => void): () => void {
  // Listen for changes to the session document
  const sessionRef = doc(db, "sessions", sessionId)
  const unsubscribeSession = onSnapshot(sessionRef, async (docSnapshot) => {
    if (docSnapshot.exists()) {
      const sessionData = docSnapshot.data()

      // Listen for changes to the issues collection
      const issuesQuery = query(collection(db, "sessions", sessionId, "issues"), orderBy("timestamp", "desc"))

      const unsubscribeIssues = onSnapshot(issuesQuery, (querySnapshot) => {
        const issues: Issue[] = []
        querySnapshot.forEach((doc) => {
          const issueData = doc.data() as any
          issues.push({
            ...issueData,
            timestamp: issueData.timestamp.toMillis(),
          })
        })

        // Construct the session object
        const session: Session = {
          id: sessionData.id,
          startTime: sessionData.startTime.toMillis(),
          url: sessionData.url,
          browserInfo: sessionData.browserInfo,
          name: sessionData.name,
          description: sessionData.description,
          lastUpdated: sessionData.lastUpdated?.toMillis() || null,
          createdBy: sessionData.createdBy,
          issues,
        }

        callback(session)
      })

      return () => {
        unsubscribeIssues()
      }
    }
  })

  return unsubscribeSession
}

// Initialize sync service
export function initSyncService(): void {
  // Set up network listeners
  setupNetworkListeners()

  // Set initial status
  syncStatusTracker.status = isOnline() ? "synced" : "offline"

  // Sync data on startup if online
  if (isOnline()) {
    syncAllData().catch(console.error)
  }
}
