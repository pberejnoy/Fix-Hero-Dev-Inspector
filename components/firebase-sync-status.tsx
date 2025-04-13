"use client"

import { useState, useEffect } from "react"
import { subscribeSyncStatus, forceSync, type SyncStatus } from "@/lib/sync-service"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Cloud, RefreshCw, AlertCircle, CheckCircle } from "lucide-react"

export function FirebaseSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle")
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    // Subscribe to sync status changes
    const unsubscribe = subscribeSyncStatus((status, time, error) => {
      setSyncStatus(status)
      setLastSyncTime(time)
      setSyncError(error)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const handleManualSync = async () => {
    if (isSyncing) return

    setIsSyncing(true)
    try {
      await forceSync()
    } catch (error) {
      console.error("Manual sync failed:", error)
    } finally {
      setIsSyncing(false)
    }
  }

  // Format the last sync time
  const formattedTime = lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : "Never"

  // Determine the status icon and color
  let StatusIcon = Cloud
  let statusColor = "text-gray-400"
  let statusText = "Not synced"

  if (syncStatus === "syncing" || isSyncing) {
    StatusIcon = RefreshCw
    statusColor = "text-blue-500"
    statusText = "Syncing..."
  } else if (syncStatus === "success") {
    StatusIcon = CheckCircle
    statusColor = "text-green-500"
    statusText = `Synced at ${formattedTime}`
  } else if (syncStatus === "error") {
    StatusIcon = AlertCircle
    statusColor = "text-red-500"
    statusText = "Sync failed"
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1 ${statusColor}`}>
              <StatusIcon className="h-4 w-4" />
              <span className="hidden md:inline">{statusText}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p>
                <strong>Status:</strong> {statusText}
              </p>
              {syncError && (
                <p>
                  <strong>Error:</strong> {syncError}
                </p>
              )}
              <p className="text-xs text-gray-500">Click to sync manually</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleManualSync} disabled={isSyncing}>
        <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
        <span className="sr-only">Sync now</span>
      </Button>
    </div>
  )
}
