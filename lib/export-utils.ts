import type { Issue, Session, ExportOptions, GitHubExportOptions } from "./types"

/**
 * Exports issues to Markdown format
 */
export function exportToMarkdown(
  issues: Issue[],
  sessionInfo: Session,
  options: ExportOptions = {
    includeScreenshots: true,
    includeConsoleErrors: true,
    includeNetworkErrors: true,
    includeElementDetails: true,
  },
): string {
  let markdown = `# Bug Report: ${new URL(sessionInfo.url).hostname}\n\n`
  markdown += `**Date:** ${new Date(sessionInfo.startTime).toLocaleString()}\n\n`
  markdown += `**URL:** ${sessionInfo.url}\n\n`
  markdown += `**Browser:** ${sessionInfo.browserInfo}\n\n`

  if (sessionInfo.description) {
    markdown += `**Description:** ${sessionInfo.description}\n\n`
  }

  markdown += `**Session ID:** ${sessionInfo.id}\n\n`
  markdown += `## Issues (${issues.length})\n\n`

  issues.forEach((issue, index) => {
    markdown += `### Issue ${index + 1}: ${issue.title}\n\n`
    markdown += `**Time:** ${new Date(issue.timestamp).toLocaleString()}\n\n`
    markdown += `**URL:** ${issue.url}\n\n`

    if (issue.severity) {
      markdown += `**Severity:** ${issue.severity}\n\n`
    }

    if (issue.category) {
      markdown += `**Category:** ${issue.category}\n\n`
    }

    if (issue.tags && issue.tags.length > 0) {
      markdown += `**Tags:** ${issue.tags.join(", ")}\n\n`
    }

    if (issue.notes) {
      markdown += `**Notes:** ${issue.notes}\n\n`
    }

    if (options.includeElementDetails && issue.elementDetails) {
      markdown += `**Element Details:**\n\n`
      markdown += `- Type: ${issue.elementDetails.type}\n`
      markdown += `- Selector: \`${issue.elementDetails.selector}\`\n`
      markdown += `- XPath: \`${issue.elementDetails.xpath}\`\n`
      markdown += `- Text: "${issue.elementDetails.text}"\n`

      if (issue.elementDetails.componentName) {
        markdown += `- Component: ${issue.elementDetails.componentName}\n`
      }

      if (issue.elementDetails.accessibility) {
        const accessibilityStr = JSON.stringify(issue.elementDetails.accessibility, null, 2)
        markdown += `- Accessibility: ${accessibilityStr.replace(/\n/g, "\n  ")}\n`
      }

      markdown += `\n**HTML:**\n\n\`\`\`html\n${issue.elementDetails.html}\n\`\`\`\n\n`
    }

    if (options.includeConsoleErrors && issue.consoleErrors && issue.consoleErrors.length > 0) {
      markdown += `**Console Errors:**\n\n\`\`\`\n`
      issue.consoleErrors.forEach((error) => {
        markdown += `${error.message} (${error.source}:${error.lineNumber})\n`
      })
      markdown += `\`\`\`\n\n`
    }

    if (options.includeNetworkErrors && issue.networkErrors && issue.networkErrors.length > 0) {
      markdown += `**Network Errors:**\n\n\`\`\`\n`
      issue.networkErrors.forEach((error) => {
        markdown += `${error.method} ${error.url} - ${error.status} ${error.statusText}\n`
      })
      markdown += `\`\`\`\n\n`
    }

    if (options.includeScreenshots && issue.screenshot) {
      markdown += `**Screenshot:**\n\n![Screenshot](${issue.screenshot})\n\n`
    }

    if (issue.aiSuggestion) {
      markdown += `**AI Analysis:**\n\n`
      markdown += `- Priority: ${issue.aiSuggestion.priority}\n`
      markdown += `- Tags: ${issue.aiSuggestion.tags.join(", ")}\n`
      markdown += `- Analysis: ${issue.aiSuggestion.analysis}\n`
      if (issue.aiSuggestion.suggestedFix) {
        markdown += `- Suggested Fix: ${issue.aiSuggestion.suggestedFix}\n`
      }
      markdown += `\n`
    }

    markdown += "---\n\n"
  })

  return markdown
}

/**
 * Exports issues to JSON format
 */
