"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Issue, Session } from "@/lib/types"
import { GitCompare, ArrowRight, Plus, Minus, RefreshCw } from "lucide-react"

interface SessionCompareProps {
  sessions: Session[]
  issues: Issue[]
}

export function SessionCompare({ sessions, issues }: SessionCompareProps) {
  const [session1, setSession1] = useState<string | null>(null)
  const [session2, setSession2] = useState<string | null>(null)
  const [isComparing, setIsComparing] = useState(false)
  const [compareResults, setCompareResults] = useState<{
    newIssues: Issue[]
    resolvedIssues: Issue[]
    persistentIssues: Issue[]
  } | null>(null)

  const handleCompare = () => {
    if (!session1 || !session2) return

    setIsComparing(true)

    // Get issues for both sessions
    const session1Issues = issues.filter((issue) => issue.sessionId === session1)
    const session2Issues = issues.filter((issue) => issue.sessionId === session2)

    // Find new issues (in session2 but not in session1)
    const newIssues = session2Issues.filter((issue2) => {
      // Consider an issue new if there's no similar issue in session1
      return !session1Issues.some(
        (issue1) =>
          // Compare by URL and element selector if available
          issue1.url === issue2.url &&
          (issue1.elementDetails?.selector === issue2.elementDetails?.selector || issue1.title === issue2.title),
      )
    })

    // Find resolved issues (in session1 but not in session2)
    const resolvedIssues = session1Issues.filter((issue1) => {
      // Consider an issue resolved if there's no similar issue in session2
      return !session2Issues.some(
        (issue2) =>
          issue2.url === issue1.url &&
          (issue2.elementDetails?.selector === issue1.elementDetails?.selector || issue2.title === issue1.title),
      )
    })

    // Find persistent issues (in both sessions)
    const persistentIssues = session2Issues.filter((issue2) => {
      // Consider an issue persistent if there's a similar issue in session1
      return session1Issues.some(
        (issue1) =>
          issue1.url === issue2.url &&
          (issue1.elementDetails?.selector === issue2.elementDetails?.selector || issue1.title === issue2.title),
      )
    })

    setCompareResults({
      newIssues,
      resolvedIssues,
      persistentIssues,
    })

    setIsComparing(false)
  }

  const getSessionName = (sessionId: string | null) => {
    if (!sessionId) return "Select a session"
    const session = sessions.find((s) => s.id === sessionId)
    return session ? session.name : sessionId
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Session Comparison Tool</CardTitle>
          <CardDescription>Compare two sessions to identify new, resolved, and persistent issues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Select value={session1 || ""} onValueChange={(value) => setSession1(value || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select base session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.name} ({formatTimestamp(session.startTime)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground" />

            <div className="flex-1">
              <Select value={session2 || ""} onValueChange={(value) => setSession2(value || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select comparison session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.name} ({formatTimestamp(session.startTime)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleCompare} disabled={!session1 || !session2 || session1 === session2 || isComparing}>
              {isComparing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Comparing...
                </>
              ) : (
                <>
                  <GitCompare className="h-4 w-4 mr-2" />
                  Compare
                </>
              )}
            </Button>
          </div>

          {compareResults && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Plus className="h-4 w-4 text-green-500" />
                      New Issues
                    </CardTitle>
                    <CardDescription>
                      Issues in {getSessionName(session2)} but not in {getSessionName(session1)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{compareResults.newIssues.length}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Minus className="h-4 w-4 text-red-500" />
                      Resolved Issues
                    </CardTitle>
                    <CardDescription>
                      Issues in {getSessionName(session1)} but not in {getSessionName(session2)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{compareResults.resolvedIssues.length}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <GitCompare className="h-4 w-4 text-blue-500" />
                      Persistent Issues
                    </CardTitle>
                    <CardDescription>Issues present in both sessions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{compareResults.persistentIssues.length}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">New Issues ({compareResults.newIssues.length})</h3>
                <ScrollArea className="h-[200px] border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {compareResults.newIssues.length > 0 ? (
                        compareResults.newIssues.map((issue, index) => (
                          <TableRow key={index}>
                            <TableCell>{issue.title}</TableCell>
                            <TableCell className="truncate max-w-[200px]" title={issue.url}>
                              {issue.url}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  issue.severity === "critical" || issue.severity === "high"
                                    ? "destructive"
                                    : issue.severity === "medium"
                                      ? "default"
                                      : "outline"
                                }
                              >
                                {issue.severity}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  issue.status === "open"
                                    ? "destructive"
                                    : issue.status === "in-progress"
                                      ? "default"
                                      : "outline"
                                }
                              >
                                {issue.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                            No new issues found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Resolved Issues ({compareResults.resolvedIssues.length})</h3>
                <ScrollArea className="h-[200px] border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {compareResults.resolvedIssues.length > 0 ? (
                        compareResults.resolvedIssues.map((issue, index) => (
                          <TableRow key={index}>
                            <TableCell>{issue.title}</TableCell>
                            <TableCell className="truncate max-w-[200px]" title={issue.url}>
                              {issue.url}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  issue.severity === "critical" || issue.severity === "high"
                                    ? "destructive"
                                    : issue.severity === "medium"
                                      ? "default"
                                      : "outline"
                                }
                              >
                                {issue.severity}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  issue.status === "open"
                                    ? "destructive"
                                    : issue.status === "in-progress"
                                      ? "default"
                                      : "outline"
                                }
                              >
                                {issue.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                            No resolved issues found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          )}

          {!compareResults && (
            <div className="border rounded-md p-8 text-center">
              <GitCompare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Session Comparison</h3>
              <p className="text-muted-foreground mb-4">
                Select two sessions to compare and identify new, resolved, and persistent issues.
              </p>
              <p className="text-sm text-muted-foreground">
                This helps track progress between testing sessions and identify recurring issues.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
