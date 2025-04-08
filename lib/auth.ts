// This is a simplified auth implementation for the demo
// In a production app, this would be replaced with a proper auth system

// The only valid admin email
const ADMIN_EMAIL = "pberejnoy@gmail.com"

// Track login attempts
const LOGIN_ATTEMPTS_KEY = "fixhero_login_attempts"
const MAX_LOGIN_ATTEMPTS = 3
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes in milliseconds

/**
 * Validates user credentials
 * In a real app, this would be a server-side function
 */
export function validateCredentials(email: string, password: string): boolean {
  // Check if account is locked
  const lockStatus = getAccountLockStatus()
  if (lockStatus.locked) {
    return false
  }

  // For demo purposes, we only allow the admin email with any password >= 6 chars
  const isValid = email === ADMIN_EMAIL && password.length >= 6

  // Track failed attempts
  if (!isValid) {
    recordFailedAttempt()
  } else {
    // Reset attempts on successful login
    resetLoginAttempts()
  }

  return isValid
}

/**
 * Generates a secure token
 * In a real app, this would be a JWT from a server
 */
export function generateSecureToken(email: string): string {
  // This is a simplified token generation for demo purposes
  // In a real app, this would be a JWT with proper signing
  const timestamp = Date.now()
  const randomPart = Math.random().toString(36).substring(2, 15)

  // Create a simple token structure
  const tokenData = {
    email,
    timestamp,
    random: randomPart,
    exp: timestamp + 7 * 24 * 60 * 60 * 1000, // 7 days expiration
  }

  // In a real app, this would be signed with a secret key
  return btoa(JSON.stringify(tokenData))
}

/**
 * Verifies if a token is valid
 */
export function verifyToken(token: string): boolean {
  try {
    const tokenData = JSON.parse(atob(token))

    // Check if token is expired
    if (tokenData.exp < Date.now()) {
      return false
    }

    // Check if the email is valid
    if (tokenData.email !== ADMIN_EMAIL) {
      return false
    }

    return true
  } catch (error) {
    return false
  }
}

/**
 * Gets user info from token
 */
export function getUserFromToken(token: string): { email: string } | null {
  try {
    const tokenData = JSON.parse(atob(token))
    return { email: tokenData.email }
  } catch (error) {
    return null
  }
}

/**
 * Records a failed login attempt
 */
function recordFailedAttempt(): void {
  try {
    const attemptsData = localStorage.getItem(LOGIN_ATTEMPTS_KEY)
    const attempts = attemptsData ? JSON.parse(attemptsData) : { count: 0, timestamp: Date.now() }

    // Increment attempt count
    attempts.count += 1
    attempts.timestamp = Date.now()

    // Save updated attempts
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts))
  } catch (error) {
    console.error("Error recording failed login attempt:", error)
  }
}

/**
 * Checks if the account is locked due to too many failed attempts
 */
export function getAccountLockStatus(): { locked: boolean; remainingTime: number } {
  try {
    const attemptsData = localStorage.getItem(LOGIN_ATTEMPTS_KEY)
    if (!attemptsData) {
      return { locked: false, remainingTime: 0 }
    }

    const attempts = JSON.parse(attemptsData)

    // If we have too many attempts
    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
      const lockoutEndTime = attempts.timestamp + LOCKOUT_DURATION
      const currentTime = Date.now()

      // If we're still in the lockout period
      if (currentTime < lockoutEndTime) {
        const remainingTime = Math.ceil((lockoutEndTime - currentTime) / 1000) // in seconds
        return { locked: true, remainingTime }
      } else {
        // Lockout period has expired, reset attempts
        resetLoginAttempts()
      }
    }

    return { locked: false, remainingTime: 0 }
  } catch (error) {
    console.error("Error checking account lock status:", error)
    return { locked: false, remainingTime: 0 }
  }
}

/**
 * Resets login attempts counter
 */
function resetLoginAttempts(): void {
  try {
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY)
  } catch (error) {
    console.error("Error resetting login attempts:", error)
  }
}

/**
 * Gets the number of remaining login attempts
 */
export function getRemainingLoginAttempts(): number {
  try {
    const attemptsData = localStorage.getItem(LOGIN_ATTEMPTS_KEY)
    if (!attemptsData) {
      return MAX_LOGIN_ATTEMPTS
    }

    const attempts = JSON.parse(attemptsData)
    return Math.max(0, MAX_LOGIN_ATTEMPTS - attempts.count)
  } catch (error) {
    console.error("Error getting remaining login attempts:", error)
    return MAX_LOGIN_ATTEMPTS
  }
}
