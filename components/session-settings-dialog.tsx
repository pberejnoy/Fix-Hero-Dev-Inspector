"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateSessionMetadata } from "@/lib/session-manager"
import type { Session } from "@/lib/types"

interface SessionSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: Session | null
  onSessionUpdated: () => void
}

export function SessionSettingsDialog({ open, onOpenChange, session, onSessionUpdated }: SessionSettingsDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Update form when session changes
  useEffect(() => {
    if (session) {
      setName(session.name || "")
      setDescription(session.description || "")
    }
  }, [session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session) return

    setIsLoading(true)

    try {
      await updateSessionMetadata(session.id, {
        name,
        description,
      })

      onSessionUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating session:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Session Settings</DialogTitle>
          <DialogDescription>Update the details for this session.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="session-name">Session Name</Label>
            <Input
              id="session-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Homepage Testing"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-description">Description (Optional)</Label>
            <Textarea
              id="session-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you testing in this session?"
              rows={3}
            />
          </div>

          <div className="text-xs text-gray-500">
            <p>Session ID: {session?.id}</p>
            <p>Created: {session ? new Date(session.startTime).toLocaleString() : ""}</p>
            <p>Issues: {session?.issues.length || 0}</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-orange-500 hover:bg-orange-600">
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
