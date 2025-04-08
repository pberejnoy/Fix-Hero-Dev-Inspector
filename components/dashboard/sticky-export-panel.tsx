"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Download, FileText, FileJson, Github, Clipboard, Share2, ChevronUp, ChevronDown } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Issue, Session } from "@/lib/types"
import { exportToMarkdown, exportToJSON, exportToCSV, downloadAsFile } from "@/lib/export-utils"

interface StickyExportPanelProps {
  issues: Issue[]
  sessions: Session[]
  currentSession: Session | null
  onOpenShareDialog: () => void
  onOpenGithubDialog: () => void
  onOpenCursorDialog: () => void
}

export function StickyExportPanel({
  issues,
  sessions,
  currentSession,
  onOpenShareDialog,
  onOpenGithubDialog,
  onOpenCursorDialog,
}: StickyExportPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { toast } = useToast()

  const handleExportMarkdown = () => {
    if (issues.length === 0) {
      toast({
        title: "No issues to export",
        description: "There are no issues to export",
        variant: "destructive",
      })
      return
    }

    try {
      const session = currentSession || {
        id: "unknown",
        startTime: Date.now(),
        url: "unknown",
        browserInfo: "unknown",
        issues: [],
      }

      const markdown = exportToMarkdown(issues, session, {
        includeScreenshots: true,
        includeConsoleErrors: true,
        includeNetworkErrors: true,
        includeElementDetails: true,
      })

      downloadAsFile(markdown, `fixhero-issues-${new Date().toISOString().slice(0, 10)}.md`, "text/markdown")

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
    }
  }

  const handleExportJSON = () => {
    if (issues.length === 0) {
      toast({
        title: "No issues to export",
        description: "There are no issues to export",
        variant: "destructive",
      })
      return
    }

    try {
      const session = currentSession || {
        id: "unknown",
        startTime: Date.now(),
        url: "unknown",
        browserInfo: "unknown",
        issues: [],
      }

      const json = exportToJSON(issues, session, {
        includeScreenshots: true,
        includeConsoleErrors: true,
        includeNetworkErrors: true,
        includeElementDetails: true,
      })

      downloadAsFile(json, `fixhero-issues-${new Date().toISOString().slice(0, 10)}.json`, "application/json")

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
    }
  }

  const handleExportCSV = () => {
    if (issues.length === 0) {
      toast({
        title: "No issues to export",
        description: "There are no issues to export",
        variant: "destructive",
      })
      return
    }

    try {
      const session = currentSession || {
        id: "unknown",
        startTime: Date.now(),
        url: "unknown",
        browserInfo: "unknown",
        issues: [],
      }

      const csv = exportToCSV(issues, session)

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
    }
  }

  const handleCopyToClipboard = () => {
    if (issues.length === 0) {
      toast({
        title: "No issues to copy",
        description: "There are no issues to copy to clipboard",
        variant: "destructive",
      })
      return
    }

    try {
      const session = currentSession || {
        id: "unknown",
        startTime: Date.now(),
        url: "unknown",
        browserInfo: "unknown",
        issues: [],
      }

      const markdown = exportToMarkdown(issues, session, {
        includeScreenshots: false, // Don't include screenshots in clipboard
        includeConsoleErrors: true,
        includeNetworkErrors: true,
        includeElementDetails: true,
      })

      navigator.clipboard.writeText(markdown)

      toast({
        title: "Copied to clipboard",
        description: `${issues.length} issues copied to clipboard in Markdown format`,
      })
    } catch (error) {
      console.error("Error copying to clipboard:", error)
      toast({
        title: "Copy failed",
        description: "An error occurred while copying to clipboard",
        variant: "destructive",
      })
    }
  }

  return (
    <div
      className={`fixed bottom-0 right-4 z-50 bg-background border rounded-t-lg shadow-lg transition-all ${isExpanded ? "pb-2" : ""}`}
    >
      <div
        className="flex items-center justify-between px-4 py-2 border-b cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          <span className="text-sm font-medium">Export Options</span>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="p-2 grid grid-cols-3 sm:grid-cols-6 gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleExportMarkdown} className="w-full">
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Export to Markdown</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleExportJSON} className="w-full">
                  <FileJson className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Export to JSON</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleExportCSV} className="w-full">
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Export to CSV</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleCopyToClipboard} className="w-full">
                  <Clipboard className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Copy to Clipboard</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onOpenGithubDialog} className="w-full">
                  <Github className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Export to GitHub</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onOpenShareDialog} className="w-full">
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Share Session</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  )
}
