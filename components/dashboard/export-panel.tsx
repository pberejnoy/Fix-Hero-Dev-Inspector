"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { exportToMarkdown, exportToJSON, exportToCSV, downloadAsFile } from "@/lib/export-utils"
import type { Issue, Session } from "@/lib/types"
import { Download, FileJson, FileText, Github, Loader2, TextCursorInput } from "lucide-react"

interface ExportPanelProps {
  issues: Issue[]
  sessions: Session[]
}

export function ExportPanel({ issues, sessions }: ExportPanelProps) {
  const [showMarkdownDialog, setShowMarkdownDialog] = useState(false)
  const [showJSONDialog, setShowJSONDialog] = useState(false)
  const [showGithubDialog, setShowGithubDialog] = useState(false)
  const [showCursorDialog, setShowCursorDialog] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportOptions, setExportOptions] = useState({
    includeScreenshots: true,
    includeConsoleErrors: true,
    includeNetworkErrors: true,
    includeElementDetails: true,
  })
  const [githubOptions, setGithubOptions] = useState({
    repo: "",
    token: "",
    labels: [] as string[],
  })
  const [cursorOptions, setCursorOptions] = useState({
    workspaceName: "",
    workspaceDescription: "",
    isTaskList: true,
  })
  const { toast } = useToast()

  const handleExportMarkdown = () => {
    if (issues.length === 0) {
      toast({
        title: "No issues to export",
        description: "There are no issues matching your current filters.",
        variant: "destructive",
      })
      return
    }
    setShowMarkdownDialog(true)
  }

  const handleExportJSON = () => {
    if (issues.length === 0) {
      toast({
        title: "No issues to export",
        description: "There are no issues matching your current filters.",
        variant: "destructive",
      })
      return
    }
    setShowJSONDialog(true)
  }

  const handleExportGithub = () => {
    if (issues.length === 0) {
      toast({
        title: "No issues to export",
        description: "There are no issues matching your current filters.",
        variant: "destructive",
      })
      return
    }
    setShowGithubDialog(true)
  }

  const handleExportCursor = () => {
    if (issues.length === 0) {
      toast({
        title: "No issues to export",
        description: "There are no issues matching your current filters.",
        variant: "destructive",
      })
      return
    }
    setShowCursorDialog(true)
  }

  const handleExportCSV = () => {
    if (issues.length === 0) {
      toast({
        title: "No issues to export",
        description: "There are no issues matching your current filters.",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)
    try {
      const session = sessions.find((s) => s.id === issues[0]?.sessionId) || null
      const csv = exportToCSV(
        issues,
        session || { id: "unknown", startTime: Date.now(), url: "unknown", browserInfo: "unknown", issues: [] },
      )
      downloadAsFile(csv, `fixhero-issues-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv")

      toast({
        title: "Export successful",
        description: `Exported ${issues.length} issues to CSV`,
      })
    } catch (error) {
      console.error("Error exporting to CSV:", error)
      toast({
        title: "Export failed",
        description: "An error occurred while exporting to CSV",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const confirmMarkdownExport = () => {
    setIsExporting(true)
    try {
      const session = sessions.find((s) => s.id === issues[0]?.sessionId) || null
      const markdown = exportToMarkdown(
        issues,
        session || { id: "unknown", startTime: Date.now(), url: "unknown", browserInfo: "unknown", issues: [] },
        exportOptions,
      )
      downloadAsFile(markdown, `fixhero-issues-${new Date().toISOString().slice(0, 10)}.md`, "text/markdown")

      setShowMarkdownDialog(false)
      toast({
        title: "Export successful",
        description: `Exported ${issues.length} issues to Markdown`,
      })
    } catch (error) {
      console.error("Error exporting to Markdown:", error)
      toast({
        title: "Export failed",
        description: "An error occurred while exporting to Markdown",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const confirmJSONExport = () => {
    setIsExporting(true)
    try {
      const session = sessions.find((s) => s.id === issues[0]?.sessionId) || null
      const json = exportToJSON(
        issues,
        session || { id: "unknown", startTime: Date.now(), url: "unknown", browserInfo: "unknown", issues: [] },
        exportOptions,
      )
      downloadAsFile(json, `fixhero-issues-${new Date().toISOString().slice(0, 10)}.json`, "application/json")

      setShowJSONDialog(false)
      toast({
        title: "Export successful",
        description: `Exported ${issues.length} issues to JSON`,
      })
    } catch (error) {
      console.error("Error exporting to JSON:", error)
      toast({
        title: "Export failed",
        description: "An error occurred while exporting to JSON",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const confirmGithubExport = () => {
    if (!githubOptions.repo || !githubOptions.token) {
      toast({
        title: "Missing information",
        description: "Please provide a repository name and GitHub token",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)
    try {
      // In a real implementation, this would make API calls to GitHub
      // For now, we'll just show a success message

      setShowGithubDialog(false)
      toast({
        title: "GitHub export initiated",
        description: `Creating ${issues.length} issues in ${githubOptions.repo}`,
      })
    } catch (error) {
      console.error("Error exporting to GitHub:", error)
      toast({
        title: "Export failed",
        description: "An error occurred while exporting to GitHub",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const confirmCursorExport = () => {
    if (!cursorOptions.workspaceName) {
      toast({
        title: "Missing information",
        description: "Please provide a workspace name",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)
    try {
      // In a real implementation, this would make API calls to Cursor.dev
      // For now, we'll just show a success message

      setShowCursorDialog(false)
      toast({
        title: "Cursor.dev export initiated",
        description: `Exporting ${issues.length} issues to "${cursorOptions.workspaceName}" workspace`,
      })
    } catch (error) {
      console.error("Error exporting to Cursor.dev:", error)
      toast({
        title: "Export failed",
        description: "An error occurred while exporting to Cursor.dev",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExportMarkdown}>
            <FileText className="h-4 w-4 mr-2" />
            Export to Markdown
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportJSON}>
            <FileJson className="h-4 w-4 mr-2" />
            Export to JSON
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportCSV}>
            <FileText className="h-4 w-4 mr-2" />
            Export to CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportGithub}>
            <Github className="h-4 w-4 mr-2" />
            Export to GitHub Issues
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportCursor}>
            <TextCursorInput className="h-4 w-4 mr-2" />
            Export to Cursor.dev
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Markdown Export Dialog */}
      <Dialog open={showMarkdownDialog} onOpenChange={setShowMarkdownDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export to Markdown</DialogTitle>
            <DialogDescription>Export {issues.length} issues to a Markdown file</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-screenshots"
                  checked={exportOptions.includeScreenshots}
                  onCheckedChange={(checked) => setExportOptions({ ...exportOptions, includeScreenshots: !!checked })}
                />
                <Label htmlFor="include-screenshots">Include Screenshots</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-console-errors"
                  checked={exportOptions.includeConsoleErrors}
                  onCheckedChange={(checked) => setExportOptions({ ...exportOptions, includeConsoleErrors: !!checked })}
                />
                <Label htmlFor="include-console-errors">Include Console Errors</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-network-errors"
                  checked={exportOptions.includeNetworkErrors}
                  onCheckedChange={(checked) => setExportOptions({ ...exportOptions, includeNetworkErrors: !!checked })}
                />
                <Label htmlFor="include-network-errors">Include Network Errors</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-element-details"
                  checked={exportOptions.includeElementDetails}
                  onCheckedChange={(checked) =>
                    setExportOptions({ ...exportOptions, includeElementDetails: !!checked })
                  }
                />
                <Label htmlFor="include-element-details">Include Element Details</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMarkdownDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmMarkdownExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                "Export to Markdown"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* JSON Export Dialog */}
      <Dialog open={showJSONDialog} onOpenChange={setShowJSONDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export to JSON</DialogTitle>
            <DialogDescription>Export {issues.length} issues to a JSON file</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-screenshots-json"
                  checked={exportOptions.includeScreenshots}
                  onCheckedChange={(checked) => setExportOptions({ ...exportOptions, includeScreenshots: !!checked })}
                />
                <Label htmlFor="include-screenshots-json">Include Screenshots</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-console-errors-json"
                  checked={exportOptions.includeConsoleErrors}
                  onCheckedChange={(checked) => setExportOptions({ ...exportOptions, includeConsoleErrors: !!checked })}
                />
                <Label htmlFor="include-console-errors-json">Include Console Errors</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-network-errors-json"
                  checked={exportOptions.includeNetworkErrors}
                  onCheckedChange={(checked) => setExportOptions({ ...exportOptions, includeNetworkErrors: !!checked })}
                />
                <Label htmlFor="include-network-errors-json">Include Network Errors</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-element-details-json"
                  checked={exportOptions.includeElementDetails}
                  onCheckedChange={(checked) =>
                    setExportOptions({ ...exportOptions, includeElementDetails: !!checked })
                  }
                />
                <Label htmlFor="include-element-details-json">Include Element Details</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJSONDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmJSONExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                "Export to JSON"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GitHub Export Dialog */}
      <Dialog open={showGithubDialog} onOpenChange={setShowGithubDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export to GitHub Issues</DialogTitle>
            <DialogDescription>Create GitHub issues from {issues.length} issues</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="github-repo">Repository</Label>
              <Input
                id="github-repo"
                placeholder="username/repository"
                value={githubOptions.repo}
                onChange={(e) => setGithubOptions({ ...githubOptions, repo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github-token">GitHub Token</Label>
              <Input
                id="github-token"
                type="password"
                placeholder="ghp_xxxxxxxxxxxx"
                value={githubOptions.token}
                onChange={(e) => setGithubOptions({ ...githubOptions, token: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Requires a token with 'repo' scope.{" "}
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Create one here
                </a>
                .
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="github-labels">Labels (comma separated)</Label>
              <Input
                id="github-labels"
                placeholder="bug, documentation, etc."
                value={githubOptions.labels.join(", ")}
                onChange={(e) =>
                  setGithubOptions({
                    ...githubOptions,
                    labels: e.target.value
                      .split(",")
                      .map((label) => label.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGithubDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmGithubExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                "Export to GitHub"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cursor.dev Export Dialog */}
      <Dialog open={showCursorDialog} onOpenChange={setShowCursorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export to Cursor.dev</DialogTitle>
            <DialogDescription>Export {issues.length} issues to a Cursor.dev workspace</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cursor-workspace">Workspace Name</Label>
              <Input
                id="cursor-workspace"
                placeholder="e.g., FixHero Bug Report"
                value={cursorOptions.workspaceName}
                onChange={(e) => setCursorOptions({ ...cursorOptions, workspaceName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cursor-description">Description (Optional)</Label>
              <Input
                id="cursor-description"
                placeholder="Brief description of these issues"
                value={cursorOptions.workspaceDescription}
                onChange={(e) => setCursorOptions({ ...cursorOptions, workspaceDescription: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cursor-task-list"
                  checked={cursorOptions.isTaskList}
                  onCheckedChange={(checked) => setCursorOptions({ ...cursorOptions, isTaskList: !!checked })}
                />
                <Label htmlFor="cursor-task-list">Format as task list</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCursorDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmCursorExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                "Export to Cursor.dev"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
