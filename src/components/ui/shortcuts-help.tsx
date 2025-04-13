"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Keyboard } from "lucide-react"

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Keyboard Shortcuts">
          <Keyboard className="h-4 w-4" />
          <span className="sr-only">Keyboard Shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>Use these keyboard shortcuts to quickly access FixHero features.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <h3 className="font-medium">Mark Bug</h3>
              <p className="text-sm text-muted-foreground">Start inspection mode</p>
            </div>
            <div className="flex items-center justify-end">
              <kbd className="inline-flex items-center justify-center rounded border border-gray-200 bg-gray-100 px-2 py-1 text-sm font-semibold text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                Ctrl+Shift+M
              </kbd>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <h3 className="font-medium">Take Screenshot</h3>
              <p className="text-sm text-muted-foreground">Capture the current page</p>
            </div>
            <div className="flex items-center justify-end">
              <kbd className="inline-flex items-center justify-center rounded border border-gray-200 bg-gray-100 px-2 py-1 text-sm font-semibold text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                Ctrl+Shift+S
              </kbd>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <h3 className="font-medium">Add Note</h3>
              <p className="text-sm text-muted-foreground">Add a note to the current session</p>
            </div>
            <div className="flex items-center justify-end">
              <kbd className="inline-flex items-center justify-center rounded border border-gray-200 bg-gray-100 px-2 py-1 text-sm font-semibold text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                Ctrl+Shift+N
              </kbd>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <h3 className="font-medium">Open Dashboard</h3>
              <p className="text-sm text-muted-foreground">Open the FixHero dashboard</p>
            </div>
            <div className="flex items-center justify-end">
              <kbd className="inline-flex items-center justify-center rounded border border-gray-200 bg-gray-100 px-2 py-1 text-sm font-semibold text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                Ctrl+Shift+D
              </kbd>
            </div>
          </div>
        </div>
        <div className="mt-2 rounded-md bg-muted p-3 text-xs">
          <p>
            You can customize these shortcuts in Chrome by going to:
            <br />
            <code className="bg-background px-1 py-0.5 rounded">chrome://extensions/shortcuts</code>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
