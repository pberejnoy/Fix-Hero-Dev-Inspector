"use client"

import type React from "react"

import { ToastProvider as ShadcnToastProvider } from "@/components/ui/toast"
import { Toaster } from "@/components/ui/toaster"

interface ToastProviderProps {
  children: React.ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <ShadcnToastProvider>
      {children}
      <Toaster />
    </ShadcnToastProvider>
  )
}
