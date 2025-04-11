"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Search, Trash, Download, FileJson, FileText, TableIcon, Github, TextCursorIcon as Cursor } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { Issue } from "@/lib/types"

interface IssueListProps {
  issues: Issue[]
  onSelectIssue: (issue: Issue) => void
  onDeleteIssue: (issueId: string) => void
  selectedIssueIds: string[]
  onToggleIssueSelection: (issueId: string) => void
  onSelectAllIssues: () => void
  onDeleteSelectedIssues: () => void
  onExportSelected: (format: "markdown" | "json" | "csv" | "github" | "cursor") => void
  isExporting: boolean
  isDeletingIssues: boolean
}

export function IssueList({
  issues,
  onSelectIssue,
  onDeleteIssue,
  selectedIssueIds,
  onToggleIssueSelection,
  onSelectAllIssues,
  onDeleteSelectedIssues,
  onExportSelected,
  isExporting,
  isDeletingIssues,
}: IssueListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Filter issues based on search query
  const filteredIssues = issues.filter((issue) => {
    const query = searchQuery.toLowerCase()
    return (
      (issue.title && issue.title.toLowerCase().includes(query)) ||
      (issue.notes && issue.notes.toLowerCase().includes(query)) ||
      (issue.tags && issue.tags.some((tag) => tag.toLowerCase().includes(query)))
    )
  })

  // Check if all issues are selected
  const allSelected = issues.length > 0 && selectedIssueIds.length === issues.length

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <h1 className="text-xl font-semibold">Issues</h1>
        <div className="flex items-center gap-2">
          {selectedIssueIds.length > 0 && (
            <>
              <AnimatedButton
                variant="destructive"
                size="sm"
                onClick={onDeleteSelectedIssues}
                isLoading={isDeletingIssues}
                loadingText={`Deleting ${selectedIssueIds.length}...`}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete {selectedIssueIds.length}
              </AnimatedButton>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <AnimatedButton variant="outline" size="sm" isLoading={isExporting} loadingText="Exporting...">
                    <Download className="mr-2 h-4 w-4" />
                    Export {selectedIssueIds.length}
                  </AnimatedButton>
                </DropdownMenuTrigger>
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
                    <TableIcon className="mr-2 h-4 w-4" />
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

      <div className="border-b p-4">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search issues..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {filteredIssues.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">No issues found</p>
              {searchQuery && (
                <Button variant="link" onClick={() => setSearchQuery("")}>
                  Clear search
                </Button>
              )}
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={onSelectAllIssues}
                    aria-label={allSelected ? "Deselect all issues" : "Select all issues"}
                  />
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filteredIssues.map((issue) => (
                  <motion.tr
                    key={issue.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={selectedIssueIds.includes(issue.id) ? "bg-primary/5" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIssueIds.includes(issue.id)}
                        onCheckedChange={() => onToggleIssueSelection(issue.id)}
                        aria-label={`Select issue ${issue.title}`}
                      />
                    </TableCell>
                    <TableCell
                      className="cursor-pointer font-medium hover:text-primary"
                      onClick={() => onSelectIssue(issue)}
                    >
                      {issue.title || "Untitled Issue"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          issue.severity === "critical"
                            ? "bg-red-500"
                            : issue.severity === "high"
                              ? "bg-orange-500"
                              : issue.severity === "medium"
                                ? "bg-yellow-500"
                                : "bg-green-500"
                        }
                      >
                        {issue.severity || "low"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {issue.tags?.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(issue.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onDeleteIssue(issue.id)}>
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
