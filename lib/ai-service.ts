import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { Issue } from "./types"

// Interface for AI suggestions
export interface AITagSuggestion {
  tags: string[]
  confidence: number
  reasoning?: string
}

export interface AISummary {
  summary: string
  severity: "critical" | "high" | "medium" | "low"
  priority: string
  suggestedFix?: string
}

// Generate tags for an issue using AI
export async function generateTagsForIssue(issue: Issue): Promise<AITagSuggestion> {
  try {
    // Default response in case of error
    const defaultResponse: AITagSuggestion = {
      tags: ["Auto-Tagged"],
      confidence: 0.5,
    }

    // If no API key is available, return default tags
    if (!process.env.OPENAI_API_KEY) {
      console.warn("No OpenAI API key available for tag generation")
      return defaultResponse
    }

    // Prepare the context for the AI
    let context = `Issue Title: ${issue.title}\n`

    if (issue.notes) {
      context += `Notes: ${issue.notes}\n`
    }

    if (issue.elementDetails) {
      context += `Element Type: ${issue.elementDetails.type}\n`
      context += `Element Text: ${issue.elementDetails.text}\n`
      context += `Element Selector: ${issue.elementDetails.selector}\n`
    }

    if (issue.consoleErrors && issue.consoleErrors.length > 0) {
      context += "Console Errors:\n"
      issue.consoleErrors.forEach((error) => {
        context += `- ${error.message}\n`
      })
    }

    if (issue.networkErrors && issue.networkErrors.length > 0) {
      context += "Network Errors:\n"
      issue.networkErrors.forEach((error) => {
        context += `- ${error.method} ${error.url} - ${error.status} ${error.statusText}\n`
      })
    }

    // Generate tags using AI
    const prompt = `
      You are an AI assistant that helps developers tag issues in a bug tracking system.
      Based on the following issue details, suggest 2-5 relevant tags that would help categorize this issue.
      
      ${context}
      
      Respond in JSON format with the following structure:
      {
        "tags": ["tag1", "tag2", "tag3"],
        "confidence": 0.9,
        "reasoning": "Brief explanation of why these tags were chosen"
      }
      
      Choose from common categories like: UI Bug, JavaScript Error, Network Error, Performance Issue, 
      Accessibility, Form Validation, Authentication, Data Loading, State Management, Rendering Issue, 
      CSS Problem, Mobile Issue, etc. But feel free to suggest more specific tags if appropriate.
      
      Only return the JSON, nothing else.
    `

    const { text } = await generateText({
      model: openai("gpt-3.5-turbo"),
      prompt,
      temperature: 0.3,
      maxTokens: 500,
    })

    try {
      // Parse the JSON response
      const response = JSON.parse(text.trim())
      return {
        tags: response.tags || defaultResponse.tags,
        confidence: response.confidence || defaultResponse.confidence,
        reasoning: response.reasoning,
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError)
      return defaultResponse
    }
  } catch (error) {
    console.error("Error generating tags:", error)
    return {
      tags: ["Auto-Tagged"],
      confidence: 0.5,
    }
  }
}

// Generate a summary for an issue using AI
export async function generateSummaryForIssue(issue: Issue): Promise<AISummary> {
  try {
    // Default response in case of error
    const defaultSummary: AISummary = {
      summary: "Automated summary unavailable",
      severity: issue.severity || "medium",
      priority: "Medium",
    }

    // If no API key is available, return default summary
    if (!process.env.OPENAI_API_KEY) {
      console.warn("No OpenAI API key available for summary generation")
      return defaultSummary
    }

    // Prepare the context for the AI
    let context = `Issue Title: ${issue.title}\n`

    if (issue.notes) {
      context += `Notes: ${issue.notes}\n`
    }

    if (issue.elementDetails) {
      context += `Element Type: ${issue.elementDetails.type}\n`
      context += `Element Text: ${issue.elementDetails.text}\n`
      context += `Element Selector: ${issue.elementDetails.selector}\n`
      context += `Element HTML: ${issue.elementDetails.html}\n`
    }

    if (issue.consoleErrors && issue.consoleErrors.length > 0) {
      context += "Console Errors:\n"
      issue.consoleErrors.forEach((error) => {
        context += `- ${error.message}\n`
      })
    }

    if (issue.networkErrors && issue.networkErrors.length > 0) {
      context += "Network Errors:\n"
      issue.networkErrors.forEach((error) => {
        context += `- ${error.method} ${error.url} - ${error.status} ${error.statusText}\n`
      })
    }

    // Generate summary using AI
    const prompt = `
      You are an AI assistant that helps developers analyze bugs in a web application.
      Based on the following issue details, provide a concise summary, assess severity, and suggest a fix if possible.
      
      ${context}
      
      Respond in JSON format with the following structure:
      {
        "summary": "A concise 1-2 sentence summary of the issue",
        "severity": "critical|high|medium|low",
        "priority": "High|Medium|Low",
        "suggestedFix": "Brief suggestion on how to fix the issue (if enough information is available)"
      }
      
      Only return the JSON, nothing else.
    `

    const { text } = await generateText({
      model: openai("gpt-3.5-turbo"),
      prompt,
      temperature: 0.3,
      maxTokens: 500,
    })

    try {
      // Parse the JSON response
      const response = JSON.parse(text.trim())
      return {
        summary: response.summary || defaultSummary.summary,
        severity: response.severity || defaultSummary.severity,
        priority: response.priority || defaultSummary.priority,
        suggestedFix: response.suggestedFix,
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError)
      return defaultSummary
    }
  } catch (error) {
    console.error("Error generating summary:", error)
    return {
      summary: "Automated summary unavailable",
      severity: issue.severity || "medium",
      priority: "Medium",
    }
  }
}
