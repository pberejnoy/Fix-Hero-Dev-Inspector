import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

export function formatDistanceToNow(timestamp: number): string {
  const now = Date.now()
  const seconds = Math.floor((now - timestamp) / 1000)

  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? "" : "s"}`
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"}`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"}`
  }

  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? "" : "s"}`
}

export function exportToMarkdown(issues: any[], sessionInfo: any) {
  let markdown = `# Bug Report: ${new URL(sessionInfo.url).hostname}\n\n`
  markdown += `**Date:** ${new Date(sessionInfo.startTime).toLocaleString()}\n\n`
  markdown += `**URL:** ${sessionInfo.url}\n\n`
  markdown += `**Browser:** ${sessionInfo.browserInfo}\n\n`
  markdown += `## Issues (${issues.length})\n\n`

  issues.forEach((issue, index) => {
    markdown += `### Issue ${index + 1}: ${issue.title}\n\n`
    markdown += `**Time:** ${new Date(issue.timestamp).toLocaleString()}\n\n`

    if (issue.notes) {
      markdown += `**Notes:** ${issue.notes}\n\n`
    }

    if (issue.severity) {
      markdown += `**Severity:** ${issue.severity}\n\n`
    }

    if (issue.tags && issue.tags.length > 0) {
      markdown += `**Tags:** ${issue.tags.join(", ")}\n\n`
    }

    if (issue.elementDetails) {
      markdown += `**Element Details:**\n\n`
      markdown += `- Type: ${issue.elementDetails.type}\n`
      markdown += `- Selector: \`${issue.elementDetails.selector}\`\n`
      markdown += `- XPath: \`${issue.elementDetails.xpath}\`\n`
      markdown += `- Text: "${issue.elementDetails.text}"\n\n`

      markdown += `**HTML:**\n\n`
      markdown += "```html\n"
      markdown += `${issue.elementDetails.html}\n`
      markdown += "```\n\n"
    }

    if (issue.consoleErrors && issue.consoleErrors.length > 0) {
      markdown += `**Console Errors:**\n\n`
      issue.consoleErrors.forEach((error: any) => {
        markdown += `- ${error.message}\n`
      })
      markdown += "\n"
    }

    if (issue.networkErrors && issue.networkErrors.length > 0) {
      markdown += `**Network Errors:**\n\n`
      issue.networkErrors.forEach((error: any) => {
        markdown += `- ${error.method} ${error.url} - ${error.status} ${error.statusText}\n`
      })
      markdown += "\n"
    }

    if (issue.screenshot) {
      markdown += `**Screenshot:**\n\n`
      markdown += `![Screenshot](${issue.screenshot})\n\n`
    }

    markdown += "---\n\n"
  })

  return markdown
}

export function downloadAsFile(content: string, filename: string, contentType: string) {
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
