"use client"

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
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { Keyboard, Save, RefreshCw } from "lucide-react"

interface KeyboardShortcut {
  id: string
  name: string
  description: string
  defaultShortcut: string
  currentShortcut: string
}

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([])
  const [isRecording, setIsRecording] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Load shortcuts from localStorage or use defaults
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedShortcuts = localStorage.getItem("fixhero_keyboard_shortcuts")

      if (savedShortcuts) {
        setShortcuts(JSON.parse(savedShortcuts))
      } else {
        // Default shortcuts
        setShortcuts([
          {
            id: "inspect",
            name: "Start/Stop Inspection",
            description: "Toggle element inspection mode",
            defaultShortcut: "Ctrl+Shift+I",
            currentShortcut: "Ctrl+Shift+I",
          },
          {
            id: "screenshot",
            name: "Take Screenshot",
            description: "Capture a screenshot of the current page",
            defaultShortcut: "Ctrl+Shift+S",
            currentShortcut: "Ctrl+Shift+S",
          },
          {
            id: "note",
            name: "Add Note",
            description: "Add a note to the current session",
            defaultShortcut: "Ctrl+Shift+N",
            currentShortcut: "Ctrl+Shift+N",
          },
          {
            id: "dashboard",
            name: "Open Dashboard",
            description: "Open the FixHero dashboard",
            defaultShortcut: "Ctrl+Shift+D",
            currentShortcut: "Ctrl+Shift+D",
          },
          {
            id: "export",
            name: "Quick Export",
            description: "Export the current session to Markdown",
            defaultShortcut: "Ctrl+Shift+E",
            currentShortcut: "Ctrl+Shift+E",
          },
          {
            id: "sidebar",
            name: "Toggle Sidebar",
            description: "Show or hide the sidebar",
            defaultShortcut: "Ctrl+Shift+B",
            currentShortcut: "Ctrl+Shift+B",
          },
          {
            id: "ai-summary",
            name: "Generate AI Summary",
            description: "Generate an AI summary for the selected issue",
            defaultShortcut: "Ctrl+Shift+A",
            currentShortcut: "Ctrl+Shift+A",
          },
          {
            id: "search",
            name: "Quick Search",
            description: "Focus the search input",
            defaultShortcut: "Ctrl+Shift+F",
            currentShortcut: "Ctrl+Shift+F",
          },
        ])
      }
    }
  }, [])

  // Save shortcuts to localStorage when they change
  useEffect(() => {
    if (typeof window !== "undefined" && shortcuts.length > 0) {
      localStorage.setItem("fixhero_keyboard_shortcuts", JSON.stringify(shortcuts))
    }
  }, [shortcuts])

  // Handle key recording
  useEffect(() => {
    if (!isRecording) return

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()

      // Don't record single modifier keys
      if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) {
        return
      }

      let shortcut = ""
      if (e.ctrlKey) shortcut += "Ctrl+"
      if (e.shiftKey) shortcut += "Shift+"
      if (e.altKey) shortcut += "Alt+"
      if (e.metaKey) shortcut += "Meta+"

      // Add the main key
      shortcut += e.key.length === 1 ? e.key.toUpperCase() : e.key

      // Update the shortcut
      setShortcuts(shortcuts.map((s) => (s.id === isRecording ? { ...s, currentShortcut: shortcut } : s)))

      // Stop recording
      setIsRecording(null)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isRecording, shortcuts])

  const handleStartRecording = (id: string) => {
    setIsRecording(id)
  }

  const handleResetToDefault = (id: string) => {
    setShortcuts(shortcuts.map((s) => (s.id === id ? { ...s, currentShortcut: s.defaultShortcut } : s)))
  }

  const handleResetAll = () => {
    setShortcuts(shortcuts.map((s) => ({ ...s, currentShortcut: s.defaultShortcut })))
    toast({
      title: "Shortcuts reset",
      description: "All keyboard shortcuts have been reset to their defaults",
    })
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      // In a real implementation, this would save to the server or extension storage
      // For now, we'll just simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Check for duplicate shortcuts
      const shortcutMap = new Map<string, string>()
      let hasDuplicates = false

      shortcuts.forEach((s) => {
        if (shortcutMap.has(s.currentShortcut)) {
          hasDuplicates = true
        }
        shortcutMap.set(s.currentShortcut, s.id)
      })

      if (hasDuplicates) {
        toast({
          title: "Duplicate shortcuts",
          description: "Some shortcuts are assigned to multiple actions. Please make each shortcut unique.",
          variant: "destructive",
        })
        return
      }

      // Save to localStorage (already done via useEffect)

      toast({
        title: "Shortcuts saved",
        description: "Your keyboard shortcuts have been updated",
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error saving shortcuts:", error)
      toast({
        title: "Error saving shortcuts",
        description: "Failed to save keyboard shortcuts",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>Customize keyboard shortcuts for FixHero Dev Inspector</DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {shortcuts.map((shortcut) => (
              <div key={shortcut.id} className="grid grid-cols-[1fr,auto] gap-4 items-center">
                <div>
                  <Label className="font-medium">{shortcut.name}</Label>
                  <p className="text-sm text-muted-foreground">{shortcut.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStartRecording(shortcut.id)}
                    className={isRecording === shortcut.id ? "border-primary" : ""}
                  >
                    {isRecording === shortcut.id ? "Press keys..." : shortcut.currentShortcut}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleResetToDefault(shortcut.id)}
                    disabled={shortcut.currentShortcut === shortcut.defaultShortcut}
                    title="Reset to default"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleResetAll}>
            Reset All to Defaults
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Shortcuts
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
