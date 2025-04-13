"use client"

import { useEffect } from "react"
import { Camera, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { KeyboardShortcut } from "@/components/ui/keyboard-shortcut"
import { IconState } from "@/lib/icon-service"

type InspectorProps = {
  isInspecting: boolean
  startInspection: () => void
  stopInspection: () => void
  onTakeScreenshot: () => void
  onFindProblems: () => void
  onFindSlowElements: () => void
  onAddNote: () => void
}

export function Inspector({
  isInspecting,
  startInspection,
  stopInspection,
  onTakeScreenshot,
  onFindProblems,
  onFindSlowElements,
  onAddNote,
}: InspectorProps) {
  // Update icon when inspection state changes
  useEffect(() => {
    // Check if we're in a Chrome extension environment
    const isExtensionEnvironment =
      typeof window !== "undefined" &&
      typeof window.chrome !== "undefined" &&
      window.chrome.runtime &&
      window.chrome.runtime.id

    if (isExtensionEnvironment) {
      if (isInspecting) {
        // Update icon to inspecting state
        window.chrome.runtime.sendMessage({
          action: "updateIcon",
          state: IconState.INSPECTING,
        })

        // Also update context menus
        window.chrome.runtime.sendMessage({
          action: "updateContextMenus",
          isInspecting: true,
        })
      } else {
        // Update icon to default state
        window.chrome.runtime.sendMessage({
          action: "updateIcon",
          state: IconState.DEFAULT,
        })

        // Also update context menus
        window.chrome.runtime.sendMessage({
          action: "updateContextMenus",
          isInspecting: false,
        })
      }
    }
  }, [isInspecting])

  return (
    <div className="flex flex-col space-y-2">
      <KeyboardShortcut shortcut="Ctrl+Shift+M">
        <Button
          variant={isInspecting ? "destructive" : "default"}
          className={`w-full justify-start ${!isInspecting ? "bg-orange-500 hover:bg-orange-600" : ""}`}
          onClick={isInspecting ? stopInspection : startInspection}
        >
          <Search className="mr-2 h-4 w-4" />
          {isInspecting ? "Stop Inspecting" : "Inspect Element"}
        </Button>
      </KeyboardShortcut>

      <KeyboardShortcut shortcut="Ctrl+Shift+S">
        <Button variant="outline" className="w-full justify-start" onClick={onTakeScreenshot}>
          <Camera className="mr-2 h-4 w-4" />
          Take Screenshot
        </Button>
      </KeyboardShortcut>

      <KeyboardShortcut shortcut="Ctrl+Shift+N">
        <Button variant="outline" className="w-full justify-start" onClick={onAddNote}>
          <Plus className="mr-2 h-4 w-4" />
          Add Note
        </Button>
      </KeyboardShortcut>
    </div>
  )
}
