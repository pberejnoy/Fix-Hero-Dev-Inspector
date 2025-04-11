import React from "react"
import ReactDOM from "react-dom/client"
import { ThemeProvider } from "./components/theme-provider"
import { Toaster } from "./components/ui/toaster"
import ErrorBoundary from "./components/error-boundary"
import { GlobalErrorHandler } from "./components/global-error-handler"

function Sidebar() {
  return (
    <ErrorBoundary>
      <GlobalErrorHandler>
        <ThemeProvider>
          <main className="min-h-screen bg-background text-foreground transition-colors duration-300 p-4">
            <h1 className="text-2xl font-bold mb-4">FixHero Dev Inspector Sidebar</h1>
            <p>This sidebar is under development and will be available in a future update.</p>
            <Toaster />
          </main>
        </ThemeProvider>
      </GlobalErrorHandler>
    </ErrorBoundary>
  )
}

// Initialize the sidebar
const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement)
root.render(
  <React.StrictMode>
    <Sidebar />
  </React.StrictMode>,
)
