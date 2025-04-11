"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Check, X } from "lucide-react"
import { AsyncButton } from "@/components/ui/async-button"
import {
  getUserSubscription,
  upgradeSubscription,
  cancelSubscription,
  SubscriptionTier,
  SubscriptionStatus,
} from "@/lib/subscription-service"
import { motion } from "framer-motion"

export function SubscriptionSettings() {
  const [subscription, setSubscription] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [isCanceling, setIsCanceling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const sub = await getUserSubscription()
        setSubscription(sub)
      } catch (error) {
        console.error("Error loading subscription:", error)
        setError("Failed to load subscription information")
      } finally {
        setIsLoading(false)
      }
    }

    loadSubscription()
  }, [])

  const handleUpgrade = async (tier: SubscriptionTier) => {
    setError(null)
    setSuccess(null)
    setIsUpgrading(true)

    try {
      const result = await upgradeSubscription(tier)
      if (result) {
        setSuccess(`Successfully upgraded to ${tier} plan`)
        // Reload subscription
        const sub = await getUserSubscription()
        setSubscription(sub)
      } else {
        setError("Failed to upgrade subscription")
      }
    } catch (error) {
      console.error("Error upgrading subscription:", error)
      setError("An error occurred while upgrading your subscription")
    } finally {
      setIsUpgrading(false)
    }
  }

  const handleCancel = async () => {
    setError(null)
    setSuccess(null)
    setIsCanceling(true)

    try {
      const result = await cancelSubscription()
      if (result) {
        setSuccess("Your subscription has been canceled")
        // Reload subscription
        const sub = await getUserSubscription()
        setSubscription(sub)
      } else {
        setError("Failed to cancel subscription")
      }
    } catch (error) {
      console.error("Error canceling subscription:", error)
      setError("An error occurred while canceling your subscription")
    } finally {
      setIsCanceling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

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
        <h2 className="text-2xl font-bold mb-2">Your Subscription</h2>
        <p className="text-muted-foreground">Manage your FixHero Dev Inspector subscription and billing information.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your current subscription details</CardDescription>
            </div>
            <Badge variant={subscription?.tier === SubscriptionTier.FREE ? "outline" : "default"}>
              {subscription?.tier.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="font-medium">Status</span>
              <Badge
                variant={
                  subscription?.status === SubscriptionStatus.ACTIVE ||
                  subscription?.status === SubscriptionStatus.TRIAL
                    ? "default"
                    : "destructive"
                }
              >
                {subscription?.status.toUpperCase()}
              </Badge>
            </div>

            {subscription?.trialEndsAt && (
              <div className="flex justify-between">
                <span className="font-medium">Trial Ends</span>
                <span>{new Date(subscription.trialEndsAt).toLocaleDateString()}</span>
              </div>
            )}

            {subscription?.endDate && (
              <div className="flex justify-between">
                <span className="font-medium">Next Billing Date</span>
                <span>{new Date(subscription.endDate).toLocaleDateString()}</span>
              </div>
            )}

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Features</h4>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span>Sessions</span>
                  <span>{subscription?.features.maxSessions}</span>
                </li>
                <li className="flex justify-between">
                  <span>Issues per Session</span>
                  <span>{subscription?.features.maxIssuesPerSession}</span>
                </li>
                <li className="flex justify-between">
                  <span>Storage</span>
                  <span>{subscription?.features.maxStorage} MB</span>
                </li>
                <li className="flex justify-between">
                  <span>Team Members</span>
                  <span>{subscription?.features.teamMembers}</span>
                </li>
                <li className="flex justify-between">
                  <span>AI Features</span>
                  <span>
                    {subscription?.features.aiFeatures ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Priority Support</span>
                  <span>
                    {subscription?.features.prioritySupport ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {subscription?.tier !== SubscriptionTier.FREE && (
            <AsyncButton variant="outline" onClick={handleCancel} isLoading={isCanceling} loadingText="Canceling...">
              Cancel Subscription
            </AsyncButton>
          )}

          {subscription?.tier === SubscriptionTier.FREE && (
            <AsyncButton
              onClick={() => handleUpgrade(SubscriptionTier.PRO)}
              isLoading={isUpgrading}
              loadingText="Upgrading..."
            >
              Upgrade to PRO
            </AsyncButton>
          )}

          {subscription?.tier === SubscriptionTier.PRO && (
            <AsyncButton
              onClick={() => handleUpgrade(SubscriptionTier.TEAM)}
              isLoading={isUpgrading}
              loadingText="Upgrading..."
            >
              Upgrade to TEAM
            </AsyncButton>
          )}
        </CardFooter>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <motion.div whileHover={{ scale: 1.03 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className={subscription?.tier === SubscriptionTier.FREE ? "border-primary" : ""}>
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>For individual developers</CardDescription>
              <div className="mt-2 text-2xl font-bold">
                $0 <span className="text-sm font-normal text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>5 Sessions</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>20 Issues per Session</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>50 MB Storage</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>Basic Export Formats</span>
                </li>
                <li className="flex items-center">
                  <X className="h-4 w-4 mr-2 text-red-500" />
                  <span className="text-muted-foreground">AI Features</span>
                </li>
                <li className="flex items-center">
                  <X className="h-4 w-4 mr-2 text-red-500" />
                  <span className="text-muted-foreground">Team Collaboration</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                variant={subscription?.tier === SubscriptionTier.FREE ? "outline" : "default"}
                className="w-full"
                disabled={subscription?.tier === SubscriptionTier.FREE}
              >
                {subscription?.tier === SubscriptionTier.FREE ? "Current Plan" : "Downgrade"}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.03 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className={subscription?.tier === SubscriptionTier.PRO ? "border-primary" : ""}>
            <CardHeader>
              <CardTitle>Pro</CardTitle>
              <CardDescription>For professional developers</CardDescription>
              <div className="mt-2 text-2xl font-bold">
                $9.99 <span className="text-sm font-normal text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>50 Sessions</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>200 Issues per Session</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>500 MB Storage</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>All Export Formats</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>AI Features</span>
                </li>
                <li className="flex items-center">
                  <X className="h-4 w-4 mr-2 text-red-500" />
                  <span className="text-muted-foreground">Team Collaboration</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <AsyncButton
                variant={subscription?.tier === SubscriptionTier.PRO ? "outline" : "default"}
                className="w-full"
                disabled={subscription?.tier === SubscriptionTier.PRO}
                onClick={() => handleUpgrade(SubscriptionTier.PRO)}
                isLoading={isUpgrading && subscription?.tier !== SubscriptionTier.PRO}
                loadingText="Upgrading..."
              >
                {subscription?.tier === SubscriptionTier.PRO
                  ? "Current Plan"
                  : subscription?.tier === SubscriptionTier.TEAM
                    ? "Downgrade"
                    : "Upgrade"}
              </AsyncButton>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.03 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className={subscription?.tier === SubscriptionTier.TEAM ? "border-primary" : ""}>
            <CardHeader>
              <CardTitle>Team</CardTitle>
              <CardDescription>For teams and agencies</CardDescription>
              <div className="mt-2 text-2xl font-bold">
                $29.99 <span className="text-sm font-normal text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>200 Sessions</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>1000 Issues per Session</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>2 GB Storage</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>All Export Formats</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>AI Features</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>10 Team Members</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>Priority Support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <AsyncButton
                variant={subscription?.tier === SubscriptionTier.TEAM ? "outline" : "default"}
                className="w-full"
                disabled={subscription?.tier === SubscriptionTier.TEAM}
                onClick={() => handleUpgrade(SubscriptionTier.TEAM)}
                isLoading={isUpgrading && subscription?.tier !== SubscriptionTier.TEAM}
                loadingText="Upgrading..."
              >
                {subscription?.tier === SubscriptionTier.TEAM ? "Current Plan" : "Upgrade"}
              </AsyncButton>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
