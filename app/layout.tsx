import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ToastProvider } from "@/components/toast-provider"
import { GlobalErrorHandler } from "@/components/global-error-handler"
import ErrorBoundary from "@/components/error-boundary"

export const metadata = {
  title: "FixHero Dev Inspector",
  description: "Advanced bug reporting and inspection tool for developers and QA testers",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <GlobalErrorHandler>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
              <ToastProvider>{children}</ToastProvider>
            </ThemeProvider>
          </GlobalErrorHandler>
        </ErrorBoundary>
      </body>
    </html>
  )
}


import './globals.css'