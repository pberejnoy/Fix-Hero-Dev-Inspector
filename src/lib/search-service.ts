// Search service for FixHero Dev Inspector
import type { Issue, Session } from "./types"
import { getSessions, getIssues } from "./session-manager-enhanced"

export interface SearchResult {
  type: "issue" | "session"
  item: Issue | Session
  sessionId?: string
  matchedOn: string[]
  score: number
}

export interface SearchOptions {
  sessionIds?: string[]
  issueTypes?: string[]
  severities?: string[]
  dateRange?: {
    start: number
    end: number
  }
  tags?: string[]
}

// Search for issues and sessions
export async function search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
  // Normalize query
  const normalizedQuery = query.toLowerCase().trim()

  // If query is empty, return empty results
  if (!normalizedQuery) {
    return []
  }

  const results: SearchResult[] = []

  // Get all sessions
  const sessions = await getSessions()

  // Filter sessions by options
  const filteredSessions = options?.sessionIds
    ? sessions.filter((session) => options.sessionIds?.includes(session.id))
    : sessions

  // Search in sessions
  for (const session of filteredSessions) {
    // Check if session matches query
    const sessionMatches = searchInSession(session, normalizedQuery)

    if (sessionMatches.length > 0) {
      results.push({
        type: "session",
        item: session,
        matchedOn: sessionMatches,
        score: calculateScore(sessionMatches, normalizedQuery),
      })
    }

    // Get issues for this session
    const issues = await getIssues(session.id)

    // Filter issues by options
    let filteredIssues = issues

    if (options?.issueTypes) {
      filteredIssues = filteredIssues.filter((issue) => !issue.type || options.issueTypes.includes(issue.type))
    }

    if (options?.severities) {
      filteredIssues = filteredIssues.filter((issue) => !issue.severity || options.severities.includes(issue.severity))
    }

    if (options?.dateRange) {
      filteredIssues = filteredIssues.filter(
        (issue) => issue.timestamp >= options.dateRange!.start && issue.timestamp <= options.dateRange!.end,
      )
    }

    if (options?.tags && options.tags.length > 0) {
      filteredIssues = filteredIssues.filter(
        (issue) => issue.tags && issue.tags.some((tag) => options.tags!.includes(tag)),
      )
    }

    // Search in issues
    for (const issue of filteredIssues) {
      // Check if issue matches query
      const issueMatches = searchInIssue(issue, normalizedQuery)

      if (issueMatches.length > 0) {
        results.push({
          type: "issue",
          item: issue,
          sessionId: session.id,
          matchedOn: issueMatches,
          score: calculateScore(issueMatches, normalizedQuery),
        })
      }
    }
  }

  // Sort results by score (descending)
  return results.sort((a, b) => b.score - a.score)
}

// Search in a session
function searchInSession(session: Session, query: string): string[] {
  const matches: string[] = []

  // Check name
  if (session.name.toLowerCase().includes(query)) {
    matches.push("name")
  }

  // Check URL
  if (session.url.toLowerCase().includes(query)) {
    matches.push("url")
  }

  // Check browser info
  if (session.browserInfo.toLowerCase().includes(query)) {
    matches.push("browserInfo")
  }

  return matches
}

// Search in an issue
function searchInIssue(issue: Issue, query: string): string[] {
  const matches: string[] = []

  // Check title
  if (issue.title.toLowerCase().includes(query)) {
    matches.push("title")
  }

  // Check notes
  if (issue.notes && issue.notes.toLowerCase().includes(query)) {
    matches.push("notes")
  }

  // Check URL
  if (issue.url && issue.url.toLowerCase().includes(query)) {
    matches.push("url")
  }

  // Check tags
  if (issue.tags && issue.tags.some((tag) => tag.toLowerCase().includes(query))) {
    matches.push("tags")
  }

  // Check element details
  if (issue.elementDetails) {
    const elementDetails = issue.elementDetails

    if (elementDetails.tagName && elementDetails.tagName.toLowerCase().includes(query)) {
      matches.push("elementDetails.tagName")
    }

    if (elementDetails.id && elementDetails.id.toLowerCase().includes(query)) {
      matches.push("elementDetails.id")
    }

    if (elementDetails.className && elementDetails.className.toLowerCase().includes(query)) {
      matches.push("elementDetails.className")
    }

    if (elementDetails.textContent && elementDetails.textContent.toLowerCase().includes(query)) {
      matches.push("elementDetails.textContent")
    }

    if (elementDetails.selector && elementDetails.selector.toLowerCase().includes(query)) {
      matches.push("elementDetails.selector")
    }
  }

  // Check console errors
  if (issue.consoleErrors && issue.consoleErrors.some((error) => error.toLowerCase().includes(query))) {
    matches.push("consoleErrors")
  }

  // Check network errors
  if (issue.networkErrors) {
    for (const error of issue.networkErrors) {
      if (
        (error.url && error.url.toLowerCase().includes(query)) ||
        (error.message && error.message.toLowerCase().includes(query))
      ) {
        matches.push("networkErrors")
        break
      }
    }
  }

  return matches
}

// Calculate search result score
function calculateScore(matches: string[], query: string): number {
  let score = 0

  // Base score based on number of matches
  score += matches.length * 10

  // Bonus for matching important fields
  if (matches.includes("title")) score += 50
  if (matches.includes("name")) score += 50
  if (matches.includes("notes")) score += 30
  if (matches.includes("tags")) score += 20

  // Bonus for exact matches
  for (const match of matches) {
    const field = match.split(".").reduce((obj, key) => obj[key], {
      title: "",
      name: "",
      notes: "",
      tags: [],
      elementDetails: {
        tagName: "",
        id: "",
        className: "",
        textContent: "",
        selector: "",
      },
    })

    if (typeof field === "string" && field.toLowerCase() === query) {
      score += 100
    } else if (Array.isArray(field) && field.some((item) => item.toLowerCase() === query)) {
      score += 100
    }
  }

  return score
}

// Get all available tags
export async function getAllTags(): Promise<string[]> {
  const sessions = await getSessions()
  const allTags = new Set<string>()

  for (const session of sessions) {
    const issues = await getIssues(session.id)

    for (const issue of issues) {
      if (issue.tags) {
        issue.tags.forEach((tag) => allTags.add(tag))
      }
    }
  }

  return Array.from(allTags).sort()
}

// Get all issue types
export async function getAllIssueTypes(): Promise<string[]> {
  const sessions = await getSessions()
  const types = new Set<string>()

  for (const session of sessions) {
    const issues = await getIssues(session.id)

    for (const issue of issues) {
      if (issue.type) {
        types.add(issue.type)
      }
    }
  }

  return Array.from(types).sort()
}
