import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore"
import { db, auth } from "./firebase-config"
import { getUserSubscription, SubscriptionTier } from "./subscription-service"

// Team member role
export enum TeamRole {
  OWNER = "owner",
  ADMIN = "admin",
  MEMBER = "member",
  VIEWER = "viewer",
}

// Team member
export interface TeamMember {
  id: string
  email: string
  displayName?: string
  role: TeamRole
  addedAt: number
  inviteAccepted: boolean
}

// Team invitation
export interface TeamInvitation {
  id: string
  teamId: string
  email: string
  role: TeamRole
  invitedBy: string
  invitedAt: number
  expiresAt: number
  token: string
}

// Get team members
export async function getTeamMembers(): Promise<TeamMember[]> {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      return []
    }

    const teamDoc = await getDoc(doc(db, "users", currentUser.uid, "team", "members"))
    if (!teamDoc.exists()) {
      // Create team document with current user as owner
      const owner: TeamMember = {
        id: currentUser.uid,
        email: currentUser.email || "",
        displayName: currentUser.displayName || undefined,
        role: TeamRole.OWNER,
        addedAt: Date.now(),
        inviteAccepted: true,
      }

      await setDoc(doc(db, "users", currentUser.uid, "team", "members"), {
        members: [owner],
        updatedAt: serverTimestamp(),
      })

      return [owner]
    }

    return teamDoc.data().members || []
  } catch (error) {
    console.error("Error getting team members:", error)
    return []
  }
}

// Invite team member
export async function inviteTeamMember(email: string, role: TeamRole): Promise<{ success: boolean; message?: string }> {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      return { success: false, message: "You must be logged in to invite team members" }
    }

    // Check subscription tier
    const subscription = await getUserSubscription()
    if (!subscription) {
      return { success: false, message: "Unable to verify subscription" }
    }

    // Check if user can add more team members
    const teamMembers = await getTeamMembers()
    if (teamMembers.length >= subscription.features.teamMembers) {
      return {
        success: false,
        message: `Your ${subscription.tier} plan is limited to ${subscription.features.teamMembers} team members. Please upgrade to add more.`,
      }
    }

    // Check if user is already a team member
    if (teamMembers.some((member) => member.email === email)) {
      return { success: false, message: "This user is already a team member" }
    }

    // Generate invitation token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    // Create invitation
    const invitation: TeamInvitation = {
      id: Math.random().toString(36).substring(2, 9),
      teamId: currentUser.uid,
      email,
      role,
      invitedBy: currentUser.uid,
      invitedAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      token,
    }

    // Save invitation
    await setDoc(doc(db, "invitations", invitation.id), invitation)

    // In a real implementation, send an email with the invitation link
    // For now, we'll just return the token
    return {
      success: true,
      message: `Invitation sent to ${email}. They will need to use this token to join: ${token}`,
    }
  } catch (error) {
    console.error("Error inviting team member:", error)
    return { success: false, message: "An error occurred while inviting the team member" }
  }
}

// Accept team invitation
export async function acceptTeamInvitation(
  invitationId: string,
  token: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    // Get invitation
    const invitationDoc = await getDoc(doc(db, "invitations", invitationId))
    if (!invitationDoc.exists()) {
      return { success: false, message: "Invitation not found" }
    }

    const invitation = invitationDoc.data() as TeamInvitation

    // Verify token
    if (invitation.token !== token) {
      return { success: false, message: "Invalid invitation token" }
    }

    // Check if invitation has expired
    if (invitation.expiresAt < Date.now()) {
      return { success: false, message: "Invitation has expired" }
    }

    // Get current user
    const currentUser = auth.currentUser
    if (!currentUser) {
      return { success: false, message: "You must be logged in to accept an invitation" }
    }

    // Check if email matches
    if (currentUser.email !== invitation.email) {
      return { success: false, message: "This invitation was sent to a different email address" }
    }

    // Add user to team
    const teamMember: TeamMember = {
      id: currentUser.uid,
      email: currentUser.email || "",
      displayName: currentUser.displayName || undefined,
      role: invitation.role,
      addedAt: Date.now(),
      inviteAccepted: true,
    }

    await updateDoc(doc(db, "users", invitation.teamId, "team", "members"), {
      members: arrayUnion(teamMember),
      updatedAt: serverTimestamp(),
    })

    // Delete invitation
    await setDoc(
      doc(db, "invitations", invitationId),
      {
        status: "accepted",
        acceptedAt: serverTimestamp(),
      },
      { merge: true },
    )

    return { success: true, message: "You have successfully joined the team" }
  } catch (error) {
    console.error("Error accepting team invitation:", error)
    return { success: false, message: "An error occurred while accepting the invitation" }
  }
}

