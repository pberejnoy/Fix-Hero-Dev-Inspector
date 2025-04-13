"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  Tag,
  Trash,
  MoveHorizontal,
  Download,
  FileJson,
  FileText,
  TableIcon,
  Github,
  TextCursorIcon as Cursor,
  FileStack,
  AlertTriangle,
  X,
} from "lucide-react"
import {
  batchUpdateIssues,
  batchDeleteIssues,
  batchExportIssues,
  batchTagIssues,
  moveIssuesToSession,
} from "@/lib/batch-operations"
import { getSessions } from "@/lib/session-manager-enhanced"
import { getAllTags } from "@/lib/search-service"
import type { Session } from "@/lib/types"

interface BatchOperationsProps {
  sessionId: string
  selectedIssueIds: string[]
  onComplete: () => void
  onCancel: () => void
}

export function BatchOperations({ sessionId, selectedIssueIds, onComplete, onCancel }: BatchOperationsProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // State for different operations
  const [sessions, setSessions] = useState<Session[]>([])
  const [targetSessionId, setTargetSessionId] = useState<string>("")
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [tagOperation, setTagOperation] = useState<"add" | "remove" | "set">("add")
  const [severity, setSeverity] = useState<string>("")
  const [status, setStatus] = useState<string>("")

  // Load sessions and tags
  useState(() => {
    const loadData = async () => {
      try {
        const loadedSessions = await getSessions()
        setSessions(loadedSessions.filter((session) => session.id !== sessionId))

        const loadedTags = await getAllTags()
        setAvailableTags(loadedTags)
      } catch (error) {
        console.error("Error loading data for batch operations:", error)
      }
    }

    loadData()
  })

  // Close dialog
  const handleClose = () => {
    setIsOpen(false)
    onCancel()
  }

  // Add tag to selection
  const addTag = () => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      setSelectedTags([...selectedTags, newTag.trim()])
      setNewTag("")
    }
  }

  // Remove tag from selection
  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag))
  }

  // Select existing tag
  const selectExistingTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  // Handle batch update
  const handleBatchUpdate = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const updates: any = {}

      if (severity) {
        updates.severity = severity
      }

      if (status) {
        updates.status = status
      }

      if (Object.keys(updates).length === 0) {
        setError("Please select at least one property to update")
        setLoading(false)
        return
      }

      const result = await batchUpdateIssues(sessionId, selectedIssueIds, updates)

      if (result) {
        setSuccess(`Successfully updated ${selectedIssueIds.length} issues`)
        setTimeout(() => {
          setIsOpen(false)
          onComplete()
        }, 1500)
      } else {
        setError("Failed to update issues")
      }
    } catch (error) {
      console.error("Error in batch update:", error)
      setError("An error occurred while updating issues")
    } finally {
      setLoading(false)
    }
  }

  // Handle batch delete
  const handleBatchDelete = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await batchDeleteIssues(sessionId, selectedIssueIds)

      if (result) {
        setSuccess(`Successfully deleted ${selectedIssueIds.length} issues`)
        setTimeout(() => {
          setIsOpen(false)
          onComplete()
        }, 1500)
      } else {
        setError("Failed to delete issues")
      }
    } catch (error) {
      console.error("Error in batch delete:", error)
      setError("An error occurred while deleting issues")
    } finally {
      setLoading(false)
    }
  }

  // Handle batch export
  const handleBatchExport = async (format: "markdown" | "json" | "csv" | "github" | "cursor" | "notion") => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await batchExportIssues(sessionId, selectedIssueIds, format)

      if (result) {
        setSuccess(`Successfully exported ${selectedIssueIds.length} issues as ${format.toUpperCase()}`)
        setTimeout(() => {
          setIsOpen(false)
          onComplete()
        }, 1500)
      } else {
        setError("Failed to export issues")
      }
    } catch (error) {
      console.error("Error in batch export:", error)
      setError("An error occurred while exporting issues")
    } finally {
      setLoading(false)
    }
  }

  // Handle batch tag
  const handleBatchTag = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (selectedTags.length === 0) {
        setError("Please select at least one tag")
        setLoading(false)
        return
      }

      const result = await batchTagIssues(sessionId, selectedIssueIds, selectedTags, tagOperation)

      if (result) {
        setSuccess(
          `Successfully ${tagOperation === "add" ? "added" : tagOperation === "remove" ? "removed" : "set"} tags for ${selectedIssueIds.length} issues`,
        )
        setTimeout(() => {
          setIsOpen(false)
          onComplete()
        }, 1500)
      } else {
        setError("Failed to update tags")
      }
    } catch (error) {
      console.error("Error in batch tag:", error)
      setError("An error occurred while updating tags")
    } finally {
      setLoading(false)
    }
  }

  // Handle move issues
  const handleMoveIssues = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (!targetSessionId) {
        setError("Please select a target session")
        setLoading(false)
        return
      }

      const result = await moveIssuesToSession(sessionId, targetSessionId, selectedIssueIds)

      if (result) {
        setSuccess(`Successfully moved ${selectedIssueIds.length} issues to another session`)
        setTimeout(() => {
          setIsOpen(false)
          onComplete()
        }, 1500)
      } else {
        setError("Failed to move issues")
      }
    } catch (error) {
      console.error("Error in move issues:", error)
      setError("An error occurred while moving issues")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Batch Operations</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium">Selected Issues: {selectedIssueIds.length}</h3>
          </div>

          {error && (
            <div className="mb-4 flex items-center rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="mr-2 h-4 w-4" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-center rounded-md bg-green-500/10 p-3 text-sm text-green-500">
              {success}
            </div>
          )}

          <Tabs defaultValue="update">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="update">Update</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
              <TabsTrigger value="move">Move</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
              <TabsTrigger value="delete">Delete</TabsTrigger>
            </TabsList>

            <TabsContent value="update" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger id="severity">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-change">No change</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-change">No change</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" onClick={handleBatchUpdate} disabled={loading || (!severity && !status)}>
                {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <FileStack className="mr-2 h-4 w-4" />}
                Update {selectedIssueIds.length} Issues
              </Button>
            </TabsContent>

            <TabsContent value="tags" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Operation</Label>
                <Select value={tagOperation} onValueChange={(value: any) => setTagOperation(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select operation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Add Tags</SelectItem>
                    <SelectItem value="remove">Remove Tags</SelectItem>
                    <SelectItem value="set">Replace All Tags</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Selected Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.length > 0 ? (
                    selectedTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="ml-1 rounded-full p-1 hover:bg-secondary">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No tags selected</div>
                  )}
                </div>
              </div>

              <div className="flex space-x-2">
                <div className="flex-1">
                  <Input
                    placeholder="Add new tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTag()}
                  />
                </div>
                <Button variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Existing Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.length > 0 ? (
                    availableTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => selectExistingTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No existing tags found</div>
                  )}
                </div>
              </div>

              <Button className="w-full" onClick={handleBatchTag} disabled={loading || selectedTags.length === 0}>
                {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <Tag className="mr-2 h-4 w-4" />}
                {tagOperation === "add" ? "Add" : tagOperation === "remove" ? "Remove" : "Set"} Tags
              </Button>
            </TabsContent>

            <TabsContent value="move" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="target-session">Target Session</Label>
                <Select value={targetSessionId} onValueChange={setTargetSessionId}>
                  <SelectTrigger id="target-session">
                    <SelectValue placeholder="Select target session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.length > 0 ? (
                      sessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          {session.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-sessions" disabled>
                        No other sessions available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" onClick={handleMoveIssues} disabled={loading || !targetSessionId}>
                {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <MoveHorizontal className="mr-2 h-4 w-4" />}
                Move {selectedIssueIds.length} Issues
              </Button>
            </TabsContent>

            <TabsContent value="export" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleBatchExport("markdown")}
                  disabled={loading}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Markdown
                </Button>

                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleBatchExport("json")}
                  disabled={loading}
                >
                  <FileJson className="mr-2 h-4 w-4" />
                  JSON
                </Button>

                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleBatchExport("csv")}
                  disabled={loading}
                >
                  <TableIcon className="mr-2 h-4 w-4" />
                  CSV
                </Button>

                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleBatchExport("github")}
                  disabled={loading}
                >
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </Button>

                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleBatchExport("cursor")}
                  disabled={loading}
                >
                  <Cursor className="mr-2 h-4 w-4" />
                  Cursor
                </Button>

                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleBatchExport("notion")}
                  disabled={loading}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Notion
                </Button>
              </div>

              <Button className="w-full" onClick={() => handleBatchExport("markdown")} disabled={loading}>
                {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <Download className="mr-2 h-4 w-4" />}
                Export {selectedIssueIds.length} Issues
              </Button>
            </TabsContent>

            <TabsContent value="delete" className="mt-4 space-y-4">
              <div className="rounded-md bg-destructive/10 p-4 text-center">
                <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
                <h3 className="mt-2 font-medium text-destructive">Warning: This action cannot be undone</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  You are about to delete {selectedIssueIds.length} issues permanently.
                </p>
              </div>

              <Button variant="destructive" className="w-full" onClick={handleBatchDelete} disabled={loading}>
                {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <Trash className="mr-2 h-4 w-4" />}
                Delete {selectedIssueIds.length} Issues
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
