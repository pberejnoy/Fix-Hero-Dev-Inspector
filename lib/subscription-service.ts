import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { db, auth } from "../../lib/firebase-config"

// Subscription tiers
export enum SubscriptionTier {
  FREE = "free",
  PRO = "pro",
  TEAM = "team",
}

// Subscription status
export enum SubscriptionStatus {
  ACTIVE = "active",
  CANCELED = "canceled",
  EXPIRED = "expired",
  TRIAL = "trial",
}

// Subscription features
export interface SubscriptionFeatures {
  maxSessions: number
  maxIssuesPerSession: number
  maxStorage: number // in MB
  exportFormats: string[]
  teamMembers: number
  aiFeatures: boolean
  prioritySupport: boolean
}

// Subscription data
export interface Subscription {
  tier: SubscriptionTier
  status: SubscriptionStatus
  startDate: number
  endDate: number | null
  trialEndsAt: number | null
  features: SubscriptionFeatures
  stripeCustomerId?: string
  stripeSubscriptionId?: string
}

// Feature limits by tier
const tierFeatures: Record<SubscriptionTier, SubscriptionFeatures> = {
  [SubscriptionTier.FREE]: {
    maxSessions: 5,
    maxIssuesPerSession: 20,
    maxStorage: 50, // 50MB
    exportFormats: ["markdown", "json"],
    teamMembers: 1,
    aiFeatures: false,
    prioritySupport: false,
  },
  [SubscriptionTier.PRO]: {
    maxSessions: 50,
    maxIssuesPerSession: 200,
    maxStorage: 500, // 500MB
    exportFormats: ["markdown", "json", "csv", "github", "cursor"],
    teamMembers: 1,
    aiFeatures: true,
    prioritySupport: false,
  },
  [SubscriptionTier.TEAM]: {
    maxSessions: 200,
    maxIssuesPerSession: 1000,
    maxStorage: 2000, // 2GB
    exportFormats: ["markdown", "json", "csv", "github", "cursor", "notion"],
    teamMembers: 10,
    aiFeatures: true,
    prioritySupport: true,
  },
}

// Get current user subscription
export async function getUserSubscription(): Promise<Subscription | null> {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      return null
    }

    const subscriptionDoc = await getDoc(doc(db, "users", currentUser.uid, "subscription", "current"))

    if (!subscriptionDoc.exists()) {
      // Create a free subscription if none exists
      const freeSubscription = createFreeSubscription()
      await setDoc(doc(db, "users", currentUser.uid, "subscription", "current"), freeSubscription)
      return freeSubscription
    }

    return subscriptionDoc.data() as Subscription
  } catch (error) {
    console.error("Error getting user subscription:", error)
    return null
  }
}

// Create a free subscription
export function createFreeSubscription(): Subscription {
  const now = Date.now()
  const trialEndsAt = now + 14 * 24 * 60 * 60 * 1000 // 14 days trial

  return {
    tier: SubscriptionTier.FREE,
    status: SubscriptionStatus.TRIAL,
    startDate: now,
    endDate: null, // Free subscriptions don't expire
    trialEndsAt,
    features: tierFeatures[SubscriptionTier.FREE],
  }
}

// Check if user can perform an action based on their subscription
export async function canPerformAction(action: string, quantity = 1): Promise<boolean> {
  const subscription = await getUserSubscription()

  if (!subscription) {
    return false
  }

  // Check if subscription is active or in trial
  if (subscription.status !== SubscriptionStatus.ACTIVE && subscription.status !== SubscriptionStatus.TRIAL) {
    return false
  }

  // Check if trial has ended
  if (
    subscription.status === SubscriptionStatus.TRIAL &&
    subscription.trialEndsAt &&
    subscription.trialEndsAt < Date.now()
  ) {
    // Update subscription status to expired
    await updateSubscriptionStatus(SubscriptionStatus.EXPIRED)
    return false
  }

  // Check specific action limits
  switch (action) {
    case "create_session":
      return (await getSessionCount()) < subscription.features.maxSessions
    case "add_issue":
      const sessionId = localStorage.getItem("fixhero_current_session")
      if (!sessionId) return false
      return (await getIssueCount(sessionId)) < subscription.features.maxIssuesPerSession
    case "use_export_format":
      const format = quantity.toString()
      return subscription.features.exportFormats.includes(format)
    case "use_ai_feature":
      return subscription.features.aiFeatures
    case "add_team_member":
      return (await getTeamMemberCount()) < subscription.features.teamMembers
    default:
      return true
  }
}

// Get current session count
async function getSessionCount(): Promise<number> {
  try {
    const sessions = JSON.parse(localStorage.getItem("fixhero_sessions") || "[]")
    return sessions.length
  } catch (error) {
    console.error("Error getting session count:", error)
    return 0
  }
}

// Get issue count for a session
async function getIssueCount(sessionId: string): Promise<number> {
  try {
    const issues = JSON.parse(localStorage.getItem(`fixhero_issues_${sessionId}`) || "[]")
    return issues.length
  } catch (error) {
    console.error("Error getting issue count:", error)
    return 0
  }
}

// Get team member count
async function getTeamMemberCount(): Promise<number> {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      return 0
    }

    const teamDoc = await getDoc(doc(db, "users", currentUser.uid, "team", "members"))
    if (!teamDoc.exists()) {
      return 0
    }

    const members = teamDoc.data().members || []
    return members.length
  } catch (error) {
    console.error("Error getting team member count:", error)
    return 0
  }
}

// Update subscription status
export async function updateSubscriptionStatus(status: SubscriptionStatus): Promise<boolean> {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      return false
    }

    await setDoc(
      doc(db, "users", currentUser.uid, "subscription", "current"),
      {
        status,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )

    return true
  } catch (error) {
    console.error("Error updating subscription status:", error)
    return false
  }
}

// Upgrade subscription (placeholder for Stripe integration)
export async function upgradeSubscription(tier: SubscriptionTier): Promise<boolean> {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      return false
    }

    // In a real implementation, this would redirect to Stripe checkout
    // For now, we'll just update the subscription directly
    const now = Date.now()

    const subscription: Subscription = {
      tier,
      status: SubscriptionStatus.ACTIVE,
      startDate: now,
      endDate: now + 30 * 24 * 60 * 60 * 1000, // 30 days
      trialEndsAt: null,
      features: tierFeatures[tier],
      stripeCustomerId: "cus_mock_id",
      stripeSubscriptionId: "sub_mock_id",
    }

    await setDoc(doc(db, "users", currentUser.uid, "subscription", "current"), subscription)

    return true
  } catch (error) {
    console.error("Error upgrading subscription:", error)
    return false
  }
}

// Cancel subscription (placeholder for Stripe integration)
export async function cancelSubscription(): Promise<boolean> {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      return false
    }

    // In a real implementation, this would cancel the Stripe subscription
    // For now, we'll just update the subscription status
    await updateSubscriptionStatus(SubscriptionStatus.CANCELED)

    return true
  } catch (error) {
    console.error("Error canceling subscription:", error)
    return false
  }
}
