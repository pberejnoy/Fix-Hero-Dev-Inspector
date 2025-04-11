import type { Issue, Session } from "../../lib/types"

// Export formats
export type ExportFormat = "markdown" | "json" | "csv" | "github" | "cursor" | "notion"

// Export a single issue
export async function exportIssue(issue: Issue, format: ExportFormat): Promise<string> {
  switch (format) {
    case "markdown":
      return exportIssueToMarkdown(issue)
    case "json":
      return exportIssueToJSON(issue)
    case "csv":
      return exportIssueToCSV(issue)
    case "github":
      return exportIssueToGitHub(issue)
    case "cursor":
      return exportIssueToCursor(issue)
    case "notion":
      return exportIssueToNotion(issue)
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}

// Export multiple issues
export async function exportIssues(issues: Issue[], session: Session | null, format: ExportFormat): Promise<string> {
  switch (format) {
    case "markdown":
      return exportIssuesToMarkdown(issues, session)
    case "json":
      return exportIssuesToJSON(issues, session)
    case "csv":
      return exportIssuesToCSV(issues, session)
    case "github":
      return exportIssuesToGitHub(issues, session)
    case "cursor":
      return exportIssuesToCursor(issues, session)
    case "notion":
      return exportIssuesToNotion(issues, session)
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}

// Export a single issue to Markdown
function exportIssueToMarkdown(issue: Issue): string {
  let markdown = `# ${issue.title || "Untitled Issue"}\n\n`

  // Add metadata
  markdown += `- **ID**: ${issue.id}\n`
  markdown += `- **Severity**: ${issue.severity || "Not specified"}\n`
  markdown += `- **Created**: ${new Date(issue.timestamp).toLocaleString()}\n`

  if (issue.tags && issue.tags.length > 0) {
    markdown += `- **Tags**: ${issue.tags.join(", ")}\n`
  }

  if (issue.url) {
    markdown += `- **URL**: ${issue.url}\n`
  }

  markdown += "\n"

  // Add notes
  if (issue.notes) {
    markdown += `## Notes\n\n${issue.notes}\n\n`
  }

  // Add element details
  if (issue.elementDetails) {
    markdown += "## Element Details\n\n"
    markdown += `- **Type**: ${issue.elementDetails.tagName || "Unknown"}\n`

    if (issue.elementDetails.id) {
      markdown += `- **ID**: ${issue.elementDetails.id}\n`
    }

    if (issue.elementDetails.className) {
      markdown += `- **Class**: ${issue.elementDetails.className}\n`
    }

    if (issue.elementDetails.textContent) {
      markdown += `- **Text Content**: ${issue.elementDetails.textContent}\n`
    }

    if (issue.elementDetails.selector) {
      markdown += `- **CSS Selector**: \`${issue.elementDetails.selector}\`\n`
    }

    if (issue.elementDetails.xpath) {
      markdown += `- **XPath**: \`${issue.elementDetails.xpath}\`\n`
    }

    markdown += "\n"
  }

  // Add console errors
  if (issue.consoleErrors && issue.consoleErrors.length > 0) {
    markdown += "## Console Errors\n\n"
    issue.consoleErrors.forEach((error, index) => {
      markdown += `### Error ${index + 1}\n\`\`\`\n${error}\n\`\`\`\n\n`
    })
  }

  // Add network errors
  if (issue.networkErrors && issue.networkErrors.length > 0) {
    markdown += "## Network Errors\n\n"
    issue.networkErrors.forEach((error, index) => {
      markdown += `### Error ${index + 1}\n`
      markdown += `- **URL**: ${error.url || "Unknown"}\n`
      markdown += `- **Status**: ${error.status || "Unknown"}\n`
      markdown += `- **Type**: ${error.type || "Unknown"}\n`
      if (error.message) {
        markdown += `- **Message**: ${error.message}\n`
      }
      markdown += "\n"
    })
  }

  // Add screenshot placeholder
  if (issue.screenshot) {
    markdown += "## Screenshot\n\n"
    markdown += "*Screenshot available in the FixHero Dev Inspector extension*\n\n"
  }

  return markdown
}

// Export multiple issues to Markdown
function exportIssuesToMarkdown(issues: Issue[], session: Session | null): string {
  let markdown = `# FixHero Dev Inspector Report\n\n`

  // Add session info if available
  if (session) {
    markdown += `## Session: ${session.name}\n\n`
    markdown += `- **URL**: ${session.url || "Not specified"}\n`
    markdown += `- **Created**: ${new Date(session.created).toLocaleString()}\n`
    markdown += `- **Last Updated**: ${new Date(session.lastUpdated).toLocaleString()}\n`
    markdown += `- **Browser**: ${session.browserInfo || "Not specified"}\n\n`
  }

  // Add summary
  markdown += `## Summary\n\n`
  markdown += `Total Issues: ${issues.length}\n\n`

  // Count by severity
  const severityCounts = {
    critical: issues.filter((issue) => issue.severity === "critical").length,
    high: issues.filter((issue) => issue.severity === "high").length,
    medium: issues.filter((issue) => issue.severity === "medium").length,
    low: issues.filter((issue) => issue.severity === "low").length,
  }

  markdown += `- Critical: ${severityCounts.critical}\n`
  markdown += `- High: ${severityCounts.high}\n`
  markdown += `- Medium: ${severityCounts.medium}\n`
  markdown += `- Low: ${severityCounts.low}\n\n`

  // Add each issue
  issues.forEach((issue, index) => {
    markdown += `## Issue ${index + 1}: ${issue.title || "Untitled Issue"}\n\n`

    // Add metadata
    markdown += `- **ID**: ${issue.id}\n`
    markdown += `- **Severity**: ${issue.severity || "Not specified"}\n`
    markdown += `- **Created**: ${new Date(issue.timestamp).toLocaleString()}\n`

    if (issue.tags && issue.tags.length > 0) {
      markdown += `- **Tags**: ${issue.tags.join(", ")}\n`
    }

    if (issue.url) {
      markdown += `- **URL**: ${issue.url}\n`
    }

    markdown += "\n"

    // Add notes
    if (issue.notes) {
      markdown += `### Notes\n\n${issue.notes}\n\n`
    }

    // Add element details
    if (issue.elementDetails) {
      markdown += "### Element Details\n\n"
      markdown += `- **Type**: ${issue.elementDetails.tagName || "Unknown"}\n`

      if (issue.elementDetails.id) {
        markdown += `- **ID**: ${issue.elementDetails.id}\n`
      }

      if (issue.elementDetails.className) {
        markdown += `- **Class**: ${issue.elementDetails.className}\n`
      }

      if (issue.elementDetails.textContent) {
        markdown += `- **Text Content**: ${issue.elementDetails.textContent}\n`
      }

      if (issue.elementDetails.selector) {
        markdown += `- **CSS Selector**: \`${issue.elementDetails.selector}\`\n`
      }

      if (issue.elementDetails.xpath) {
        markdown += `- **XPath**: \`${issue.elementDetails.xpath}\`\n`
      }

      markdown += "\n"
    }

    // Add console errors
    if (issue.consoleErrors && issue.consoleErrors.length > 0) {
      markdown += "### Console Errors\n\n"
      issue.consoleErrors.forEach((error, errorIndex) => {
        markdown += `#### Error ${errorIndex + 1}\n\`\`\`\n${error}\n\`\`\`\n\n`
      })
    }

    // Add network errors
    if (issue.networkErrors && issue.networkErrors.length > 0) {
      markdown += "### Network Errors\n\n"
      issue.networkErrors.forEach((error, errorIndex) => {
        markdown += `#### Error ${errorIndex + 1}\n`
        markdown += `- **URL**: ${error.url || "Unknown"}\n`
        markdown += `- **Status**: ${error.status || "Unknown"}\n`
        markdown += `- **Type**: ${error.type || "Unknown"}\n`
        if (error.message) {
          markdown += `- **Message**: ${error.message}\n`
        }
        markdown += "\n"
      })
    }

    // Add separator between issues
    if (index < issues.length - 1) {
      markdown += "---\n\n"
    }
  })

  // Add footer
  markdown += "\n\n---\n\n"
  markdown += `Generated by FixHero Dev Inspector on ${new Date().toLocaleString()}\n`

  return markdown
}

// Export a single issue to JSON
function exportIssueToJSON(issue: Issue): string {
  // Create a clean copy without the screenshot (too large for JSON)
  const cleanIssue = { ...issue }

  if (cleanIssue.screenshot) {
    cleanIssue.screenshot = "[Screenshot data removed for export]"
  }

  return JSON.stringify(cleanIssue, null, 2)
}

// Export multiple issues to JSON
function exportIssuesToJSON(issues: Issue[], session: Session | null): string {
  // Create clean copies without screenshots
  const cleanIssues = issues.map((issue) => {
    const cleanIssue = { ...issue }
    if (cleanIssue.screenshot) {
      cleanIssue.screenshot = "[Screenshot data removed for export]"
    }
    return cleanIssue
  })

  const exportData = {
    session: session || null,
    issues: cleanIssues,
    metadata: {
      exportDate: new Date().toISOString(),
      totalIssues: issues.length,
      severityCounts: {
        critical: issues.filter((issue) => issue.severity === "critical").length,
        high: issues.filter((issue) => issue.severity === "high").length,
        medium: issues.filter((issue) => issue.severity === "medium").length,
        low: issues.filter((issue) => issue.severity === "low").length,
      },
    },
  }

  return JSON.stringify(exportData, null, 2)
}

// Export a single issue to CSV
function exportIssueToCSV(issue: Issue): string {
  // Define CSV headers
  const headers = [
    "ID",
    "Title",
    "Severity",
    "Created",
    "URL",
    "Tags",
    "Notes",
    "Element Type",
    "Element ID",
    "Element Class",
    "Console Errors",
    "Network Errors",
  ]

  // Format the data
  const row = [
    issue.id,
    issue.title || "Untitled Issue",
    issue.severity || "Not specified",
    new Date(issue.timestamp).toLocaleString(),
    issue.url || "",
    issue.tags ? issue.tags.join(", ") : "",
    issue.notes ? issue.notes.replace(/\n/g, " ") : "",
    issue.elementDetails?.tagName || "",
    issue.elementDetails?.id || "",
    issue.elementDetails?.className || "",
    issue.consoleErrors ? issue.consoleErrors.length.toString() : "0",
    issue.networkErrors ? issue.networkErrors.length.toString() : "0",
  ]

  // Escape CSV values
  const escapedRow = row.map((value) => {
    // If value contains comma, newline, or double quote, wrap in quotes
    if (value.includes(",") || value.includes("\n") || value.includes('"')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  })

  return `${headers.join(",")}\n${escapedRow.join(",")}`
}

// Export multiple issues to CSV
function exportIssuesToCSV(issues: Issue[], session: Session | null): string {
  // Define CSV headers
  const headers = [
    "ID",
    "Title",
    "Severity",
    "Created",
    "URL",
    "Tags",
    "Notes",
    "Element Type",
    "Element ID",
    "Element Class",
    "Console Errors",
    "Network Errors",
    "Session Name",
    "Session URL",
  ]

  // Format the data for each issue
  const rows = issues.map((issue) => {
    const row = [
      issue.id,
      issue.title || "Untitled Issue",
      issue.severity || "Not specified",
      new Date(issue.timestamp).toLocaleString(),
      issue.url || "",
      issue.tags ? issue.tags.join(", ") : "",
      issue.notes ? issue.notes.replace(/\n/g, " ") : "",
      issue.elementDetails?.tagName || "",
      issue.elementDetails?.id || "",
      issue.elementDetails?.className || "",
      issue.consoleErrors ? issue.consoleErrors.length.toString() : "0",
      issue.networkErrors ? issue.networkErrors.length.toString() : "0",
      session ? session.name : "",
      session ? session.url : "",
    ]

    // Escape CSV values
    return row.map((value) => {
      // If value contains comma, newline, or double quote, wrap in quotes
      if (value.includes(",") || value.includes("\n") || value.includes('"')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    })
  })

  // Combine headers and rows
  return `${headers.join(",")}\n${rows.map((row) => row.join(",")).join("\n")}`
}

// Export a single issue to GitHub issue format
function exportIssueToGitHub(issue: Issue): string {
  let markdown = `<!-- Generated by FixHero Dev Inspector -->\n\n`

  // Title and severity badge
  markdown += `# ${issue.title || "Untitled Issue"}`

  if (issue.severity) {
    const severityColor =
      issue.severity === "critical"
        ? "red"
        : issue.severity === "high"
          ? "orange"
          : issue.severity === "medium"
            ? "yellow"
            : "green"

    markdown += ` ![${issue.severity}](https://img.shields.io/badge/${issue.severity}-${severityColor})\n\n`
  } else {
    markdown += "\n\n"
  }

  // Add metadata
  if (issue.url) {
    markdown += `**URL:** ${issue.url}\n\n`
  }

  if (issue.tags && issue.tags.length > 0) {
    markdown += `**Tags:** ${issue.tags.join(", ")}\n\n`
  }

  // Add notes
  if (issue.notes) {
    markdown += `## Description\n\n${issue.notes}\n\n`
  }

  // Add element details
  if (issue.elementDetails) {
    markdown += "## Element Details\n\n"
    markdown += `- **Type:** ${issue.elementDetails.tagName || "Unknown"}\n`

    if (issue.elementDetails.id) {
      markdown += `- **ID:** ${issue.elementDetails.id}\n`
    }

    if (issue.elementDetails.className) {
      markdown += `- **Class:** ${issue.elementDetails.className}\n`
    }

    if (issue.elementDetails.selector) {
      markdown += `- **CSS Selector:** \`${issue.elementDetails.selector}\`\n`
    }

    markdown += "\n"
  }

  // Add console errors
  if (issue.consoleErrors && issue.consoleErrors.length > 0) {
    markdown += "## Console Errors\n\n"
    issue.consoleErrors.forEach((error, index) => {
      markdown += `<details>\n<summary>Error ${index + 1}</summary>\n\n\`\`\`\n${error}\n\`\`\`\n</details>\n\n`
    })
  }

  // Add network errors
  if (issue.networkErrors && issue.networkErrors.length > 0) {
    markdown += "## Network Errors\n\n"
    issue.networkErrors.forEach((error, index) => {
      markdown += `<details>\n<summary>Error ${index + 1}: ${error.url || "Unknown URL"}</summary>\n\n`
      markdown += `- **URL:** ${error.url || "Unknown"}\n`
      markdown += `- **Status:** ${error.status || "Unknown"}\n`
      markdown += `- **Type:** ${error.type || "Unknown"}\n`
      if (error.message) {
        markdown += `- **Message:** ${error.message}\n`
      }
      markdown += "</details>\n\n"
    })
  }

  // Add footer
  markdown += "---\n\n"
  markdown += `*This issue was generated by FixHero Dev Inspector on ${new Date().toLocaleString()}*`

  return markdown
}

// Export multiple issues to GitHub issue format
function exportIssuesToGitHub(issues: Issue[], session: Session | null): string {
  // For GitHub, we'll create a format that can be easily copied for each issue
  let markdown = `# FixHero Dev Inspector Report\n\n`

  // Add session info if available
  if (session) {
    markdown += `## Session: ${session.name}\n\n`
    markdown += `- **URL:** ${session.url || "Not specified"}\n`
    markdown += `- **Created:** ${new Date(session.created).toLocaleString()}\n`
    markdown += `- **Browser:** ${session.browserInfo || "Not specified"}\n\n`
  }

  // Add summary
  markdown += `## Summary\n\n`
  markdown += `Total Issues: ${issues.length}\n\n`

  // Count by severity
  const severityCounts = {
    critical: issues.filter((issue) => issue.severity === "critical").length,
    high: issues.filter((issue) => issue.severity === "high").length,
    medium: issues.filter((issue) => issue.severity === "medium").length,
    low: issues.filter((issue) => issue.severity === "low").length,
  }

  markdown += `- Critical: ${severityCounts.critical}\n`
  markdown += `- High: ${severityCounts.high}\n`
  markdown += `- Medium: ${severityCounts.medium}\n`
  markdown += `- Low: ${severityCounts.low}\n\n`

  // Add each issue as a GitHub issue template
  issues.forEach((issue, index) => {
    markdown += `## GitHub Issue ${index + 1}\n\n`
    markdown += "```markdown\n"
    markdown += exportIssueToGitHub(issue)
    markdown += "\n```\n\n"

    if (index < issues.length - 1) {
      markdown += "---\n\n"
    }
  })

  return markdown
}

// Export a single issue to Cursor format
function exportIssueToCursor(issue: Issue): string {
  let markdown = `# ${issue.title || "Untitled Issue"}\n\n`

  // Add metadata
  markdown += `**Severity:** ${issue.severity || "Not specified"}\n`
  markdown += `**Created:** ${new Date(issue.timestamp).toLocaleString()}\n`

  if (issue.tags && issue.tags.length > 0) {
    markdown += `**Tags:** ${issue.tags.join(", ")}\n`
  }

  if (issue.url) {
    markdown += `**URL:** ${issue.url}\n`
  }

  markdown += "\n"

  // Add notes
  if (issue.notes) {
    markdown += `## Notes\n\n${issue.notes}\n\n`
  }

  // Add element details
  if (issue.elementDetails) {
    markdown += "## Element Details\n\n"

    if (issue.elementDetails.selector) {
      markdown += `**Selector:** \`${issue.elementDetails.selector}\`\n\n`
    }

    // Create a code snippet for the element
    markdown += "```html\n"

    let elementHtml = `<${issue.elementDetails.tagName || "div"}`

    if (issue.elementDetails.id) {
      elementHtml += ` id="${issue.elementDetails.id}"`
    }

    if (issue.elementDetails.className) {
      elementHtml += ` class="${issue.elementDetails.className}"`
    }

    // Add some attributes if they exist
    if (issue.elementDetails.attributes) {
      issue.elementDetails.attributes.forEach((attr) => {
        if (attr.name !== "id" && attr.name !== "class") {
          elementHtml += ` ${attr.name}="${attr.value}"`
        }
      })
    }

    if (issue.elementDetails.textContent) {
      elementHtml += `>${issue.elementDetails.textContent}</${issue.elementDetails.tagName || "div"}>`
    } else {
      elementHtml += ` />`
    }

    markdown += elementHtml + "\n"
    markdown += "```\n\n"
  }

  // Add console errors
  if (issue.consoleErrors && issue.consoleErrors.length > 0) {
    markdown += "## Console Errors\n\n"
    issue.consoleErrors.forEach((error, index) => {
      markdown += `### Error ${index + 1}\n\`\`\`\n${error}\n\`\`\`\n\n`
    })
  }

  // Add network errors
  if (issue.networkErrors && issue.networkErrors.length > 0) {
    markdown += "## Network Errors\n\n"
    issue.networkErrors.forEach((error, index) => {
      markdown += `### Error ${index + 1}\n`
      markdown += `**URL:** ${error.url || "Unknown"}\n`
      markdown += `**Status:** ${error.status || "Unknown"}\n`
      if (error.message) {
        markdown += `**Message:** ${error.message}\n`
      }
      markdown += "\n"
    })
  }

  return markdown
}

// Export multiple issues to Cursor format
function exportIssuesToCursor(issues: Issue[], session: Session | null): string {
  let markdown = `# FixHero Dev Inspector Report\n\n`

  // Add session info if available
  if (session) {
    markdown += `## Session: ${session.name}\n\n`
    markdown += `**URL:** ${session.url || "Not specified"}\n`
    markdown += `**Created:** ${new Date(session.created).toLocaleString()}\n`
    markdown += `**Browser:** ${session.browserInfo || "Not specified"}\n\n`
  }

  // Add each issue
  issues.forEach((issue, index) => {
    markdown += `## Issue ${index + 1}: ${issue.title || "Untitled Issue"}\n\n`

    // Add metadata
    markdown += `**Severity:** ${issue.severity || "Not specified"}\n`

    if (issue.tags && issue.tags.length > 0) {
      markdown += `**Tags:** ${issue.tags.join(", ")}\n`
    }

    if (issue.url) {
      markdown += `**URL:** ${issue.url}\n`
    }

    markdown += "\n"

    // Add notes
    if (issue.notes) {
      markdown += `### Notes\n\n${issue.notes}\n\n`
    }

    // Add element details
    if (issue.elementDetails) {
      markdown += "### Element Details\n\n"

      if (issue.elementDetails.selector) {
        markdown += `**Selector:** \`${issue.elementDetails.selector}\`\n\n`
      }

      // Create a code snippet for the element
      markdown += "```html\n"

      let elementHtml = `<${issue.elementDetails.tagName || "div"}`

      if (issue.elementDetails.id) {
        elementHtml += ` id="${issue.elementDetails.id}"`
      }

      if (issue.elementDetails.className) {
        elementHtml += ` class="${issue.elementDetails.className}"`
      }

      // Add some attributes if they exist
      if (issue.elementDetails.attributes) {
        issue.elementDetails.attributes.forEach((attr) => {
          if (attr.name !== "id" && attr.name !== "class") {
            elementHtml += ` ${attr.name}="${attr.value}"`
          }
        })
      }

      if (issue.elementDetails.textContent) {
        elementHtml += `>${issue.elementDetails.textContent}</${issue.elementDetails.tagName || "div"}>`
      } else {
        elementHtml += ` />`
      }

      markdown += elementHtml + "\n"
      markdown += "```\n\n"
    }

    // Add console errors
    if (issue.consoleErrors && issue.consoleErrors.length > 0) {
      markdown += "### Console Errors\n\n"
      issue.consoleErrors.forEach((error, errorIndex) => {
        markdown += `#### Error ${errorIndex + 1}\n\`\`\`\n${error}\n\`\`\`\n\n`
      })
    }

    // Add network errors
    if (issue.networkErrors && issue.networkErrors.length > 0) {
      markdown += "### Network Errors\n\n"
      issue.networkErrors.forEach((error, errorIndex) => {
        markdown += `#### Error ${errorIndex + 1}\n`
        markdown += `**URL:** ${error.url || "Unknown"}\n`
        markdown += `**Status:** ${error.status || "Unknown"}\n`
        if (error.message) {
          markdown += `**Message:** ${error.message}\n`
        }
        markdown += "\n"
      })
    }

    // Add separator between issues
    if (index < issues.length - 1) {
      markdown += "---\n\n"
    }
  })

  return markdown
}

// Export a single issue to Notion format
function exportIssueToNotion(issue: Issue): string {
  // Notion uses a similar format to Markdown, but with some specific conventions
  let markdown = `# ${issue.title || "Untitled Issue"}\n\n`

  // Add metadata as a table
  markdown += "| Property | Value |\n"
  markdown += "| --- | --- |\n"
  markdown += `| ID | ${issue.id} |\n`
  markdown += `| Severity | ${issue.severity || "Not specified"} |\n`
  markdown += `| Created | ${new Date(issue.timestamp).toLocaleString()} |\n`

  if (issue.tags && issue.tags.length > 0) {
    markdown += `| Tags | ${issue.tags.join(", ")} |\n`
  }

  if (issue.url) {
    markdown += `| URL | ${issue.url} |\n`
  }

  markdown += "\n"

  // Add notes
  if (issue.notes) {
    markdown += `## Notes\n\n${issue.notes}\n\n`
  }

  // Add element details
  if (issue.elementDetails) {
    markdown += "## Element Details\n\n"

    // Element details as a table
    markdown += "| Property | Value |\n"
    markdown += "| --- | --- |\n"
    markdown += `| Type | ${issue.elementDetails.tagName || "Unknown"} |\n`

    if (issue.elementDetails.id) {
      markdown += `| ID | ${issue.elementDetails.id} |\n`
    }

    if (issue.elementDetails.className) {
      markdown += `| Class | ${issue.elementDetails.className} |\n`
    }

    if (issue.elementDetails.textContent) {
      markdown += `| Text Content | ${issue.elementDetails.textContent} |\n`
    }

    if (issue.elementDetails.selector) {
      markdown += `| CSS Selector | \`${issue.elementDetails.selector}\` |\n`
    }

    if (issue.elementDetails.xpath) {
      markdown += `| XPath | \`${issue.elementDetails.xpath}\` |\n`
    }

    markdown += "\n"
  }

  // Add console errors
  if (issue.consoleErrors && issue.consoleErrors.length > 0) {
    markdown += "## Console Errors\n\n"
    issue.consoleErrors.forEach((error, index) => {
      markdown += `### Error ${index + 1}\n\`\`\`\n${error}\n\`\`\`\n\n`
    })
  }

  // Add network errors
  if (issue.networkErrors && issue.networkErrors.length > 0) {
    markdown += "## Network Errors\n\n"

    // Network errors as a table
    markdown += "| URL | Status | Type | Message |\n"
    markdown += "| --- | --- | --- | --- |\n"

    issue.networkErrors.forEach((error) => {
      markdown += `| ${error.url || "Unknown"} | ${error.status || "Unknown"} | ${error.type || "Unknown"} | ${error.message || ""} |\n`
    })

    markdown += "\n"
  }

  // Add screenshot placeholder
  if (issue.screenshot) {
    markdown += "## Screenshot\n\n"
    markdown += "*Screenshot available in the FixHero Dev Inspector extension*\n\n"
  }

  return markdown
}

// Export multiple issues to Notion format
function exportIssuesToNotion(issues: Issue[], session: Session | null): string {
  let markdown = `# FixHero Dev Inspector Report\n\n`

  // Add session info if available
  if (session) {
    markdown += `## Session: ${session.name}\n\n`

    // Session info as a table
    markdown += "| Property | Value |\n"
    markdown += "| --- | --- |\n"
    markdown += `| URL | ${session.url || "Not specified"} |\n`
    markdown += `| Created | ${new Date(session.created).toLocaleString()} |\n`
    markdown += `| Last Updated | ${new Date(session.lastUpdated).toLocaleString()} |\n`
    markdown += `| Browser | ${session.browserInfo || "Not specified"} |\n\n`
  }

  // Add summary
  markdown += `## Summary\n\n`

  // Summary as a table
  markdown += "| Severity | Count |\n"
  markdown += "| --- | --- |\n"
  markdown += `| Critical | ${issues.filter((issue) => issue.severity === "critical").length} |\n`
  markdown += `| High | ${issues.filter((issue) => issue.severity === "high").length} |\n`
  markdown += `| Medium | ${issues.filter((issue) => issue.severity === "medium").length} |\n`
  markdown += `| Low | ${issues.filter((issue) => issue.severity === "low").length} |\n`
  markdown += `| Total | ${issues.length} |\n\n`

  // Add issues table
  markdown += `## Issues\n\n`

  // Issues as a table
  markdown += "| ID | Title | Severity | Tags | URL |\n"
  markdown += "| --- | --- | --- | --- | --- |\n"

  issues.forEach((issue) => {
    markdown += `| ${issue.id} | ${issue.title || "Untitled Issue"} | ${issue.severity || "Not specified"} | ${issue.tags ? issue.tags.join(", ") : ""} | ${issue.url || ""} |\n`
  })

  markdown += "\n"

  // Add detailed issues
  issues.forEach((issue, index) => {
    markdown += `## Issue ${index + 1}: ${issue.title || "Untitled Issue"}\n\n`

    // Add metadata as a table
    markdown += "| Property | Value |\n"
    markdown += "| --- | --- |\n"
    markdown += `| ID | ${issue.id} |\n`
    markdown += `| Severity | ${issue.severity || "Not specified"} |\n`
    markdown += `| Created | ${new Date(issue.timestamp).toLocaleString()} |\n`

    if (issue.tags && issue.tags.length > 0) {
      markdown += `| Tags | ${issue.tags.join(", ")} |\n`
    }

    if (issue.url) {
      markdown += `| URL | ${issue.url} |\n`
    }

    markdown += "\n"

    // Add notes
    if (issue.notes) {
      markdown += `### Notes\n\n${issue.notes}\n\n`
    }

    // Add element details
    if (issue.elementDetails) {
      markdown += "### Element Details\n\n"

      // Element details as a table
      markdown += "| Property | Value |\n"
      markdown += "| --- | --- |\n"
      markdown += `| Type | ${issue.elementDetails.tagName || "Unknown"} |\n`

      if (issue.elementDetails.id) {
        markdown += `| ID | ${issue.elementDetails.id} |\n`
      }

      if (issue.elementDetails.className) {
        markdown += `| Class | ${issue.elementDetails.className} |\n`
      }

      if (issue.elementDetails.selector) {
        markdown += `| CSS Selector | \`${issue.elementDetails.selector}\` |\n`
      }

      markdown += "\n"
    }

    // Add separator between issues
    if (index < issues.length - 1) {
      markdown += "---\n\n"
    }
  })

  return markdown
}

// Download exported content as a file
export function downloadExport(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()

  URL.revokeObjectURL(url)
}

// Helper function to get MIME type for export format
export function getMimeType(format: ExportFormat): string {
  switch (format) {
    case "markdown":
    case "github":
    case "cursor":
    case "notion":
      return "text/markdown"
    case "json":
      return "application/json"
    case "csv":
      return "text/csv"
    default:
      return "text/plain"
  }
}

// Helper function to get file extension for export format
export function getFileExtension(format: ExportFormat): string {
  switch (format) {
    case "markdown":
    case "github":
    case "cursor":
    case "notion":
      return "md"
    case "json":
      return "json"
    case "csv":
      return "csv"
    default:
      return "txt"
  }
}
