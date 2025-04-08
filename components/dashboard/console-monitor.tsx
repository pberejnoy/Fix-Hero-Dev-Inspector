"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Issue } from "@/lib/types"
import { Search, AlertTriangle, Info, XCircle } from "lucide-react"

interface ConsoleMonitorProps {
  issues: Issue[]
}

export function ConsoleMonitor({ issues }: ConsoleMonitorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sourceFilter, setSourceFilter] = useState<string | null>(null)
  const [showErrors, setShowErrors] = useState(true)
  const [showWarnings, setShowWarnings] = useState(true)
  const [showInfo, setShowInfo] = useState(true)

  // Extract all console errors from issues
  const allConsoleErrors = issues.flatMap((issue) =>
    (issue.consoleErrors || []).map((error) => ({
      ...error,
      issueId: issue.id,
      issueTitle: issue.title,
      // Infer type from message
      type: error.message.toLowerCase().includes("error")
        ? "error"
        : error.message.toLowerCase().includes("warn")
          ? "warning"
          : "info",
    })),
  )

  // Apply filters
  const filteredErrors = allConsoleErrors.filter((error) => {
    // Apply type filters
    if (error.type === "error" && !showErrors) return false
    if (error.type === "warning" && !showWarnings) return false
    if (error.type === "info" && !showInfo) return false

    // Apply source filter
    if (sourceFilter && error.source !== sourceFilter) return false

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        error.message.toLowerCase().includes(query) ||
        error.source.toLowerCase().includes(query) ||
        error.issueTitle.toLowerCase().includes(query)
      )
    }

    return true
  })

  // Get unique sources for filter
  const uniqueSources = Array.from(new Set(allConsoleErrors.map((e) => e.source)))

  const getErrorIcon = (type: string) => {
    switch (type) {
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getErrorBadge = (type: string) => {
    switch (type) {
      case "error":
        return <Badge variant="destructive">Error</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
      default:
        return <Badge className="bg-blue-100 text-blue-800">Info</Badge>
    }
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Console Error Monitor</CardTitle>
          <CardDescription>View and analyze console errors captured during inspection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search console messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={sourceFilter || ""} onValueChange={(value) => setSourceFilter(value || null)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Source File" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {uniqueSources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-errors"
                  checked={showErrors}
                  onCheckedChange={(checked) => setShowErrors(!!checked)}
                />
                <Label htmlFor="show-errors" className="text-sm">
                  Errors
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-warnings"
                  checked={showWarnings}
                  onCheckedChange={(checked) => setShowWarnings(!!checked)}
                />
                <Label htmlFor="show-warnings" className="text-sm">
                  Warnings
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="show-info" checked={showInfo} onCheckedChange={(checked) => setShowInfo(!!checked)} />
                <Label htmlFor="show-info" className="text-sm">
                  Info
                </Label>
              </div>
            </div>
          </div>

          <ScrollArea className="h-[600px] border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead className="w-[400px]">Message</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Line</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Issue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredErrors.length > 0 ? (
                  filteredErrors.map((error, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getErrorIcon(error.type)}
                          {getErrorBadge(error.type)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{error.message}</TableCell>
                      <TableCell>{error.source}</TableCell>
                      <TableCell>{error.lineNumber}</TableCell>
                      <TableCell>{formatTimestamp(error.timestamp)}</TableCell>
                      <TableCell className="truncate max-w-[150px]" title={error.issueTitle}>
                        {error.issueTitle}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No console messages found matching your filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          <div className="p-4 border rounded-md bg-muted">
            <h3 className="font-medium mb-2">Common Error Patterns</h3>
            <div className="space-y-2 text-sm">
              <div>
                <Badge variant="destructive" className="mb-1">
                  Uncaught TypeError
                </Badge>
                <p>Usually indicates an attempt to access a property of undefined or null.</p>
              </div>
              <div>
                <Badge variant="destructive" className="mb-1">
                  Uncaught ReferenceError
                </Badge>
                <p>Occurs when referencing a variable that doesn't exist.</p>
              </div>
              <div>
                <Badge className="bg-yellow-100 text-yellow-800 mb-1">Deprecated</Badge>
                <p>Indicates use of deprecated APIs that may be removed in future versions.</p>
              </div>
              <div>
                <Badge className="bg-blue-100 text-blue-800 mb-1">CORS</Badge>
                <p>Cross-Origin Resource Sharing issues, often related to API requests.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