// Remove team member
export async function removeTeamMember(memberId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      return { success: false, message: "You must be logged in to remove team members" }
    }

    // Get team members
    const teamMembers = await getTeamMembers()

    // Check if current user is owner or admin
    const currentMember = teamMembers.find((member) => member.id === currentUser.uid)
    if (!currentMember || (currentMember.role !== TeamRole.OWNER && currentMember.role !== TeamRole.ADMIN)) {
      return { success: false, message: "You don't have permission to remove team members" }
    }

    // Check if member exists
    const memberToRemove = teamMembers.find((member) => member.id === memberId)
    if (!memberToRemove) {
      return { success: false, message: "Team member not found" }
    }

    // Cannot remove owner
    if (memberToRemove.role === TeamRole.OWNER) {
      return { success: false, message: "Cannot remove the team owner" }
    }

    // Admin cannot remove other admins
    if (currentMember.role === TeamRole.ADMIN && memberToRemove.role === TeamRole.ADMIN) {
      return { success: false, message: "Admins cannot remove other admins" }
    }

    // Remove member
    await updateDoc(doc(db, "users", currentUser.uid, "team", "members"), {
      members: arrayRemove(memberToRemove),
      updatedAt: serverTimestamp(),
    })

    return {
      success: true,
      message: `${memberToRemove.displayName || memberToRemove.email} has been removed from the team`,
    }
  } catch (error) {
    console.error("Error removing team member:", error)
    return { success: false, message: "An error occurred while removing the team member" }
  }
}

// Update team member role
export async function updateTeamMemberRole(
  memberId: string,
  newRole: TeamRole,
): Promise<{ success: boolean; message?: string }> {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      return { success: false, message: "You must be logged in to update team member roles" }
    }

    // Get team members
    const teamMembers = await getTeamMembers()

    // Check if current user is owner or admin
    const currentMember = teamMembers.find((member) => member.id === currentUser.uid)
    if (!currentMember || (currentMember.role !== TeamRole.OWNER && currentMember.role !== TeamRole.ADMIN)) {
      return { success: false, message: "You don't have permission to update team member roles" }
    }

    // Check if member exists
    const memberToUpdate = teamMembers.find((member) => member.id === memberId)
    if (!memberToUpdate) {
      return { success: false, message: "Team member not found" }
    }

    // Cannot change owner role
    if (memberToUpdate.role === TeamRole.OWNER) {
      return { success: false, message: "Cannot change the role of the team owner" }
    }

    // Admin cannot change other admin roles
    if (currentMember.role === TeamRole.ADMIN && memberToUpdate.role === TeamRole.ADMIN) {
      return { success: false, message: "Admins cannot change the roles of other admins" }
    }

    // Admin cannot promote to owner
    if (currentMember.role === TeamRole.ADMIN && newRole === TeamRole.OWNER) {
      return { success: false, message: "Admins cannot promote members to owner" }
    }

    // Update member role
    const updatedMember = { ...memberToUpdate, role: newRole }

    // Remove old member and add updated member
    await updateDoc(doc(db, "users", currentUser.uid, "team", "members"), {
      members: arrayRemove(memberToUpdate),
      updatedAt: serverTimestamp(),
    })

    await updateDoc(doc(db, "users", currentUser.uid, "team", "members"), {
      members: arrayUnion(updatedMember),
      updatedAt: serverTimestamp(),
    })

    return {
      success: true,
      message: `${memberToUpdate.displayName || memberToUpdate.email}'s role has been updated to ${newRole}`,
    }
  } catch (error) {
    console.error("Error updating team member role:", error)
    return { success: false, message: "An error occurred while updating the team member role" }
  }
}

// Generate sharing link
export async function generateSharingLink(
  sessionId: string,
  expiresIn = 7,
): Promise<{ success: boolean; link?: string; message?: string }> {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      return { success: false, message: "You must be logged in to generate sharing links" }
    }

    // Check subscription tier
    const subscription = await getUserSubscription()
    if (!subscription) {
      return { success: false, message: "Unable to verify subscription" }
    }

    // Only PRO and TEAM can generate sharing links
    if (subscription.tier === SubscriptionTier.FREE) {
      return {
        success: false,
        message: "Sharing links are only available on PRO and TEAM plans. Please upgrade to use this feature.",
      }
    }

    // Generate token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    // Calculate expiration date
    const expiresAt = Date.now() + expiresIn * 24 * 60 * 60 * 1000

    // Save sharing link
    await setDoc(doc(db, "users", currentUser.uid, "sharing", sessionId), {
      token,
      expiresAt,
      createdAt: serverTimestamp(),
      sessionId,
    })

    // Generate link
    const link = `https://fixhero.app/shared/${sessionId}?token=${token}`

    return { success: true, link }
  } catch (error) {
    console.error("Error generating sharing link:", error)
    return { success: false, message: "An error occurred while generating the sharing link" }
  }
}

// Verify sharing link
export async function verifySharingLink(
  sessionId: string,
  token: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    // Get sharing link
    const sharingDoc = await getDoc(doc(db, "users", sessionId.split("_")[0], "sharing", sessionId))
    if (!sharingDoc.exists()) {
      return { success: false, message: "Sharing link not found" }
    }

    const sharingData = sharingDoc.data()

    // Verify token
    if (sharingData.token !== token) {
      return { success: false, message: "Invalid sharing token" }
    }

    // Check if link has expired
    if (sharingData.expiresAt < Date.now()) {
      return { success: false, message: "Sharing link has expired" }
    }

    return { success: true }
  } catch (error) {
    console.error("Error verifying sharing link:", error)
    return { success: false, message: "An error occurred while verifying the sharing link" }
  }
}
