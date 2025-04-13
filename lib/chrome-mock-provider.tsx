"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

// Define the shape of our Chrome API mock
interface ChromeApiContextType {
  storage: {
    local: {
      get: (keys: string | string[] | null, callback: (items: Record<string, any>) => void) => void
      set: (items: Record<string, any>, callback?: () => void) => void
    }
    sync: {
      get: (keys: string | string[] | null, callback: (items: Record<string, any>) => void) => void
      set: (items: Record<string, any>, callback?: () => void) => void
    }
  }
  runtime: {
    sendMessage: (message: any, callback?: (response: any) => void) => void
    onMessage: {
      addListener: (callback: (message: any, sender: any, sendResponse: (response?: any) => void) => void) => void
      removeListener: (callback: (message: any, sender: any, sendResponse: (response?: any) => void) => void) => void
    }
  }
  tabs: {
    query: (queryInfo: any, callback: (tabs: any[]) => void) => void
    sendMessage: (tabId: number, message: any, callback?: (response: any) => void) => void
  }
  commands: {
    onCommand: {
      addListener: (callback: (command: string) => void) => void
    }
  }
}

// Create the context
const ChromeApiContext = createContext<ChromeApiContextType | null>(null)

// Local storage for our mock
const localStorageData: Record<string, any> = {}

// Provider component
export const ChromeApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [listeners, setListeners] = useState<Array<(message: any, sender: any, sendResponse: any) => void>>([])

  // Mock Chrome API
  const chromeApiMock: ChromeApiContextType = {
    storage: {
      local: {
        get: (keys, callback) => {
          console.log("[ChromeApiMock] storage.local.get", keys)

          let result: Record<string, any> = {}

          if (keys === null) {
            // Return all data
            result = { ...localStorageData }
          } else if (typeof keys === "string") {
            // Return single key
            result[keys] = localStorageData[keys] || null
          } else if (Array.isArray(keys)) {
            // Return multiple keys
            keys.forEach((key) => {
              result[key] = localStorageData[key] || null
            })
          } else if (typeof keys === "object") {
            // Return keys with default values
            Object.keys(keys).forEach((key) => {
              result[key] = localStorageData[key] !== undefined ? localStorageData[key] : keys[key]
            })
          }

          setTimeout(() => callback(result), 0)
        },
        set: (items, callback) => {
          console.log("[ChromeApiMock] storage.local.set", items)

          Object.keys(items).forEach((key) => {
            localStorageData[key] = items[key]
          })

          if (callback) setTimeout(callback, 0)
        },
      },
      sync: {
        get: (keys, callback) => {
          // Same implementation as local for simplicity
          chromeApiMock.storage.local.get(keys, callback)
        },
        set: (items, callback) => {
          // Same implementation as local for simplicity
          chromeApiMock.storage.local.set(items, callback)
        },
      },
    },
    runtime: {
      sendMessage: (message, callback) => {
        console.log("[ChromeApiMock] runtime.sendMessage", message)

        // Simulate message processing
        setTimeout(() => {
          // Notify all listeners
          listeners.forEach((listener) => {
            listener(message, { id: "mock-sender" }, (response: any) => {
              if (callback) callback(response)
            })
          })

          // Default response if no listeners handled it
          if (callback) callback({ success: true, mock: true })
        }, 100)
      },
      onMessage: {
        addListener: (callback) => {
          console.log("[ChromeApiMock] runtime.onMessage.addListener")
          setListeners((prev) => [...prev, callback])
        },
        removeListener: (callback) => {
          console.log("[ChromeApiMock] runtime.onMessage.removeListener")
          setListeners((prev) => prev.filter((listener) => listener !== callback))
        },
      },
    },
    tabs: {
      query: (queryInfo, callback) => {
        console.log("[ChromeApiMock] tabs.query", queryInfo)

        // Mock a tab
        const mockTabs = [
          {
            id: 1,
            url: window.location.href,
            title: document.title,
            active: true,
            currentWindow: true,
          },
        ]

        setTimeout(() => callback(mockTabs), 0)
      },
      sendMessage: (tabId, message, callback) => {
        console.log("[ChromeApiMock] tabs.sendMessage", tabId, message)

        // Simulate sending message to content script
        setTimeout(() => {
          if (callback) callback({ success: true, mock: true })
        }, 100)
      },
    },
    commands: {
      onCommand: {
        addListener: (callback) => {
          console.log("[ChromeApiMock] commands.onCommand.addListener")
          // We don't actually implement this in the mock
        },
      },
    },
  }

  // Set up global chrome object for development
  useEffect(() => {
    if (typeof window !== "undefined" && !window.chrome) {
      // @ts-ignore
      window.chrome = chromeApiMock
      console.log("[ChromeApiMock] Installed mock Chrome API")
    }

    return () => {
      // Clean up
      if (typeof window !== "undefined" && window.chrome) {
        // @ts-ignore
        delete window.chrome
      }
    }
  }, [])

  return <ChromeApiContext.Provider value={chromeApiMock}>{children}</ChromeApiContext.Provider>
}

// Hook to use the Chrome API
export const useChromeApi = () => {
  const context = useContext(ChromeApiContext)
  if (!context) {
    throw new Error("useChromeApi must be used within a ChromeApiProvider")
  }
  return context
}

// Type declaration for the global chrome object
declare global {
  interface Window {
    chrome?: any
  }
}
