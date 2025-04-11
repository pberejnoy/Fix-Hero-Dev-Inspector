"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AsyncButton } from "@/components/ui/async-button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { getUserSettings, updateUserProfile, updateUserSettings } from "@/lib/auth-service"
import { checkStorageQuota, cleanupStorage } from "@/lib/session-manager-enhanced"
import { SubscriptionSettings } from "./subscription-settings"
import { TeamManagement } from "./team-management"
import { useTheme } from "@/components/theme-provider"
import { motion } from "framer-motion"
import type { User } from "@/lib/types"

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
}

// Declare chrome if it's not already defined (e.g., in a testing environment)
declare global {
  interface Window {
    chrome?: any
  }
}

export function SettingsDialog({ isOpen, onClose, user }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState("general")
  const [displayName, setDisplayName] = useState(user?.displayName || "")
  const [autoSync, setAutoSync] = useState(true)
  const [enableSounds, setEnableSounds] = useState(true)
  const [defaultSeverity, setDefaultSeverity] = useState("medium")
  const [storageUsage, setStorageUsage] = useState({ used: 0, quota: 0, percentUsed: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { theme, setTheme } = useTheme()

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Get user settings
        const settings = await getUserSettings()
        if (settings) {
          setAutoSync(settings.autoSync !== false) // Default to true
          setEnableSounds(settings.sounds !== false) // Default to true
          setDefaultSeverity(settings.defaultSeverity || "medium")
        }

        // Get storage usage
        const usage = await checkStorageQuota()
        setStorageUsage(usage)
      } catch (error) {
        console.error("Error loading settings:", error)
      }
    }

    if (isOpen) {
      loadSettings()
    }
  }, [isOpen])

  const handleSaveProfile = async () => {
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      await updateUserProfile(displayName)
      setSuccess("Profile updated successfully")
    } catch (error: any) {
      console.error("Error updating profile:", error)
      setError(error.message || "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      await updateUserSettings({
        theme,
        autoSync,
        sounds: enableSounds,
        defaultSeverity,
      })

      // Save sounds setting to local storage for background script
      if (typeof window !== "undefined" && window.chrome && window.chrome.storage) {
        window.chrome.storage.local.set({ fixhero_settings_sounds: enableSounds })
      }

      setSuccess("Settings updated successfully")
    } catch (error: any) {
      console.error("Error updating settings:", error)
      setError(error.message || "Failed to update settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCleanupStorage = async () => {
    setError(null)
    setSuccess(null)
    setIsCleaning(true)

    try {
      await cleanupStorage()

      // Get updated storage usage
      const usage = await checkStorageQuota()
      setStorageUsage(usage)

      setSuccess("Storage cleaned up successfully")
    } catch (error: any) {
      console.error("Error cleaning up storage:", error)
      setError(error.message || "Failed to clean up storage")
    } finally {
      setIsCleaning(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Customize your FixHero Dev Inspector experience</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="subscription" id="subscription">
              Subscription
            </TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-100">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={theme} onValueChange={(value: any) => setTheme(value)}>
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

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-sync">Auto Sync</Label>
                <p className="text-sm text-muted-foreground">Automatically sync issues across devices</p>
              </div>
              <Switch id="auto-sync" checked={autoSync} onCheckedChange={setAutoSync} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-sounds">Sound Effects</Label>
                <p className="text-sm text-muted-foreground">Play sounds for actions and notifications</p>
              </div>
              <Switch id="enable-sounds" checked={enableSounds} onCheckedChange={setEnableSounds} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-severity">Default Severity</Label>
              <Select value={defaultSeverity} onValueChange={setDefaultSeverity}>
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

            <div className="space-y-2 pt-4">
              <Label>Storage Usage</Label>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full bg-primary"
                  style={{ width: `${Math.min(storageUsage.percentUsed * 100, 100)}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(storageUsage.percentUsed * 100, 100)}%` }}
                  transition={{ duration: 1 }}
                ></motion.div>
              </div>
              <p className="text-sm text-muted-foreground">
                {(storageUsage.used / (1024 * 1024)).toFixed(2)} MB used of{" "}
                {(storageUsage.quota / (1024 * 1024)).toFixed(2)} MB
              </p>
              <AsyncButton
                variant="outline"
                onClick={handleCleanupStorage}
                isLoading={isCleaning}
                loadingText="Cleaning..."
                className="mt-2"
              >
                Clean Up Storage
              </AsyncButton>
            </div>

            <div className="pt-4">
              <AsyncButton onClick={handleSaveSettings} isLoading={isLoading} loadingText="Saving...">
                Save Settings
              </AsyncButton>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-100">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ""} disabled />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Name"
              />
            </div>

            <div className="pt-4">
              <AsyncButton onClick={handleSaveProfile} isLoading={isLoading} loadingText="Saving...">
                Update Profile
              </AsyncButton>
            </div>
          </TabsContent>

          <TabsContent value="subscription" className="py-4">
            <SubscriptionSettings />
          </TabsContent>

          <TabsContent value="team" className="py-4">
            <TeamManagement />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