export function exportToJSON(
  issues: Issue[],
  sessionInfo: Session,
  options: ExportOptions = {
    includeScreenshots: true,
    includeConsoleErrors: true,
    includeNetworkErrors: true,
    includeElementDetails: true,
  },
): string {
  // Create a clean copy of the data
  const exportData = {
    session: {
      id: sessionInfo.id,
      startTime: sessionInfo.startTime,
      url: sessionInfo.url,
      browserInfo: sessionInfo.browserInfo,
      name: sessionInfo.name,
      description: sessionInfo.description,
      lastUpdated: sessionInfo.lastUpdated,
      createdBy: sessionInfo.createdBy,
    },
    issues: issues.map((issue) => {
      const cleanIssue: any = {
        id: issue.id,
        timestamp: issue.timestamp,
        url: issue.url,
        title: issue.title,
        severity: issue.severity,
        category: issue.category,
        tags: issue.tags,
        notes: issue.notes,
        reportedBy: issue.reportedBy,
      }

      if (options.includeElementDetails && issue.elementDetails) {
        cleanIssue.elementDetails = issue.elementDetails
      }

      if (options.includeScreenshots && issue.screenshot) {
        cleanIssue.screenshot = issue.screenshot
      }

      if (options.includeConsoleErrors && issue.consoleErrors) {
        cleanIssue.consoleErrors = issue.consoleErrors
      }

      if (options.includeNetworkErrors && issue.networkErrors) {
        cleanIssue.networkErrors = issue.networkErrors
      }

      if (issue.aiSuggestion) {
        cleanIssue.aiSuggestion = issue.aiSuggestion
      }

      if (issue.pageMetadata) {
        cleanIssue.pageMetadata = issue.pageMetadata
      }

      return cleanIssue
    }),
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * Exports issues to CSV format
 */
export function exportToCSV(issues: Issue[], sessionInfo: Session): string {
  // Define CSV headers
  const headers = [
    "ID",
    "Title",
    "Severity",
    "URL",
    "Timestamp",
    "Tags",
    "Category",
    "Notes",
    "Element Type",
    "Element Selector",
  ]

  // Create CSV content
  let csv = headers.join(",") + "\n"

  // Add each issue as a row
  issues.forEach((issue) => {
    const row = [
      `"${issue.id}"`,
      `"${issue.title.replace(/"/g, '""')}"`,
      `"${issue.severity || ""}"`,
      `"${issue.url}"`,
      `"${new Date(issue.timestamp).toLocaleString()}"`,
      `"${issue.tags ? issue.tags.join(", ") : ""}"`,
      `"${issue.category || ""}"`,
      `"${issue.notes ? issue.notes.replace(/"/g, '""') : ""}"`,
      `"${issue.elementDetails ? issue.elementDetails.type : ""}"`,
      `"${issue.elementDetails ? issue.elementDetails.selector.replace(/"/g, '""') : ""}"`,
    ]

    csv += row.join(",") + "\n"
  })

  return csv
}

/**
 * Prepares GitHub issues for export
 */
export function prepareGitHubIssues(issues: Issue[], sessionInfo: Session, options: GitHubExportOptions): any[] {
  return issues.map((issue) => {
    // Create issue title
    const title = `[${issue.severity?.toUpperCase() || "BUG"}] ${issue.title}`

    // Create issue body
    let body = "## Bug Report\n\n"
    body += `**URL:** ${issue.url}\n`
    body += `**Reported:** ${new Date(issue.timestamp).toLocaleString()}\n`
    body += `**Browser:** ${sessionInfo.browserInfo}\n\n`

    if (issue.notes) {
      body += `### Description\n${issue.notes}\n\n`
    }

    if (issue.elementDetails) {
      body += "### Element Details\n"
      body += `- Type: ${issue.elementDetails.type}\n`
      body += `- Selector: \`${issue.elementDetails.selector}\`\n`
      body += `- XPath: \`${issue.elementDetails.xpath}\`\n`

      if (issue.elementDetails.componentName) {
        body += `- Component: ${issue.elementDetails.componentName}\n`
      }

      body += `\n\`\`\`html\n${issue.elementDetails.html}\n\`\`\`\n\n`
    }

    if (issue.consoleErrors && issue.consoleErrors.length > 0) {
      body += "### Console Errors\n```\n"
      issue.consoleErrors.forEach((error) => {
        body += `${error.message} (${error.source}:${error.lineNumber})\n`
      })
      body += "```\n\n"
    }

    if (issue.networkErrors && issue.networkErrors.length > 0) {
      body += "### Network Errors\n```\n"
      issue.networkErrors.forEach((error) => {
        body += `${error.method} ${error.url} - ${error.status} ${error.statusText}\n`
      })
      body += "```\n\n"
    }

    body += "### Session Info\n"
    body += `- Session ID: ${sessionInfo.id}\n`
    body += "- Captured with: FixHero Dev Inspector\n"

    // Create GitHub issue object
    return {
      title,
      body,
      labels: [
        ...(options.labels || []),
        `severity:${issue.severity || "medium"}`,
        ...(issue.tags || []).map((tag) => `tag:${tag}`),
      ],
      assignees: options.assignees || [],
    }
  })
}

/**
 * Downloads content as a file
 */
export function downloadAsFile(content: string, filename: string, contentType: string): void {
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Exports issues to the specified format and downloads the file
 */
export function exportAndDownload(issues: Issue[], sessionInfo: Session, options: ExportOptions): void {
  const timestamp = new Date().toISOString().slice(0, 10)
  const baseFilename = `fixhero-report-${timestamp}`

  switch (options.format) {
    case "json":
      const jsonContent = exportToJSON(issues, sessionInfo, options)
      downloadAsFile(jsonContent, `${baseFilename}.json`, "application/json")
      break

    case "csv":
      const csvContent = exportToCSV(issues, sessionInfo)
      downloadAsFile(csvContent, `${baseFilename}.csv`, "text/csv")
      break

    case "markdown":
    default:
      const markdownContent = exportToMarkdown(issues, sessionInfo, options)
      downloadAsFile(markdownContent, `${baseFilename}.md`, "text/markdown")
      break
  }
}
