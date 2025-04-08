"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Zap } from "lucide-react"
import type { Issue } from "@/lib/types"

interface AISummaryBadgeProps {
  issue: Issue
  onClick?: () => void
}

export function AISummaryBadge({ issue, onClick }: AISummaryBadgeProps) {
  if (!issue.aiSuggestion) return null

  const hasPriority = !!issue.aiSuggestion.priority
  const hasTags = !!issue.aiSuggestion.tags && issue.aiSuggestion.tags.length > 0
  const hasAnalysis = !!issue.aiSuggestion.analysis
  const hasSuggestedFix = !!issue.aiSuggestion.suggestedFix

  // Calculate completeness score (0-100)
  const completenessScore = [hasPriority, hasTags, hasAnalysis, hasSuggestedFix].filter(Boolean).length * 25

  // Determine badge variant based on completeness
  const getBadgeVariant = () => {
    if (completenessScore >= 75) return "default"
    if (completenessScore >= 50) return "secondary"
    return "outline"
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={getBadgeVariant()}
            className="flex items-center gap-1 cursor-pointer hover:bg-primary/90"
            onClick={onClick}
          >
            <Zap className="h-3 w-3" />
            <span>AI</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <p className="font-medium">AI Analysis Available</p>
            {hasPriority && <p>• Suggested Priority: {issue.aiSuggestion.priority}</p>}
            {hasTags && <p>• Suggested Tags: {issue.aiSuggestion.tags.join(", ")}</p>}
            {hasSuggestedFix && <p>• Includes suggested fix</p>}
            <p className="italic">Click to view full analysis</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
