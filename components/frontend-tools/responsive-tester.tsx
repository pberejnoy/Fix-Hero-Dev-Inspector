"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Smartphone, Tablet, Monitor, RotateCw, Maximize, Minimize } from "lucide-react"

// Common device sizes
const DEVICE_PRESETS = {
  mobile: [
    { name: "iPhone SE", width: 375, height: 667 },
    { name: "iPhone XR/11", width: 414, height: 896 },
    { name: "iPhone 12/13/14", width: 390, height: 844 },
    { name: "iPhone 12/13/14 Pro Max", width: 428, height: 926 },
    { name: "Galaxy S21", width: 360, height: 800 },
    { name: "Pixel 5", width: 393, height: 851 },
  ],
  tablet: [
    { name: "iPad Mini", width: 768, height: 1024 },
    { name: "iPad", width: 810, height: 1080 },
    { name: 'iPad Pro 11"', width: 834, height: 1194 },
    { name: 'iPad Pro 12.9"', width: 1024, height: 1366 },
    { name: "Galaxy Tab S7", width: 800, height: 1280 },
  ],
  desktop: [
    { name: "Small Laptop", width: 1280, height: 800 },
    { name: "Laptop", width: 1440, height: 900 },
    { name: "Desktop", width: 1920, height: 1080 },
    { name: "Large Desktop", width: 2560, height: 1440 },
  ],
}

// Common breakpoints
const BREAKPOINTS = [
  { name: "xs", width: 320 },
  { name: "sm", width: 640 },
  { name: "md", width: 768 },
  { name: "lg", width: 1024 },
  { name: "xl", width: 1280 },
  { name: "2xl", width: 1536 },
]

export function ResponsiveTester() {
  const [deviceType, setDeviceType] = useState("mobile")
  const [selectedDevice, setSelectedDevice] = useState(DEVICE_PRESETS.mobile[0].name)
  const [orientation, setOrientation] = useState("portrait")
  const [customWidth, setCustomWidth] = useState(375)
  const [customHeight, setCustomHeight] = useState(667)
  const [url, setUrl] = useState("")
  const [zoom, setZoom] = useState(75)

  // Get current device dimensions
  const getCurrentDevice = () => {
    if (deviceType === "custom") {
      return { width: customWidth, height: customHeight }
    }

    const device = DEVICE_PRESETS[deviceType as keyof typeof DEVICE_PRESETS].find((d) => d.name === selectedDevice)
    if (!device) return { width: 375, height: 667 }

    return orientation === "portrait"
      ? { width: device.width, height: device.height }
      : { width: device.height, height: device.width }
  }

  const { width, height } = getCurrentDevice()

  // Calculate iframe dimensions based on zoom
  const scaledWidth = Math.round(width * (zoom / 100))
  const scaledHeight = Math.round(height * (zoom / 100))

  // Handle device selection
  const handleDeviceChange = (value: string) => {
    const devices = DEVICE_PRESETS[value as keyof typeof DEVICE_PRESETS]
    setDeviceType(value)
    setSelectedDevice(devices[0].name)
  }

  // Toggle orientation
  const toggleOrientation = () => {
    setOrientation(orientation === "portrait" ? "landscape" : "portrait")
  }

  // Set URL to current page if empty
  const handleLoadUrl = () => {
    if (!url) {
      setUrl(window.location.href)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Responsive Viewport Tester</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Device Type</Label>
              <div className="flex gap-2">
                <Button
                  variant={deviceType === "mobile" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDeviceChange("mobile")}
                  className="flex-1"
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Mobile
                </Button>
                <Button
                  variant={deviceType === "tablet" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDeviceChange("tablet")}
                  className="flex-1"
                >
                  <Tablet className="h-4 w-4 mr-2" />
                  Tablet
                </Button>
                <Button
                  variant={deviceType === "desktop" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDeviceChange("desktop")}
                  className="flex-1"
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  Desktop
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Device Model</Label>
              <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                <SelectTrigger>
                  <SelectValue placeholder="Select device" />
                </SelectTrigger>
                <SelectContent>
                  {DEVICE_PRESETS[deviceType as keyof typeof DEVICE_PRESETS].map((device) => (
                    <SelectItem key={device.name} value={device.name}>
                      {device.name} ({device.width}×{device.height})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Actions</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={toggleOrientation} className="flex-1">
                  <RotateCw className="h-4 w-4 mr-2" />
                  Rotate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.min(zoom + 10, 100))}
                  className="flex-1"
                >
                  <Maximize className="h-4 w-4 mr-2" />
                  Zoom In
                </Button>
                <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(zoom - 10, 30))} className="flex-1">
                  <Minimize className="h-4 w-4 mr-2" />
                  Zoom Out
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label>URL to Test</Label>
              <div className="flex gap-2">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="flex-1"
                />
                <Button onClick={handleLoadUrl}>Load</Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Zoom: {zoom}%</Label>
              <Slider value={[zoom]} min={30} max={100} step={5} onValueChange={(value) => setZoom(value[0])} />
            </div>

            <div className="space-y-2">
              <Label>Dimensions</Label>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium">
                    {width}×{height}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    {orientation === "portrait" ? "Portrait" : "Landscape"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Scaled: {scaledWidth}×{scaledHeight}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Tabs defaultValue="device">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="device">Device View</TabsTrigger>
                <TabsTrigger value="breakpoints">Breakpoints</TabsTrigger>
              </TabsList>

              <TabsContent value="device">
                <div className="flex justify-center p-4 bg-gray-100 rounded-md overflow-auto">
                  <div
                    className="border-4 border-gray-800 rounded-lg overflow-hidden shadow-lg"
                    style={{
                      width: `${scaledWidth}px`,
                      height: `${scaledHeight}px`,
                      transition: "width 0.3s, height 0.3s",
                    }}
                  >
                    {url ? (
                      <iframe
                        src={url}
                        width={width}
                        height={height}
                        style={{
                          transform: `scale(${zoom / 100})`,
                          transformOrigin: "0 0",
                          width: "100%",
                          height: "100%",
                          border: "none",
                        }}
                        title="Responsive Preview"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white">
                        <div className="text-center p-4">
                          <p className="text-muted-foreground mb-2">Enter a URL to preview</p>
                          <Button size="sm" onClick={() => setUrl(window.location.href)}>
                            Use Current Page
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="breakpoints">
                <div className="space-y-4">
                  {BREAKPOINTS.map((breakpoint) => (
                    <div key={breakpoint.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="flex items-center">
                          <span className="w-8 inline-block">{breakpoint.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{breakpoint.width}px</span>
                        </Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDeviceType("custom")
                            setCustomWidth(breakpoint.width)
                            setCustomHeight(800)
                            setOrientation("portrait")
                          }}
                        >
                          Preview
                        </Button>
                      </div>
                      <div
                        className="h-4 bg-gray-200 rounded-full overflow-hidden"
                        style={{ width: `${Math.min(100, breakpoint.width / 25.6)}%` }}
                      >
                        <div className="h-full bg-blue-500" style={{ width: "100%" }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
