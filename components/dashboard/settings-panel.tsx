"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Keyboard, Zap, Cloud, Shield } from "lucide-react"

export function SettingsPanel() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  
  // General settings
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [autoTaggingEnabled, setAutoTaggingEnabled] = useState(true)
  const [autoAnalysisEnabled, setAutoAnalysisEnabled] = useState(true)
  const [maxSessionsCount, setMaxSessionsCount] = useState(10)
  const [maxIssuesPerSession, setMaxIssuesPerSession] = useState(100)
  
  // Hotkeys settings
  const [inspectHotkey, setInspectHotkey] = useState("Ctrl+Alt+I")
  const [screenshotHotkey, setScreenshotHotkey] = useState("Ctrl+Alt+S")
  const [noteHotkey, setNoteHotkey] = useState("Ctrl+Alt+N")
  const [dashboardHotkey, setDashboardHotkey] = useState("Ctrl+Alt+D")
  
  // AI settings
  const [aiModel, setAiModel] = useState("gpt-4o")
  const [aiTemperature, setAiTemperature] = useState(0.7)
  const [aiMaxTokens, setAiMaxTokens] = useState(1000)
  
  // Cloud settings
  const [syncEnabled, setSyncEnabled] = useState(true)
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true)
  const [syncInterval, setSyncInterval] = useState(60)
  
  // Security settings
  const [maskSensitiveData, setMaskSensitiveData] = useState(true)
  const [linkExpirationDays, setLinkExpirationDays] = useState(7)
  const [requireAuthentication, setRequireAuthentication] = useState(false)
  
  const handleSaveSettings = () => {
    setIsLoading(true)
    
    // Simulate saving settings
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Settings saved",
        description: "Your settings have been saved successfully",
      })
    }, 1000)
  }
  
  const handleResetSettings = () => {
    if (confirm("Are you sure you want to reset all settings to default values?")) {
      // Reset to defaults
      setAutoSaveEnabled(true)
      setAutoTaggingEnabled(true)
      setAutoAnalysisEnabled(true)
      setMaxSessionsCount(10)
      setMaxIssuesPerSession(100)
      setInspectHotkey("Ctrl+Alt+I")
      setScreenshotHotkey("Ctrl+Alt+S")
      setNoteHotkey("Ctrl+Alt+N")
      setDashboardHotkey("Ctrl+Alt+D")
      setAiModel("gpt-4o")
      setAiTemperature(0.7)
      setAiMaxTokens(1000)
      setSyncEnabled(true)
      setAutoSyncEnabled(true)
      setSyncInterval(60)
      setMaskSensitiveData(true)
      setLinkExpirationDays(7)
      setRequireAuthentication(false)
      
      toast({
        title: "Settings reset",
        description: "All settings have been reset to default values",
      })
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Configure FixHero Dev Inspector to match your workflow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="hotkeys" className="flex items-center gap-1">
                <Keyboard className="h-4 w-4" />
                Hotkeys
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                AI
              </TabsTrigger>
              <TabsTrigger value="cloud" className="flex items-center gap-1">
                <Cloud className="h-4 w-4" />
                Cloud
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-save issues</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically save issues when they are captured
                    </p>
                  </div>
                  <Switch 
                    checked={autoSaveEnabled} 
                    onCheckedChange={setAutoSaveEnabled}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>AI auto-tagging</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically tag issues using AI
                    </p>
                  </div>
                  <Switch 
                

\
Now, let's create the Share Dialog component for generating shareable links:
