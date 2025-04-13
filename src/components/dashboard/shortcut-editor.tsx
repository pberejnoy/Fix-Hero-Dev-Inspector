"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Keyboard, RotateCcw } from "lucide-react"
import { getShortcuts, updateShortcut, resetShortcuts, type Shortcut } from "@/lib/shortcut-service"

export function ShortcutEditor() {
  const [shortcuts, setShortcuts] = useState<Record<string, Shortcut>>({})
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null)
  const [recordingShortcut, setRecordingShortcut] = useState(false)
  const [currentShortcut, setCurrentShortcut] = useState<Shortcut | null>(null)

  // Load shortcuts on mount
  useEffect(() => {
    setShortcuts(getShortcuts())
  }, [])

  // Start recording a new shortcut
  const startRecording = (name: string) => {
    setEditingShortcut(name)
    setRecordingShortcut(true)
    setCurrentShortcut(shortcuts[name])

    // Add keyboard listener
    window.addEventListener("keydown", recordShortcut)
  }

  // Stop recording
  const stopRecording = () => {
    setRecordingShortcut(false)
    setEditingShortcut(null)

    // Remove keyboard listener
    window.removeEventListener("keydown", recordShortcut)
  }

  // Record a shortcut
  const recordShortcut = (event: KeyboardEvent) => {
    // Prevent default browser behavior
    event.preventDefault()

    // Ignore modifier keys by themselves
    if (["Control", "Shift", "Alt", "Meta"].includes(event.key)) {
      return
    }

    // Create new shortcut
    const newShortcut: Shortcut = {
      key: event.key.toUpperCase(),
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      alt: event.altKey,
      description: currentShortcut?.description || "",
    }

    // Update shortcut
    if (editingShortcut) {
      updateShortcut(editingShortcut, newShortcut)

      // Update state
      setShortcuts((prev) => ({
        ...prev,
        [editingShortcut]: newShortcut,
      }))
    }

    // Stop recording
    stopRecording()
  }

  // Update shortcut modifier
  const updateModifier = (name: string, modifier: "ctrl" | "shift" | "alt", value: boolean) => {
    const shortcut = shortcuts[name]
    if (!shortcut) return

    const updatedShortcut = {
      ...shortcut,
      [modifier]: value,
    }

    updateShortcut(name, updatedShortcut)

    // Update state
    setShortcuts((prev) => ({
      ...prev,
      [name]: updatedShortcut,
    }))
  }

  // Reset all shortcuts to defaults
  const handleResetShortcuts = () => {
    resetShortcuts()
    setShortcuts(getShortcuts())
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Keyboard Shortcuts</CardTitle>
            <CardDescription>Customize keyboard shortcuts for quick access</CardDescription>
          </div>
          <Button variant="outline" onClick={handleResetShortcuts}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(shortcuts).map(([name, shortcut]) => (
            <div key={name} className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="font-medium">{shortcut.description}</h3>
                <p className="text-sm text-muted-foreground">{name}</p>
              </div>

              <div className="flex items-center space-x-4">
                {editingShortcut === name && recordingShortcut ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-accent animate-pulse">Press any key...</span>
                    <Button variant="ghost" size="sm" onClick={stopRecording}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${name}-ctrl`}
                        checked={shortcut.ctrl}
                        onCheckedChange={(checked) => updateModifier(name, "ctrl", checked === true)}
                      />
                      <Label htmlFor={`${name}-ctrl`}>Ctrl</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${name}-shift`}
                        checked={shortcut.shift}
                        onCheckedChange={(checked) => updateModifier(name, "shift", checked === true)}
                      />
                      <Label htmlFor={`${name}-shift`}>Shift</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${name}-alt`}
                        checked={shortcut.alt}
                        onCheckedChange={(checked) => updateModifier(name, "alt", checked === true)}
                      />
                      <Label htmlFor={`${name}-alt`}>Alt</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Input value={shortcut.key} className="w-12 text-center" readOnly />
                      <Button variant="outline" size="sm" onClick={() => startRecording(name)}>
                        <Keyboard className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
