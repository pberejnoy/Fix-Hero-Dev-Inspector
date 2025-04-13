// Batch operations service for FixHero Dev Inspector
import type { Issue } from "./types"
import { getIssues, updateIssue, deleteMultipleIssues, getSessionById, updateSession } from "./session-manager-enhanced"
import { exportIssues, downloadExport, getFileExtension, getMimeType } from "./export-service"

// Batch update issues
export async function batchUpdateIssues(
  sessionId: string,
  issueIds: string[],
  updates: Partial<Issue>,
): Promise<boolean> {
  try {
    // Get all issues for the session
    const issues = await getIssues(sessionId)

    // Filter issues by IDs
    const selectedIssues = issues.filter((issue) => issueIds.includes(issue.id))

    // Update each issue
    for (const issue of selectedIssues) {
      const updatedIssue = {
        ...issue,
        ...updates,
        lastUpdated: Date.now(),
      }

      await updateIssue(sessionId, updatedIssue)
    }

    // Update session last updated timestamp
    const session = await getSessionById(sessionId)
    if (session) {
      await updateSession({
        ...session,
        lastUpdated: Date.now(),
      })
    }

    return true
  } catch (error) {
    console.error("Error batch updating issues:", error)
    return false
  }
}

// Batch delete issues
export async function batchDeleteIssues(sessionId: string, issueIds: string[]): Promise<boolean> {
  try {
    await deleteMultipleIssues(sessionId, issueIds)
    return true
  } catch (error) {
    console.error("Error batch deleting issues:", error)
    return false
  }
}

// Batch export issues
export async function batchExportIssues(
  sessionId: string,
  issueIds: string[],
  format: "markdown" | "json" | "csv" | "github" | "cursor" | "notion",
): Promise<boolean> {
  try {
    // Get all issues for the session
    const issues = await getIssues(sessionId)

    // Filter issues by IDs
    const selectedIssues = issues.filter((issue) => issueIds.includes(issue.id))

    // Get session
    const session = await getSessionById(sessionId)

    // Export issues
    const exportContent = await exportIssues(selectedIssues, session, format)

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const sessionName = session?.name.replace(/[^a-z0-9]/gi, "-").toLowerCase() || "session"
    const filename = `fixhero-${sessionName}-${timestamp}.${getFileExtension(format)}`

    // Download the file
    downloadExport(exportContent, filename, getMimeType(format))

    return true
  } catch (error) {
    console.error("Error batch exporting issues:", error)
    return false
  }
}

// Batch tag issues
export async function batchTagIssues(
  sessionId: string,
  issueIds: string[],
  tags: string[],
  operation: "add" | "remove" | "set",
): Promise<boolean> {
  try {
    // Get all issues for the session
    const issues = await getIssues(sessionId)

    // Filter issues by IDs
    const selectedIssues = issues.filter((issue) => issueIds.includes(issue.id))

    // Update each issue
    for (const issue of selectedIssues) {
      let updatedTags: string[] = []

      switch (operation) {
        case "add":
          // Add tags that don't already exist
          updatedTags = [...new Set([...(issue.tags || []), ...tags])]
          break
        case "remove":
          // Remove specified tags
          updatedTags = (issue.tags || []).filter((tag) => !tags.includes(tag))
          break
        case "set":
          // Replace all tags
          updatedTags = [...tags]
          break
      }

      const updatedIssue = {
        ...issue,
        tags: updatedTags,
        lastUpdated: Date.now(),
      }

      await updateIssue(sessionId, updatedIssue)
    }

    // Update session last updated timestamp
    const session = await getSessionById(sessionId)
    if (session) {
      await updateSession({
        ...session,
        lastUpdated: Date.now(),
      })
    }

    return true
  } catch (error) {
    console.error("Error batch tagging issues:", error)
    return false
  }
}

// Move issues to another session
export async function moveIssuesToSession(
  sourceSessionId: string,
  targetSessionId: string,
  issueIds: string[],
): Promise<boolean> {
  try {
    // Get source session issues
    const sourceIssues = await getIssues(sourceSessionId)

    // Filter issues by IDs
    const issuesToMove = sourceIssues.filter((issue) => issueIds.includes(issue.id))

    // Get target session issues
    const targetIssues = await getIssues(targetSessionId)

    // Check for ID conflicts
    const targetIssueIds = new Set(targetIssues.map((issue) => issue.id))
    const conflictingIds = issuesToMove.filter((issue) => targetIssueIds.has(issue.id))

    // If there are conflicts, generate new IDs
    const timestamp = Date.now()
    const movedIssues = issuesToMove.map((issue) => {
      if (targetIssueIds.has(issue.id)) {
        return {
          ...issue,
          id: `${issue.id}_moved_${timestamp}`,
          lastUpdated: timestamp,
        }
      }
      return {
        ...issue,
        lastUpdated: timestamp,
      }
    })

    // Add issues to target session
    for (const issue of movedIssues) {
      await updateIssue(targetSessionId, issue)
    }

    // Delete issues from source session
    await deleteMultipleIssues(sourceSessionId, issueIds)

    // Update both sessions' lastUpdated timestamp
    const sourceSession = await getSessionById(sourceSessionId)
    const targetSession = await getSessionById(targetSessionId)

    if (sourceSession) {
      await updateSession({
        ...sourceSession,
        lastUpdated: timestamp,
        issueCount: Math.max((sourceSession.issueCount || 0) - issueIds.length, 0),
      })
    }

    if (targetSession) {
      await updateSession({
        ...targetSession,
        lastUpdated: timestamp,
        issueCount: (targetSession.issueCount || 0) + issuesToMove.length,
      })
    }

    return true
  } catch (error) {
    console.error("Error moving issues to another session:", error)
    return false
  }
}
