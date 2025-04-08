"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Loader2, RefreshCw } from "lucide-react"
import { generateSummaryForIssue, type AISummary } from "@/lib/ai-service"
import type { Issue } from "@/lib/types"

interface AISummaryProps {
  issue: Issue
  onUpdateSeverity?: (severity: "critical" | "high" | "medium" | "low") => void
}

export function AISummaryComponent({ issue, onUpdateSeverity }: AISummaryProps) {
  const [summary, setSummary] = useState<AISummary | null>(
    issue.aiSuggestion
      ? {
          summary: issue.aiSuggestion.analysis,
          severity: issue.severity || "medium",
          priority: issue.aiSuggestion.priority,
          suggestedFix: issue.aiSuggestion.suggestedFix,
        }
      : null,
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerateSummary = async () => {
    setLoading(true)
    setError(null)

    try {
      const aiSummary = await generateSummaryForIssue(issue)
      setSummary(aiSummary)
    } catch (err) {
      setError("Failed to generate summary. Please try again.")
      console.error("Error generating summary:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleApplySeverity = () => {
    if (!summary || !onUpdateSeverity) return
    onUpdateSeverity(summary.severity)
  }

  if (loading) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
          <p className="text-sm text-muted-foreground">Analyzing issue and generating summary...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="mt-4 border-destructive">
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={handleGenerateSummary} className="mt-2">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return (
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <Zap className="h-4 w-4 text-primary mr-1" />
            AI Analysis
          </CardTitle>
          <CardDescription>Generate an AI analysis of this issue</CardDescription>
        </CardHeader>
        <CardFooter className="pt-0">
          <Button variant="default" size="sm" onClick={handleGenerateSummary} className="w-full">
            <Zap className="h-4 w-4 mr-2" />
            Analyze Issue
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="mt-4 border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm flex items-center">
            <Zap className="h-4 w-4 text-primary mr-1" />
            AI Analysis
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleGenerateSummary}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Badge
            variant={
              summary.severity === "critical"
                ? "destructive"
                : summary.severity === "high"
                  ? "destructive"
                  : summary.severity === "medium"
                    ? "default"
                    : "outline"
            }
          >
            {summary.severity} severity
          </Badge>
          <Badge variant="secondary">{summary.priority} priority</Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm">{summary.summary}</p>

        {summary.suggestedFix && (
          <div className="mt-2">
            <p className="text-xs font-medium">Suggested Fix:</p>
            <p className="text-xs text-muted-foreground">{summary.suggestedFix}</p>
          </div>
        )}
      </CardContent>
      {onUpdateSeverity && summary.severity !== issue.severity && (
        <CardFooter>
          <Button variant="outline" size="sm" onClick={handleApplySeverity} className="w-full">
            Apply Suggested Severity ({summary.severity})
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
