"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { FirebaseSyncStatus } from "@/components/firebase-sync-status"
import type { User } from "@/lib/types"

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
}

export function SettingsDialog({ isOpen, onClose, user }: SettingsDialogProps) {
  const [settings, setSettings] = useState({
    autoSync: true,
    notificationSounds: true,
    defaultSeverity: "medium",
    screenshotQuality: "high",
  })

  const handleChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="sync">Sync</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notification-sounds">Notification Sounds</Label>
                <p className="text-sm text-muted-foreground">Play sounds for notifications and actions</p>
              </div>
              <Switch
                id="notification-sounds"
                checked={settings.notificationSounds}
                onCheckedChange={(checked) => handleChange("notificationSounds", checked)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default-severity">Default Issue Severity</Label>
              <Select
                value={settings.defaultSeverity}
                onValueChange={(value) => handleChange("defaultSeverity", value)}
              >
                <SelectTrigger id="default-severity">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="screenshot-quality">Screenshot Quality</Label>
              <Select
                value={settings.screenshotQuality}
                onValueChange={(value) => handleChange("screenshotQuality", value)}
              >
                <SelectTrigger id="screenshot-quality">
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low (Smaller Size)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          <TabsContent value="appearance" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground">Select your preferred theme</p>
              </div>
              <ThemeToggle />
            </div>
          </TabsContent>
          <TabsContent value="sync" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-sync">Auto Sync</Label>
                <p className="text-sm text-muted-foreground">Automatically sync data with Firebase</p>
              </div>
              <Switch
                id="auto-sync"
                checked={settings.autoSync}
                onCheckedChange={(checked) => handleChange("autoSync", checked)}
                disabled={!user}
              />
            </div>
            <FirebaseSyncStatus user={user} />
          </TabsContent>
        </Tabs>
        <div className="flex justify-end">
          <Button onClick={onClose}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
