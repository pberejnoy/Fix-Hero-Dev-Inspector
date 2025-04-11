"use client"

import { useState } from "react"
import {
  Bug,
  Settings,
  Plus,
  Camera,
  Search,
  AlertTriangle,
  Zap,
  LogOut,
  Edit,
  Trash,
  Copy,
  CheckSquare,
  Square,
  Download,
  FileJson,
  FileText,
  Table,
  Github,
  TextCursorIcon as Cursor,
} from "lucide-react"
import { Button } from "../ui/button"
import { Separator } from "../ui/separator"
import { ScrollArea } from "../ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { Badge } from "../ui/badge"
import { FirebaseSyncStatus } from "./firebase-sync-status"
import type { Issue, Session, User } from "../../lib/types"

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  issues: Issue[]
  currentSession: Session | null
  allSessions: Session[]
  isInspecting: boolean
  startInspection: () => void
  stopInspection: () => void
  onSelectIssue: (issue: Issue) => void
  onDeleteIssue: (issueId: string) => void
  onAddNote: () => void
  onCreateNewSession: () => void
  onSwitchSession: (sessionId: string) => void
  onCloneSession: (sessionId: string) => void
  onTakeScreenshot: () => void
  onFindProblems: () => void
  onFindSlowElements: () => void
  onLogout: () => void
  onEditSession: () => void
  onOpenSettings: () => void
  user: User | null
  selectedIssueIds: string[]
  onToggleIssueSelection: (issueId: string) => void
  onSelectAllIssues: () => void
  onDeleteSelectedIssues: () => void
  onExportSelected: (format: "markdown" | "json" | "csv" | "github" | "cursor") => void
}

