"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { updateIssueStatus } from "@/lib/firebase-service"
import type { Issue, Session } from "@/lib/types"
import { formatDistanceToNow } from "@/lib/utils"
import { MoreHorizontal, ExternalLink, Edit, Trash2, CheckCircle, Clock, AlertCircle } from "lucide-react"

interface IssueTableProps {
  issues: Issue[]
  sessions: Session[]
  isLoading: boolean
}

export function IssueTable({ issues, sessions, isLoading }: IssueTableProps) {
  const [selectedIssues, setSelectedIssues] = useState<string[]>([])
  const { toast } = useToast()

  const handleSelectAll = () => {
    if (selectedIssues.length === issues.length) {
      setSelectedIssues([])
    } else {
      setSelectedIssues(issues.map((issue) => issue.id))
    }
  }

  const handleSelectIssue = (issueId: string) => {
    if (selectedIssues.includes(issueId)) {
      setSelectedIssues(selectedIssues.filter((id) => id !== issueId))
    } else {
      setSelectedIssues([...selectedIssues, issueId])
    }
  }

  const handleStatusChange = async (issueId: string, status: string) => {
    try {
      await updateIssueStatus(issueId, status)
      toast({
        title: "Status updated",
        description: `Issue status changed to ${status}`,
      })
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error updating status",
        description: "Failed to update issue status",
        variant: "destructive",
      })
    }
  }

  const getSessionName = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId)
    return session?.name || "Unknown Session"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Open
          </Badge>
        )
      case "in-progress":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> In Progress
          </Badge>
        )
      case "resolved":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Resolved
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>
      case "high":
        return <Badge variant="destructive">High</Badge>
      case "medium":
        return <Badge>Medium</Badge>
      case "low":
        return <Badge variant="outline">Low</Badge>
      default:
        return <Badge variant="secondary">{severity}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-4">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (issues.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No issues found matching your filters.</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-24rem)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <Checkbox
                checked={selectedIssues.length === issues.length && issues.length > 0}
                onCheckedChange={handleSelectAll}
                aria-label="Select all issues"
              />
            </TableHead>
            <TableHead className="w-[80px]">Preview</TableHead>
            <TableHead>Issue</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Session</TableHead>
            <TableHead>Reported</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.map((issue) => (
            <TableRow key={issue.id}>
              <TableCell>
                <Checkbox
                  checked={selectedIssues.includes(issue.id)}
                  onCheckedChange={() => handleSelectIssue(issue.id)}
                  aria-label={`Select issue ${issue.title}`}
                />
              </TableCell>
              <TableCell>
                {issue.screenshot ? (
                  <div className="relative h-10 w-10 overflow-hidden rounded border">
                    <img
                      src={issue.screenshot || "/placeholder.svg"}
                      alt="Screenshot"
                      className="h-full w-full object-cover"
                      onClick={() => window.open(issue.screenshot, "_blank")}
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">No img</span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{issue.title}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[300px]">{issue.url}</span>
                  {issue.elementDetails && (
                    <span className="text-xs text-muted-foreground font-mono mt-1 truncate max-w-[300px]">
                      {issue.elementDetails.selector}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(issue.status || "open")}</TableCell>
              <TableCell>{getSeverityBadge(issue.severity || "medium")}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                  {issue.tags?.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {(issue.tags?.length || 0) > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{(issue.tags?.length || 0) - 3} more
                    </Badge>
                  )}
                  {(!issue.tags || issue.tags.length === 0) && (
                    <span className="text-xs text-muted-foreground">No tags</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm">{getSessionName(issue.sessionId)}</span>
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground">{formatDistanceToNow(issue.timestamp)} ago</span>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => window.open(issue.url, "_blank")}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open URL
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open(`/issue-details.html?id=${issue.id}`, "_blank")}>
                      <Edit className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleStatusChange(issue.id, "open")}>
                      <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                      Open
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(issue.id, "in-progress")}>
                      <Clock className="h-4 w-4 mr-2 text-blue-500" />
                      In Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(issue.id, "resolved")}>
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Resolved
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-500"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this issue?")) {
                          // Delete issue logic here
                          toast({
                            title: "Issue deleted",
                            description: "The issue has been permanently deleted",
                          })
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Issue
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}
