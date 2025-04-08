"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import type { Issue, Session } from "@/lib/types"
import { exportToMarkdown } from "@/lib/export-utils"

interface ExportToCursorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  issues: Issue[]
  session: Session | null
  selectedIssueIds?: string[]
}

export function ExportToCursorDialog({
  open,
  onOpenChange,
  issues,
  session,
  selectedIssueIds,
}: ExportToCursorDialogProps) {
  const [workspaceName, setWorkspaceName] = useState("")
  const [workspaceDescription, setWorkspaceDescription] = useState("")
  const [isTaskList, setIsTaskList] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Filter issues if selectedIssueIds is provided
  const issuesToExport = selectedIssueIds ? issues.filter((issue) => selectedIssueIds.includes(issue.id)) : issues

  const handleExport = async () => {
    if (!session) return
    if (workspaceName.trim() === "") {
      toast({
        title: "Workspace name required",
        description: "Please enter a name for your Cursor workspace",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Generate markdown content
      let markdown = exportToMarkdown(issuesToExport, session, {
        includeScreenshots: true,
        includeConsoleErrors: true,
        includeNetworkErrors: true,
        includeElementDetails: true,
      })

      // If task list format is selected, convert to task list
      if (isTaskList) {
        markdown = convertToTaskList(markdown)
      }

      // In a real implementation, this would call the Cursor API
      // For now, we'll simulate the API call with a timeout
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Show success message
      toast({
        title: "Exported to Cursor",
        description: `${issuesToExport.length} issues exported to "${workspaceName}" workspace`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error exporting to Cursor:", error)
      toast({
        title: "Export failed",
        description: "An error occurred while exporting to Cursor",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Convert markdown to task list format
  const convertToTaskList = (markdown: string): string => {
    const lines = markdown.split("\n")
    let inIssue = false

    return lines
      .map((line) => {
        if (line.startsWith("### Issue ")) {
          inIssue = true
          return `- [ ] ${line.substring(4)}`
        } else if (line.startsWith("##") && !line.startsWith("### ")) {
          inIssue = false
        }

        if (inIssue && line.trim() !== "" && !line.startsWith("-")) {
          return `  ${line}`
        }

        return line
      })
      .join("\n")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export to Cursor.dev</DialogTitle>
          <DialogDescription>
            {selectedIssueIds
              ? `Export ${issuesToExport.length} selected issues to a Cursor.dev workspace.`
              : `Export all ${issuesToExport.length} issues to a Cursor.dev workspace.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <Input
              id="workspace-name"
              placeholder="e.g., FixHero Bug Report"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-description">Description (Optional)</Label>
            <Textarea
              id="workspace-description"
              placeholder="Brief description of these issues"
              value={workspaceDescription}
              onChange={(e) => setWorkspaceDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="task-list" checked={isTaskList} onCheckedChange={(checked) => setIsTaskList(!!checked)} />
            <Label htmlFor="task-list">Format as task list</Label>
          </div>

          <div className="text-xs text-gray-500">
            <p>Session: {session?.name || "Unnamed Session"}</p>
            <p>Created: {session ? new Date(session.startTime).toLocaleString() : ""}</p>
            <p>Issues to export: {issuesToExport.length}</p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isLoading || issuesToExport.length === 0}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              "Export to Cursor"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
