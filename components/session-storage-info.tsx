"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Database } from "lucide-react"
import type { Session } from "@/lib/types"

interface SessionStorageInfoProps {
  session: Session | null
}

export function SessionStorageInfo({ session }: SessionStorageInfoProps) {
  const [storageInfo, setStorageInfo] = useState({
    totalSize: 0,
    issuesSize: 0,
    screenshotsSize: 0,
    metadataSize: 0,
  })

  useEffect(() => {
    if (!session) return

    // Calculate approximate storage size
    const calculateStorageSize = () => {
      let issuesSize = 0
      let screenshotsSize = 0
      let metadataSize = 0

      // Calculate size of session metadata
      metadataSize = JSON.stringify(session).length * 2 // Approximate size in bytes

      // Calculate size of issues
      if (session.issues && session.issues.length > 0) {
        session.issues.forEach((issue) => {
          // Calculate issue data size without screenshot
          const issueWithoutScreenshot = { ...issue, screenshot: undefined }
          issuesSize += JSON.stringify(issueWithoutScreenshot).length * 2

          // Calculate screenshot size
          if (issue.screenshot) {
            // For data URLs, estimate size based on length
            if (issue.screenshot.startsWith("data:")) {
              // Remove the data:image/xxx;base64, prefix
              const base64 = issue.screenshot.split(",")[1]
              // Base64 encodes 3 bytes in 4 characters
              screenshotsSize += Math.ceil(base64.length * 0.75)
            } else {
              // For URLs, use a fixed size estimate
              screenshotsSize += 200 // URL length in bytes
            }
          }
        })
      }

      // Convert to KB
      const totalSize = (issuesSize + screenshotsSize + metadataSize) / 1024

      setStorageInfo({
        totalSize: Math.round(totalSize * 10) / 10, // Round to 1 decimal place
        issuesSize: Math.round((issuesSize / 1024) * 10) / 10,
        screenshotsSize: Math.round((screenshotsSize / 1024) * 10) / 10,
        metadataSize: Math.round((metadataSize / 1024) * 10) / 10,
      })
    }

    calculateStorageSize()
  }, [session])

  if (!session) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Database className="h-4 w-4" />
          Session Storage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Total Size: {storageInfo.totalSize} KB</span>
            <span>{session.issues.length} issues</span>
          </div>

          <Progress value={100} className="h-2 bg-gray-100" />

          <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
            <div>
              <div className="font-medium">Issues Data</div>
              <div>{storageInfo.issuesSize} KB</div>
            </div>
            <div>
              <div className="font-medium">Screenshots</div>
              <div>{storageInfo.screenshotsSize} KB</div>
            </div>
            <div>
              <div className="font-medium">Metadata</div>
              <div>{storageInfo.metadataSize} KB</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
