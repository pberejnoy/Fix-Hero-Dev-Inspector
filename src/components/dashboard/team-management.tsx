"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Check, Copy, UserPlus, UserX, UserCog } from "lucide-react"
import { AsyncButton } from "@/components/ui/async-button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  getTeamMembers,
  inviteTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
  generateSharingLink,
  TeamRole,
} from "@/lib/team-service"
import { getUserSubscription, SubscriptionTier } from "@/lib/subscription-service"
import { motion, AnimatePresence } from "framer-motion"

export function TeamManagement() {
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [subscription, setSubscription] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInviting, setIsInviting] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<TeamRole>(TeamRole.MEMBER)
  const [sharingLink, setSharingLink] = useState<string | null>(null)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [linkExpiration, setLinkExpiration] = useState(7) // 7 days

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load team members
        const members = await getTeamMembers()
        setTeamMembers(members)

        // Load subscription
        const sub = await getUserSubscription()
        setSubscription(sub)

        // Load sessions
        const sessionsData = JSON.parse(localStorage.getItem("fixhero_sessions") || "[]")
        setSessions(sessionsData)
      } catch (error) {
        console.error("Error loading team data:", error)
        setError("Failed to load team information")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleInvite = async () => {
    setError(null)
    setSuccess(null)
    setIsInviting(true)

    try {
      const result = await inviteTeamMember(inviteEmail, inviteRole)
      if (result.success) {
        setSuccess(result.message)
        setInviteEmail("")
        setShowInviteDialog(false)

        // Reload team members
        const members = await getTeamMembers()
        setTeamMembers(members)
      } else {
        setError(result.message)
      }
    } catch (error) {
      console.error("Error inviting team member:", error)
      setError("An error occurred while inviting the team member")
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemove = async (memberId: string) => {
    setError(null)
    setSuccess(null)
    setIsRemoving(true)

    try {
      const result = await removeTeamMember(memberId)
      if (result.success) {
        setSuccess(result.message)

        // Reload team members
        const members = await getTeamMembers()
        setTeamMembers(members)
      } else {
        setError(result.message)
      }
    } catch (error) {
      console.error("Error removing team member:", error)
      setError("An error occurred while removing the team member")
    } finally {
      setIsRemoving(false)
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: TeamRole) => {
    setError(null)
    setSuccess(null)
    setIsUpdatingRole(true)

    try {
      const result = await updateTeamMemberRole(memberId, newRole)
      if (result.success) {
        setSuccess(result.message)

        // Reload team members
        const members = await getTeamMembers()
        setTeamMembers(members)
      } else {
        setError(result.message)
      }
    } catch (error) {
      console.error("Error updating team member role:", error)
      setError("An error occurred while updating the team member role")
    } finally {
      setIsUpdatingRole(false)
    }
  }

  const handleGenerateLink = async () => {
    if (!selectedSessionId) return

    setError(null)
    setSuccess(null)
    setIsGeneratingLink(true)
    setSharingLink(null)

    try {
      const result = await generateSharingLink(selectedSessionId, linkExpiration)
      if (result.success && result.link) {
        setSharingLink(result.link)
      } else {
        setError(result.message)
      }
    } catch (error) {
      console.error("Error generating sharing link:", error)
      setError("An error occurred while generating the sharing link")
    } finally {
      setIsGeneratingLink(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccess("Link copied to clipboard")
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  const canInviteMembers =
    subscription?.tier !== SubscriptionTier.FREE && teamMembers.length < subscription?.features.teamMembers

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-100">
          <Check className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Team Management</h2>
        <p className="text-muted-foreground">Manage your team members and sharing settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage your team members and their roles</CardDescription>
              </div>
              <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogTrigger asChild>
                  <Button disabled={!canInviteMembers}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                      Send an invitation to join your team. They will receive an email with instructions.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="colleague@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as TeamRole)}>
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TeamRole.ADMIN}>Admin</SelectItem>
                          <SelectItem value={TeamRole.MEMBER}>Member</SelectItem>
                          <SelectItem value={TeamRole.VIEWER}>Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                      Cancel
                    </Button>
                    <AsyncButton
                      onClick={handleInvite}
                      isLoading={isInviting}
                      loadingText="Inviting..."
                      disabled={!inviteEmail}
                    >
                      Send Invitation
                    </AsyncButton>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="mx-auto h-12 w-12 mb-4 opacity-20" />
                <p>No team members yet</p>
                {subscription?.tier === SubscriptionTier.FREE ? (
                  <p className="mt-2 text-sm">Upgrade to PRO or TEAM to invite team members</p>
                ) : (
                  <Button variant="link" onClick={() => setShowInviteDialog(true)} disabled={!canInviteMembers}>
                    Invite your first team member
                  </Button>
                )}
              </div>
            ) : (
              <ul className="space-y-4">
                <AnimatePresence>
                  {teamMembers.map((member) => (
                    <motion.li
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center justify-between p-3 rounded-md border"
                    >
                      <div>
                        <div className="font-medium">{member.displayName || member.email}</div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={member.role}
                          onValueChange={(value) => handleUpdateRole(member.id, value as TeamRole)}
                          disabled={member.role === TeamRole.OWNER || isUpdatingRole}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={TeamRole.OWNER}>Owner</SelectItem>
                            <SelectItem value={TeamRole.ADMIN}>Admin</SelectItem>
                            <SelectItem value={TeamRole.MEMBER}>Member</SelectItem>
                            <SelectItem value={TeamRole.VIEWER}>Viewer</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(member.id)}
                          disabled={member.role === TeamRole.OWNER || isRemoving}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              {teamMembers.length} / {subscription?.features.teamMembers} members
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Sharing</CardTitle>
                <CardDescription>Share your sessions with others</CardDescription>
              </div>
              <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                <DialogTrigger asChild>
                  <Button disabled={subscription?.tier === SubscriptionTier.FREE}>Generate Link</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate Sharing Link</DialogTitle>
                    <DialogDescription>
                      Create a link to share a session with others. They will be able to view the session but not modify
                      it.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="session">Session</Label>
                      <Select value={selectedSessionId || ""} onValueChange={setSelectedSessionId}>
                        <SelectTrigger id="session">
                          <SelectValue placeholder="Select session" />
                        </SelectTrigger>
                        <SelectContent>
                          {sessions.map((session) => (
                            <SelectItem key={session.id} value={session.id}>
                              {session.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiration">Expires After</Label>
                      <Select
                        value={linkExpiration.toString()}
                        onValueChange={(value) => setLinkExpiration(Number.parseInt(value))}
                      >
                        <SelectTrigger id="expiration">
                          <SelectValue placeholder="Select expiration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 day</SelectItem>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {sharingLink && (
                      <div className="mt-4 p-3 bg-muted rounded-md">
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-mono truncate">{sharingLink}</div>
                          <Button variant="ghost" size="icon" onClick={() => copyToClipboard(sharingLink)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                      Close
                    </Button>
                    <AsyncButton
                      onClick={handleGenerateLink}
                      isLoading={isGeneratingLink}
                      loadingText="Generating..."
                      disabled={!selectedSessionId}
                    >
                      Generate Link
                    </AsyncButton>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {subscription?.tier === SubscriptionTier.FREE ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserCog className="mx-auto h-12 w-12 mb-4 opacity-20" />
                <p>Sharing is only available on PRO and TEAM plans</p>
                <Button variant="link" onClick={() => (window.location.href = "#subscription")}>
                  Upgrade your plan
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p>
                  Generate temporary links to share your sessions with clients, colleagues, or stakeholders. They will
                  be able to view the session but not modify it.
                </p>

                <div className="rounded-md bg-muted p-4">
                  <h4 className="font-medium mb-2">Sharing Features</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      <span>View-only access</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      <span>No account required for viewers</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      <span>Customizable expiration</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      <span>Revoke access anytime</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => setShowShareDialog(true)}
              disabled={subscription?.tier === SubscriptionTier.FREE}
              className="w-full"
            >
              Generate Sharing Link
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
