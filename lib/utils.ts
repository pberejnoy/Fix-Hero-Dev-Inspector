import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { v4 as uuidv4 } from "uuid"

// Generate a unique ID
export function generateId(): string {
  return uuidv4()
}

// Format date
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}

// Generate a CSS selector for an element
export function generateSelector(element: HTMLElement): string {
  if (!element) return ""

  if (element.id) {
    return `#${element.id}`
  }

  if (element === document.body) {
    return "body"
  }

  if (!element.parentElement) {
    return ""
  }

  // Use classes if available
  if (element.className) {
    const classes = element.className
      .split(" ")
      .filter((c) => c.trim().length > 0)
      .map((c) => `.${c}`)
      .join("")

    if (classes && document.querySelectorAll(classes).length === 1) {
      return classes
    }
  }

  // Use tag name and nth-child
  const index = Array.from(element.parentElement.children).indexOf(element) + 1
  return `${generateSelector(element.parentElement)} > ${element.tagName.toLowerCase()}:nth-child(${index})`
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)

    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

// Parse URL
export function parseUrl(url: string): {
  protocol: string
  host: string
  pathname: string
  search: string
  hash: string
} {
  try {
    const parsedUrl = new URL(url)
    return {
      protocol: parsedUrl.protocol,
      host: parsedUrl.host,
      pathname: parsedUrl.pathname,
      search: parsedUrl.search,
      hash: parsedUrl.hash,
    }
  } catch (error) {
    return {
      protocol: "",
      host: "",
      pathname: "",
      search: "",
      hash: "",
    }
  }
}

// Get browser info
export function getBrowserInfo(): string {
  const userAgent = navigator.userAgent
  let browserName = "Unknown"
  let browserVersion = ""

  if (userAgent.indexOf("Firefox") > -1) {
    browserName = "Firefox"
    browserVersion = userAgent.match(/Firefox\/([0-9.]+)/)?.[1] || ""
  } else if (userAgent.indexOf("Edge") > -1) {
    browserName = "Edge"
    browserVersion = userAgent.match(/Edge\/([0-9.]+)/)?.[1] || ""
  } else if (userAgent.indexOf("Edg") > -1) {
    browserName = "Edge"
    browserVersion = userAgent.match(/Edg\/([0-9.]+)/)?.[1] || ""
  } else if (userAgent.indexOf("Chrome") > -1) {
    browserName = "Chrome"
    browserVersion = userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || ""
  } else if (userAgent.indexOf("Safari") > -1) {
    browserName = "Safari"
    browserVersion = userAgent.match(/Safari\/([0-9.]+)/)?.[1] || ""
  } else if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) {
    browserName = "Internet Explorer"
    browserVersion = userAgent.match(/(?:MSIE |rv:)([0-9.]+)/)?.[1] || ""
  }

  return `${browserName} ${browserVersion}`
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
