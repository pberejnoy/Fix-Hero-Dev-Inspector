import type { Issue, Session } from "./types"
import { generateId } from "./utils"
import { syncLocalToFirebase, deleteIssueFromFirebase, deleteSessionFromFirebase } from "./sync-service"

// Get all sessions
export async function getSessions(): Promise<Session[]> {
  try {
    const sessions = JSON.parse(localStorage.getItem("fixhero_sessions") || "[]")
    return sessions.sort((a: Session, b: Session) => b.lastUpdated - a.lastUpdated)
  } catch (error) {
    console.error("Error getting sessions:", error)
    return []
  }
}

// Get a session by ID
export async function getSessionById(sessionId: string): Promise<Session | null> {
  try {
    const sessions = await getSessions()
    return sessions.find((session) => session.id === sessionId) || null
  } catch (error) {
    console.error("Error getting session by ID:", error)
    return null
  }
}

// Get the current session
export async function getCurrentSession(): Promise<Session | null> {
  try {
    const currentSessionId = localStorage.getItem("fixhero_current_session")
    if (!currentSessionId) return null

    return getSessionById(currentSessionId)
  } catch (error) {
    console.error("Error getting current session:", error)
    return null
  }
}

// Create a new session
export async function createSession(url: string, browserInfo: string): Promise<Session> {
  try {
    const sessionId = generateId()
    const timestamp = Date.now()

    const newSession: Session = {
      id: sessionId,
      url,
      browserInfo,
      created: timestamp,
      lastUpdated: timestamp,
      name: `Session ${new Date().toLocaleString()}`,
      issueCount: 0,
    }

    // Save to localStorage
    const sessions = await getSessions()
    localStorage.setItem("fixhero_sessions", JSON.stringify([...sessions, newSession]))
    localStorage.setItem("fixhero_current_session", sessionId)
    localStorage.setItem(`fixhero_issues_${sessionId}`, JSON.stringify([]))

    // Sync to Firebase if user is logged in
    const userEmail = localStorage.getItem("fixhero_user_email")
    if (userEmail) {
      syncLocalToFirebase(userEmail).catch((error) => {
        console.error("Error syncing new session to Firebase:", error)
      })
    }

    return newSession
  } catch (error) {
    console.error("Error creating session:", error)
    throw error
  }
}

// Set the current session
export async function setCurrentSession(session: Session): Promise<void> {
  try {
    localStorage.setItem("fixhero_current_session", session.id)
  } catch (error) {
    console.error("Error setting current session:", error)
    throw error
  }
}

// Update a session
export async function updateSession(updatedSession: Session): Promise<Session> {
  try {
    const sessions = await getSessions();\
    const updatedSessions = sessions.map  
  try {
    const sessions = await getSessions();
    const updatedSessions = sessions.map((session) => {
      if (session.id === updatedSession.id) {
        return {
          ...session,
          ...updatedSession,
          lastUpdated: Date.now(),
        };
      }
      return session;
    });

    localStorage.setItem("fixhero_sessions", JSON.stringify(updatedSessions));

    // Sync to Firebase if user is logged in
    const userEmail = localStorage.getItem("fixhero_user_email");
    if (userEmail) {
      syncLocalToFirebase(userEmail).catch(error => {
        console.error("Error syncing updated session to Firebase:", error);
      });
    }

    return updatedSession;
  } catch (error) {
    console.error("Error updating session:", error);
    throw error;
  }

// Clone a session
export async function cloneSession(sessionId: string): Promise<Session | null> {
  try {
    const sourceSession = await getSessionById(sessionId);
    if (!sourceSession) return null;

    const newSessionId = generateId();
    const timestamp = Date.now();

    const newSession: Session = {
      ...sourceSession,
      id: newSessionId,
      created: timestamp,
      lastUpdated: timestamp,
      name: `${sourceSession.name || "Session"} (Copy)`,
      issueCount: 0,
    };

    // Save to localStorage
    const sessions = await getSessions();
    localStorage.setItem("fixhero_sessions", JSON.stringify([...sessions, newSession]));
    localStorage.setItem(`fixhero_issues_${newSessionId}`, JSON.stringify([]));

    // Sync to Firebase if user is logged in
    const userEmail = localStorage.getItem("fixhero_user_email");
    if (userEmail) {
      syncLocalToFirebase(userEmail).catch(error => {
        console.error("Error syncing cloned session to Firebase:", error);
      });
    }

    return newSession;
  } catch (error) {
    console.error("Error cloning session:", error);
    throw error;
  }
}

// Delete a session
export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    const sessions = await getSessions();
    const updatedSessions = sessions.filter((session) => session.id !== sessionId);
    localStorage.setItem("fixhero_sessions", JSON.stringify(updatedSessions));

    // Remove issues for this session
    localStorage.removeItem(`fixhero_issues_${sessionId}`);

    // If this was the current session, set a new current session
    const currentSessionId = localStorage.getItem("fixhero_current_session");
    if (currentSessionId === sessionId) {
      if (updatedSessions.length > 0) {
        localStorage.setItem("fixhero_current_session", updatedSessions[0].id);
      } else {
        localStorage.removeItem("fixhero_current_session");
      }
    }

    // Delete from Firebase if user is logged in
    const userEmail = localStorage.getItem("fixhero_user_email");
    if (userEmail) {
      deleteSessionFromFirebase(userEmail, sessionId).catch(error => {
        console.error("Error deleting session from Firebase:", error);
      });
    }

    return true;
  } catch (error) {
    console.error("Error deleting session:", error);
    throw error;
  }
}

