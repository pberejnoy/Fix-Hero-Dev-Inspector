"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Gauge } from "lucide-react"
import { capturePerformanceMetrics, formatBytes, formatTime, type PerformanceMetrics } from "@/lib/performance-metrics"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface PerformanceMetricsViewProps {
  url?: string
}

export function PerformanceMetricsView({ url }: PerformanceMetricsViewProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const captureMetrics = async () => {
    setLoading(true)
    setError(null)
    try {
      const newMetrics = await capturePerformanceMetrics()
      setMetrics(newMetrics)
    } catch (err) {
      console.error("Error capturing performance metrics:", err)
      setError("Failed to capture performance metrics. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Get performance score (0-100)
  const getPerformanceScore = (): number => {
    if (!metrics || !metrics.navigationTiming) return 0

    const { pageLoadTime } = metrics.navigationTiming

    // Simple scoring based on page load time
    if (pageLoadTime < 1000) return 100
    if (pageLoadTime < 2000) return 90
    if (pageLoadTime < 3000) return 80
    if (pageLoadTime < 4000) return 70
    if (pageLoadTime < 5000) return 60
    if (pageLoadTime < 6000) return 50
    if (pageLoadTime < 8000) return 40
    if (pageLoadTime < 10000) return 30
    if (pageLoadTime < 15000) return 20
    return 10
  }

  // Get score color
  const getScoreColor = (score: number): string => {
    if (score >= 90) return "text-green-500"
    if (score >= 70) return "text-yellow-500"
    if (score >= 50) return "text-orange-500"
    return "text-red-500"
  }

  // Get performance rating
  const getPerformanceRating = (score: number): string => {
    if (score >= 90) return "Excellent"
    if (score >= 70) return "Good"
    if (score >= 50) return "Average"
    if (score >= 30) return "Poor"
    return "Very Poor"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Performance Metrics</h2>
        <Button onClick={captureMetrics} disabled={loading}>
          {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <Gauge className="mr-2 h-4 w-4" />}
          Capture Metrics
        </Button>
      </div>

      {error && <div className="rounded-md bg-destructive/10 p-4 text-destructive">{error}</div>}

      {loading && !metrics && (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
          <span className="ml-2">Capturing performance metrics...</span>
        </div>
      )}

      {metrics && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className={`text-2xl font-bold ${getScoreColor(getPerformanceScore())}`}>
                    {getPerformanceScore()}
                  </div>
                  <Badge variant={getPerformanceScore() >= 70 ? "default" : "destructive"}>
                    {getPerformanceRating(getPerformanceScore())}
                  </Badge>
                </div>
                <Progress value={getPerformanceScore()} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Page Load Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.navigationTiming ? formatTime(metrics.navigationTiming.pageLoadTime) : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">From navigation start to load event end</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">First Paint</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.paintTiming ? formatTime(metrics.paintTiming.firstPaint) : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">Time until first pixel rendered</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">DOM Interactive</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.navigationTiming ? formatTime(metrics.navigationTiming.domInteractive) : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">Time until DOM is ready</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="timing">
            <TabsList>
              <TabsTrigger value="timing">Timing Breakdown</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="memory">Memory & Connection</TabsTrigger>
            </TabsList>

            <TabsContent value="timing" className="space-y-4">
              {metrics.navigationTiming && (
                <Card>
                  <CardHeader>
                    <CardTitle>Navigation Timing</CardTitle>
                    <CardDescription>Detailed breakdown of page load timing</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">DNS Lookup</p>
                          <p className="text-2xl font-bold">{formatTime(metrics.navigationTiming.dnsTime)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">TCP Connection</p>
                          <p className="text-2xl font-bold">{formatTime(metrics.navigationTiming.tcpTime)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Request Time</p>
                          <p className="text-2xl font-bold">{formatTime(metrics.navigationTiming.requestTime)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Response Time</p>
                          <p className="text-2xl font-bold">{formatTime(metrics.navigationTiming.responseTime)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">DOM Processing</p>
                          <p className="text-2xl font-bold">{formatTime(metrics.navigationTiming.domProcessingTime)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">DOM Content Loaded</p>
                          <p className="text-2xl font-bold">
                            {formatTime(metrics.navigationTiming.domContentLoadedTime)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="resources" className="space-y-4">
              {metrics.resourceTiming && metrics.resourceTiming.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Resource Timing</CardTitle>
                    <CardDescription>Performance of loaded resources</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-96 overflow-auto">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-left text-sm font-medium">Resource</th>
                            <th className="text-left text-sm font-medium">Type</th>
                            <th className="text-left text-sm font-medium">Size</th>
                            <th className="text-left text-sm font-medium">Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metrics.resourceTiming.map((resource, index) => (
                            <tr key={index} className="border-t">
                              <td className="py-2 text-sm">
                                <div className="max-w-xs truncate">{resource.name}</div>
                              </td>
                              <td className="py-2 text-sm">{resource.initiatorType}</td>
                              <td className="py-2 text-sm">
                                {resource.transferSize ? formatBytes(resource.transferSize) : "N/A"}
                              </td>
                              <td className="py-2 text-sm">{formatTime(resource.duration)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="rounded-md bg-muted p-4 text-center">No resource timing data available</div>
              )}
            </TabsContent>

            <TabsContent value="memory" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {metrics.memoryInfo && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Memory Usage</CardTitle>
                      <CardDescription>JavaScript heap memory information</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium">Used JS Heap</p>
                          <p className="text-2xl font-bold">{formatBytes(metrics.memoryInfo.usedJSHeapSize)}</p>
                          <Progress
                            value={(metrics.memoryInfo.usedJSHeapSize / metrics.memoryInfo.jsHeapSizeLimit) * 100}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Total JS Heap</p>
                          <p className="text-2xl font-bold">{formatBytes(metrics.memoryInfo.totalJSHeapSize)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">JS Heap Limit</p>
                          <p className="text-2xl font-bold">{formatBytes(metrics.memoryInfo.jsHeapSizeLimit)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {metrics.connectionInfo && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Network Information</CardTitle>
                      <CardDescription>Connection details</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium">Connection Type</p>
                          <p className="text-2xl font-bold">{metrics.connectionInfo.effectiveType}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Downlink</p>
                          <p className="text-2xl font-bold">{metrics.connectionInfo.downlink} Mbps</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Round Trip Time</p>
                          <p className="text-2xl font-bold">{metrics.connectionInfo.rtt} ms</p>
                        </div>
                        {metrics.connectionInfo.saveData && <Badge variant="outline">Data Saver Enabled</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
