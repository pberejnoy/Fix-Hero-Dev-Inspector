// Performance metrics service for FixHero Dev Inspector

export interface PerformanceMetrics {
  url: string
  timestamp: number
  navigationTiming?: NavigationTiming
  resourceTiming?: ResourceTiming[]
  paintTiming?: PaintTiming
  memoryInfo?: MemoryInfo
  connectionInfo?: ConnectionInfo
}

export interface NavigationTiming {
  fetchStart: number
  domainLookupStart: number
  domainLookupEnd: number
  connectStart: number
  connectEnd: number
  requestStart: number
  responseStart: number
  responseEnd: number
  domInteractive: number
  domContentLoadedEventStart: number
  domContentLoadedEventEnd: number
  domComplete: number
  loadEventStart: number
  loadEventEnd: number
  // Calculated metrics
  dnsTime: number
  tcpTime: number
  requestTime: number
  responseTime: number
  domProcessingTime: number
  domContentLoadedTime: number
  domCompleteTime: number
  pageLoadTime: number
}

export interface ResourceTiming {
  name: string
  entryType: string
  startTime: number
  duration: number
  initiatorType: string
  size?: number
  transferSize?: number
  encodedBodySize?: number
  decodedBodySize?: number
}

export interface PaintTiming {
  firstPaint: number
  firstContentfulPaint: number
}

export interface MemoryInfo {
  jsHeapSizeLimit: number
  totalJSHeapSize: number
  usedJSHeapSize: number
}

export interface ConnectionInfo {
  effectiveType: string
  downlink: number
  rtt: number
  saveData: boolean
}

// Capture performance metrics for the current page
export async function capturePerformanceMetrics(): Promise<PerformanceMetrics> {
  const metrics: PerformanceMetrics = {
    url: window.location.href,
    timestamp: Date.now(),
  }

  // Navigation Timing
  const navigationTiming = getNavigationTiming()
  if (navigationTiming) {
    metrics.navigationTiming = navigationTiming
  }

  // Resource Timing
  const resourceTiming = getResourceTiming()
  if (resourceTiming && resourceTiming.length > 0) {
    metrics.resourceTiming = resourceTiming
  }

  // Paint Timing
  const paintTiming = getPaintTiming()
  if (paintTiming) {
    metrics.paintTiming = paintTiming
  }

  // Memory Info
  const memoryInfo = getMemoryInfo()
  if (memoryInfo) {
    metrics.memoryInfo = memoryInfo
  }

  // Connection Info
  const connectionInfo = getConnectionInfo()
  if (connectionInfo) {
    metrics.connectionInfo = connectionInfo
  }

  return metrics
}

// Get navigation timing metrics
function getNavigationTiming(): NavigationTiming | null {
  const performance = window.performance
  if (!performance || !performance.timing) {
    return null
  }

  const timing = performance.timing

  // Calculate metrics
  const dnsTime = timing.domainLookupEnd - timing.domainLookupStart
  const tcpTime = timing.connectEnd - timing.connectStart
  const requestTime = timing.responseStart - timing.requestStart
  const responseTime = timing.responseEnd - timing.responseStart
  const domProcessingTime = timing.domComplete - timing.responseEnd
  const domContentLoadedTime = timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart
  const domCompleteTime = timing.domComplete - timing.domInteractive
  const pageLoadTime = timing.loadEventEnd - timing.navigationStart

  return {
    fetchStart: timing.fetchStart,
    domainLookupStart: timing.domainLookupStart,
    domainLookupEnd: timing.domainLookupEnd,
    connectStart: timing.connectStart,
    connectEnd: timing.connectEnd,
    requestStart: timing.requestStart,
    responseStart: timing.responseStart,
    responseEnd: timing.responseEnd,
    domInteractive: timing.domInteractive,
    domContentLoadedEventStart: timing.domContentLoadedEventStart,
    domContentLoadedEventEnd: timing.domContentLoadedEventEnd,
    domComplete: timing.domComplete,
    loadEventStart: timing.loadEventStart,
    loadEventEnd: timing.loadEventEnd,
    // Calculated metrics
    dnsTime,
    tcpTime,
    requestTime,
    responseTime,
    domProcessingTime,
    domContentLoadedTime,
    domCompleteTime,
    pageLoadTime,
  }
}

// Get resource timing metrics
function getResourceTiming(): ResourceTiming[] | null {
  const performance = window.performance
  if (!performance || !performance.getEntriesByType) {
    return null
  }

  const resources = performance.getEntriesByType("resource")
  if (!resources || resources.length === 0) {
    return null
  }

  return resources.map((resource) => ({
    name: resource.name,
    entryType: resource.entryType,
    startTime: resource.startTime,
    duration: resource.duration,
    initiatorType: resource.initiatorType,
    size: (resource as any).transferSize || 0,
    transferSize: (resource as any).transferSize,
    encodedBodySize: (resource as any).encodedBodySize,
    decodedBodySize: (resource as any).decodedBodySize,
  }))
}

// Get paint timing metrics
function getPaintTiming(): PaintTiming | null {
  const performance = window.performance
  if (!performance || !performance.getEntriesByType) {
    return null
  }

  const paintEntries = performance.getEntriesByType("paint")
  if (!paintEntries || paintEntries.length === 0) {
    return null
  }

  let firstPaint = 0
  let firstContentfulPaint = 0

  paintEntries.forEach((entry) => {
    if (entry.name === "first-paint") {
      firstPaint = entry.startTime
    } else if (entry.name === "first-contentful-paint") {
      firstContentfulPaint = entry.startTime
    }
  })

  if (firstPaint === 0 && firstContentfulPaint === 0) {
    return null
  }

  return {
    firstPaint,
    firstContentfulPaint,
  }
}

// Get memory info
function getMemoryInfo(): MemoryInfo | null {
  const performance = window.performance as any
  if (!performance || !performance.memory) {
    return null
  }

  return {
    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
    totalJSHeapSize: performance.memory.totalJSHeapSize,
    usedJSHeapSize: performance.memory.usedJSHeapSize,
  }
}

// Get connection info
function getConnectionInfo(): ConnectionInfo | null {
  const navigator = window.navigator as any
  if (!navigator || !navigator.connection) {
    return null
  }

  const connection = navigator.connection
  return {
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData,
  }
}

// Format bytes to human-readable format
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

// Format milliseconds to human-readable format
export function formatTime(ms: number): string {
  if (ms < 1) return "< 1ms"
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}
