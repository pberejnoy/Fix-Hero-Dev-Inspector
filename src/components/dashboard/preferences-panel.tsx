"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getPreferences,
  updatePreferences,
  resetPreferences,
  type Preferences,
  type Theme,
  type ScreenshotQuality,
  type IssueListView,
  type ExportFormat,
} from "@/lib/preferences-service"
import { useToast } from "@/hooks/use-toast"
import { RotateCcw, Save } from "lucide-react"

export function PreferencesPanel() {
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await getPreferences()
        setPreferences(prefs)
      } catch (error) {
        console.error("Error loading preferences:", error)
        toast({
          title: "Error",
          description: "Failed to load preferences",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [toast])

  // Handle preference change
  const handlePreferenceChange = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    if (!preferences) return

    setPreferences({
      ...preferences,
      [key]: value,
    })
  }

  // Save preferences
  const handleSave = async () => {
    if (!preferences) return

    try {
      await updatePreferences(preferences)
      toast({
        title: "Success",
        description: "Preferences saved successfully",
      })
    } catch (error) {
      console.error("Error saving preferences:", error)
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive",
      })
    }
  }

  // Reset preferences
  const handleReset = async () => {
    try {
      await resetPreferences()
      const defaultPrefs = await getPreferences()
      setPreferences(defaultPrefs)
      toast({
        title: "Success",
        description: "Preferences reset to default",
      })
    } catch (error) {
      console.error("Error resetting preferences:", error)
      toast({
        title: "Error",
        description: "Failed to reset preferences",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!preferences) {
    return (
      <Card className="w-[380px]">
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to load preferences.</CardDescription>
        </CardHeader>
        <CardContent>Please try again.</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-sync">Auto Sync</Label>
              <p className="text-sm text-muted-foreground">Automatically sync issues across devices</p>
            </div>
            <Switch
              id="auto-sync"
              checked={preferences.autoSync}
              onCheckedChange={(checked) => handlePreferenceChange("autoSync", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notification-sounds">Sound Effects</Label>
              <p className="text-sm text-muted-foreground">Play sounds for actions and notifications</p>
            </div>
            <Switch
              id="notification-sounds"
              checked={preferences.notificationSounds}
              onCheckedChange={(checked) => handlePreferenceChange("notificationSounds", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="welcome-startup">Show Welcome on Startup</Label>
              <p className="text-sm text-muted-foreground">Show welcome screen when extension starts</p>
            </div>
            <Switch
              id="welcome-startup"
              checked={preferences.showWelcomeOnStartup}
              onCheckedChange={(checked) => handlePreferenceChange("showWelcomeOnStartup", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-expand-sidebar">Auto Expand Sidebar</Label>
              <p className="text-sm text-muted-foreground">Automatically expand sidebar on startup</p>
            </div>
            <Switch
              id="auto-expand-sidebar"
              checked={preferences.autoExpandSidebar}
              onCheckedChange={(checked) => handlePreferenceChange("autoExpandSidebar", checked)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="default-severity">Default Severity</Label>
            <Select
              value={preferences.defaultSeverity}
              onValueChange={(value) => handlePreferenceChange("defaultSeverity", value)}
            >
              <SelectTrigger id="default-severity">
                <SelectValue placeholder="Select default severity" />
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
            <Label htmlFor="export-format">Default Export Format</Label>
            <Select
              value={preferences.exportFormat}
              onValueChange={(value) => handlePreferenceChange("exportFormat", value as ExportFormat)}
            >
              <SelectTrigger id="export-format">
                <SelectValue placeholder="Select export format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="markdown">Markdown</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="github">GitHub Issue</SelectItem>
                <SelectItem value="cursor">Cursor</SelectItem>
                <SelectItem value="notion">Notion</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
        <TabsContent value="appearance" className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={preferences.theme}
              onValueChange={(value) => handlePreferenceChange("theme", value as Theme)}
            >
              <SelectTrigger id="theme">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="issue-list-view">Issue List View</Label>
            <Select
              value={preferences.issueListView}
              onValueChange={(value) => handlePreferenceChange("issueListView", value as IssueListView)}
            >
              <SelectTrigger id="issue-list-view">
                <SelectValue placeholder="Select issue list view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="list">List</SelectItem>
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="highlight-color">Inspection Highlight Color</Label>
            <div className="flex gap-2">
              <input
                id="highlight-color"
                type="color"
                value={preferences.inspectionHighlightColor}
                onChange={(e) => handlePreferenceChange("inspectionHighlightColor", e.target.value)}
                className="w-12 h-10 p-1"
              />
              <input
                type="text"
                value={preferences.inspectionHighlightColor}
                onChange={(e) => handlePreferenceChange("inspectionHighlightColor", e.target.value)}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="screenshot-quality">Screenshot Quality</Label>
            <Select
              value={preferences.screenshotQuality}
              onValueChange={(value) => handlePreferenceChange("screenshotQuality", value as ScreenshotQuality)}
            >
              <SelectTrigger id="screenshot-quality">
                <SelectValue placeholder="Select screenshot quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (Faster)</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High (Better Quality)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
        <TabsContent value="advanced" className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="keyboard-screenshot">Take Screenshot Shortcut</Label>
            <input
              id="keyboard-screenshot"
              value={preferences.keyboardShortcuts.takeScreenshot}
              onChange={(e) =>
                handlePreferenceChange("keyboardShortcuts", {
                  ...preferences.keyboardShortcuts,
                  takeScreenshot: e.target.value,
                })
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Ctrl+Shift+S"
            />
            <p className="text-xs text-muted-foreground">
              Note: Custom shortcuts require configuration in chrome://extensions/shortcuts
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="keyboard-note">Add Note Shortcut</Label>
            <input
              id="keyboard-note"
              value={preferences.keyboardShortcuts.addNote}
              onChange={(e) =>
                handlePreferenceChange("keyboardShortcuts", {
                  ...preferences.keyboardShortcuts,
                  addNote: e.target.value,
                })
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Ctrl+Shift+N"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="keyboard-sidebar">Toggle Sidebar Shortcut</Label>
            <input
              id="keyboard-sidebar"
              value={preferences.keyboardShortcuts.toggleSidebar}
              onChange={(e) =>
                handlePreferenceChange("keyboardShortcuts", {
                  ...preferences.keyboardShortcuts,
                  toggleSidebar: e.target.value,
                })
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Ctrl+Shift+D"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="keyboard-dashboard">Open Dashboard Shortcut</Label>
            <input
              id="keyboard-dashboard"
              value={preferences.keyboardShortcuts.openDashboard}
              onChange={(e) =>
                handlePreferenceChange("keyboardShortcuts", {
                  ...preferences.keyboardShortcuts,
                  openDashboard: e.target.value,
                })
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Ctrl+Shift+M"
            />
          </div>
        </TabsContent>
      </Tabs>
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleReset} disabled={isLoading}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to Defaults
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}
