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
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSettings, saveSettings } from "@/lib/session-manager-enhanced"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [settings, setSettings] = useState({
    maxSessionsCount: 10,
    maxIssuesPerSession: 100,
    storageWarningThreshold: 80, // Convert from 0.8 to 80 for UI
    autoCleanupEnabled: true,
    syncEnabled: true,
    autoTaggingEnabled: true,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const loadedSettings = await getSettings()
        setSettings({
          ...loadedSettings,
          storageWarningThreshold: loadedSettings.storageWarningThreshold * 100, // Convert to percentage for UI
        })
      } catch (error) {
        console.error("Error loading settings:", error)
        toast({
          title: "Error loading settings",
          description: "Failed to load your settings. Default values will be used.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (open) {
      loadSettings()
    }
  }, [open, toast])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveSettings({
        ...settings,
        storageWarningThreshold: settings.storageWarningThreshold / 100, // Convert back to decimal
      })
      toast({
        title: "Settings saved",
        description: "Your settings have been saved successfully.",
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error saving settings",
        description: "Failed to save your settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Configure FixHero Dev Inspector settings</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="storage">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="storage">Storage</TabsTrigger>
            <TabsTrigger value="sync">Cloud Sync</TabsTrigger>
            <TabsTrigger value="ai">AI Features</TabsTrigger>
          </TabsList>

          <TabsContent value="storage" className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="max-sessions">Maximum Sessions</Label>
                  <span className="text-sm">{settings.maxSessionsCount}</span>
                </div>
                <Slider
                  id="max-sessions"
                  min={5}
                  max={20}
                  step={1}
                  value={[settings.maxSessionsCount]}
                  onValueChange={(value) => setSettings({ ...settings, maxSessionsCount: value[0] })}
                />
                <p className="text-xs text-muted-foreground">
                  Oldest sessions will be automatically removed when this limit is reached.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="max-issues">Maximum Issues per Session</Label>
                  <span className="text-sm">{settings.maxIssuesPerSession}</span>
                </div>
                <Slider
                  id="max-issues"
                  min={50}
                  max={200}
                  step={10}
                  value={[settings.maxIssuesPerSession]}
                  onValueChange={(value) => setSettings({ ...settings, maxIssuesPerSession: value[0] })}
                />
                <p className="text-xs text-muted-foreground">
                  Oldest issues will be automatically removed when this limit is reached.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="warning-threshold">Storage Warning Threshold</Label>
                  <span className="text-sm">{settings.storageWarningThreshold}%</span>
                </div>
                <Slider
                  id="warning-threshold"
                  min={50}
                  max={95}
                  step={5}
                  value={[settings.storageWarningThreshold]}
                  onValueChange={(value) => setSettings({ ...settings, storageWarningThreshold: value[0] })}
                />
                <p className="text-xs text-muted-foreground">
                  Show a warning when storage usage exceeds this percentage.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-cleanup"
                  checked={settings.autoCleanupEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoCleanupEnabled: checked })}
                />
                <Label htmlFor="auto-cleanup">Enable automatic storage cleanup</Label>
              </div>
              <p className="text-xs text-muted-foreground pl-7">
                Automatically remove old sessions when storage is running low.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="sync" className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="sync-enabled"
                  checked={settings.syncEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, syncEnabled: checked })}
                />
                <Label htmlFor="sync-enabled">Enable cloud synchronization</Label>
              </div>
              <p className="text-xs text-muted-foreground pl-7">
                Automatically sync your sessions and issues to the cloud for backup and access across devices.
              </p>

              <div className="rounded-md bg-muted p-4">
                <p className="text-sm">Cloud sync features:</p>
                <ul className="list-disc pl-5 text-xs space-y-1 mt-2">
                  <li>Automatic background sync of all sessions and issues</li>
                  <li>Work offline and sync when you reconnect</li>
                  <li>Access your data across multiple devices</li>
                  <li>Secure backup of all your captured issues</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-tagging"
                  checked={settings.autoTaggingEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoTaggingEnabled: checked })}
                />
                <Label htmlFor="auto-tagging">Enable AI auto-tagging</Label>
              </div>
              <p className="text-xs text-muted-foreground pl-7">
                Use AI to automatically suggest tags for your captured issues.
              </p>

              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-analysis"
                  checked={settings.autoAnalysisEnabled || false}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoAnalysisEnabled: checked })}
                />
                <Label htmlFor="auto-analysis">Enable automatic issue analysis</Label>
              </div>
              <p className="text-xs text-muted-foreground pl-7">
                Automatically analyze issues to determine severity and suggest fixes.
              </p>

              <div className="rounded-md bg-muted p-4">
                <p className="text-sm">AI features:</p>
                <ul className="list-disc pl-5 text-xs space-y-1 mt-2">
                  <li>Automatic tag suggestions based on issue content</li>
                  <li>AI-powered issue analysis and severity assessment</li>
                  <li>Suggested fixes for common problems</li>
                  <li>Privacy-focused: Your data is processed securely</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
