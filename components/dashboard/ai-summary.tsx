"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import type { Issue } from "@/lib/types"
import { AlertTriangle, CheckCircle, Clock, Zap, ArrowRight, BarChart2, RefreshCw } from "lucide-react"

interface AISummaryProps {
  issues: Issue[]
}

interface AISummaryData {
  topIssues: {
    id: string
    title: string
    url: string
    severity: string
    reason: string
  }[]
  criticalPaths: {
    path: string
    issueCount: number
    description: string
  }[]
  recommendations: string[]
  stats: {
    totalIssues: number
    openIssues: number
    inProgressIssues: number
    resolvedIssues: number
    criticalIssues: number
    highIssues: number
    mediumIssues: number
    lowIssues: number
  }
}

export function AISummary({ issues }: AISummaryProps) {
  const [summaryData, setSummaryData] = useState<AISummaryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("top-issues")
  const { toast } = useToast()

  useEffect(() => {
    generateSummary()
  }, [issues])

  const generateSummary = async () => {
    setIsLoading(true)
    try {
      // In a real implementation, this would call the AI service
      // For now, we'll generate a mock summary
      const mockSummary = generateMockSummary(issues)
      setSummaryData(mockSummary)
    } catch (error) {
      console.error("Error generating AI summary:", error)
      toast({
        title: "Error generating summary",
        description: "Failed to generate AI summary",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateMockSummary = (issues: Issue[]): AISummaryData => {
    // Calculate stats
    const stats = {
      totalIssues: issues.length,
      openIssues: issues.filter((i) => i.status === "open").length,
      inProgressIssues: issues.filter((i) => i.status === "in-progress").length,
      resolvedIssues: issues.filter((i) => i.status === "resolved").length,
      criticalIssues: issues.filter((i) => i.severity === "critical").length,
      highIssues: issues.filter((i) => i.severity === "high").length,
      mediumIssues: issues.filter((i) => i.severity === "medium").length,
      lowIssues: issues.filter((i) => i.severity === "low").length,
    }

    // Get top issues (critical and high severity, open status)
    const criticalAndHighIssues = issues
      .filter((i) => (i.severity === "critical" || i.severity === "high") && i.status === "open")
      .slice(0, 5)
      .map((i) => ({
        id: i.id,
        title: i.title,
        url: i.url,
        severity: i.severity || "medium",
        reason: i.aiSuggestion?.analysis || "High priority issue that needs attention",
      }))

    // Group issues by URL path to find critical paths
    const pathCounts: Record<string, number> = {}
    issues.forEach((issue) => {
      try {
        const url = new URL(issue.url)
        const path = url.pathname
        pathCounts[path] = (pathCounts[path] || 0) + 1
      } catch (e) {
        // Skip invalid URLs
      }
    })

    // Sort paths by issue count and take top 3
    const criticalPaths = Object.entries(pathCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([path, count]) => ({
        path,
        issueCount: count,
        description: `This path has ${count} issues and may need attention`,
      }))

    // Generate recommendations based on the issues
    const recommendations = [
      "Focus on resolving critical and high severity issues first",
      "Consider reviewing the most problematic paths in your application",
      "Address console errors that appear across multiple issues",
      "Improve error handling for network requests",
      "Consider adding more comprehensive testing for critical user flows",
    ]

    return {
      topIssues: criticalAndHighIssues,
      criticalPaths,
      recommendations,
      stats,
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-40" />
      </div>
    )
  }

  if (!summaryData) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">Failed to generate AI summary.</p>
        <Button onClick={generateSummary} variant="outline" className="mt-2">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Issues</p>
              <p className="text-2xl font-bold">{summaryData.stats.totalIssues}</p>
            </div>
            <BarChart2 className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Open Issues</p>
              <p className="text-2xl font-bold text-red-500">{summaryData.stats.openIssues}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold text-blue-500">{summaryData.stats.inProgressIssues}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Resolved</p>
              <p className="text-2xl font-bold text-green-500">{summaryData.stats.resolvedIssues}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="top-issues" className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            Top Issues
          </TabsTrigger>
          <TabsTrigger value="critical-paths" className="flex items-center gap-1">
            <BarChart2 className="h-4 w-4" />
            Critical Paths
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-1">
            <Zap className="h-4 w-4" />
            Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="top-issues" className="mt-4">
          {summaryData.topIssues.length > 0 ? (
            <div className="space-y-3">
              {summaryData.topIssues.map((issue, index) => (
                <Card key={index}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{issue.title}</h3>
                          <Badge variant={issue.severity === "critical" ? "destructive" : "default"}>
                            {issue.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate max-w-[500px]">{issue.url}</p>
                        <p className="text-sm mt-2">{issue.reason}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => window.open(`/issue-details.html?id=${issue.id}`, "_blank")}
                      >
                        View <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No high priority issues found.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="critical-paths" className="mt-4">
          {summaryData.criticalPaths.length > 0 ? (
            <div className="space-y-3">
              {summaryData.criticalPaths.map((path, index) => (
                <Card key={index}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium font-mono">{path.path}</h3>
                          <Badge>{path.issueCount} issues</Badge>
                        </div>
                        <p className="text-sm mt-1">{path.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No critical paths identified.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <ul className="space-y-2">
                {summaryData.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Zap className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
