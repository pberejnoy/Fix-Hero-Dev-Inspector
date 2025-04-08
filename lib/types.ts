export interface Issue {
  id: string
  timestamp: number
  url: string
  title: string
  elementDetails?: ElementDetails
  screenshot?: string
  consoleErrors?: ConsoleError[]
  networkErrors?: NetworkError[]
  notes?: string
  severity?: "critical" | "high" | "medium" | "low"
  category?: string
  tags?: string[]
  browserInfo?: BrowserInfo
  aiSuggestion?: AISuggestion
  stateSnapshot?: StateSnapshot
  pageMetadata?: PageMetadata
  reportedBy?: string
}

export interface ElementDetails {
  type: string
  selector: string
  xpath: string
  text: string
  attributes: Record<string, string>
  styles: Record<string, string>
  position: { x: number; y: number; width: number; height: number }
  html: string
  componentName?: string
  accessibility?: Record<string, any>
  parent?: Record<string, any>
  children?: Record<string, any>[]
  eventListeners?: string[]
}

export interface ConsoleError {
  message: string
  source: string
  lineNumber: number
  timestamp: number
}

export interface NetworkError {
  url: string
  status: number
  statusText: string
  method: string
  timestamp: number
}

export interface BrowserInfo {
  name: string
  version: string
  os: string
  screen: string
  userAgent: string
}

export interface AISuggestion {
  priority: string
  tags: string[]
  analysis: string
  suggestedFix?: string
}

export interface StateSnapshot {
  localStorage: Record<string, any>
  sessionStorage: Record<string, any>
  componentState?: Record<string, any>
  cookies?: Record<string, string>
}

export interface Session {
  id: string
  startTime: number
  url: string
  browserInfo: string
  issues: Issue[]
  name?: string
  description?: string
  lastUpdated?: number
  createdBy?: string
}

export interface PageMetadata {
  url: string
  title: string
  path: string
  query: string
  hash: string
  viewport: {
    width: number
    height: number
  }
  timestamp: number
  userAgent: string
}

export interface ExportOptions {
  includeScreenshots: boolean
  includeConsoleErrors: boolean
  includeNetworkErrors: boolean
  includeElementDetails: boolean
  format?: "markdown" | "json" | "csv" | "github"
}

export interface GitHubExportOptions {
  repo: string
  token: string
  labels?: string[]
  assignees?: string[]
}

export interface User {
  email: string
  name?: string
  role?: "admin" | "user"
  lastLogin?: number
}
