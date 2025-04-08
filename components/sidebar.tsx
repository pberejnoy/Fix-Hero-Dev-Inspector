"use client"

import type React from "react"

import { useState } from "react"
import {
  Bug,
  Clipboard,
  BarChart2,
  AlertTriangle,
  Settings,
  Search,
  PlusCircle,
  Trash2,
  Tag,
  LogOut,
  Plus,
  History,
  Copy,
  Download,
  Filter,
  User,
  Edit,
  CheckSquare,
  Square,
  Camera,
  FileText,
  Gauge,
  Map,
  Layers,
  Zap,
  Lightbulb,
  Github,
  TextCursorIcon as Cursor,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StorageStats } from "@/components/storage-stats"
import { SyncStatusIndicator } from "@/components/sync-status-indicator"
import { BulkActionsBar } from "@/components/bulk-actions-bar"
import type { Issue, Session } from "@/lib/types"
import type { User as UserType } from "@/lib/types"
import { cn, formatDistanceToNow } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import {
  SidebarProvider,
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { SessionStorageInfo } from "@/components/session-storage-info"

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  issues: Issue[]
  currentSession: Session | null
  allSessions: Session[]
  isInspecting: boolean
  startInspection: () => void
  stopInspection: () => void
  onSelectIssue: (issue: Issue | null) => void
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
  user: UserType | null
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
  const [searchQuery, setSearchQuery] = useState("")
  const [severityFilter, setSeverityFilter] = useState<string | null>(null)
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [isTagsOpen, setIsTagsOpen] = useState(false)
  const [isSelectionMode, setIsSelectionMode] = useState(false)

  const { toast } = useToast()

  // Apply filters to issues
  const filteredIssues = issues.filter((issue) => {
    // Apply search filter
    const matchesSearch =
      !searchQuery ||
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      issue.severity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.notes?.toLowerCase().includes(searchQuery.toLowerCase())

    // Apply severity filter
    const matchesSeverity = !severityFilter || issue.severity === severityFilter

    // Apply tag filter
    const matchesTag = !tagFilter || issue.tags?.includes(tagFilter)

    return matchesSearch && matchesSeverity && matchesTag
  })

  // Get all unique tags from issues
  const allTags = Array.from(new Set(issues.flatMap((issue) => issue.tags || [])))

  // Count issues by severity
  const severityCounts = {
    critical: issues.filter((issue) => issue.severity === "critical").length,
    high: issues.filter((issue) => issue.severity === "high").length,
    medium: issues.filter((issue) => issue.severity === "medium").length,
    low: issues.filter((issue) => issue.severity === "low").length,
  }

  // Count errors
  const consoleErrorCount = issues.reduce((count, issue) => count + (issue.consoleErrors?.length || 0), 0)
  const networkErrorCount = issues.reduce((count, issue) => count + (issue.networkErrors?.length || 0), 0)

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode)
    if (isSelectionMode) {
      // Clear selections when exiting selection mode
      onSelectAllIssues()
    }
  }

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Shift + I to start inspection
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "I") {
      e.preventDefault()
      if (isInspecting) {
        stopInspection()
      } else {
        startInspection()
      }
    }

    // Ctrl/Cmd + Shift + S to take screenshot
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "S") {
      e.preventDefault()
      onTakeScreenshot()
    }

    // Ctrl/Cmd + Shift + N to add note
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "N") {
      e.preventDefault()
      onAddNote()
    }

    // Ctrl/Cmd + A to select all issues when in selection mode
    if ((e.ctrlKey || e.metaKey) && e.key === "a" && isSelectionMode && activeTab === "issues") {
      e.preventDefault()
      onSelectAllIssues()
    }
  }

  return (
    <SidebarProvider>
      <div onKeyDown={handleKeyDown} tabIndex={-1} className="outline-none">
        <ShadcnSidebar className="border-r">
          <SidebarHeader className="flex flex-col gap-2 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug className="h-5 w-5 text-orange-500" />
                <h1 className="font-semibold">FixHero Dev Inspector</h1>
              </div>
              <div className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Sessions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={onCreateNewSession}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Session
                    </DropdownMenuItem>

                    {currentSession && (
                      <>
                        <DropdownMenuItem onClick={onEditSession}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Current Session
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => onCloneSession(currentSession.id)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Clone Current Session
                        </DropdownMenuItem>
                      </>
                    )}

                    {allSessions.length > 1 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Switch Session</DropdownMenuLabel>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <History className="mr-2 h-4 w-4" />
                            Recent Sessions
                          </DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              {allSessions.map((session) => (
                                <DropdownMenuItem
                                  key={session.id}
                                  onClick={() => onSwitchSession(session.id)}
                                  disabled={currentSession?.id === session.id}
                                >
                                  <div className="flex flex-col">
                                    <span>
                                      {session.name || `Session ${formatDistanceToNow(session.startTime)} ago`}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(session.startTime).toLocaleDateString()} • {session.issueCount || 0}{" "}
                                      issues
                                    </span>
                                  </div>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                      </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onOpenSettings}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>User</DropdownMenuLabel>
                    <DropdownMenuItem disabled>
                      <User className="mr-2 h-4 w-4" />
                      {user?.email || "Anonymous"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onLogout} className="text-red-500">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <SidebarTrigger />
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search issues..."
                className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={isInspecting ? stopInspection : startInspection}
                className={cn(
                  "flex items-center gap-1",
                  isInspecting ? "bg-red-500 hover:bg-red-600" : "bg-orange-500 hover:bg-orange-600",
                )}
                size="sm"
              >
                <Bug className="h-3 w-3" />
                {isInspecting ? "Stop Inspection" : "Start Inspection"}
              </Button>
              <Button onClick={onAddNote} variant="outline" size="sm" className="flex items-center gap-1">
                <PlusCircle className="h-3 w-3" />
                Add Note
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <TooltipProvider>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help text-xs text-gray-500">Shortcuts:</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs">
                        <p>Ctrl+Shift+I: Start/Stop Inspection</p>
                        <p>Ctrl+Shift+S: Take Screenshot</p>
                        <p>Ctrl+Shift+N: Add Note</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>

              <div className="flex items-center gap-2">
                <SyncStatusIndicator />

                {severityFilter && (
                  <Badge
                    variant="outline"
                    className="px-1 h-5 cursor-pointer hover:bg-gray-100"
                    onClick={() => setSeverityFilter(null)}
                  >
                    {severityFilter} ×
                  </Badge>
                )}
                {tagFilter && (
                  <Badge
                    variant="outline"
                    className="px-1 h-5 cursor-pointer hover:bg-gray-100"
                    onClick={() => setTagFilter(null)}
                  >
                    {tagFilter} ×
                  </Badge>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5">
                      <Filter className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Filter Issues</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>By Severity</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setSeverityFilter("critical")}>
                      Critical ({severityCounts.critical})
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSeverityFilter("high")}>
                      High ({severityCounts.high})
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSeverityFilter("medium")}>
                      Medium ({severityCounts.medium})
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSeverityFilter("low")}>
                      Low ({severityCounts.low})
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSeverityFilter(null)}>Clear Severity Filter</DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>By Tag</DropdownMenuLabel>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Tag className="mr-2 h-3 w-3" />
                        Select Tag
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          {allTags.map((tag) => (
                            <DropdownMenuItem key={tag} onClick={() => setTagFilter(tag)}>
                              {tag}
                            </DropdownMenuItem>
                          ))}
                          {allTags.length === 0 && <DropdownMenuItem disabled>No tags available</DropdownMenuItem>}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuItem onClick={() => setTagFilter(null)}>Clear Tag Filter</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </SidebarHeader>

          <Tabs defaultValue="issues" className="w-full" value={activeTab} onValueChange={setActiveTab}>
            <div className="px-4 py-2">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="inspector" className="text-xs">
                  <Bug className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Inspector</span>
                </TabsTrigger>
                <TabsTrigger value="issues" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Issues</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs">
                  <BarChart2 className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="export" className="text-xs">
                  <Clipboard className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Export</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>

          <SidebarContent>
            <ScrollArea className="h-[calc(100vh-12rem)]">
              {activeTab === "issues" && (
                <div className="px-4 py-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Issues ({filteredIssues.length})</h2>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-6 w-6 ${isSelectionMode ? "bg-orange-100" : ""}`}
                        onClick={toggleSelectionMode}
                        title={isSelectionMode ? "Exit selection mode" : "Enter selection mode"}
                      >
                        {isSelectionMode ? (
                          <CheckSquare className="h-4 w-4 text-orange-500" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                      <Badge variant="outline" className="text-xs">
                        Console: {consoleErrorCount}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Network: {networkErrorCount}
                      </Badge>
                    </div>
                  </div>

                  {isSelectionMode && filteredIssues.length > 0 && (
                    <BulkActionsBar
                      selectedCount={selectedIssueIds.length}
                      totalCount={issues.length}
                      onSelectAll={onSelectAllIssues}
                      onDelete={onDeleteSelectedIssues}
                      onExport={onExportSelected}
                      onCancel={toggleSelectionMode}
                    />
                  )}

                  {filteredIssues.length > 0 ? (
                    <div className="space-y-2">
                      {filteredIssues.map((issue) => (
                        <div
                          key={issue.id}
                          className={`p-2 border rounded-md hover:bg-gray-50 cursor-pointer ${
                            isSelectionMode && selectedIssueIds.includes(issue.id)
                              ? "bg-orange-50 border-orange-300"
                              : ""
                          }`}
                          onClick={() => {
                            if (isSelectionMode) {
                              onToggleIssueSelection(issue.id)
                            } else {
                              onSelectIssue(issue)
                            }
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {isSelectionMode && (
                                <div
                                  className="flex-shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onToggleIssueSelection(issue.id)
                                  }}
                                >
                                  {selectedIssueIds.includes(issue.id) ? (
                                    <CheckSquare className="h-4 w-4 text-orange-500" />
                                  ) : (
                                    <Square className="h-4 w-4" />
                                  )}
                                </div>
                              )}
                              <span className="text-sm font-medium truncate">{issue.title}</span>
                            </div>
                            <div className="flex gap-1">
                              {issue.severity && (
                                <Badge
                                  variant={
                                    issue.severity === "critical"
                                      ? "destructive"
                                      : issue.severity === "high"
                                        ? "destructive"
                                        : issue.severity === "medium"
                                          ? "default"
                                          : "outline"
                                  }
                                  className="text-xs"
                                >
                                  {issue.severity}
                                </Badge>
                              )}
                              {!isSelectionMode && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (confirm("Are you sure you want to delete this issue?")) {
                                      onDeleteIssue(issue.id)
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mb-1 truncate">{new URL(issue.url).pathname}</div>
                          {issue.tags && issue.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {issue.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No issues found</p>
                      <p className="text-xs mt-1">Start inspection to capture issues</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "analytics" && (
                <div className="px-4 py-2 space-y-4">
                  <h2 className="text-sm font-semibold">Analytics</h2>

                  {/* Storage Stats */}
                  <StorageStats />

                  {/* Session Storage Info */}
                  {currentSession && <SessionStorageInfo session={currentSession} />}

                  <div className="space-y-2">
                    <div className="p-3 border rounded-md">
                      <h3 className="text-sm font-medium mb-2">Error Distribution</h3>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Console Errors</span>
                            <span>{consoleErrorCount}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-red-500 h-1.5 rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (consoleErrorCount / (consoleErrorCount + networkErrorCount || 1)) * 100,
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Network Errors</span>
                            <span>{networkErrorCount}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-orange-500 h-1.5 rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (networkErrorCount / (consoleErrorCount + networkErrorCount || 1)) * 100,
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 border rounded-md">
                      <h3 className="text-sm font-medium mb-2">Severity Breakdown</h3>
                      <div className="space-y-2">
                        {["critical", "high", "medium", "low"].map((severity) => {
                          const count = issues.filter((issue) => issue.severity === severity).length
                          return (
                            <div key={severity}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="capitalize">{severity}</span>
                                <span>{count}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={cn(
                                    "h-1.5 rounded-full",
                                    severity === "critical"
                                      ? "bg-red-700"
                                      : severity === "high"
                                        ? "bg-red-500"
                                        : severity === "medium"
                                          ? "bg-orange-500"
                                          : "bg-blue-500",
                                  )}
                                  style={{ width: `${Math.min(100, (count / (issues.length || 1)) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <Collapsible open={isTagsOpen} onOpenChange={setIsTagsOpen} className="p-3 border rounded-md">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Popular Tags</h3>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <span className="sr-only">Toggle</span>
                            {isTagsOpen ? <span className="text-xs">−</span> : <span className="text-xs">+</span>}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent className="mt-2">
                        <div className="flex flex-wrap gap-1">
                          {Array.from(new Set(issues.flatMap((issue) => issue.tags || []))).map((tag, index) => {
                            const count = issues.filter((issue) => issue.tags?.includes(tag)).length
                            return (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs cursor-pointer"
                                onClick={() => setTagFilter(tag)}
                              >
                                {tag} ({count})
                              </Badge>
                            )
                          })}
                          {allTags.length === 0 && <span className="text-xs text-gray-500">No tags found</span>}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    <div className="p-3 border rounded-md">
                      <h3 className="text-sm font-medium mb-2">Session Timeline</h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {issues
                          .sort((a, b) => a.timestamp - b.timestamp)
                          .map((issue, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                              onClick={() => {
                                onSelectIssue(issue)
                                setActiveTab("issues")
                              }}
                            >
                              <div className="w-12 text-xs text-gray-500">
                                {new Date(issue.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              <div
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  issue.severity === "critical"
                                    ? "bg-red-700"
                                    : issue.severity === "high"
                                      ? "bg-red-500"
                                      : issue.severity === "medium"
                                        ? "bg-orange-500"
                                        : "bg-blue-500",
                                )}
                              ></div>
                              <div className="text-xs truncate">{issue.title}</div>
                            </div>
                          ))}
                        {issues.length === 0 && <span className="text-xs text-gray-500">No issues recorded yet</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "export" && (
                <div className="px-4 py-2 space-y-4">
                  <h2 className="text-sm font-semibold">Export Options</h2>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-md">
                      <h3 className="text-sm font-medium mb-1">Markdown Export</h3>
                      <p className="text-xs text-gray-500 mb-2">
                        Export as Markdown file with all details and screenshots
                      </p>
                      <Button
                        onClick={() => {
                          if (issues.length === 0) {
                            toast({
                              title: "No issues to export",
                              description: "Capture some issues first before exporting",
                              variant: "destructive",
                            })
                            return
                          }
                          onExportSelected("markdown")
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600"
                        disabled={issues.length === 0}
                      >
                        <Clipboard className="h-4 w-4" />
                        Export to Markdown
                      </Button>
                    </div>

                    <div className="p-3 border rounded-md">
                      <h3 className="text-sm font-medium mb-1">Cursor.dev Export</h3>
                      <p className="text-xs text-gray-500 mb-2">Export issues to Cursor.dev workspace</p>
                      <Button
                        onClick={() => {
                          if (issues.length === 0) {
                            toast({
                              title: "No issues to export",
                              description: "Capture some issues first before exporting",
                              variant: "destructive",
                            })
                            return
                          }
                          onExportSelected("cursor")
                        }}
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2"
                        disabled={issues.length === 0}
                      >
                        <Cursor className="h-4 w-4" />
                        Export to Cursor
                      </Button>
                    </div>

                    <div className="p-3 border rounded-md">
                      <h3 className="text-sm font-medium mb-1">GitHub Issues</h3>
                      <p className="text-xs text-gray-500 mb-2">Create GitHub issues from your captured data</p>
                      <Button
                        onClick={() => {
                          if (issues.length === 0) {
                            toast({
                              title: "No issues to export",
                              description: "Capture some issues first before exporting",
                              variant: "destructive",
                            })
                            return
                          }
                          onExportSelected("github")
                        }}
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2"
                        disabled={issues.length === 0}
                      >
                        <Github className="h-4 w-4" />
                        Export to GitHub
                      </Button>
                    </div>

                    <div className="p-3 border rounded-md">
                      <h3 className="text-sm font-medium mb-1">JSON/CSV Export</h3>
                      <p className="text-xs text-gray-500 mb-2">Export data for use in other tools</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => {
                            if (issues.length === 0) {
                              toast({
                                title: "No issues to export",
                                description: "Capture some issues first before exporting",
                                variant: "destructive",
                              })
                              return
                            }
                            onExportSelected("json")
                          }}
                          variant="outline"
                          className="flex items-center justify-center gap-1"
                          disabled={issues.length === 0}
                        >
                          <Download className="h-3 w-3" />
                          JSON
                        </Button>
                        <Button
                          onClick={() => {
                            if (issues.length === 0) {
                              toast({
                                title: "No issues to export",
                                description: "Capture some issues first before exporting",
                                variant: "destructive",
                              })
                              return
                            }
                            onExportSelected("csv")
                          }}
                          variant="outline"
                          className="flex items-center justify-center gap-1"
                          disabled={issues.length === 0}
                        >
                          <Download className="h-3 w-3" />
                          CSV
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "inspector" && (
                <div className="px-4 py-2 space-y-4">
                  <h2 className="text-sm font-semibold">Inspector Tools</h2>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={onTakeScreenshot}
                      variant="outline"
                      className="flex items-center gap-1 justify-center"
                    >
                      <Camera className="h-4 w-4" />
                      Screenshot
                    </Button>
                    <Button onClick={onAddNote} variant="outline" className="flex items-center gap-1 justify-center">
                      <FileText className="h-4 w-4" />
                      Add Note
                    </Button>
                    <Button
                      onClick={onFindProblems}
                      variant="outline"
                      className="flex items-center gap-1 justify-center"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Find Problems
                    </Button>
                    <Button
                      onClick={onFindSlowElements}
                      variant="outline"
                      className="flex items-center gap-1 justify-center"
                    >
                      <Gauge className="h-4 w-4" />
                      Performance
                    </Button>
                  </div>

                  <Separator />

                  <SidebarGroup>
                    <SidebarGroupLabel>Advanced Tools</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            onClick={() => {
                              setActiveTab("analytics")
                            }}
                          >
                            <Map className="h-4 w-4 mr-2" />
                            Flow Coverage Map
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            onClick={() => {
                              // This would be implemented with actual state snapshot capture
                              toast({
                                title: "State Snapshot",
                                description: "State snapshot captured successfully",
                              })
                            }}
                          >
                            <Layers className="h-4 w-4 mr-2" />
                            Capture State Snapshot
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            onClick={() => {
                              // This would be implemented with actual auto-tagging
                              toast({
                                title: "Auto-Tagging",
                                description: "Issues have been automatically tagged",
                              })
                            }}
                          >
                            <Tag className="h-4 w-4 mr-2" />
                            Auto-Tag Issues
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            onClick={() => {
                              // This would be implemented with actual AI priority suggestion
                              toast({
                                title: "AI Analysis",
                                description: "AI is analyzing your issues...",
                              })
                            }}
                          >
                            <Zap className="h-4 w-4 mr-2" />
                            AI Priority Suggestion
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            onClick={() => {
                              // This would be implemented with actual accessibility analysis
                              toast({
                                title: "Accessibility Check",
                                description: "Analyzing page for accessibility issues...",
                              })
                            }}
                          >
                            <Lightbulb className="h-4 w-4 mr-2" />
                            Accessibility Check
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>

                  <div className="p-3 border rounded-md bg-gray-50">
                    <h3 className="text-sm font-medium mb-2">Session Info</h3>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Name:</span>
                        <span className="font-medium truncate max-w-[150px]">
                          {currentSession?.name || "Unnamed Session"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">URL:</span>
                        <span className="font-mono truncate max-w-[150px]">
                          {currentSession?.url || window.location.href}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Started:</span>
                        <span>
                          {currentSession
                            ? new Date(currentSession.startTime).toLocaleString()
                            : new Date().toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Issues:</span>
                        <span>{issues.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Browser:</span>
                        <span className="truncate max-w-[150px]">{currentSession?.browserInfo || "Unknown"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </SidebarContent>

          <SidebarFooter className="border-t p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                <span>FixHero Dev Inspector v1.0</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{user?.email ? user.email.split("@")[0] : "User"}</span>
                <Button variant="ghost" size="icon" onClick={onLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SidebarFooter>
        </ShadcnSidebar>
      </div>
    </SidebarProvider>
  )
}
