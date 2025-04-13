console.log("FixHero Dev Inspector: Local development content script loaded")

// Initialize local development specific features
function initLocalDevFeatures() {
  // Add local development specific features
  addConsoleErrorTracking()
  addNetworkRequestTracking()
  addPerformanceMonitoring()
  addLocalStorageInspection()
  addReactDevToolsIntegration()
}

// Add console error tracking
function addConsoleErrorTracking() {
  // Override console.error to capture errors
  const originalConsoleError = console.error
  console.error = (...args) => {
    // Send error to background script
    chrome.runtime.sendMessage({
      action: "consoleError",
      error: args.map((arg) => String(arg)).join(" "),
      url: window.location.href,
      timestamp: Date.now(),
    })

    // Call original console.error
    originalConsoleError.apply(console, args)
  }

  // Capture unhandled errors
  window.addEventListener("error", (event) => {
    chrome.runtime.sendMessage({
      action: "unhandledError",
      error: {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack || "",
      },
      url: window.location.href,
      timestamp: Date.now(),
    })
  })

  // Capture unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    chrome.runtime.sendMessage({
      action: "unhandledRejection",
      error: {
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack || "",
      },
      url: window.location.href,
      timestamp: Date.now(),
    })
  })
}

// Add network request tracking
function addNetworkRequestTracking() {
  // Override fetch
  const originalFetch = window.fetch
  window.fetch = async function (...args) {
    const startTime = performance.now()
    const url = typeof args[0] === "string" ? args[0] : args[0].url

    try {
      const response = await originalFetch.apply(this, args)
      const endTime = performance.now()

      // Only track requests to the same origin or if it's a relative URL
      if (url.startsWith("/") || url.startsWith(window.location.origin)) {
        // Send successful request to background script
        chrome.runtime.sendMessage({
          action: "networkRequest",
          request: {
            url,
            method: args[1]?.method || "GET",
            status: response.status,
            statusText: response.statusText,
            duration: endTime - startTime,
            type: "fetch",
            success: response.ok,
          },
          timestamp: Date.now(),
        })
      }

      return response
    } catch (error) {
      const endTime = performance.now()

      // Send failed request to background script
      chrome.runtime.sendMessage({
        action: "networkError",
        error: {
          url,
          method: args[1]?.method || "GET",
          message: error.message,
          type: "fetch",
          duration: endTime - startTime,
        },
        timestamp: Date.now(),
      })

      throw error
    }
  }

  // Override XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open
  const originalXHRSend = XMLHttpRequest.prototype.send

  XMLHttpRequest.prototype.open = function (...args) {
    this._fixheroUrl = args[1]
    this._fixheroMethod = args[0]
    this._fixheroStartTime = performance.now()
    return originalXHROpen.apply(this, args)
  }

  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener("load", () => {
      const endTime = performance.now()
      const url = this._fixheroUrl

      // Only track requests to the same origin or if it's a relative URL
      if (url.startsWith("/") || url.startsWith(window.location.origin)) {
        // Send request to background script
        chrome.runtime.sendMessage({
          action: "networkRequest",
          request: {
            url,
            method: this._fixheroMethod || "GET",
            status: this.status,
            statusText: this.statusText,
            duration: endTime - this._fixheroStartTime,
            type: "xhr",
            success: this.status >= 200 && this.status < 300,
          },
          timestamp: Date.now(),
        })
      }
    })

    this.addEventListener("error", () => {
      const endTime = performance.now()

      // Send error to background script
      chrome.runtime.sendMessage({
        action: "networkError",
        error: {
          url: this._fixheroUrl,
          method: this._fixheroMethod || "GET",
          message: "Network error",
          type: "xhr",
          duration: endTime - this._fixheroStartTime,
        },
        timestamp: Date.now(),
      })
    })

    return originalXHRSend.apply(this, args)
  }
}

