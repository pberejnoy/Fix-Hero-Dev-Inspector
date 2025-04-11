import type { Issue } from "./types"
import { canPerformAction } from "./subscription-service"

// Interface for tag suggestions
interface TagSuggestions {
  tags: string[]
  confidence: number
}

// Function to generate tags for an issue using AI
export async function generateTagsForIssue(issue: Issue): Promise<TagSuggestions> {
  try {
    // Check if user can use AI features
    const canUseAI = await canPerformAction("use_ai_feature")
    if (!canUseAI) {
      console.log("AI features not available in current subscription tier. Using fallback tagging.")
      return generateFallbackTags(issue)
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API key not found. Using fallback tagging mechanism.")
      return generateFallbackTags(issue)
    }

    // Prepare the issue data for the AI model
    const issueData = {
      title: issue.title,
      notes: issue.notes || "",
      elementType: issue.elementDetails?.type || "",
      url: issue.url || "",
      consoleErrors: issue.consoleErrors || [],
      networkErrors: issue.networkErrors || [],
    }

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a web development expert. Analyze the provided issue and suggest relevant tags. Respond with a JSON array of tags only.",
          },
          {
            role: "user",
            content: `Generate tags for this web issue: ${JSON.stringify(issueData)}`,
          },
        ],
        max_tokens: 150,
      }),
    })

    if (!response.ok) {
      console.error("OpenAI API error:", await response.text())
      return generateFallbackTags(issue)
    }

    const data = await response.json()

    // Parse the AI response to extract tags
    let tags: string[] = []
    try {
      const content = data.choices[0].message.content
      // Try to parse JSON response
      if (content.includes("[") && content.includes("]")) {
        const jsonStr = content.substring(content.indexOf("["), content.lastIndexOf("]") + 1)
        tags = JSON.parse(jsonStr)
      } else {
        // If not JSON, split by commas or spaces
        tags = content.split(/,|\s+/).filter(Boolean)
      }

      // Clean up tags
      tags = tags.map((tag) => tag.trim().replace(/["']/g, "")).filter((tag) => tag.length > 0 && tag.length < 20)

      // Log for future AI training
      logAIAction("tag_generation", {
        input: issueData,
        output: tags,
        success: true,
      })

      return {
        tags,
        confidence: 0.85,
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError)
      return generateFallbackTags(issue)
    }
  } catch (error) {
    console.error("Error generating tags with AI:", error)
    return generateFallbackTags(issue)
  }
}

// Fallback mechanism for when AI is unavailable
function generateFallbackTags(issue: Issue): TagSuggestions {
  const tags: string[] = []

  // Add tags based on element type
  if (issue.elementDetails?.tagName) {
    tags.push(issue.elementDetails.tagName)
  }

  // Add tags based on console errors
  if (issue.consoleErrors && issue.consoleErrors.length > 0) {
    tags.push("Console Error")

    // Check for common error types
    const errorText = issue.consoleErrors.join(" ")
    if (errorText.includes("TypeError")) tags.push("TypeError")
    if (errorText.includes("SyntaxError")) tags.push("SyntaxError")
    if (errorText.includes("ReferenceError")) tags.push("ReferenceError")
    if (errorText.includes("undefined")) tags.push("Undefined")
    if (errorText.includes("null")) tags.push("Null Reference")
  }

  // Add tags based on network errors
  if (issue.networkErrors && issue.networkErrors.length > 0) {
    tags.push("Network Error")

    // Check for common status codes
    const hasStatus = (status: number) => issue.networkErrors?.some((err) => err.status === status)

    if (hasStatus(404)) tags.push("404")
    if (hasStatus(500)) tags.push("500")
    if (hasStatus(403)) tags.push("403")
  }

  // Add tags based on severity
  if (issue.severity) {
    tags.push(issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1))
  }

  // Add tags based on URL patterns
  if (issue.url) {
    if (issue.url.includes("login")) tags.push("Login")
    if (issue.url.includes("checkout")) tags.push("Checkout")
    if (issue.url.includes("form")) tags.push("Form")
  }

  return {
    tags: [...new Set(tags)], // Remove duplicates
    confidence: 0.6,
  }
}

// Log AI actions for future training
export function logAIAction(action: string, data: any) {
  try {
    // In a production environment, this would send data to a logging service
    console.log(`AI Action Logged: ${action}`, data)

    // Store in localStorage for now (would be Firebase in production)
    const logs = JSON.parse(localStorage.getItem("fixhero_ai_logs") || "[]")
    logs.push({
      timestamp: Date.now(),
      action,
      data,
    })
    localStorage.setItem("fixhero_ai_logs", JSON.stringify(logs))
  } catch (error) {
    console.error("Error logging AI action:", error)
  }
}

// Function to summarize an issue using AI
export async function summarizeIssue(issue: Issue): Promise<string> {
  try {
    // Check if user can use AI features
    const canUseAI = await canPerformAction("use_ai_feature")
    if (!canUseAI) {
      return generateFallbackSummary(issue)
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      return generateFallbackSummary(issue)
    }

    // Prepare the issue data
    const issueData = {
      title: issue.title,
      notes: issue.notes || "",
      elementDetails: issue.elementDetails,
      url: issue.url || "",
      consoleErrors: issue.consoleErrors || [],
      networkErrors: issue.networkErrors || [],
      severity: issue.severity,
      tags: issue.tags || [],
    }

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a web development expert. Summarize the provided issue concisely in 1-2 sentences.",
          },
          {
            role: "user",
            content: `Summarize this web issue: ${JSON.stringify(issueData)}`,
          },
        ],
        max_tokens: 100,
      }),
    })

    if (!response.ok) {
      return generateFallbackSummary(issue)
    }

    const data = await response.json()
    const summary = data.choices[0].message.content.trim()

    // Log for future AI training
    logAIAction("issue_summarization", {
      input: issueData,
      output: summary,
      success: true,
    })

    return summary
  } catch (error) {
    console.error("Error summarizing issue with AI:", error)
    return generateFallbackSummary(issue)
  }
}

// Fallback mechanism for issue summarization
function generateFallbackSummary(issue: Issue): string {
  let summary = `${issue.title || "Untitled Issue"}`

  if (issue.severity) {
    summary += ` (${issue.severity} severity)`
  }

  if (issue.elementDetails?.tagName) {
    summary += ` related to ${issue.elementDetails.tagName} element`
  }

  if (issue.consoleErrors && issue.consoleErrors.length > 0) {
    summary += ` with console errors`
  }

  if (issue.networkErrors && issue.networkErrors.length > 0) {
    summary += ` with network errors`
  }

  return summary
}
