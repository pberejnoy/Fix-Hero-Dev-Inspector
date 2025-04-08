"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Cloud, CloudOff, CloudIcon as CloudSync, AlertTriangle } from "lucide-react"
import { syncStatusTracker, type SyncStatus } from "@/lib/sync-service"

export function SyncStatusIndicator() {
  const [status, setStatus] = useState<SyncStatus>(syncStatusTracker.status)
  const [lastSynced, setLastSynced] = useState<Date | null>(syncStatusTracker.lastSynced)
  const [pendingChanges, setPendingChanges] = useState<number>(syncStatusTracker.pendingChanges)

  useEffect(() => {
    // Update status when it changes
    const handleStatusChange = (newStatus: SyncStatus) => {
      setStatus(newStatus)
      setLastSynced(syncStatusTracker.lastSynced)
      setPendingChanges(syncStatusTracker.pendingChanges)
    }

    syncStatusTracker.addListener(handleStatusChange)

    return () => {
      syncStatusTracker.removeListener(handleStatusChange)
    }
  }, [])

  const getStatusDetails = () => {
    switch (status) {
      case "synced":
        return {
          icon: <Cloud className="h-3 w-3" />,
          text: "Synced",
          variant: "outline",
          tooltip: lastSynced
            ? `Last synced: ${lastSynced.toLocaleTimeString()}`
            : "All changes are synced to the cloud",
        }
      case "syncing":
        return {
          icon: <CloudSync className="h-3 w-3 animate-spin" />,
          text: `Syncing${pendingChanges > 0 ? ` (${pendingChanges})` : "..."}`,
          variant: "default",
          tooltip: "Syncing changes to the cloud",
        }
      case "offline":
        return {
          icon: <CloudOff className="h-3 w-3" />,
          text: "Offline",
          variant: "secondary",
          tooltip: "Working offline. Changes will sync when you reconnect.",
        }
      case "error":
        return {
          icon: <AlertTriangle className="h-3 w-3" />,
          text: "Sync Error",
          variant: "destructive",
          tooltip: "There was an error syncing to the cloud. Your data is saved locally.",
        }
      default:
        return {
          icon: <Cloud className="h-3 w-3" />,
          text: "Unknown",
          variant: "outline",
          tooltip: "Sync status unknown",
        }
    }
  }

  const statusDetails = getStatusDetails()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={statusDetails.variant as any} className="flex items-center gap-1 h-5 px-2 cursor-help">
            {statusDetails.icon}
            <span className="text-xs">{statusDetails.text}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{statusDetails.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
