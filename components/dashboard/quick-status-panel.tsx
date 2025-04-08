"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { syncStatusTracker, type SyncStatus } from "@/lib/sync-service"
import { getStorageStats } from "@/lib/session-manager-enhanced"
import type { Issue } from "@/lib/types"
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  CloudOff,
  CloudIcon as CloudSync,
  Database,
  Zap,
  Wifi,
  WifiOff,
} from "lucide-react"

interface QuickStatusPanelProps {
  issues: Issue[]
  isOnline: boolean
  syncEnabled: boolean
}

export function QuickStatusPanel({ issues, isOnline, syncEnabled }: QuickStatusPanelProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncStatusTracker.status)
  const [lastSynced, setLastSynced] = useState<Date | null>(syncStatusTracker.lastSynced)
  const [pendingChanges, setPendingChanges] = useState<number>(syncStatusTracker.pendingChanges)
  const [storageStats, setStorageStats] = useState({ used: 0, total: 0, percent: 0 })

  // Count issues by severity
  const criticalCount = issues.filter((i) => i.severity === "critical").length
  const highCount = issues.filter((i) => i.severity === "high").length
  const mediumCount = issues.filter((i) => i.severity === "medium").length
  const lowCount = issues.filter((i) => i.severity === "low").length

  // Count issues by status
  const openCount = issues.filter((i) => i.status === "open").length
  const inProgressCount = issues.filter((i) => i.status === "in-progress").length
  const resolvedCount = issues.filter((i) => i.status === "resolved").length

  useEffect(() => {
    // Update status when it changes
    const handleStatusChange = (newStatus: SyncStatus) => {
      setSyncStatus(newStatus)
      setLastSynced(syncStatusTracker.lastSynced)
      setPendingChanges(syncStatusTracker.pendingChanges)
    }

    syncStatusTracker.addListener(handleStatusChange)

    // Get storage stats
    const fetchStorageStats = async () => {
      const stats = await getStorageStats()
      setStorageStats(stats)
    }
    fetchStorageStats()

    // Refresh storage stats every 30 seconds
    const interval = setInterval(fetchStorageStats, 30000)

    return () => {
      syncStatusTracker.removeListener(handleStatusChange)
      clearInterval(interval)
    }
  }, [])

  const getStatusDetails = () => {
    if (!isOnline) {
      return {
        icon: <WifiOff className="h-4 w-4 text-gray-500" />,
        text: "Offline",
        variant: "outline",
        tooltip: "You are currently offline. Changes will be saved locally.",
      }
    }

    if (!syncEnabled) {
      return {
        icon: <CloudOff className="h-4 w-4 text-gray-500" />,
        text: "Sync Disabled",
        variant: "outline",
        tooltip: "Cloud sync is disabled. Enable it in settings to back up your data.",
      }
    }

    switch (syncStatus) {
      case "synced":
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
          text: "Synced",
          variant: "outline",
          tooltip: lastSynced
            ? `Last synced: ${lastSynced.toLocaleTimeString()}`
            : "All changes are synced to the cloud",
        }
      case "syncing":
        return {
          icon: <CloudSync className="h-4 w-4 text-blue-500 animate-spin" />,
          text: `Syncing${pendingChanges > 0 ? ` (${pendingChanges})` : "..."}`,
          variant: "default",
          tooltip: "Syncing changes to the cloud",
        }
      case "offline":
        return {
          icon: <CloudOff className="h-4 w-4 text-gray-500" />,
          text: "Offline",
          variant: "secondary",
          tooltip: "Working offline. Changes will sync when you reconnect.",
        }
      case "error":
        return {
          icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
          text: "Sync Error",
          variant: "destructive",
          tooltip: "There was an error syncing to the cloud. Your data is saved locally.",
        }
      default:
        return {
          icon: <CloudOff className="h-4 w-4 text-gray-500" />,
          text: "Unknown",
          variant: "outline",
          tooltip: "Sync status unknown",
        }
    }
  }

  const statusDetails = getStatusDetails()

  return (
    <Card className="bg-background/60 backdrop-blur-sm">
      <CardContent className="p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant={statusDetails.variant as any}
                    className="flex items-center gap-1 h-6 px-2 cursor-help"
                  >
                    {statusDetails.icon}
                    <span className="text-xs">{statusDetails.text}</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{statusDetails.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-help">
                    <Database className="h-4 w-4 text-gray-500" />
                    <div className="text-xs text-muted-foreground">
                      {storageStats.used} / {storageStats.total} MB
                    </div>
                    <Progress
                      value={storageStats.percent}
                      className="w-16 h-2"
                      indicatorClassName={
                        storageStats.percent > 90
                          ? "bg-red-500"
                          : storageStats.percent > 70
                            ? "bg-amber-500"
                            : "bg-blue-500"
                      }
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Storage usage: {storageStats.percent}%</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-xs font-medium">{criticalCount + highCount}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {criticalCount} Critical, {highCount} High severity issues
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-medium">{mediumCount}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{mediumCount} Medium severity issues</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-xs font-medium">{lowCount}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{lowCount} Low severity issues</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="h-4 border-l border-gray-200"></div>

            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-xs font-medium">{openCount}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{openCount} Open issues</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-medium">{inProgressCount}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{inProgressCount} In Progress issues</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-xs font-medium">{resolvedCount}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{resolvedCount} Resolved issues</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="h-4 border-l border-gray-200"></div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-help">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-medium">{issues.filter((i) => i.aiSuggestion).length}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{issues.filter((i) => i.aiSuggestion).length} issues with AI suggestions</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="h-4 border-l border-gray-200"></div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-help">
                    <Wifi className="h-4 w-4 text-gray-500" />
                    <span className="text-xs font-medium">{isOnline ? "Online" : "Offline"}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{isOnline ? "Connected to the internet" : "No internet connection"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