// Get all issues for a session
export async function getIssues(sessionId: string): Promise<Issue[]> {
  try {
    const issues = JSON.parse(localStorage.getItem(`fixhero_issues_${sessionId}`) || "[]");
    return issues.sort((a: Issue, b: Issue) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error getting issues:", error);
    return [];
  }
}

// Add an issue to a session
export async function addIssue(sessionId: string, issue: Issue): Promise<Issue> {
  try {
    // Save issue to localStorage
    const issues = await getIssues(sessionId);
    localStorage.setItem(`fixhero_issues_${sessionId}`, JSON.stringify([...issues, issue]));

    // Update session issue count and last updated
    const session = await getSessionById(sessionId);
    if (session) {
      const updatedSession = {
        ...session,
        issueCount: (session.issueCount || 0) + 1,
        lastUpdated: Date.now(),
      };
      await updateSession(updatedSession);
    }

    // Sync to Firebase if user is logged in
    const userEmail = localStorage.getItem("fixhero_user_email");
    if (userEmail) {
      syncLocalToFirebase(userEmail).catch(error => {
        console.error("Error syncing new issue to Firebase:", error);
      });
    }

    return issue;
  } catch (error) {
    console.error("Error adding issue:", error);
    throw error;
  }
}

// Update an issue
export async function updateIssue(sessionId: string, updatedIssue: Issue): Promise<Issue> {
  try {
    const issues = await getIssues(sessionId);
    const updatedIssues = issues.map((issue) => {
      if (issue.id === updatedIssue.id) {
        return {
          ...issue,
          ...updatedIssue,
          lastUpdated: Date.now(),
        };
      }
      return issue;
    });

    localStorage.setItem(`fixhero_issues_${sessionId}`, JSON.stringify(updatedIssues));

    // Update session last updated
    const session = await getSessionById(sessionId);
    if (session) {
      const updatedSession = {
        ...session,
        lastUpdated: Date.now(),
      };
      await updateSession(updatedSession);
    }

    // Sync to Firebase if user is logged in
    const userEmail = localStorage.getItem("fixhero_user_email");
    if (userEmail) {
      syncLocalToFirebase(userEmail).catch(error => {
        console.error("Error syncing updated issue to Firebase:", error);
      });
    }

    return updatedIssue;
  } catch (error) {
    console.error("Error updating issue:", error);
    throw error;
  }
}

// Delete an issue
export async function deleteIssue(sessionId: string, issueId: string): Promise<boolean> {
  try {
    const issues = await getIssues(sessionId);
    const updatedIssues = issues.filter((issue) => issue.id !== issueId);
    localStorage.setItem(`fixhero_issues_${sessionId}`, JSON.stringify(updatedIssues));

    // Update session issue count and last updated
    const session = await getSessionById(sessionId);
    if (session) {
      const updatedSession = {
        ...session,
        issueCount: Math.max((session.issueCount || 0) - 1, 0),
        lastUpdated: Date.now(),
      };
      await updateSession(updatedSession);
    }

    // Delete from Firebase if user is logged in
    const userEmail = localStorage.getItem("fixhero_user_email");
    if (userEmail) {
      deleteIssueFromFirebase(userEmail, sessionId, issueId).catch(error => {
        console.error("Error deleting issue from Firebase:", error);
      });
    }

    return true;
  } catch (error) {
    console.error("Error deleting issue:", error);
    throw error;
  }
}

// Delete multiple issues
export async function deleteMultipleIssues(sessionId: string, issueIds: string[]): Promise<boolean> {
  try {
    const issues = await getIssues(sessionId);
    const updatedIssues = issues.filter((issue) => !issueIds.includes(issue.id));
    localStorage.setItem(`fixhero_issues_${sessionId}`, JSON.stringify(updatedIssues));

    // Update session issue count and last updated
    const session = await getSessionById(sessionId);
    if (session) {
      const updatedSession = {
        ...session,
        issueCount: Math.max((session.issueCount || 0) - issueIds.length, 0),
        lastUpdated: Date.now(),
      };
      await updateSession(updatedSession);
    }

    // Delete from Firebase if user is logged in
    const userEmail = localStorage.getItem("fixhero_user_email");
    if (userEmail) {
      // Delete each issue from Firebase
      for (const issueId of issueIds) {
        deleteIssueFromFirebase(userEmail, sessionId, issueId).catch(error => {
          console.error(`Error deleting issue ${issueId} from Firebase:`, error);
        });
      }
    }

    return true;
  } catch (error) {
    console.error("Error deleting multiple issues:", error);
    throw error;
  }
}

// Clean up storage (remove old sessions, compress screenshots)
export async function cleanupStorage(): Promise<void> {
  try {
    // Check if we need to clean up
    const lastCleanup = localStorage.getItem("fixhero_last_cleanup");
    const now = Date.now();
    
    // Only clean up once a day
    if (lastCleanup && now - Number.parseInt(lastCleanup) < 24 * 60 * 60 * 1000) {
      return;
    }
    
    // Get all sessions
    const sessions = await getSessions();
    
    // Remove sessions older than 30 days
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const oldSessions = sessions.filter(session => session.lastUpdated < thirtyDaysAgo);
    
    for (const session of oldSessions) {
      // Remove from sessions list
      await deleteSession(session.id);
    }
    
    // Compress large screenshots in remaining sessions
    for (const session of sessions) {
      if (oldSessions.some(s => s.id === session.id)) continue;
      
      const issues = await getIssues(session.id);
      let updated = false;
      
      for (const issue of issues) {
        if (issue.screenshot && issue.screenshot.length > 100000) {
          // Compress screenshot
          const compressedScreenshot = await compressScreenshot(issue.screenshot);
          if (compressedScreenshot !== issue.screenshot) {
            issue.screenshot = compressedScreenshot;
            updated = true;
          }
        }
      }
      
      if (updated) {
        localStorage.setItem(`fixhero_issues_${session.id}`, JSON.stringify(issues));
      }
    }
    
    // Update last cleanup time
    localStorage.setItem("fixhero_last_cleanup", now.toString());
  } catch (error) {
    console.error("Error cleaning up storage:", error);
  }
}

// Helper function to compress screenshots
async function compressScreenshot(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      // Set canvas dimensions to match image but cap at reasonable size
      const maxDimension = 1200;
      let width = img.width;
      let height = img.height;
      
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round(height * (maxDimension / width));
          width = maxDimension;
        } else {
          width = Math.round(width * (maxDimension / height));
          height = maxDimension;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Reduce quality to save space
      const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
      resolve(compressedDataUrl);
    };
    
    img.onerror = () => {
      reject(new Error("Failed to load image for compression"));
    };
    
    img.src = dataUrl;
  });
}

// Check storage quota
export async function checkStorageQuota(): Promise<{
  used: number;
  quota: number;
  percentUsed: number;
}> {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
        percentUsed: estimate.quota ? (estimate.usage || 0) / estimate.quota : 0,
      };
    }
    
    // Fallback: estimate based on localStorage size
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || "";
        totalSize += key.length + value.length;
      }
    }
    
    // Rough estimate: localStorage is typically limited to 5-10MB
    const estimatedQuota = 5 * 1024 * 1024;
    return {
      used: totalSize,
      quota: estimatedQuota,
      percentUsed: totalSize / estimatedQuota,
    };
  } catch (error) {
    console.error("Error checking storage quota:", error);
    return {
      used: 0,
      quota: 0,
      percentUsed: 0,
    };
  }
}
