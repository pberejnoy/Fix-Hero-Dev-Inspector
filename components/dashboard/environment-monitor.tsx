"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Issue } from "@/lib/types"
import { Search, Copy, Eye, EyeOff } from "lucide-react"

interface EnvironmentMonitorProps {
  issues: Issue[]
}

export function EnvironmentMonitor({ issues }: EnvironmentMonitorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showSensitive, setShowSensitive] = useState(false)
  const [activeTab, setActiveTab] = useState("environment")

  // Extract environment variables from issues
  const environmentVars = issues
    .filter((issue) => issue.environmentVars)
    .flatMap((issue) => {
      const vars = issue.environmentVars || {}
      return Object.entries(vars).map(([key, value]) => ({
        key,
        value: String(value),
        issueId: issue.id,
        issueTitle: issue.title,
        isSensitive: isSensitiveKey(key),
      }))
    })

  // Extract navigation events from issues
  const navigationEvents = issues
    .filter((issue) => issue.navigationEvents)
    .flatMap((issue) => {
      const events = issue.navigationEvents || []
      return events.map((event) => ({
        ...event,
        issueId: issue.id,
        issueTitle: issue.title,
      }))
    })

  // Apply search filter
  const filteredVars = environmentVars.filter((variable) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        variable.key.toLowerCase().includes(query) ||
        (!variable.isSensitive && variable.value.toLowerCase().includes(query))
      )
    }
    return true
  })

  const filteredNavEvents = navigationEvents.filter((event) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        event.from.toLowerCase().includes(query) ||
        event.to.toLowerCase().includes(query) ||
        event.type.toLowerCase().includes(query)
      )
    }
    return true
  })

  function isSensitiveKey(key: string): boolean {
    const sensitivePatterns = [
      /key/i,
      /token/i,
      /secret/i,
      /password/i,
      /auth/i,
      /api/i,
      /credential/i,
      /private/i,
      /access/i,
      /jwt/i,
    ]
    return sensitivePatterns.some((pattern) => pattern.test(key))
  }

  const handleCopyValue = (value: string) => {
    navigator.clipboard.writeText(value)
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Environment & Navigation Monitor</CardTitle>
          <CardDescription>View environment variables and navigation events captured during inspection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="environment">Environment Variables</TabsTrigger>
              <TabsTrigger value="navigation">Navigation Events</TabsTrigger>
            </TabsList>

            <TabsContent value="environment" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search environment variables..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowSensitive(!showSensitive)} className="ml-2">
                  {showSensitive ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide Sensitive
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Show Sensitive
                    </>
                  )}
                </Button>
              </div>

              <ScrollArea className="h-[500px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Variable</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Issue</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVars.length > 0 ? (
                      filteredVars.map((variable, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{variable.key}</span>
                              {variable.isSensitive && (
                                <Badge variant="outline" className="text-xs">
                                  Sensitive
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {variable.isSensitive && !showSensitive ? (
                              <span className="text-muted-foreground">••••••••••••</span>
                            ) : (
                              <span className="font-mono text-xs">{variable.value}</span>
                            )}
                          </TableCell>
                          <TableCell className="truncate max-w-[150px]" title={variable.issueTitle}>
                            {variable.issueTitle}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopyValue(variable.value)}
                              disabled={variable.isSensitive && !showSensitive}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No environment variables found matching your search
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>

              <div className="p-4 border rounded-md bg-muted">
                <h3 className="font-medium mb-2">Environment Variables</h3>
                <p className="text-sm text-muted-foreground">
                  Environment variables are captured at runtime during issue reporting. Sensitive variables (containing
                  keywords like "key", "token", "secret", etc.) are masked by default.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="navigation" className="space-y-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search navigation events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              <ScrollArea className="h-[500px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Issue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNavEvents.length > 0 ? (
                      filteredNavEvents.map((event, index) => (
                        <TableRow key={index}>
                          <TableCell className="truncate max-w-[200px]" title={event.from}>
                            {event.from}
                          </TableCell>
                          <TableCell className="truncate max-w-[200px]" title={event.to}>
                            {event.to}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{event.type}</Badge>
                          </TableCell>
                          <TableCell>{formatTimestamp(event.timestamp)}</TableCell>
                          <TableCell className="truncate max-w-[150px]" title={event.issueTitle}>
                            {event.issueTitle}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No navigation events found matching your search
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>

              <div className="p-4 border rounded-md bg-muted">
                <h3 className="font-medium mb-2">Navigation Events</h3>
                <p className="text-sm text-muted-foreground">
                  Navigation events track URL changes during the inspection session, including the navigation type
                  (push, replace, pop) and timestamps. This helps understand the user journey that led to an issue.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
