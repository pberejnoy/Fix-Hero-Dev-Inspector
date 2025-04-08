"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { Issue } from "@/lib/types"
import { X } from "lucide-react"

interface FilterPanelProps {
  statusFilter: string | null
  setStatusFilter: (status: string | null) => void
  tagFilter: string | null
  setTagFilter: (tag: string | null) => void
  issues: Issue[]
  onClearFilters: () => void
}

export function FilterPanel({
  statusFilter,
  setStatusFilter,
  tagFilter,
  setTagFilter,
  issues,
  onClearFilters,
}: FilterPanelProps) {
  // Get all unique tags from issues
  const allTags = Array.from(new Set(issues.flatMap((issue) => issue.tags || []))).sort((a, b) => a.localeCompare(b))

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="text-sm font-medium">Status</div>
        <Select value={statusFilter || ""} onValueChange={(value) => setStatusFilter(value || null)}>
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Tags</div>
        <Select value={tagFilter || ""} onValueChange={(value) => setTagFilter(value || null)}>
          <SelectTrigger>
            <SelectValue placeholder="All tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {allTags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Active Filters</div>
        <div className="flex flex-wrap gap-2">
          {statusFilter && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Status: {statusFilter}
              <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setStatusFilter(null)} />
            </Badge>
          )}
          {tagFilter && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Tag: {tagFilter}
              <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setTagFilter(null)} />
            </Badge>
          )}
          {!statusFilter && !tagFilter && <span className="text-xs text-muted-foreground">No active filters</span>}
        </div>
      </div>

      {(statusFilter || tagFilter) && (
        <Button variant="outline" size="sm" onClick={onClearFilters} className="w-full">
          Clear All Filters
        </Button>
      )}
    </div>
  )
}