// Add performance monitoring
function addPerformanceMonitoring() {
  // Track page load performance
  window.addEventListener("load", () => {
    setTimeout(() => {
      const perfData = window.performance.timing
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart
      const domReadyTime = perfData.domComplete - perfData.domLoading

      // Send performance data to background script
      chrome.runtime.sendMessage({
        action: "performanceMetrics",
        metrics: {
          pageLoadTime,
          domReadyTime,
          redirectTime: perfData.redirectEnd - perfData.redirectStart,
          dnsLookupTime: perfData.domainLookupEnd - perfData.domainLookupStart,
          tcpConnectTime: perfData.connectEnd - perfData.connectStart,
          serverResponseTime: perfData.responseEnd - perfData.requestStart,
          pageRenderTime: perfData.loadEventEnd - perfData.responseEnd,
          url: window.location.href,
        },
        timestamp: Date.now(),
      })

      // Track Web Vitals if available
      if ("web-vitals" in window) {
        // This would require the web-vitals library to be injected
        // For demonstration purposes only
        trackWebVitals()
      }
    }, 0)
  })

  // Track runtime performance
  let longTaskObserver: any

  if ("PerformanceObserver" in window) {
    try {
      longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          // Report long tasks (over 50ms)
          if (entry.duration > 50) {
            chrome.runtime.sendMessage({
              action: "longTask",
              task: {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name,
                url: window.location.href,
              },
              timestamp: Date.now(),
            })
          }
        })
      })

      longTaskObserver.observe({ entryTypes: ["longtask"] })
    } catch (e) {
      console.error("PerformanceObserver for longtask not supported", e)
    }
  }
}

// Track Web Vitals (placeholder function)
function trackWebVitals() {
  // This would require the web-vitals library
  console.log("Web Vitals tracking would be implemented here")
}

// Add localStorage inspection
function addLocalStorageInspection() {
  // Override localStorage methods
  const originalSetItem = localStorage.setItem
  const originalRemoveItem = localStorage.removeItem
  const originalClear = localStorage.clear

  localStorage.setItem = function (key, value) {
    // Send to background script
    chrome.runtime.sendMessage({
      action: "localStorageChanged",
      change: {
        type: "set",
        key,
        value,
        url: window.location.href,
      },
      timestamp: Date.now(),
    })

    return originalSetItem.call(this, key, value)
  }

  localStorage.removeItem = function (key) {
    // Send to background script
    chrome.runtime.sendMessage({
      action: "localStorageChanged",
      change: {
        type: "remove",
        key,
        url: window.location.href,
      },
      timestamp: Date.now(),
    })

    return originalRemoveItem.call(this, key)
  }

  localStorage.clear = function () {
    // Send to background script
    chrome.runtime.sendMessage({
      action: "localStorageChanged",
      change: {
        type: "clear",
        url: window.location.href,
      },
      timestamp: Date.now(),
    })

    return originalClear.call(this)
  }
}

// Add React DevTools integration
function addReactDevToolsIntegration() {
  // Check if React is present
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log("React DevTools hook detected")

    // Track component renders
    const originalOnCommitFiberRoot = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot

    if (originalOnCommitFiberRoot) {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = (...args) => {
        // Send to background script (simplified)
        chrome.runtime.sendMessage({
          action: "reactComponentRender",
          timestamp: Date.now(),
        })

        return originalOnCommitFiberRoot.apply(this, args)
      }
    }
  }
}

// Initialize when the content script loads
initLocalDevFeatures()

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Local dev content script received message:", message)

  switch (message.action) {
    case "getPerformanceMetrics":
      // Collect and return performance metrics
      const metrics = collectPerformanceMetrics()
      sendResponse({ metrics })
      break
    case "getLocalStorageData":
      // Collect and return localStorage data
      const storageData = collectLocalStorageData()
      sendResponse({ storageData })
      break
  }

  return true // Keep the message channel open for async responses
})

// Collect performance metrics
function collectPerformanceMetrics() {
  // Implementation for collecting performance metrics
  return {
    // Basic timing metrics
    pageLoad: performance.timing.loadEventEnd - performance.timing.navigationStart,
    domReady: performance.timing.domComplete - performance.timing.domLoading,
    // Memory usage if available
    memory: performance.memory
      ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
        }
      : null,
  }
}

// Collect localStorage data
function collectLocalStorageData() {
  const data = {}

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      data[key] = localStorage.getItem(key)
    }
  }

  return data
}
