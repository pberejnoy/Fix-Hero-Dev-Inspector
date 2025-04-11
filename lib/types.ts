// User type
export interface User {
  id?: string
  email: string
  displayName?: string
  photoURL?: string
}

// Session type
export interface Session {
  id: string
  name: string
  url: string
  browserInfo: string
  created: number
  lastUpdated: number
  issueCount: number
}

// Issue type
export interface Issue {
  id: string
  title: string
  notes?: string
  severity?: "critical" | "high" | "medium" | "low"
  timestamp: number
  lastUpdated?: number
  type?: "bug" | "feature" | "note" | "improvement"
  status?: "open" | "in-progress" | "resolved" | "closed"
  tags?: string[]
  url?: string
  screenshot?: string
  screenshotRef?: string
  elementDetails?: ElementDetails
  consoleErrors?: string[]
  networkErrors?: NetworkError[]
  assignedTo?: string
  priority?: number
}

// Element details type
export interface ElementDetails {
  tagName?: string
  id?: string
  className?: string
  textContent?: string
  attributes?: { name: string; value: string }[]
  rect?: { top: number; left: number; width: number; height: number }
  styles?: Record<string, string>
  xpath?: string
  selector?: string
}

// Network error type
export interface NetworkError {
  url?: string
  status?: number
  statusText?: string
  type?: string
  message?: string
}

// Export format type
export type ExportFormat = "markdown" | "json" | "csv" | "github" | "cursor" | "notion"
