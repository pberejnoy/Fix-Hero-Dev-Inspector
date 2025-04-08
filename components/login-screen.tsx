"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Wrench, Lock, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getAccountLockStatus, getRemainingLoginAttempts } from "@/lib/auth"

interface LoginScreenProps {
  onLogin: (email: string, password: string) => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({ email: "", password: "" })
  const [accountLocked, setAccountLocked] = useState(false)
  const [lockoutTime, setLockoutTime] = useState(0)
  const [remainingAttempts, setRemainingAttempts] = useState(3)
  const { toast } = useToast()

  // Check account lock status on mount and periodically
  useEffect(() => {
    const checkLockStatus = () => {
      const lockStatus = getAccountLockStatus()
      setAccountLocked(lockStatus.locked)
      setLockoutTime(lockStatus.remainingTime)
      setRemainingAttempts(getRemainingLoginAttempts())
    }

    // Check immediately
    checkLockStatus()

    // Then check every 10 seconds
    const interval = setInterval(checkLockStatus, 10000)

    return () => clearInterval(interval)
  }, [])

  const validateForm = () => {
    const newErrors = { email: "", password: "" }
    let isValid = true

    if (!email) {
      newErrors.email = "Email is required"
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid"
      isValid = false
    }

    if (!password) {
      newErrors.password = "Password is required"
      isValid = false
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if account is locked
    const lockStatus = getAccountLockStatus()
    if (lockStatus.locked) {
      setAccountLocked(true)
      setLockoutTime(lockStatus.remainingTime)

      toast({
        title: "Account temporarily locked",
        description: `Too many failed attempts. Please try again in ${Math.ceil(lockStatus.remainingTime / 60)} minutes.`,
        variant: "destructive",
      })
      return
    }

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      await onLogin(email, password)
    } catch (error) {
      // Update remaining attempts after failed login
      setRemainingAttempts(getRemainingLoginAttempts())

      // Check if account is now locked
      const newLockStatus = getAccountLockStatus()
      if (newLockStatus.locked) {
        setAccountLocked(true)
        setLockoutTime(newLockStatus.remainingTime)

        toast({
          title: "Account temporarily locked",
          description: `Too many failed attempts. Please try again in ${Math.ceil(newLockStatus.remainingTime / 60)} minutes.`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Login failed",
          description: `Invalid credentials. ${remainingAttempts - 1} attempts remaining.`,
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault()
    toast({
      title: "Password Reset",
      description: "This feature is not yet implemented. Please contact your administrator.",
    })
  }

  // Format lockout time for display
  const formatLockoutTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-orange-500 text-white p-3 rounded-full">
              <Wrench className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">FixHero Dev Inspector</CardTitle>
          <CardDescription className="text-center">Advanced bug reporting and inspection tool</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {accountLocked ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <h3 className="font-semibold text-red-700">Account Temporarily Locked</h3>
              <p className="text-sm text-red-600 mt-1">
                Too many failed login attempts. Please try again in {formatLockoutTime(lockoutTime)}.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    placeholder="Enter your email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={errors.email ? "border-red-500" : ""}
                    disabled={isLoading}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={errors.password ? "border-red-500" : ""}
                    disabled={isLoading}
                  />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                  <div className="text-right">
                    <a
                      href="#"
                      onClick={handleForgotPassword}
                      className="text-xs text-orange-600 hover:text-orange-800"
                    >
                      Forgot password?
                    </a>
                  </div>
                </div>
                {remainingAttempts < 3 && (
                  <div className="text-xs text-amber-600 mt-1">
                    Warning: {remainingAttempts} login {remainingAttempts === 1 ? "attempt" : "attempts"} remaining
                  </div>
                )}
                <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Lock className="h-4 w-4 mr-2" />
                      Sign In
                    </span>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-xs text-center text-gray-500 w-full">
            Admin access only. Contact your administrator for credentials.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
