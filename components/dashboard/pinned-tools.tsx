"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Bug,
  Camera,
  Code,
  Eye,
  FileText,
  Grid,
  Palette,
  PlusCircle,
  Smartphone,
  Type,
  X,
  Network,
  Terminal,
  Database,
  BarChart2,
  Zap,
  Settings,
  Layers,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Tool {
  id: string
  name: string
  icon: React.ReactNode
  category: "frontend" | "backend" | "design" | "general"
  description: string
  path: string
}

interface PinnedToolsProps {
  onNavigate: (path: string) => void
  userRole: "frontend" | "backend" | "design" | "all"
}

export function PinnedTools({ onNavigate, userRole }: PinnedToolsProps) {
  // Define all available tools
  const allTools: Tool[] = [
    // Frontend tools
    {
      id: "responsive-tester",
      name: "Responsive Tester",
      icon: <Smartphone className="h-4 w-4" />,
      category: "frontend",
      description: "Test your website at different screen sizes",
      path: "/frontend-tools?tab=responsive",
    },
    {
      id: "contrast-checker",
      name: "Contrast Checker",
      icon: <Eye className="h-4 w-4" />,
      category: "frontend",
      description: "Check color contrast for accessibility",
      path: "/frontend-tools?tab=contrast",
    },
    {
      id: "grid-visualizer",
      name: "Grid Visualizer",
      icon: <Grid className="h-4 w-4" />,
      category: "frontend",
      description: "Visualize and generate CSS grid layouts",
      path: "/frontend-tools?tab=grid",
    },
    {
      id: "css-inspector",
      name: "CSS Inspector",
      icon: <Code className="h-4 w-4" />,
      category: "frontend",
      description: "Inspect and edit CSS properties",
      path: "/frontend-tools?tab=css",
    },
    {
      id: "typography",
      name: "Typography",
      icon: <Type className="h-4 w-4" />,
      category: "frontend",
      description: "Analyze and test typography settings",
      path: "/frontend-tools?tab=typography",
    },
    {
      id: "framework-helpers",
      name: "Framework Helpers",
      icon: <Palette className="h-4 w-4" />,
      category: "frontend",
      description: "Reference for CSS frameworks",
      path: "/frontend-tools?tab=frameworks",
    },

    // Backend tools
    {
      id: "network-monitor",
      name: "Network Monitor",
      icon: <Network className="h-4 w-4" />,
      category: "backend",
      description: "Monitor network requests and responses",
      path: "/backend-tools?tab=network",
    },
    {
      id: "console-monitor",
      name: "Console Monitor",
      icon: <Terminal className="h-4 w-4" />,
      category: "backend",
      description: "Track console logs and errors",
      path: "/backend-tools?tab=console",
    },
    {
      id: "environment",
      name: "Environment",
      icon: <Database className="h-4 w-4" />,
      category: "backend",
      description: "View environment variables and settings",
      path: "/backend-tools?tab=environment",
    },

    // Design tools
    {
      id: "color-palette",
      name: "Color Palette",
      icon: <Palette className="h-4 w-4" />,
      category: "design",
      description: "Generate and test color palettes",
      path: "/design-tools?tab=colors",
    },
    {
      id: "spacing-analyzer",
      name: "Spacing Analyzer",
      icon: <Layers className="h-4 w-4" />,
      category: "design",
      description: "Analyze spacing and alignment",
      path: "/design-tools?tab=spacing",
    },

    // General tools
    {
      id: "element-inspector",
      name: "Element Inspector",
      icon: <Bug className="h-4 w-4" />,
      category: "general",
      description: "Inspect and capture element details",
      path: "/inspector",
    },
    {
      id: "screenshot",
      name: "Screenshot",
      icon: <Camera className="h-4 w-4" />,
      category: "general",
      description: "Capture screenshots of the page",
      path: "/screenshot",
    },
    {
      id: "notes",
      name: "Notes",
      icon: <FileText className="h-4 w-4" />,
      category: "general",
      description: "Add notes to your session",
      path: "/notes",
    },
    {
      id: "analytics",
      name: "Analytics",
      icon: <BarChart2 className="h-4 w-4" />,
      category: "general",
      description: "View session analytics",
      path: "/analytics",
    },
    {
      id: "ai-summary",
      name: "AI Summary",
      icon: <Zap className="h-4 w-4" />,
      category: "general",
      description: "Generate AI summaries of issues",
      path: "/ai-summary",
    },
    {
      id: "settings",
      name: "Settings",
      icon: <Settings className="h-4 w-4" />,
      category: "general",
      description: "Configure extension settings",
      path: "/settings",
    },
  ]

  // Get pinned tools from localStorage or use defaults
  const [pinnedTools, setPinnedTools] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fixhero_pinned_tools")
      if (saved) {
        return JSON.parse(saved)
      }
    }
    // Default pinned tools based on role
    switch (userRole) {
      case "frontend":
        return ["responsive-tester", "contrast-checker", "element-inspector", "css-inspector"]
      case "backend":
        return ["network-monitor", "console-monitor", "environment", "element-inspector"]
      case "design":
        return ["contrast-checker", "color-palette", "spacing-analyzer", "screenshot"]
      default:
        return ["element-inspector", "screenshot", "notes", "ai-summary"]
    }
  })

  // Save pinned tools to localStorage when they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("fixhero_pinned_tools", JSON.stringify(pinnedTools))
    }
  }, [pinnedTools])

  // Filter tools based on user role
  const getAvailableTools = () => {
    if (userRole === "all") return allTools
    return allTools.filter((tool) => tool.category === userRole || tool.category === "general")
  }

  // Get tools that are not pinned
  const unpinnedTools = getAvailableTools().filter((tool) => !pinnedTools.includes(tool.id))

  // Add a tool to pinned tools
  const pinTool = (toolId: string) => {
    if (pinnedTools.length < 8) {
      // Limit to 8 pinned tools
      setPinnedTools([...pinnedTools, toolId])
    }
  }

  // Remove a tool from pinned tools
  const unpinTool = (toolId: string) => {
    setPinnedTools(pinnedTools.filter((id) => id !== toolId))
  }

  // Get tool by ID
  const getToolById = (id: string) => allTools.find((tool) => tool.id === id)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Pinned Tools</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <PlusCircle className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {unpinnedTools.length > 0 ? (
                unpinnedTools.map((tool) => (
                  <DropdownMenuItem key={tool.id} onClick={() => pinTool(tool.id)}>
                    {tool.icon}
                    <span className="ml-2">{tool.name}</span>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>All tools are pinned</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {pinnedTools.map((toolId) => {
            const tool = getToolById(toolId)
            if (!tool) return null

            return (
              <TooltipProvider key={toolId}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative group">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-10 justify-start"
                        onClick={() => onNavigate(tool.path)}
                      >
                        {tool.icon}
                        <span className="ml-2 truncate">{tool.name}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 absolute -top-2 -right-2 rounded-full bg-background border opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          unpinTool(toolId)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{tool.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
