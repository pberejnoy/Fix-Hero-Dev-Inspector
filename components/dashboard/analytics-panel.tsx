"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import type { Issue, Session } from "@/lib/types"
import { BarChart2, PieChart, LineChart, Activity, AlertTriangle, CheckCircle, Clock } from "lucide-react"

// Import chart libraries
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Line, Bar, Pie } from "react-chartjs-2"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)

interface AnalyticsPanelProps {
  issues: Issue[]
  sessions: Session[]
}

export function AnalyticsPanel({ issues, sessions }: AnalyticsPanelProps) {
  const [timeRange, setTimeRange] = useState("7days")
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("issues-over-time")

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Filter issues based on time range
  const getFilteredIssues = () => {
    const now = new Date()
    let startDate: Date

    switch (timeRange) {
      case "24hours":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case "7days":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "30days":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "90days":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(0) // All time
    }

    return issues.filter((issue) => new Date(issue.timestamp) >= startDate)
  }

  // Prepare data for issues over time chart
  const getIssuesOverTimeData = () => {
    const filteredIssues = getFilteredIssues()
    const dateFormat = timeRange === "24hours" ? "hour" : "day"

    // Group issues by date
    const issuesByDate: Record<string, { total: number; open: number; inProgress: number; resolved: number }> = {}

    // Create date labels based on time range
    const labels: string[] = []
    const now = new Date()
    let numDays: number

    switch (timeRange) {
      case "24hours":
        numDays = 24
        for (let i = 0; i < numDays; i++) {
          const date = new Date(now.getTime() - (numDays - i - 1) * 60 * 60 * 1000)
          const label = date.toLocaleTimeString([], { hour: "2-digit" })
          labels.push(label)
          issuesByDate[label] = { total: 0, open: 0, inProgress: 0, resolved: 0 }
        }
        break
      case "7days":
        numDays = 7
        for (let i = 0; i < numDays; i++) {
          const date = new Date(now.getTime() - (numDays - i - 1) * 24 * 60 * 60 * 1000)
          const label = date.toLocaleDateString([], { weekday: "short" })
          labels.push(label)
          issuesByDate[label] = { total: 0, open: 0, inProgress: 0, resolved: 0 }
        }
        break
      case "30days":
        numDays = 30
        for (let i = 0; i < numDays; i += 3) {
          const date = new Date(now.getTime() - (numDays - i - 1) * 24 * 60 * 60 * 1000)
          const label = date.toLocaleDateString([], { month: "short", day: "numeric" })
          labels.push(label)
          issuesByDate[label] = { total: 0, open: 0, inProgress: 0, resolved: 0 }
        }
        break
      case "90days":
        numDays = 90
        for (let i = 0; i < numDays; i += 10) {
          const date = new Date(now.getTime() - (numDays - i - 1) * 24 * 60 * 60 * 1000)
          const label = date.toLocaleDateString([], { month: "short", day: "numeric" })
          labels.push(label)
          issuesByDate[label] = { total: 0, open: 0, inProgress: 0, resolved: 0 }
        }
        break
      default:
        numDays = 12
        for (let i = 0; i < numDays; i++) {
          const date = new Date(now.getFullYear(), now.getMonth() - (numDays - i - 1), 1)
          const label = date.toLocaleDateString([], { month: "short" })
          labels.push(label)
          issuesByDate[label] = { total: 0, open: 0, inProgress: 0, resolved: 0 }
        }
    }

    // Count issues by date and status
    filteredIssues.forEach((issue) => {
      const date = new Date(issue.timestamp)
      let label: string

      if (timeRange === "24hours") {
        label = date.toLocaleTimeString([], { hour: "2-digit" })
      } else if (timeRange === "7days") {
        label = date.toLocaleDateString([], { weekday: "short" })
      } else if (timeRange === "30days" || timeRange === "90days") {
        label = date.toLocaleDateString([], { month: "short", day: "numeric" })
      } else {
        label = date.toLocaleDateString([], { month: "short" })
      }

      // Find the closest label
      const closestLabel = labels.reduce((prev, curr) => {
        return Math.abs(new Date(curr).getTime() - date.getTime()) < Math.abs(new Date(prev).getTime() - date.getTime())
          ? curr
          : prev
      })

      if (issuesByDate[closestLabel]) {
        issuesByDate[closestLabel].total++

        if (issue.status === "open") {
          issuesByDate[closestLabel].open++
        } else if (issue.status === "in-progress") {
          issuesByDate[closestLabel].inProgress++
        } else if (issue.status === "resolved") {
          issuesByDate[closestLabel].resolved++
        }
      }
    })

    // Prepare chart data
    return {
      labels,
      datasets: [
        {
          label: "Total Issues",
          data: labels.map((label) => issuesByDate[label]?.total || 0),
          borderColor: "rgb(99, 102, 241)",
          backgroundColor: "rgba(99, 102, 241, 0.5)",
          tension: 0.2,
        },
        {
          label: "Open",
          data: labels.map((label) => issuesByDate[label]?.open || 0),
          borderColor: "rgb(239, 68, 68)",
          backgroundColor: "rgba(239, 68, 68, 0.5)",
          tension: 0.2,
        },
        {
          label: "In Progress",
          data: labels.map((label) => issuesByDate[label]?.inProgress || 0),
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.5)",
          tension: 0.2,
        },
        {
          label: "Resolved",
          data: labels.map((label) => issuesByDate[label]?.resolved || 0),
          borderColor: "rgb(34, 197, 94)",
          backgroundColor: "rgba(34, 197, 94, 0.5)",
          tension: 0.2,
        },
      ],
    }
  }

  // Prepare data for issues by status chart
  const getIssuesByStatusData = () => {
    const filteredIssues = getFilteredIssues()

    const openCount = filteredIssues.filter((issue) => issue.status === "open").length
    const inProgressCount = filteredIssues.filter((issue) => issue.status === "in-progress").length
    const resolvedCount = filteredIssues.filter((issue) => issue.status === "resolved").length

    return {
      labels: ["Open", "In Progress", "Resolved"],
      datasets: [
        {
          data: [openCount, inProgressCount, resolvedCount],
          backgroundColor: ["rgba(239, 68, 68, 0.7)", "rgba(59, 130, 246, 0.7)", "rgba(34, 197, 94, 0.7)"],
          borderColor: ["rgb(239, 68, 68)", "rgb(59, 130, 246)", "rgb(34, 197, 94)"],
          borderWidth: 1,
        },
      ],
    }
  }

  // Prepare data for issues by tag chart
  const getIssuesByTagData = () => {
    const filteredIssues = getFilteredIssues()

    // Count issues by tag
    const tagCounts: Record<string, number> = {}
    filteredIssues.forEach((issue) => {
      if (issue.tags && issue.tags.length > 0) {
        issue.tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      }
    })

    // Sort tags by count and take top 10
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    // Generate random colors for each tag
    const backgroundColors = topTags.map((_, i) => {
      const hue = (i * 30) % 360
      return `hsla(${hue}, 70%, 60%, 0.7)`
    })

    const borderColors = topTags.map((_, i) => {
      const hue = (i * 30) % 360
      return `hsl(${hue}, 70%, 50%)`
    })

    return {
      labels: topTags.map(([tag]) => tag),
      datasets: [
        {
          data: topTags.map(([_, count]) => count),
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
        },
      ],
    }
  }

  // Prepare data for issues by severity chart
  const getIssuesBySeverityData = () => {
    const filteredIssues = getFilteredIssues()

    const criticalCount = filteredIssues.filter((issue) => issue.severity === "critical").length
    const highCount = filteredIssues.filter((issue) => issue.severity === "high").length
    const mediumCount = filteredIssues.filter((issue) => issue.severity === "medium").length
    const lowCount = filteredIssues.filter((issue) => issue.severity === "low").length

    return {
      labels: ["Critical", "High", "Medium", "Low"],
      datasets: [
        {
          data: [criticalCount, highCount, mediumCount, lowCount],
          backgroundColor: [
            "rgba(220, 38, 38, 0.7)",
            "rgba(239, 68, 68, 0.7)",
            "rgba(249, 115, 22, 0.7)",
            "rgba(59, 130, 246, 0.7)",
          ],
          borderColor: ["rgb(220, 38, 38)", "rgb(239, 68, 68)", "rgb(249, 115, 22)", "rgb(59, 130, 246)"],
          borderWidth: 1,
        },
      ],
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="issues-over-time" className="flex items-center gap-1">
              <LineChart className="h-4 w-4" />
              Issues Over Time
            </TabsTrigger>
            <TabsTrigger value="issues-by-status" className="flex items-center gap-1">
              <PieChart className="h-4 w-4" />
              By Status
            </TabsTrigger>
            <TabsTrigger value="issues-by-tag" className="flex items-center gap-1">
              <BarChart2 className="h-4 w-4" />
              By Tag
            </TabsTrigger>
            <TabsTrigger value="issues-by-severity" className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              By Severity
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Label htmlFor="time-range" className="text-sm">
            Time Range:
          </Label>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger id="time-range" className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24hours">Last 24 Hours</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <TabsContent value="issues-over-time" className="mt-0">
            <div className="h-[400px]">
              <Line
                data={getIssuesOverTimeData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0,
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      position: "top" as const,
                    },
                    title: {
                      display: true,
                      text: "Issues Over Time",
                    },
                  },
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="issues-by-status" className="mt-0">
            <div className="h-[400px] flex items-center justify-center">
              <div className="w-[400px] h-[400px]">
                <Pie
                  data={getIssuesByStatusData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "right" as const,
                      },
                      title: {
                        display: true,
                        text: "Issues by Status",
                      },
                    },
                  }}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="issues-by-tag" className="mt-0">
            <div className="h-[400px]">
              <Bar
                data={getIssuesByTagData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: "y" as const,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    title: {
                      display: true,
                      text: "Top 10 Tags",
                    },
                  },
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="issues-by-severity" className="mt-0">
            <div className="h-[400px] flex items-center justify-center">
              <div className="w-[400px] h-[400px]">
                <Pie
                  data={getIssuesBySeverityData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "right" as const,
                      },
                      title: {
                        display: true,
                        text: "Issues by Severity",
                      },
                    },
                  }}
                />
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Open Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {getFilteredIssues().filter((issue) => issue.status === "open").length}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {Math.round(
                (getFilteredIssues().filter((issue) => issue.status === "open").length / getFilteredIssues().length) *
                  100,
              ) || 0}
              % of total issues
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              In Progress Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {getFilteredIssues().filter((issue) => issue.status === "in-progress").length}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {Math.round(
                (getFilteredIssues().filter((issue) => issue.status === "in-progress").length /
                  getFilteredIssues().length) *
                  100,
              ) || 0}
              % of total issues
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Resolved Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {getFilteredIssues().filter((issue) => issue.status === "resolved").length}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {Math.round(
                (getFilteredIssues().filter((issue) => issue.status === "resolved").length /
                  getFilteredIssues().length) *
                  100,
              ) || 0}
              % of total issues
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
