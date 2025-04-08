"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Check, X, Loader2 } from "lucide-react"
import { generateTagsForIssue, type AITagSuggestion } from "@/lib/ai-service"
import type { Issue } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"

interface AITagSuggestionsProps {
  issue: Issue
  onAcceptTags: (tags: string[]) => void
}

export function AITagSuggestions({ issue, onAcceptTags }: AITagSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AITagSuggestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Reset state when issue changes
    setSuggestions(null)
    setLoading(false)
    setError(null)
  }, [issue.id])

  const handleGenerateTags = async () => {
    setLoading(true)
    setError(null)

    try {
      const tagSuggestions = await generateTagsForIssue(issue)
      setSuggestions(tagSuggestions)
    } catch (err) {
      setError("Failed to generate tags. Please try again.")
      console.error("Error generating tags:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptTags = () => {
    if (!suggestions) return

    // Combine existing tags with new ones, removing duplicates
    const existingTags = issue.tags || []
    const newTags = suggestions.tags.filter((tag) => !existingTags.includes(tag))
    const combinedTags = [...existingTags, ...newTags]

    onAcceptTags(combinedTags)

    toast({
      title: "Tags applied",
      description: `Added ${newTags.length} new AI-suggested tags`,
    })
  }

  const handleRejectTags = () => {
    setSuggestions(null)
  }

  if (loading) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
          <p className="text-sm text-muted-foreground">Analyzing issue and generating tags...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="mt-4 border-destructive">
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={handleGenerateTags} className="mt-2">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!suggestions) {
    return (
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <Zap className="h-4 w-4 text-primary mr-1" />
            AI Tag Suggestions
          </CardTitle>
          <CardDescription>Generate relevant tags for this issue using AI</CardDescription>
        </CardHeader>
        <CardFooter className="pt-0">
          <Button variant="default" size="sm" onClick={handleGenerateTags} className="w-full">
            <Zap className="h-4 w-4 mr-2" />
            Generate Tags
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="mt-4 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center">
          <Zap className="h-4 w-4 text-primary mr-1" />
          AI Tag Suggestions
        </CardTitle>
        <CardDescription>Confidence: {Math.round(suggestions.confidence * 100)}%</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-wrap gap-1 mb-2">
          {suggestions.tags.map((tag, index) => (
            <Badge key={index} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
        {suggestions.reasoning && <p className="text-xs text-muted-foreground mt-2">{suggestions.reasoning}</p>}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" size="sm" onClick={handleRejectTags}>
          <X className="h-4 w-4 mr-1" />
          Reject
        </Button>
        <Button variant="default" size="sm" onClick={handleAcceptTags}>
          <Check className="h-4 w-4 mr-1" />
          Apply Tags
        </Button>
      </CardFooter>
    </Card>
  )
}
