"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { RefreshCw, Check, X, Info, Pipette } from "lucide-react"
import { cn } from "@/lib/utils"

// WCAG contrast ratio levels
const WCAG_LEVELS = {
  AALarge: 3.0,
  AA: 4.5,
  AAALarge: 4.5,
  AAA: 7.0,
}

// Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : null
}

// Convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}

// Calculate relative luminance
function getLuminance(rgb: { r: number; g: number; b: number }): number {
  const { r, g, b } = rgb
  const [R, G, B] = [r, g, b].map((v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

// Calculate contrast ratio
function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)

  if (!rgb1 || !rgb2) return 1

  const luminance1 = getLuminance(rgb1)
  const luminance2 = getLuminance(rgb2)

  const brightest = Math.max(luminance1, luminance2)
  const darkest = Math.min(luminance1, luminance2)

  return (brightest + 0.05) / (darkest + 0.05)
}

// Check if a color passes WCAG criteria
function checkWcagCompliance(ratio: number) {
  return {
    AALarge: ratio >= WCAG_LEVELS.AALarge,
    AA: ratio >= WCAG_LEVELS.AA,
    AAALarge: ratio >= WCAG_LEVELS.AAALarge,
    AAA: ratio >= WCAG_LEVELS.AAA,
  }
}

// Get a readable text color (black or white) based on background
function getReadableTextColor(bgColor: string): string {
  const rgb = hexToRgb(bgColor)
  if (!rgb) return "#000000"

  const luminance = getLuminance(rgb)
  return luminance > 0.5 ? "#000000" : "#ffffff"
}

// Suggest accessible colors
function suggestAccessibleColors(baseColor: string, targetRatio = 4.5): { lighter: string; darker: string } {
  const rgb = hexToRgb(baseColor)
  if (!rgb) return { lighter: "#ffffff", darker: "#000000" }

  // Get current luminance
  const baseLuminance = getLuminance(rgb)

  // Function to adjust color
  const adjustColor = (
    color: { r: number; g: number; b: number },
    amount: number,
  ): { r: number; g: number; b: number } => {
    return {
      r: Math.max(0, Math.min(255, Math.round(color.r + amount))),
      g: Math.max(0, Math.min(255, Math.round(color.g + amount))),
      b: Math.max(0, Math.min(255, Math.round(color.b + amount))),
    }
  }

  // Find lighter color
  let lighterColor = { ...rgb }
  let lighterLuminance = baseLuminance
  let lighterRatio = 1

  // Find darker color
  let darkerColor = { ...rgb }
  let darkerLuminance = baseLuminance
  let darkerRatio = 1

  // Adjust in steps of 5 for better performance
  const step = 5

  // Find lighter color that meets the target ratio
  for (let i = 0; i <= 255; i += step) {
    lighterColor = adjustColor(rgb, i)
    lighterLuminance = getLuminance(lighterColor)
    lighterRatio = (lighterLuminance + 0.05) / (baseLuminance + 0.05)

    if (lighterRatio >= targetRatio) break
  }

  // Find darker color that meets the target ratio
  for (let i = 0; i <= 255; i += step) {
    darkerColor = adjustColor(rgb, -i)
    darkerLuminance = getLuminance(darkerColor)
    darkerRatio = (baseLuminance + 0.05) / (darkerLuminance + 0.05)

    if (darkerRatio >= targetRatio) break
  }

  return {
    lighter: rgbToHex(lighterColor.r, lighterColor.g, lighterColor.b),
    darker: rgbToHex(darkerColor.r, darkerColor.g, darkerColor.b),
  }
}

export function ColorContrastChecker() {
  const [foregroundColor, setForegroundColor] = useState("#000000")
  const [backgroundColor, setBackgroundColor] = useState("#ffffff")
  const [contrastRatio, setContrastRatio] = useState(21)
  const [compliance, setCompliance] = useState({
    AALarge: true,
    AA: true,
    AAALarge: true,
    AAA: true,
  })
  const [fontSize, setFontSize] = useState(16)
  const [fontWeight, setFontWeight] = useState("normal")
  const [suggestions, setSuggestions] = useState<{ lighter: string; darker: string }>({
    lighter: "#ffffff",
    darker: "#000000",
  })
  const [eyeDropperActive, setEyeDropperActive] = useState(false)
  const [eyeDropperTarget, setEyeDropperTarget] = useState<"foreground" | "background">("foreground")
  
  // Check if EyeDropper API is available
  const isEyeDropperSupported = typeof window !== "undefined" && "EyeDropper" in window
  
  // Update contrast ratio and compliance when colors change
  useEffect(() => {
    const ratio = getContrastRatio(foregroundColor, backgroundColor)
    setContrastRatio(ratio)
    setCompliance(checkWcagCompliance(ratio))
    
    // Update suggestions
    setSuggestions(suggestAccessibleColors(backgroundColor))
  }, [foregroundColor, backgroundColor])
  
  // Handle eyedropper selection
  const handleEyeDropper = async (target: "foreground" | "background") => {
    if (!isEyeDropperSupported) return
    
    setEyeDropperActive(true)
    setEyeDropperTarget(target)
    
    try {
      // @ts-ignore - EyeDropper is not in the TypeScript DOM types yet
      const eyeDropper = new window.EyeDropper()
      const result = await eyeDropper.open()
      
      if (target === "foreground") {
        setForegroundColor(result.sRGBHex)
      } else {
        setBackgroundColor(result.sRGBHex)
      }
    } catch (e) {
      console.log("EyeDropper was cancelled or failed")
    } finally {
      setEyeDropperActive(false)
    }
  }
  
  // Swap foreground and background colors
  const swapColors = () => {
    const temp = foregroundColor
    setForegroundColor(backgroundColor)
    setBackgroundColor(temp)
  }
  
  // Get rating text based on contrast ratio
  const getRatingText = () => {
    if (contrastRatio >= 7) return "Excellent"
    if (contrastRatio >= 4.5) return "Good"
    if (contrastRatio >= 3) return "Fair"
    return "Poor"
  }
  
  // Get rating color based on contrast ratio
  const getRatingColor = () => {
    if (contrastRatio >= 7) return "text-green-500"
    if (contrastRatio >= 4.5) return "text-blue-500"
    if (contrastRatio >= 3) return "text-amber-500"
    return "text-red-500"
  }
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">WCAG Color Contrast Checker</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="checker">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="checker">Contrast Checker</TabsTrigger>
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="checker">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <div className="flex gap-2">
                      <div 
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: foregroundColor }}
                      ></div>
                      <Input 
                        value={foregroundColor} 
                        onChange={(e) => setForegroundColor(e.target.value)}
                        className="flex-1"
                      />
                      {isEyeDropperSupported && (
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleEyeDropper("foreground")}
                          disabled={eyeDropperActive}
                        >
                          <Pipette className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Background Color</Label>
                    <div className="flex gap-2">
                      <div 
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: backgroundColor }}
                      ></div>
                      <Input 
                        value={backgroundColor} 
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="flex-1"
                      />
                      {isEyeDropperSupported && (
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleEyeDropper("background")}
                          disabled={eyeDropperActive}
                        >
                          <Pipette className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={swapColors}
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Swap Colors
                  </Button>
                  
                  <div className="space-y-2">
                    <Label>Font Size: {fontSize}px</Label>
                    <Slider
                      value={[fontSize]}
                      min={8}
                      max={32}
                      step={1}
                      onValueChange={(value) => setFontSize(value[0])}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Font Weight</Label>
                    <div className="flex gap-2">
                      <Button 
                        variant={fontWeight === "normal" ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setFontWeight("normal")}
                        className="flex-1"
                      >
                        Normal
                      </Button>
                      <Button 
                        variant={fontWeight === "bold" ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setFontWeight("bold")}
                        className="flex-1"
                      >
                        Bold
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div 
                    className="p-6 rounded-lg border flex items-center justify-center min-h-[200px]"
                    style={{ 
                      backgroundColor: backgroundColor,
                      color: foregroundColor,
                    }}
                  >
                    <p style={{ 
                      fontSize: `${fontSize}px`,
                      fontWeight: fontWeight,
                    }}>
                      Sample Text
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg border bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Contrast Ratio</h3>
                      <span className={cn("font-bold text-lg", getRatingColor())}>
                        {contrastRatio.toFixed(2)}:1
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4">
                      Rating: <span className={getRatingColor()}>{getRatingText()}</span>
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="text-sm">AA Level (Normal Text)</span>
                          <Info className="h-3 w-3 ml-1 text-muted-foreground" />
                        </div>
                        {compliance.AA ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="text-sm">AA Level (Large Text)</span>
                          <Info className="h-3 w-3 ml-1 text-muted-foreground" />
                        </div>
                        {compliance.AALarge ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="text-sm">AAA Level (Normal Text)</span>
                          <Info className="h-3 w-3 ml-1 text-muted-foreground" />
                        </div>
                        {compliance.AAA ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="text-sm">AAA Level (Large Text)</span>
                          <Info className="h-3 w-3 ml-1 text-muted-foreground" />
                        </div>
                        {compliance.AAALarge ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="suggestions">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Lighter Alternative</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="p-6 rounded-lg border flex items-center justify-center min-h-[100px] mb-4"
                        style={{ 
                          backgroundColor: backgroundColor,
                          color: suggestions.lighter,
                        }}
                      >
                        <p style={{ 
                          fontSize: `${fontSize}px`,
                          fontWeight: fontWeight,
                        }}>
                          Sample Text
                        </p>
                      </div>
                      
                      <div className="flex gap-2 items-center">
                        <div 
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: suggestions.lighter }}
                        ></div>
                        <Input 
                          value={suggestions.lighter} 
                          readOnly
                          className="flex-1"
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setForegroundColor(suggestions.lighter)}
                        >
                          Apply
                        </Button>
                \
