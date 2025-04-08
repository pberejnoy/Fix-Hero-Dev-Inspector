"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Smartphone,
  Tablet,
  Monitor,
  Eye,
  Grid,
  Type,
  Code,
  Check,
  X,
  Copy,
  RefreshCw,
  Columns,
  Rows,
  Palette,
  Search,
} from "lucide-react"

export function FrontendTools() {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="responsive" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="responsive" className="flex items-center gap-1">
            <Smartphone className="h-4 w-4" />
            Responsive Tester
          </TabsTrigger>
          <TabsTrigger value="contrast" className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            Contrast Checker
          </TabsTrigger>
          <TabsTrigger value="grid" className="flex items-center gap-1">
            <Grid className="h-4 w-4" />
            Grid Visualizer
          </TabsTrigger>
          <TabsTrigger value="css" className="flex items-center gap-1">
            <Code className="h-4 w-4" />
            CSS Inspector
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-1">
            <Type className="h-4 w-4" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="frameworks" className="flex items-center gap-1">
            <Palette className="h-4 w-4" />
            Framework Helpers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="responsive" className="mt-4">
          <ResponsiveTester />
        </TabsContent>

        <TabsContent value="contrast" className="mt-4">
          <ContrastChecker />
        </TabsContent>

        <TabsContent value="grid" className="mt-4">
          <GridVisualizer />
        </TabsContent>

        <TabsContent value="css" className="mt-4">
          <CSSInspector />
        </TabsContent>

        <TabsContent value="typography" className="mt-4">
          <TypographyChecker />
        </TabsContent>

        <TabsContent value="frameworks" className="mt-4">
          <FrameworkHelpers />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ResponsiveTester() {
  const [url, setUrl] = useState("")
  const [activeDevice, setActiveDevice] = useState("desktop")
  const [customWidth, setCustomWidth] = useState(1280)
  const [customHeight, setCustomHeight] = useState(800)
  const [isLoading, setIsLoading] = useState(false)

  const devices = [
    { id: "mobile-sm", name: "Mobile Small", width: 320, height: 568, icon: <Smartphone className="h-4 w-4" /> },
    { id: "mobile", name: "Mobile", width: 375, height: 667, icon: <Smartphone className="h-4 w-4" /> },
    { id: "mobile-lg", name: "Mobile Large", width: 428, height: 926, icon: <Smartphone className="h-4 w-4" /> },
    { id: "tablet", name: "Tablet", width: 768, height: 1024, icon: <Tablet className="h-4 w-4" /> },
    { id: "tablet-lg", name: "Tablet Large", width: 1024, height: 1366, icon: <Tablet className="h-4 w-4" /> },
    { id: "desktop", name: "Desktop", width: 1280, height: 800, icon: <Monitor className="h-4 w-4" /> },
    { id: "desktop-lg", name: "Desktop Large", width: 1440, height: 900, icon: <Monitor className="h-4 w-4" /> },
    { id: "desktop-xl", name: "Desktop XL", width: 1920, height: 1080, icon: <Monitor className="h-4 w-4" /> },
  ]

  const getDeviceDimensions = () => {
    const device = devices.find((d) => d.id === activeDevice)
    return device ? { width: device.width, height: device.height } : { width: customWidth, height: customHeight }
  }

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 500)
  }

  const dimensions = getDeviceDimensions()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Responsive Breakpoint Tester</CardTitle>
        <CardDescription>Test your website at different screen sizes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="url">Website URL</Label>
            <Input id="url" placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <Button onClick={handleRefresh} disabled={!url || isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Load
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {devices.map((device) => (
            <Button
              key={device.id}
              variant={activeDevice === device.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveDevice(device.id)}
              className="flex items-center gap-1"
            >
              {device.icon}
              <span className="hidden sm:inline">{device.name}</span>
              <span className="text-xs text-muted-foreground">
                ({device.width}×{device.height})
              </span>
            </Button>
          ))}
          <Button
            variant={activeDevice === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveDevice("custom")}
          >
            Custom
          </Button>
        </div>

        {activeDevice === "custom" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="custom-width">Width (px)</Label>
              <Input
                id="custom-width"
                type="number"
                value={customWidth}
                onChange={(e) => setCustomWidth(Number.parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-height">Height (px)</Label>
              <Input
                id="custom-height"
                type="number"
                value={customHeight}
                onChange={(e) => setCustomHeight(Number.parseInt(e.target.value))}
              />
            </div>
          </div>
        )}

        <div className="border rounded-md p-4 flex flex-col items-center">
          <div className="text-sm text-muted-foreground mb-2">
            {dimensions.width} × {dimensions.height}px
          </div>
          <div
            className="border rounded bg-background overflow-hidden"
            style={{
              width: `${Math.min(dimensions.width, 100)}%`,
              height: `${Math.min(dimensions.height, 600)}px`,
              maxWidth: `${dimensions.width}px`,
            }}
          >
            {url ? (
              <iframe
                src={url.startsWith("http") ? url : `https://${url}`}
                width="100%"
                height="100%"
                style={{ border: "none" }}
                title="Website Preview"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                Enter a URL to preview
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ContrastChecker() {
  const [foreground, setForeground] = useState("#000000")
  const [background, setBackground] = useState("#FFFFFF")
  const [fontSize, setFontSize] = useState(16)
  const [isBold, setIsBold] = useState(false)

  // Calculate contrast ratio
  const calculateContrastRatio = (fg: string, bg: string) => {
    // Convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result
        ? {
            r: Number.parseInt(result[1], 16),
            g: Number.parseInt(result[2], 16),
            b: Number.parseInt(result[3], 16),
          }
        : { r: 0, g: 0, b: 0 }
    }

    // Calculate luminance
    const luminance = (r: number, g: number, b: number) => {
      const a = [r, g, b].map((v) => {
        v /= 255
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
      })
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
    }

    const rgb1 = hexToRgb(fg)
    const rgb2 = hexToRgb(bg)
    const l1 = luminance(rgb1.r, rgb1.g, rgb1.b)
    const l2 = luminance(rgb2.r, rgb2.g, rgb2.b)

    const ratio = l1 > l2 ? (l1 + 0.05) / (l2 + 0.05) : (l2 + 0.05) / (l1 + 0.05)

    return Math.round(ratio * 100) / 100
  }

  const contrastRatio = calculateContrastRatio(foreground, background)

  // WCAG 2.1 compliance checks
  const isAALargeText = contrastRatio >= 3
  const isAANormalText = contrastRatio >= 4.5
  const isAAALargeText = contrastRatio >= 4.5
  const isAAANormalText = contrastRatio >= 7

  // Determine if current font size is "large text" by WCAG standards
  const isLargeText = fontSize >= 18 || (fontSize >= 14 && isBold)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Color Contrast Checker</CardTitle>
        <CardDescription>Check if your color combinations meet WCAG accessibility standards</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="foreground-color">Text Color</Label>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded border" style={{ backgroundColor: foreground }} />
                <Input
                  id="foreground-color"
                  type="text"
                  value={foreground}
                  onChange={(e) => setForeground(e.target.value)}
                />
                <input
                  type="color"
                  value={foreground}
                  onChange={(e) => setForeground(e.target.value)}
                  className="w-10 h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="background-color">Background Color</Label>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded border" style={{ backgroundColor: background }} />
                <Input
                  id="background-color"
                  type="text"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                />
                <input
                  type="color"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  className="w-10 h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="font-size">Font Size: {fontSize}px</Label>
              <Slider
                id="font-size"
                min={8}
                max={32}
                step={1}
                value={[fontSize]}
                onValueChange={(value) => setFontSize(value[0])}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is-bold"
                checked={isBold}
                onChange={(e) => setIsBold(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is-bold">Bold Text</Label>
            </div>
          </div>

          <div className="space-y-4">
            <div
              className="p-8 rounded-md flex items-center justify-center text-center"
              style={{
                backgroundColor: background,
                color: foreground,
                fontSize: `${fontSize}px`,
                fontWeight: isBold ? "bold" : "normal",
              }}
            >
              Sample Text
            </div>

            <div className="space-y-2 p-4 border rounded-md">
              <div className="flex items-center justify-between">
                <span className="font-medium">Contrast Ratio:</span>
                <span className="text-lg font-bold">{contrastRatio}:1</span>
              </div>

              <Separator className="my-2" />

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span>WCAG AA (Normal Text):</span>
                  {isAANormalText ? (
                    <Badge variant="success" className="bg-green-100 text-green-800">
                      <Check className="h-3 w-3 mr-1" /> Pass
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="bg-red-100 text-red-800">
                      <X className="h-3 w-3 mr-1" /> Fail
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span>WCAG AA (Large Text):</span>
                  {isAALargeText ? (
                    <Badge variant="success" className="bg-green-100 text-green-800">
                      <Check className="h-3 w-3 mr-1" /> Pass
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="bg-red-100 text-red-800">
                      <X className="h-3 w-3 mr-1" /> Fail
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span>WCAG AAA (Normal Text):</span>
                  {isAAANormalText ? (
                    <Badge variant="success" className="bg-green-100 text-green-800">
                      <Check className="h-3 w-3 mr-1" /> Pass
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="bg-red-100 text-red-800">
                      <X className="h-3 w-3 mr-1" /> Fail
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span>WCAG AAA (Large Text):</span>
                  {isAAALargeText ? (
                    <Badge variant="success" className="bg-green-100 text-green-800">
                      <Check className="h-3 w-3 mr-1" /> Pass
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="bg-red-100 text-red-800">
                      <X className="h-3 w-3 mr-1" /> Fail
                    </Badge>
                  )}
                </div>
              </div>

              <Separator className="my-2" />

              <div className="text-sm text-muted-foreground">
                {isLargeText ? (
                  <p>Current text is considered "large" by WCAG standards.</p>
                ) : (
                  <p>Current text is considered "normal" by WCAG standards.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function GridVisualizer() {
  const [columns, setColumns] = useState(12)
  const [gutterSize, setGutterSize] = useState(16)
  const [containerWidth, setContainerWidth] = useState(1200)
  const [showGrid, setShowGrid] = useState(true)
  const [gridType, setGridType] = useState("columns")
  const [rowCount, setRowCount] = useState(3)
  const [rowHeight, setRowHeight] = useState(100)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grid & Spacing Visualizer</CardTitle>
        <CardDescription>Visualize grid layouts and spacing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Grid Type</Label>
              <div className="flex gap-2">
                <Button
                  variant={gridType === "columns" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGridType("columns")}
                  className="flex items-center gap-1"
                >
                  <Columns className="h-4 w-4" />
                  Columns
                </Button>
                <Button
                  variant={gridType === "rows" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGridType("rows")}
                  className="flex items-center gap-1"
                >
                  <Rows className="h-4 w-4" />
                  Rows
                </Button>
              </div>
            </div>

            {gridType === "columns" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="columns">Columns: {columns}</Label>
                  <Slider
                    id="columns"
                    min={1}
                    max={24}
                    step={1}
                    value={[columns]}
                    onValueChange={(value) => setColumns(value[0])}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="rows">Rows: {rowCount}</Label>
                  <Slider
                    id="rows"
                    min={1}
                    max={10}
                    step={1}
                    value={[rowCount]}
                    onValueChange={(value) => setRowCount(value[0])}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="row-height">Row Height: {rowHeight}px</Label>
                  <Slider
                    id="row-height"
                    min={50}
                    max={200}
                    step={10}
                    value={[rowHeight]}
                    onValueChange={(value) => setRowHeight(value[0])}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="gutter">Gutter Size: {gutterSize}px</Label>
              <Slider
                id="gutter"
                min={0}
                max={40}
                step={4}
                value={[gutterSize]}
                onValueChange={(value) => setGutterSize(value[0])}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="container-width">Container Width: {containerWidth}px</Label>
              <Slider
                id="container-width"
                min={320}
                max={1920}
                step={10}
                value={[containerWidth]}
                onValueChange={(value) => setContainerWidth(value[0])}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show-grid"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="show-grid">Show Grid Overlay</Label>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="border rounded-md p-4 relative overflow-x-auto" style={{ maxWidth: "100%" }}>
              <div className="mx-auto relative" style={{ width: `${containerWidth}px`, maxWidth: "100%" }}>
                {showGrid && gridType === "columns" && (
                  <div
                    className="absolute inset-0 grid"
                    style={{
                      gridTemplateColumns: `repeat(${columns}, 1fr)`,
                      gap: `${gutterSize}px`,
                      pointerEvents: "none",
                    }}
                  >
                    {Array.from({ length: columns }).map((_, i) => (
                      <div key={i} className="bg-blue-100 opacity-30 h-full" />
                    ))}
                  </div>
                )}

                {showGrid && gridType === "rows" && (
                  <div
                    className="absolute inset-0 grid"
                    style={{
                      gridTemplateRows: `repeat(${rowCount}, ${rowHeight}px)`,
                      gap: `${gutterSize}px`,
                      pointerEvents: "none",
                    }}
                  >
                    {Array.from({ length: rowCount }).map((_, i) => (
                      <div key={i} className="bg-blue-100 opacity-30 w-full" />
                    ))}
                  </div>
                )}

                {gridType === "columns" ? (
                  <div
                    className="grid relative"
                    style={{
                      gridTemplateColumns: `repeat(${columns}, 1fr)`,
                      gap: `${gutterSize}px`,
                      minHeight: "300px",
                    }}
                  >
                    {Array.from({ length: columns }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-gray-100 border border-gray-200 rounded flex items-center justify-center"
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="grid relative"
                    style={{
                      gridTemplateRows: `repeat(${rowCount}, ${rowHeight}px)`,
                      gap: `${gutterSize}px`,
                    }}
                  >
                    {Array.from({ length: rowCount }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-gray-100 border border-gray-200 rounded flex items-center justify-center"
                      >
                        Row {i + 1}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              <p>CSS Grid Template:</p>
              <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
                {gridType === "columns"
                  ? `.grid-container {
  display: grid;
  grid-template-columns: repeat(${columns}, 1fr);
  gap: ${gutterSize}px;
  max-width: ${containerWidth}px;
  margin: 0 auto;
}`
                  : `.grid-container {
  display: grid;
  grid-template-rows: repeat(${rowCount}, ${rowHeight}px);
  gap: ${gutterSize}px;
  max-width: ${containerWidth}px;
  margin: 0 auto;
}`}
              </pre>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CSSInspector() {
  const [selector, setSelector] = useState("")
  const [cssProperties, setCssProperties] = useState<Record<string, string>>({})
  const [cssCode, setCssCode] = useState("")
  const [isInspecting, setIsInspecting] = useState(false)

  const handleInspect = () => {
    setIsInspecting(!isInspecting)

    // In a real implementation, this would use the Chrome extension API
    // to inject a script that allows element inspection
    if (!isInspecting) {
      // Mock data for demonstration
      setTimeout(() => {
        setCssProperties({
          color: "#333333",
          "font-size": "16px",
          margin: "0 0 20px 0",
          padding: "10px",
          "background-color": "#f8f8f8",
          border: "1px solid #ddd",
          "border-radius": "4px",
          "box-shadow": "0 1px 3px rgba(0,0,0,0.1)",
        })
        setSelector(".example-element")
        setIsInspecting(false)
      }, 1000)
    }
  }

  const handleCopyCSS = () => {
    navigator.clipboard.writeText(cssCode)
  }

  // Generate CSS code from properties
  useEffect(() => {
    let code = `${selector} {\n`
    Object.entries(cssProperties).forEach(([property, value]) => {
      code += `  ${property}: ${value};\n`
    })
    code += `}`
    setCssCode(code)
  }, [selector, cssProperties])

  const handlePropertyChange = (property: string, value: string) => {
    setCssProperties((prev) => ({
      ...prev,
      [property]: value,
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSS Inspector & Editor</CardTitle>
        <CardDescription>Inspect and temporarily edit CSS properties</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="selector">CSS Selector</Label>
            <Input
              id="selector"
              placeholder=".example-element"
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
            />
          </div>
          <Button onClick={handleInspect} variant={isInspecting ? "destructive" : "default"}>
            {isInspecting ? "Cancel" : "Inspect Element"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <Label>CSS Properties</Label>
            <ScrollArea className="h-[400px] border rounded-md p-2">
              {Object.entries(cssProperties).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(cssProperties).map(([property, value]) => (
                    <div key={property} className="grid grid-cols-2 gap-2">
                      <div className="text-sm font-mono">{property}:</div>
                      <Input
                        value={value}
                        onChange={(e) => handlePropertyChange(property, e.target.value)}
                        className="h-7 text-sm"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {isInspecting ? "Click on an element to inspect its CSS" : "Click 'Inspect Element' to start"}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Generated CSS</Label>
              <Button variant="outline" size="sm" onClick={handleCopyCSS} disabled={!cssCode}>
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
            </div>
            <Textarea value={cssCode} readOnly className="font-mono text-sm h-[400px]" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TypographyChecker() {
  const [fontFamily, setFontFamily] = useState("Inter, sans-serif")
  const [fontSize, setFontSize] = useState(16)
  const [lineHeight, setLineHeight] = useState(1.5)
  const [fontWeight, setFontWeight] = useState(400)
  const [letterSpacing, setLetterSpacing] = useState(0)
  const [sampleText, setSampleText] = useState("The quick brown fox jumps over the lazy dog. 0123456789")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Typography Checker</CardTitle>
        <CardDescription>Analyze and test typography settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="font-family">Font Family</Label>
              <Input id="font-family" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="font-size">Font Size: {fontSize}px</Label>
              <Slider
                id="font-size"
                min={8}
                max={72}
                step={1}
                value={[fontSize]}
                onValueChange={(value) => setFontSize(value[0])}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="line-height">Line Height: {lineHeight}</Label>
              <Slider
                id="line-height"
                min={1}
                max={3}
                step={0.1}
                value={[lineHeight]}
                onValueChange={(value) => setLineHeight(value[0])}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="font-weight">Font Weight: {fontWeight}</Label>
              <Select value={fontWeight.toString()} onValueChange={(value) => setFontWeight(Number.parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select font weight" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100 (Thin)</SelectItem>
                  <SelectItem value="200">200 (Extra Light)</SelectItem>
                  <SelectItem value="300">300 (Light)</SelectItem>
                  <SelectItem value="400">400 (Regular)</SelectItem>
                  <SelectItem value="500">500 (Medium)</SelectItem>
                  <SelectItem value="600">600 (Semi Bold)</SelectItem>
                  <SelectItem value="700">700 (Bold)</SelectItem>
                  <SelectItem value="800">800 (Extra Bold)</SelectItem>
                  <SelectItem value="900">900 (Black)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="letter-spacing">Letter Spacing: {letterSpacing}px</Label>
              <Slider
                id="letter-spacing"
                min={-2}
                max={10}
                step={0.1}
                value={[letterSpacing]}
                onValueChange={(value) => setLetterSpacing(value[0])}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sample-text">Sample Text</Label>
              <Textarea id="sample-text" value={sampleText} onChange={(e) => setSampleText(e.target.value)} rows={3} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="border rounded-md p-6">
              <div
                style={{
                  fontFamily,
                  fontSize: `${fontSize}px`,
                  lineHeight,
                  fontWeight,
                  letterSpacing: `${letterSpacing}px`,
                }}
              >
                {sampleText}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Typography Scale</Label>
              <div className="space-y-4 border rounded-md p-4">
                <div style={{ fontFamily, fontWeight, letterSpacing: `${letterSpacing}px` }}>
                  <div style={{ fontSize: `${fontSize * 2}px`, lineHeight }}>Heading 1</div>
                  <div style={{ fontSize: `${fontSize * 1.5}px`, lineHeight }}>Heading 2</div>
                  <div style={{ fontSize: `${fontSize * 1.25}px`, lineHeight }}>Heading 3</div>
                  <div style={{ fontSize: `${fontSize}px`, lineHeight }}>Body Text</div>
                  <div style={{ fontSize: `${fontSize * 0.875}px`, lineHeight }}>Small Text</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>CSS Code</Label>
              <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-sm">
                {`.element {
  font-family: ${fontFamily};
  font-size: ${fontSize}px;
  line-height: ${lineHeight};
  font-weight: ${fontWeight};
  letter-spacing: ${letterSpacing}px;
}`}
              </pre>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FrameworkHelpers() {
  const [framework, setFramework] = useState("tailwind")
  const [searchQuery, setSearchQuery] = useState("")

  const tailwindClasses = [
    { category: "Layout", classes: ["container", "flex", "grid", "block", "inline", "hidden"] },
    { category: "Spacing", classes: ["p-4", "m-2", "px-4", "my-2", "space-x-4", "space-y-2"] },
    { category: "Sizing", classes: ["w-full", "h-screen", "max-w-md", "min-h-screen"] },
    { category: "Typography", classes: ["text-lg", "font-bold", "italic", "text-center", "underline"] },
    { category: "Backgrounds", classes: ["bg-blue-500", "bg-opacity-50", "bg-gradient-to-r"] },
    { category: "Borders", classes: ["border", "rounded-md", "border-2", "border-blue-500"] },
    { category: "Effects", classes: ["shadow-md", "opacity-50", "blur-sm", "grayscale"] },
    { category: "Transitions", classes: ["transition", "duration-300", "ease-in-out", "delay-150"] },
  ]

  const bootstrapClasses = [
    { category: "Layout", classes: ["container", "row", "col", "d-flex", "d-grid", "d-none"] },
    { category: "Spacing", classes: ["p-4", "m-2", "px-4", "my-2", "gap-2"] },
    { category: "Sizing", classes: ["w-100", "h-100", "mw-100", "min-vh-100"] },
    { category: "Typography", classes: ["fs-1", "fw-bold", "fst-italic", "text-center"] },
    { category: "Colors", classes: ["bg-primary", "text-danger", "border-success"] },
    { category: "Components", classes: ["btn", "card", "navbar", "modal", "form-control"] },
    { category: "Utilities", classes: ["shadow", "opacity-50", "rounded", "border"] },
    { category: "Animations", classes: ["fade", "collapse", "slide"] },
  ]

  const filteredClasses = (framework === "tailwind" ? tailwindClasses : bootstrapClasses)
    .map((category) => ({
      ...category,
      classes: category.classes.filter((cls) => !searchQuery || cls.toLowerCase().includes(searchQuery.toLowerCase())),
    }))
    .filter((category) => category.classes.length > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Framework Helpers</CardTitle>
        <CardDescription>Reference and suggestions for CSS frameworks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="space-x-2">
            <Button variant={framework === "tailwind" ? "default" : "outline"} onClick={() => setFramework("tailwind")}>
              Tailwind CSS
            </Button>
            <Button
              variant={framework === "bootstrap" ? "default" : "outline"}
              onClick={() => setFramework("bootstrap")}
            >
              Bootstrap
            </Button>
          </div>
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${framework === "tailwind" ? "Tailwind" : "Bootstrap"} classes...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </div>

        <ScrollArea className="h-[500px] border rounded-md p-4">
          {filteredClasses.length > 0 ? (
            <div className="space-y-6">
              {filteredClasses.map((category) => (
                <div key={category.category}>
                  <h3 className="font-medium mb-2">{category.category}</h3>
                  <div className="flex flex-wrap gap-2">
                    {category.classes.map((cls) => (
                      <Badge
                        key={cls}
                        variant="outline"
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => navigator.clipboard.writeText(cls)}
                      >
                        {cls}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No classes found matching "{searchQuery}"</div>
          )}
        </ScrollArea>

        <div className="p-4 border rounded-md bg-muted">
          <h3 className="font-medium mb-2">Quick Reference</h3>
          {framework === "tailwind" ? (
            <div className="space-y-2 text-sm">
              <p>
                <strong>Responsive Prefixes:</strong> sm:, md:, lg:, xl:, 2xl:
              </p>
              <p>
                <strong>Colors:</strong> Use color-intensity (e.g., blue-500, red-700)
              </p>
              <p>
                <strong>Spacing:</strong> p-4 (1rem padding), m-2 (0.5rem margin)
              </p>
              <p>
                <strong>Documentation:</strong>{" "}
                <a
                  href="https://tailwindcss.com/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  tailwindcss.com/docs
                </a>
              </p>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <p>
                <strong>Responsive Classes:</strong> -sm, -md, -lg, -xl, -xxl
              </p>
              <p>
                <strong>Colors:</strong> primary, secondary, success, danger, warning, info
              </p>
              <p>
                <strong>Spacing:</strong> p-4 (1.5rem padding), m-2 (0.5rem margin)
              </p>
              <p>
                <strong>Documentation:</strong>{" "}
                <a
                  href="https://getbootstrap.com/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  getbootstrap.com/docs
                </a>
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
