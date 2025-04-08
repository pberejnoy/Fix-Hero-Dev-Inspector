"use client"

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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import type { Issue, Session } from "@/lib/types"
import { formatDistanceToNow } from "@/lib/utils"
import { MoreHorizontal, ExternalLink, Edit, Trash2, Copy, AlertCircle, Clock, CheckCircle } from "lucide-react"

interface SessionTableProps {
  sessions: Session[]
  issues: Issue[]
  isLoading: boolean
}

export function SessionTable({ sessions, issues, isLoading }: SessionTableProps) {
  const { toast } = useToast()

  const getIssueCountByStatus = (sessionId: string, status: string) => {
    return issues.filter((issue) => issue.sessionId === sessionId && issue.status === status).length
  }

  const getIssueCountBySeverity = (sessionId: string, severity: string) => {
    return issues.filter((issue) => issue.sessionId === sessionId && issue.severity === severity).length
  }

  const getTotalIssueCount = (sessionId: string) => {
    return issues.filter((issue) => issue.sessionId === sessionId).length
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No sessions found.</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-24rem)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Session Name</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Issues</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.id}>
              <TableCell>
                <div className="font-medium">{session.name}</div>
                <div className="text-xs text-muted-foreground">{session.description}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm truncate max-w-[200px]">{session.url}</div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge>{getTotalIssueCount(session.id)}</Badge>
                  <div className="text-xs flex gap-1">
                    <span className="text-red-500">
                      {getIssueCountBySeverity(session.id, "critical") + getIssueCountBySeverity(session.id, "high")}
                    </span>
                    <span className="text-orange-500">{getIssueCountBySeverity(session.id, "medium")}</span>
                    <span className="text-green-500">{getIssueCountBySeverity(session.id, "low")}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1 text-xs">
                    <AlertCircle className="h-3 w-3 text-red-500" />
                    <span>{getIssueCountByStatus(session.id, "open")} open</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3 text-blue-500" />
                    <span>{getIssueCountByStatus(session.id, "in-progress")} in progress</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>{getIssueCountByStatus(session.id, "resolved")} resolved</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground">
                  {new Date(session.startTime).toLocaleDateString()}
                </span>
                <div className="text-xs text-muted-foreground">{formatDistanceToNow(session.startTime)} ago</div>
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground">
                  {session.lastUpdated ? new Date(session.lastUpdated).toLocaleDateString() : "N/A"}
                </span>
                <div className="text-xs text-muted-foreground">
                  {session.lastUpdated ? `${formatDistanceToNow(session.lastUpdated)} ago` : "N/A"}
                </div>
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
                    <DropdownMenuItem onClick={() => window.open(session.url, "_blank")}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open URL
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open(`/session-details.html?id=${session.id}`, "_blank")}>
                      <Edit className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        // Clone session logic here
                        toast({
                          title: "Session cloned",
                          description: "A copy of the session has been created",
                        })
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Clone Session
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-500"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this session and all its issues?")) {
                          // Delete session logic here
                          toast({
                            title: "Session deleted",
                            description: "The session and all its issues have been permanently deleted",
                          })
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Session
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
