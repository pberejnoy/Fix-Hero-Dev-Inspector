"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getStorageStats, getSettings } from "@/lib/session-manager"
import { Database, HardDrive } from "lucide-react"

export function StorageStats() {
  const [stats, setStats] = useState({ used: 0, total: 0, percent: 0 })
  const [settings, setSettings] = useState({
    maxSessionsCount: 5,
    maxIssuesPerSession: 50,
    storageWarningThreshold: 0.8,
  })

  useEffect(() => {
    const fetchStats = async () => {
      const storageStats = await getStorageStats()
      setStats(storageStats)

      const appSettings = await getSettings()
      setSettings(appSettings)
    }

    fetchStats()

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000)

    return () => clearInterval(interval)
  }, [])

  // Calculate warning level based on usage percentage
  const getWarningLevel = () => {
    if (stats.percent >= 90) return "destructive"
    if (stats.percent >= settings.storageWarningThreshold * 100) return "warning"
    return "default"
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Database className="h-4 w-4" />
          Storage Usage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Used: {stats.used} MB</span>
            <span>{stats.percent}%</span>
          </div>

          <Progress
            value={stats.percent}
            className={`h-2 ${
              getWarningLevel() === "destructive"
                ? "bg-red-100"
                : getWarningLevel() === "warning"
                  ? "bg-amber-100"
                  : "bg-gray-100"
            }`}
            indicatorClassName={
              getWarningLevel() === "destructive"
                ? "bg-red-500"
                : getWarningLevel() === "warning"
                  ? "bg-amber-500"
                  : "bg-blue-500"
            }
          />

          <div className="flex justify-between items-center text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <HardDrive className="h-3 w-3" />
              <span>Total: {stats.total} MB</span>
            </div>

            {getWarningLevel() !== "default" && (
              <span className={`text-xs ${getWarningLevel() === "destructive" ? "text-red-500" : "text-amber-500"}`}>
                {getWarningLevel() === "destructive" ? "Critical storage level" : "Storage running low"}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
