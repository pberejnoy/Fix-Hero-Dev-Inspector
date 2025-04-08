"use client"

import { Sidebar } from "@/components/ui/sidebar"

import { useEffect, useState } from "react"
import ReactDOM from "react-dom/client"

// Declare chrome variable for use in non-typescript environments
declare const chrome: any

type Session = {
  id: string
  startTime: number
  issues: Issue[]
  url: string
}

type Issue = {
  id: string
  timestamp: number
  url: string
  title: string
  elementDetails?: any
  screenshot?: string
  consoleErrors?: any[]
  networkErrors?: any[]
  notes?: string
  severity?: "low" | "medium" | "high"
  category?: string
  tags?: string[]
}

// Update the popup component to be more responsive
function Popup() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [activeTab, setActiveTab] = useState("current")
  const [chromeApiAvailable, setChromeApiAvailable] = useState(false)

  useEffect(() => {
    // Check if Chrome API is available
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      setChromeApiAvailable(true)

      // Get current session
      try {
        chrome.runtime.sendMessage({ type: "GET_CURRENT_SESSION" }, (response) => {
          if (response && response.session) {
            setCurrentSession(response.session)
          }
        })

        // Get all sessions
        chrome.runtime.sendMessage({ type: "GET_ALL_SESSIONS" }, (response) => {
          if (response && response.sessions) {
            setSessions(response.sessions)
          }
        })
      } catch (error) {
        console.error("Error communicating with extension:", error)
      }
    } else {
      console.warn("Chrome API not available. Popup functionality will be limited.")
    }
  }, [])

  const startInspection = () => {
    if (!chromeApiAvailable) {
      console.warn("Chrome API not available. Cannot start inspection.")
      return
    }

    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: "START_INSPECTION" })
        }
      })
      window.close()
    } catch (error) {
      console.error("Error starting inspection:", error)
    }
  }

  const takeScreenshot = () => {
    if (!chromeApiAvailable) {
      console.warn("Chrome API not available. Cannot take screenshot.")
      return
    }

    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: "TAKE_SCREENSHOT" })
        }
      })
    } catch (error) {
      console.error("Error taking screenshot:", error)
    }
  }

  const addNote = () => {
    if (!chromeApiAvailable) {
      console.warn("Chrome API not available. Cannot add note.")
      return
    }

    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: "add-note" })
        }
      })
      window.close()
    } catch (error) {
      console.error("Error adding note:", error)
    }
  }

  const openDashboard = () => {
    if (!chromeApiAvailable) {
      console.warn("Chrome API not available. Cannot open dashboard.")
      return
    }

    try {
      chrome.runtime.sendMessage({ type: "OPEN_DASHBOARD" })
      window.close()
    } catch (error) {
      console.error("Error opening dashboard:", error)
    }
  }

  const exportToMarkdown = (session: Session) => {
    let markdown = `# Bug Report: ${new URL(session.url).hostname}
    
    `
    markdown += `**Date:** ${new Date(session.startTime).toLocaleString()}

`
    markdown += `**URL:** ${session.url}

`
    markdown += `## Issues (${session.issues.length})

`

    session.issues.forEach((issue, index) => {
      markdown += `### Issue ${index + 1}: ${issue.title}

`
      markdown += `**Time:** ${new Date(issue.timestamp).toLocaleString()}

`

      if (issue.notes) {
        markdown += `**Notes:** ${issue.notes}

`
      }

      if (issue.severity) {
        markdown += `**Severity:** ${issue.severity}

`
      }

      if (issue.elementDetails) {
        markdown += `**Element Details:**

`
        markdown += `- Selector: \`${issue.elementDetails.selector}\`
`
        markdown += `- XPath: \`${issue.elementDetails.xpath}\`
`
        markdown += `- Text: "${issue.elementDetails.text}"

`

        markdown += `**HTML:**

\`\`\`html
${issue.elementDetails.html}
\`\`\`

`
      }

      if (issue.consoleErrors && issue.consoleErrors.length > 0) {
        markdown += `**Console Errors:**

`
        issue.consoleErrors.forEach((error) => {
          markdown += `- ${error.message}
`
        })
        markdown += "\n"
      }

      if (issue.networkErrors && issue.networkErrors.length > 0) {
        markdown += `**Network Errors:**

`
        issue.networkErrors.forEach((error) => {
          markdown += `- ${error.method} ${error.url} - ${error.status} ${error.statusText}
`
        })
        markdown += "\n"
      }

      if (issue.screenshot) {
        markdown += `**Screenshot:**

`
        markdown += `![Screenshot](${issue.screenshot})

`
      }

      markdown += "---\n"
    })

    const blob = new Blob([markdown], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `bug-report-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToGitHub = (session: Session) => {
    // This would normally open a dialog to configure GitHub export
    // For the MVP, we'll just show an alert
    alert("GitHub export would be configured here. For the MVP, use Markdown export and paste into GitHub.")
  }

  const clearAllSessions = () => {
    if (!chromeApiAvailable) {
      console.warn("Chrome API not available. Cannot clear sessions.")
      return
    }

    if (confirm("Are you sure you want to clear all sessions?")) {
      try {
        chrome.runtime.sendMessage({ type: "CLEAR_ALL_SESSIONS" }, () => {
          setSessions([])
          setCurrentSession(null)
        })
      } catch (error) {
        console.error("Error clearing sessions:", error)
      }
    }
  }

  const toggleSidebar = () => {
    if (!chromeApiAvailable) {
      console.warn("Chrome API not available. Cannot toggle sidebar.")
      return
    }

    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          const toggleMessage = {
            type: "TOGGLE_SIDEBAR",
          }
          chrome.tabs.sendMessage(tabs[0].id, toggleMessage)
        }
      })
      window.close()
    } catch (error) {
      console.error("Error toggling sidebar:", error)
    }
  }

  return (
    

      
        \
  FixHero
  Dev
  Inspector

  Capture
  and
  report
  issues
  with a single
  click
  !chromeApiAvailable ? (
        

          
            Chrome extension
  API
  not
  available.This
  extension
  must
  be
  loaded as a
  Chrome
  extension
  to
  function properly
  .
          
        
      ) : (
        
          
            
              Current Session
              All Sessions
  currentSession ? (
                
                  
                    {new URL(currentSession.url).hostname} •
  new Date(currentSession.startTime).toLocaleString()
  currentSession.issues.length
  issues
  currentSession.issues.filter((i) => i.consoleErrors?.length).length > 0 && (
                      
                        Console
  Errors

  )
  currentSession.issues.filter((i) => i.networkErrors?.length).length > 0 && (
                      
                        Network
  Errors

  )

  Inspect
  Element

  Screenshot

  Add
  Note

  Export

  Open
  Dashboard

  ) : (
                

                  
                    No active session
                  
                  
                    Start Inspection
                  
                

              )
  sessions.length > 0 ? (
                

                  {sessions.map((session) => (
                    
                      
                        {new URL(session.url).hostname}
  new Date(session.startTime).toLocaleString()
  session.issues.length
  issues

  Markdown

  GitHub

  ))

  ) : (
                

                  
                    No sessions found
                  
                

              )
  sessions.length > 0 && (
                
                  Clear
  All
  Sessions

  )

  Open
  Dashboard

  )
}

FixHero
Dev
Inspector
v0
0.1
0.0

Open
Sidebar

)
}

const root = ReactDOM.createRoot(document.getElementById("root")!)
root.render()