export function Sidebar({
  activeTab,
  setActiveTab,
  issues,
  currentSession,
  allSessions,
  isInspecting,
  startInspection,
  stopInspection,
  onSelectIssue,
  onDeleteIssue,
  onAddNote,
  onCreateNewSession,
  onSwitchSession,
  onCloneSession,
  onTakeScreenshot,
  onFindProblems,
  onFindSlowElements,
  onLogout,
  onEditSession,
  onOpenSettings,
  user,
  selectedIssueIds,
  onToggleIssueSelection,
  onSelectAllIssues,
  onDeleteSelectedIssues,
  onExportSelected,
}: SidebarProps) {
  const [showAllSessions, setShowAllSessions] = useState(false)

  // Get severity counts for badges
  const criticalCount = issues.filter((issue) => issue.severity === "critical").length
  const highCount = issues.filter((issue) => issue.severity === "high").length
  const mediumCount = issues.filter((issue) => issue.severity === "medium").length
  const lowCount = issues.filter((issue) => issue.severity === "low").length

  // Get tag counts
  const tagCounts: Record<string, number> = {}
  issues.forEach((issue) => {
    if (issue.tags) {
      issue.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    }
  })

  // Sort tags by count (descending)
  const sortedTags = Object.entries(tagCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 10) // Show top 10 tags

  return (
    <div className="flex h-full w-64 flex-col border-r bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-orange-500" />
          <h1 className="text-lg font-semibold">FixHero</h1>
        </div>
        <div className="flex items-center gap-1">
          <FirebaseSyncStatus />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onOpenSettings}>
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Session Info */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-500">Current Session</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onCreateNewSession}>New Session</DropdownMenuItem>
              <DropdownMenuItem onClick={onAddNote}>Add Note</DropdownMenuItem>
              <DropdownMenuItem onClick={onTakeScreenshot}>Take Screenshot</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {currentSession ? (
          <div className="mt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium truncate" title={currentSession.name}>
                {currentSession.name}
              </h3>
              <div className="flex items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onEditSession}>
                        <Edit className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit Session</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {issues.length} issues • Last updated: {new Date(currentSession.lastUpdated).toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="mt-2 text-sm text-gray-500">No active session</div>
        )}

        {/* Session Selector */}
        <div className="mt-2">
          <button
            className="text-xs text-orange-500 hover:underline"
            onClick={() => setShowAllSessions(!showAllSessions)}
          >
            {showAllSessions ? "Hide" : "Show"} all sessions ({allSessions.length})
          </button>

          {showAllSessions && (
            <div className="mt-2 max-h-32 overflow-y-auto rounded border bg-white p-1">
              {allSessions.map((session) => (
                <div
                  key={session.id}
                  className={`flex items-center justify-between rounded px-2 py-1 text-xs ${
                    currentSession?.id === session.id ? "bg-orange-100" : "hover:bg-gray-100"
                  }`}
                >
                  <button
                    className="truncate text-left"
                    onClick={() => onSwitchSession(session.id)}
                    title={session.name}
                  >
                    {session.name}
                  </button>
                  <div className="flex items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={() => onCloneSession(session.id)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Clone Session</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === "inspector"
              ? "border-b-2 border-orange-500 text-orange-500"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("inspector")}
        >
          Inspector
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === "issues"
              ? "border-b-2 border-orange-500 text-orange-500"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("issues")}
        >
          Issues
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "inspector" ? (
          <div className="flex h-full flex-col p-4">
            <h2 className="mb-2 text-sm font-medium">Inspection Tools</h2>
            <div className="space-y-2">
              <Button
                variant={isInspecting ? "destructive" : "default"}
                className={`w-full justify-start ${!isInspecting ? "bg-orange-500 hover:bg-orange-600" : ""}`}
                onClick={isInspecting ? stopInspection : startInspection}
              >
                <Search className="mr-2 h-4 w-4" />
                {isInspecting ? "Stop Inspecting" : "Inspect Element"}
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={onTakeScreenshot}>
                <Camera className="mr-2 h-4 w-4" />
                Take Screenshot
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={onFindProblems}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Find Problems
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={onFindSlowElements}>
                <Zap className="mr-2 h-4 w-4" />
                Find Slow Elements
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={onAddNote}>
                <Plus className="mr-2 h-4 w-4" />
                Add Note
              </Button>
            </div>

            <Separator className="my-4" />

            <div className="space-y-4">
              <div>
                <h3 className="mb-1 text-sm font-medium">Session Stats</h3>
                <div className="rounded border bg-white p-2 text-xs">
                  <div className="flex justify-between py-1">
                    <span>Total Issues:</span>
                    <span className="font-medium">{issues.length}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Critical:</span>
                    <span className="font-medium text-red-500">{criticalCount}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>High:</span>
                    <span className="font-medium text-orange-500">{highCount}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Medium:</span>
                    <span className="font-medium text-yellow-500">{mediumCount}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Low:</span>
                    <span className="font-medium text-green-500">{lowCount}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-1 text-sm font-medium">Common Tags</h3>
                <div className="flex flex-wrap gap-1">
                  {sortedTags.map(([tag, count]) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag} ({count})
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-sm font-medium">Issues ({issues.length})</h2>
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onSelectAllIssues}>
                        {selectedIssueIds.length === issues.length && issues.length > 0 ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {selectedIssueIds.length === issues.length && issues.length > 0 ? "Deselect All" : "Select All"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {selectedIssueIds.length > 0 && (
                  <>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onDeleteSelectedIssues}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete Selected</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <DropdownMenu>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <Download className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                          </TooltipTrigger>
                          <TooltipContent>Export Selected</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onExportSelected("markdown")}>
                          <FileText className="mr-2 h-4 w-4" />
                          Export as Markdown
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExportSelected("json")}>
                          <FileJson className="mr-2 h-4 w-4" />
                          Export as JSON
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExportSelected("csv")}>
                          <Table className="mr-2 h-4 w-4" />
                          Export as CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExportSelected("github")}>
                          <Github className="mr-2 h-4 w-4" />
                          Export as GitHub Issue
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExportSelected("cursor")}>
                          <Cursor className="mr-2 h-4 w-4" />
                          Export to Cursor
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-1 p-2">
                {issues.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No issues found. Start inspecting to capture issues.
                  </div>
                ) : (
                  issues.map((issue) => (
                    <div
                      key={issue.id}
                      className={`group flex items-start rounded border p-2 hover:bg-gray-50 ${
                        selectedIssueIds.includes(issue.id) ? "bg-orange-50" : ""
                      }`}
                    >
                      <div className="mr-2 mt-1">
                        <button
                          onClick={() => onToggleIssueSelection(issue.id)}
                          className="h-4 w-4 rounded border border-gray-300 text-white"
                        >
                          {selectedIssueIds.includes(issue.id) && <CheckSquare className="h-4 w-4 text-orange-500" />}
                        </button>
                      </div>
                      <div className="flex-1 cursor-pointer" onClick={() => onSelectIssue(issue)}>
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{issue.title}</h3>
                          <div className="flex items-center">
                            <Badge
                              className={`ml-2 ${
                                issue.severity === "critical"
                                  ? "bg-red-500"
                                  : issue.severity === "high"
                                    ? "bg-orange-500"
                                    : issue.severity === "medium"
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                              }`}
                            >
                              {issue.severity}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">{new Date(issue.timestamp).toLocaleString()}</div>
                        {issue.tags && issue.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {issue.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="ml-2 flex flex-col opacity-0 group-hover:opacity-100">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => onDeleteIssue(issue.id)}
                              >
                                <Trash className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete Issue</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">{user ? `Logged in as ${user.email}` : "Not logged in"}</div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
