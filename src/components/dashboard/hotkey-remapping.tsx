"use client"

import type React from "react"

// This is a placeholder component for future enhancement
// It will allow users to customize keyboard shortcuts within the extension

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

interface Shortcut {
  id: string
  name: string
  description: string
  defaultKey: string
  currentKey: string
}

export function HotkeyRemapping() {
  // This would be populated from storage in a real implementation
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([
    {
      id: "mark-bug",
      name: "Mark Bug",
      description: "Start inspection mode to mark a bug",
      defaultKey: "Ctrl+Shift+M",
      currentKey: "Ctrl+Shift+M",
    },
    {
      id: "take-screenshot",
      name: "Take Screenshot",
      description: "Capture the current page",
      defaultKey: "Ctrl+Shift+S",
      currentKey: "Ctrl+Shift+S",
    },
    {
      id: "add-note",
      name: "Add Note",
      description: "Add a note to the current session",
      defaultKey: "Ctrl+Shift+N",
      currentKey: "Ctrl+Shift+N",
    },
    {
      id: "open-dashboard",
      name: "Open Dashboard",
      description: "Open the FixHero dashboard",
      defaultKey: "Ctrl+Shift+D",
      currentKey: "Ctrl+Shift+D",
    },
  ])

  const [recording, setRecording] = useState<string | null>(null)
  const [tempKey, setTempKey] = useState("")

  // This would actually save to storage in a real implementation
  const saveShortcuts = () => {
    // In a real implementation, this would:
    // 1. Save to chrome.storage.sync
    // 2. Update the background script to listen for these custom shortcuts
    alert("Shortcuts saved! (This is a placeholder - not actually saving)")
  }

  const resetToDefaults = () => {
    setShortcuts(
      shortcuts.map((shortcut) => ({
        ...shortcut,
        currentKey: shortcut.defaultKey,
      })),
    )
  }

  const startRecording = (id: string) => {
    setRecording(id)
    setTempKey("")
  }

  const stopRecording = () => {
    if (recording && tempKey) {
      setShortcuts(
        shortcuts.map((shortcut) => (shortcut.id === recording ? { ...shortcut, currentKey: tempKey } : shortcut)),
      )
    }
    setRecording(null)
    setTempKey("")
  }

  // This would be a real key listener in the implementation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault()

    if (!recording) return

    const ctrl = e.ctrlKey
    const shift = e.shiftKey
    const alt = e.altKey
    const key = e.key.toUpperCase()

    if (key === "CONTROL" || key === "SHIFT" || key === "ALT") return

    let combo = ""
    if (ctrl) combo += "Ctrl+"
    if (shift) combo += "Shift+"
    if (alt) combo += "Alt+"
    combo += key

    setTempKey(combo)
  }

  return (
    <div className="space-y-6" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Customize Keyboard Shortcuts</h2>
        <p className="text-muted-foreground">Customize the keyboard shortcuts used by FixHero Dev Inspector.</p>
      </div>

      <Alert className="bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          This is a future enhancement. Currently, you can customize shortcuts in Chrome by going to:
          <br />
          <code className="text-xs bg-background px-1 py-0.5 rounded">chrome://extensions/shortcuts</code>
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {shortcuts.map((shortcut) => (
          <div key={shortcut.id} className="rounded-md border p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor={shortcut.id}>{shortcut.name}</Label>
                <p className="text-sm text-muted-foreground">{shortcut.description}</p>
              </div>
              <div className="flex items-center justify-end gap-2">
                {recording === shortcut.id ? (
                  <>
                    <Input id={shortcut.id} value={tempKey || "Press keys..."} readOnly className="w-40 text-center" />
                    <Button size="sm" onClick={stopRecording}>
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <kbd className="inline-flex items-center justify-center rounded border border-gray-200 bg-gray-100 px-2 py-1 text-sm font-semibold text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                      {shortcut.currentKey}
                    </kbd>
                    <Button size="sm" variant="outline" onClick={() => startRecording(shortcut.id)}>
                      Change
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={resetToDefaults}>
          Reset to Defaults
        </Button>
        <Button onClick={saveShortcuts}>Save Changes</Button>
      </div>
    </div>
  )
}
