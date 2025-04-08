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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { exportToMarkdown, exportToJSON, exportToCSV, downloadAsFile } from "@/lib/export-utils"
import type { Issue, Session, ExportOptions } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"

interface ExportConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  issues: Issue[]
  session: Session | null
  format: "markdown" | "json" | "csv" | "github"
  selectedIssueIds?: string[]
}

export function ExportConfirmationDialog({
  open,
  onOpenChange,
  issues,
  session,
  format,
  selectedIssueIds,
}: ExportConfirmationDialogProps) {
  const [options, setOptions] = useState<ExportOptions>({
    includeScreenshots: true,
    includeConsoleErrors: true,
    includeNetworkErrors: true,
    includeElementDetails: true,
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Filter issues if selectedIssueIds is provided
  const issuesToExport = selectedIssueIds ? issues.filter((issue) => selectedIssueIds.includes(issue.id)) : issues

  const handleExport = async () => {
    if (!session) return

    setIsLoading(true)

    try {
      const timestamp = new Date().toISOString().slice(0, 10)
      const baseFilename = `fixhero-report-${timestamp}`

      switch (format) {
        case "markdown":
          const markdown = exportToMarkdown(issuesToExport, session, options)
          downloadAsFile(markdown, `${baseFilename}.md`, "text/markdown")
          break

        case "json":
          const json = exportToJSON(issuesToExport, session, options)
          downloadAsFile(json, `${baseFilename}.json`, "application/json")
          break

        case "csv":
          const csv = exportToCSV(issuesToExport, session)
          downloadAsFile(csv, `${baseFilename}.csv`, "text/csv")
          break

        case "github":
          // For GitHub, we'll just show a message for now
          toast({
            title: "GitHub Export",
            description: "GitHub export functionality will be implemented in a future update.",
          })
          break
      }

      toast({
        title: "Export successful",
        description: `Successfully exported ${issuesToExport.length} issues in ${format.toUpperCase()} format.`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error exporting issues:", error)

      toast({
        title: "Export failed",
        description: "An error occurred while exporting the issues.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirm Export</DialogTitle>
          <DialogDescription>
            {selectedIssueIds
              ? `Export ${issuesToExport.length} selected issues in ${format.toUpperCase()} format.`
              : `Export all ${issuesToExport.length} issues in ${format.toUpperCase()} format.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Export Options</Label>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-screenshots"
                  checked={options.includeScreenshots}
                  onCheckedChange={(checked) => setOptions({ ...options, includeScreenshots: !!checked })}
                />
                <Label htmlFor="include-screenshots">Include Screenshots</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-console-errors"
                  checked={options.includeConsoleErrors}
                  onCheckedChange={(checked) => setOptions({ ...options, includeConsoleErrors: !!checked })}
                />
                <Label htmlFor="include-console-errors">Include Console Errors</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-network-errors"
                  checked={options.includeNetworkErrors}
                  onCheckedChange={(checked) => setOptions({ ...options, includeNetworkErrors: !!checked })}
                />
                <Label htmlFor="include-network-errors">Include Network Errors</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-element-details"
                  checked={options.includeElementDetails}
                  onCheckedChange={(checked) => setOptions({ ...options, includeElementDetails: !!checked })}
                />
                <Label htmlFor="include-element-details">Include Element Details</Label>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            <p>Session: {session?.name || "Unnamed Session"}</p>
            <p>Created: {session ? new Date(session.startTime).toLocaleString() : ""}</p>
            <p>Issues to export: {issuesToExport.length}</p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isLoading || issuesToExport.length === 0}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isLoading ? "Exporting..." : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
