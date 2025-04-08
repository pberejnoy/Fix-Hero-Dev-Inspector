"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { Issue } from "@/lib/types"
import { Search, ChevronDown, Copy, ExternalLink } from "lucide-react"

interface NetworkMonitorProps {
  issues: Issue[]
}

export function NetworkMonitor({ issues }: NetworkMonitorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [methodFilter, setMethodFilter] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)
  const [showOnlyErrors, setShowOnlyErrors] = useState(false)

  // Extract all network requests from issues
  const allNetworkRequests = issues.flatMap((issue) =>
    (issue.networkErrors || []).map((error) => ({
      ...error,
      issueId: issue.id,
      issueTitle: issue.title,
    })),
  )

  // Apply filters
  const filteredRequests = allNetworkRequests.filter((request) => {
    if (showOnlyErrors && request.status < 400) return false
    if (statusFilter && request.status.toString() !== statusFilter) return false
    if (methodFilter && request.method !== methodFilter) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        request.url.toLowerCase().includes(query) ||
        request.statusText.toLowerCase().includes(query) ||
        request.issueTitle.toLowerCase().includes(query)
      )
    }
    return true
  })

  // Get unique status codes and methods for filters
  const uniqueStatusCodes = Array.from(new Set(allNetworkRequests.map((r) => r.status.toString())))
  const uniqueMethods = Array.from(new Set(allNetworkRequests.map((r) => r.method)))

  const getStatusBadge = (status: number) => {
    if (status < 300) return <Badge className="bg-green-100 text-green-800">Success</Badge>
    if (status < 400) return <Badge className="bg-blue-100 text-blue-800">Redirect</Badge>
    if (status < 500) return <Badge className="bg-yellow-100 text-yellow-800">Client Error</Badge>
    return <Badge className="bg-red-100 text-red-800">Server Error</Badge>
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
  }

  const handleOpenUrl = (url: string) => {
    window.open(url, "_blank")
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Network Request Monitor</CardTitle>
          <CardDescription>View and analyze network requests captured during inspection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value || null)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status Code" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status Codes</SelectItem>
                  {uniqueStatusCodes.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={methodFilter || "all"} onValueChange={(value) => setMethodFilter(value || null)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {uniqueMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-errors"
                  checked={showOnlyErrors}
                  onCheckedChange={(checked) => setShowOnlyErrors(!!checked)}
                />
                <Label htmlFor="show-errors" className="text-sm">
                  Errors Only
                </Label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <ScrollArea className="h-[500px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Method</TableHead>
                      <TableHead className="w-[300px]">URL</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Issue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length > 0 ? (
                      filteredRequests.map((request, index) => (
                        <TableRow
                          key={index}
                          className={`cursor-pointer ${selectedRequest === request ? "bg-muted" : ""}`}
                          onClick={() => setSelectedRequest(request)}
                        >
                          <TableCell>
                            <Badge variant="outline">{request.method}</Badge>
                          </TableCell>
                          <TableCell className="truncate max-w-[300px]" title={request.url}>
                            {request.url}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{request.status}</span>
                              {getStatusBadge(request.status)}
                            </div>
                          </TableCell>
                          <TableCell>{formatTimestamp(request.timestamp)}</TableCell>
                          <TableCell className="truncate max-w-[150px]" title={request.issueTitle}>
                            {request.issueTitle}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No network requests found matching your filters
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            <div>
              {selectedRequest ? (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Request Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs">URL</Label>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopyUrl(selectedRequest.url)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleOpenUrl(selectedRequest.url)}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm break-all border rounded-md p-2 bg-muted">{selectedRequest.url}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Method</Label>
                        <div className="text-sm font-medium">{selectedRequest.method}</div>
                      </div>
                      <div>
                        <Label className="text-xs">Status</Label>
                        <div className="text-sm font-medium">
                          {selectedRequest.status} {selectedRequest.statusText}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Timestamp</Label>
                      <div className="text-sm">{formatTimestamp(selectedRequest.timestamp)}</div>
                    </div>

                    <div>
                      <Label className="text-xs">Related Issue</Label>
                      <div className="text-sm font-medium">{selectedRequest.issueTitle}</div>
                    </div>

                    {selectedRequest.headers && (
                      <Collapsible>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Headers</Label>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent>
                          <div className="text-xs border rounded-md p-2 bg-muted">
                            <pre>{JSON.stringify(selectedRequest.headers, null, 2)}</pre>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {selectedRequest.requestBody && (
                      <Collapsible>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Request Body</Label>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent>
                          <div className="text-xs border rounded-md p-2 bg-muted">
                            <pre>{JSON.stringify(selectedRequest.requestBody, null, 2)}</pre>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {selectedRequest.responseBody && (
                      <Collapsible>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Response Body</Label>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent>
                          <div className="text-xs border rounded-md p-2 bg-muted">
                            <pre>{JSON.stringify(selectedRequest.responseBody, null, 2)}</pre>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="h-full flex items-center justify-center border rounded-md p-8">
                  <div className="text-center text-muted-foreground">
                    <p>Select a request to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
