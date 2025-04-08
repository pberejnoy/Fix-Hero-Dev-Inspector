"use client"

import type React from "react"

import { useEffect, useState } from "react"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000

type ToastActionElement = React.ReactElement

export type Toast = {
  id: string
  title?: string
  description?: string
  action?: ToastActionElement
  variant?: "default" | "destructive"
}

let count = 0

function generateId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ToasterToast = Toast & {
  id: string
  title?: string
  description?: string
  action?: ToastActionElement
  variant?: "default" | "destructive"
  dismiss: () => void
}

const toastState = {
  toasts: [] as ToasterToast[],
  listeners: new Set<(toasts: ToasterToast[]) => void>(),
}

function addToast(toast: Toast) {
  const id = toast.id || generateId()

  const newToast = {
    ...toast,
    id,
    dismiss: () => removeToast(id),
  }

  toastState.toasts = [newToast, ...toastState.toasts].slice(0, TOAST_LIMIT)
  toastState.listeners.forEach((listener) => {
    listener(toastState.toasts)
  })

  setTimeout(() => {
    removeToast(id)
  }, TOAST_REMOVE_DELAY)

  return id
}

function removeToast(id: string) {
  toastState.toasts = toastState.toasts.filter((t) => t.id !== id)
  toastState.listeners.forEach((listener) => {
    listener(toastState.toasts)
  })
}

export function useToast() {
  const [toasts, setToasts] = useState<ToasterToast[]>(toastState.toasts)

  useEffect(() => {
    toastState.listeners.add(setToasts)
    return () => {
      toastState.listeners.delete(setToasts)
    }
  }, [])

  return {
    toasts,
    toast: addToast,
    dismiss: removeToast,
  }
}
