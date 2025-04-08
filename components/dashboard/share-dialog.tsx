"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Clipboard, Download } from "lucide-react"
import QRCode from "qrcode.react"
import type { Session } from "@/lib/types"

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: Session | null
}

export function ShareDialog({ open, onOpenChange, session }: ShareDialogProps) {
  const [shareMode, setShareMode] = useState<"view-only" | "interactive">("view-only")
  const [expiryDays, setExpiryDays] = useState(7)
  const [isGenerating, setIsGenerating] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const qrCodeRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const handleGenerateLink = async () => {
    if (!session) return

    setIsGenerating(true)

    try {
      // In a real implementation, this would call an API to generate a shareable link
      // For now, we'll simulate it with a timeout
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Generate a mock share URL
      const baseUrl = window.location.origin
      const mockToken = Math.random().toString(36).substring(2, 15)
      const url = `${baseUrl}/share/${session.id}/${mockToken}?mode=${shareMode}&expires=${Date.now() + expiryDays * 24 * 60 * 60 * 1000}`

      setShareUrl(url)

      toast({
        title: "Share link generated",
        description: `Link will expire in ${expiryDays} days`,
      })
    } catch (error) {
      console.error("Error generating share link:", error)
      toast({
        title: "Error generating link",
        description: "Failed to generate share link",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast({
      title: "Link copied",
      description: "Share link copied to clipboard",
    })
  }

  const handleDownloadQRCode = () => {
    if (!qrCodeRef.current) return

    const canvas = qrCodeRef.current.querySelector("canvas")
    if (!canvas) return

    const url = canvas.toDataURL("image/png")
    const link = document.createElement("a")
    link.href = url
    link.download = `fixhero-share-qr-${session?.id || "session"}.png`
    link.click()

    toast({
      title: "QR Code downloaded",
      description: "QR Code has been downloaded as PNG",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Session</DialogTitle>
          <DialogDescription>Create a shareable link or QR code for this session</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Session</Label>
            <div className="p-2 border rounded-md bg-muted">
              <p className="font-medium">{session?.name || "Unnamed Session"}</p>
              <p className="text-sm text-muted-foreground truncate">{session?.url}</p>
              <p className="text-sm text-muted-foreground">
                {session?.issues.length || 0} issues • Created{" "}
                {session ? new Date(session.startTime).toLocaleString() : ""}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Share Mode</Label>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium">{shareMode === "view-only" ? "View Only" : "Interactive"}</div>
                <div className="text-sm text-muted-foreground">
                  {shareMode === "view-only"
                    ? "Recipients can only view issues and details"
                    : "Recipients can interact with tools and add comments"}
                </div>
              </div>
              <Switch
                checked={shareMode === "interactive"}
                onCheckedChange={(checked) => setShareMode(checked ? "interactive" : "view-only")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry">Link Expiry</Label>
            <div className="flex items-center gap-2">
              <Input
                id="expiry"
                type="number"
                min={1}
                max={30}
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
              />
              <span>days</span>
            </div>
          </div>

          <Button onClick={handleGenerateLink} disabled={isGenerating || !session} className="w-full">
            {isGenerating ? "Generating..." : "Generate Share Link"}
          </Button>

          {shareUrl && (
            <Tabs defaultValue="link" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="link">Link</TabsTrigger>
                <TabsTrigger value="qr">QR Code</TabsTrigger>
              </TabsList>

              <TabsContent value="link" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="share-url">Share URL</Label>
                  <div className="flex items-center gap-2">
                    <Input id="share-url" value={shareUrl} readOnly />
                    <Button variant="outline" size="icon" onClick={handleCopyLink}>
                      <Clipboard className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="qr" className="space-y-4 mt-4">
                <div className="flex flex-col items-center justify-center gap-4">
                  <div ref={qrCodeRef} className="p-4 bg-white rounded-md">
                    <QRCode value={shareUrl} size={200} />
                  </div>
                  <Button variant="outline" onClick={handleDownloadQRCode}>
                    <Download className="h-4 w-4 mr-2" />
                    Download QR Code
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
