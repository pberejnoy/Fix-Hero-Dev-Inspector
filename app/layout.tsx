import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ChromeApiProvider } from "@/lib/chrome-mock-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FixHero Dev Inspector",
  description: "A Chrome extension for developers to inspect, debug, and document web applications",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ChromeApiProvider>{children}</ChromeApiProvider>
      </body>
    </html>
  )
}


import './globals.css'