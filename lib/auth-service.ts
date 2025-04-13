import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
} from "firebase/auth"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "./firebase-config"
import type { User } from "./types"

// Check if we're in a Chrome extension environment
const isExtensionEnvironment = typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id

// Register a new user
export async function registerUser(
  email: string,
  password: string,
  displayName: string,
): Promise<{ user: User; token: string }> {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    // Update display name
    await updateProfile(firebaseUser, { displayName })

    // Create user document in Firestore
    await setDoc(doc(db, "users", firebaseUser.uid), {
      email,
      displayName,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      settings: {
        theme: "light",
        autoSync: true,
        defaultSeverity: "medium",
      },
    })

    // Get ID token
    const token = await firebaseUser.getIdToken()

    // Store token in extension storage if in extension environment
    if (isExtensionEnvironment && chrome.storage) {
      await chrome.storage.local.set({ authToken: token, userId: firebaseUser.uid })
    }

    return {
      user: {
        id: firebaseUser.uid,
        email: firebaseUser.email || email,
        displayName: firebaseUser.displayName || displayName,
      },
      token,
    }
  } catch (error) {
    console.error("Error registering user:", error)
    throw error
  }
}

// Login user
export async function loginUser(email: string, password: string): Promise<{ user: User; token: string }> {
  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    // Update last login timestamp
    await setDoc(
      doc(db, "users", firebaseUser.uid),
      {
        lastLogin: serverTimestamp(),
      },
      { merge: true },
    )

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
    const userData = userDoc.data()

    // Get ID token
    const token = await firebaseUser.getIdToken()

    // Store token in extension storage if in extension environment
    if (isExtensionEnvironment && chrome.storage) {
      await chrome.storage.local.set({ authToken: token, userId: firebaseUser.uid })
    }

    return {
      user: {
        id: firebaseUser.uid,
        email: firebaseUser.email || email,
        displayName: firebaseUser.displayName || userData?.displayName || email.split("@")[0],
      },
      token,
    }
  } catch (error) {
    console.error("Error logging in:", error)
    throw error
  }
}

// Login with Google (using chrome.identity in extension environment)
export async function loginWithGoogle(): Promise<{ user: User; token: string }> {
  try {
    if (isExtensionEnvironment && typeof chrome !== "undefined" && chrome.identity) {
      // Use chrome.identity for extension environment
      return new Promise((resolve, reject) => {
        const AUTH_PARAMS = {
          client_id: "YOUR_CLIENT_ID.apps.googleusercontent.com", // Replace with your client ID
          scopes: ["profile", "email"],
          redirect_uri: chrome.identity.getRedirectURL(),
        }

        // Construct the authorization URL
        const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${AUTH_PARAMS.client_id}&response_type=token&redirect_uri=${encodeURIComponent(
          AUTH_PARAMS.redirect_uri,
        )}&scope=${encodeURIComponent(AUTH_PARAMS.scopes.join(" "))}`

        // Launch the auth flow
        chrome.identity.launchWebAuthFlow(
          {
            url: authUrl,
            interactive: true,
          },
          async (responseUrl) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message))
              return
            }

            // Extract the access token from the response URL
            const accessToken = new URLSearchParams(new URL(responseUrl).hash.substring(1)).get("access_token")
            if (!accessToken) {
              reject(new Error("Failed to get access token"))
              return
            }

            // Create a credential with the token
            const credential = GoogleAuthProvider.credential(null, accessToken)

            // Sign in with the credential
            const userCredential = await signInWithCredential(auth, credential)
            const firebaseUser = userCredential.user

            // Update or create user document in Firestore
            await setDoc(
              doc(db, "users", firebaseUser.uid),
              {
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                lastLogin: serverTimestamp(),
                photoURL: firebaseUser.photoURL,
                updatedAt: serverTimestamp(),
              },
              { merge: true },
            )

            // Get ID token
            const token = await firebaseUser.getIdToken()

            // Store token in extension storage
            await chrome.storage.local.set({ authToken: token, userId: firebaseUser.uid })

            resolve({
              user: {
                id: firebaseUser.uid,
                email: firebaseUser.email || "",
                displayName: firebaseUser.displayName || "",
              },
              token,
            })
          },
        )
      })
    } else {
      // Use regular Firebase auth for non-extension environment
      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, provider)
      const firebaseUser = userCredential.user

      // Update or create user document in Firestore
      await setDoc(
        doc(db, "users", firebaseUser.uid),
        {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          lastLogin: serverTimestamp(),
          photoURL: firebaseUser.photoURL,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      // Get ID token
      const token = await firebaseUser.getIdToken()

      return {
        user: {
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "",
        },
        token,
      }
    }
  } catch (error) {
    console.error("Error logging in with Google:", error)
    throw error
  }
}

// Logout user
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth)

    // Clear token from extension storage if in extension environment
    if (isExtensionEnvironment && chrome.storage) {
      await chrome.storage.local.remove(["authToken", "userId"])
    }
  } catch (error) {
    console.error("Error logging out:", error)
    throw error
  }
}

// Reset password
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error) {
    console.error("Error resetting password:", error)
    throw error
  }
}

// Get current user
export async function getCurrentUser(): Promise<User | null> {
  // First check extension storage for token if in extension environment
  if (isExtensionEnvironment && chrome.storage) {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get(["authToken", "userId"], async (result) => {
          if (result.authToken && result.userId) {
            try {
              // Get user data from Firestore
              const userDoc = await getDoc(doc(db, "users", result.userId))
              const userData = userDoc.data()

              if (userData) {
                resolve({
                  id: result.userId,
                  email: userData.email || "",
                  displayName: userData.displayName || "",
                })
                return
              }
            } catch (error) {
              console.error("Error getting user data from Firestore:", error)
            }
          }

          // If no token in storage or Firestore fetch failed, check Firebase Auth
          checkFirebaseAuth(resolve)
        })
      })
    } catch (error) {
      console.error("Error checking extension storage:", error)
    }
  }

  // Default to checking Firebase Auth
  return new Promise(checkFirebaseAuth)
}

function checkFirebaseAuth(resolve: (user: User | null) => void) {
  const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
    unsubscribe()
    if (firebaseUser) {
      try {
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
        const userData = userDoc.data()

        resolve({
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || userData?.displayName || firebaseUser.email?.split("@")[0] || "",
        })
      } catch (error) {
        console.error("Error getting user data:", error)
        resolve({
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "",
        })
      }
    } else {
      resolve(null)
    }
  })
}

// Update user profile
export async function updateUserProfile(
  displayName: string,
  photoURL?: string,
): Promise<{ success: boolean; user: User | null }> {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error("No user is currently logged in")
    }

    // Update profile in Firebase Auth
    await updateProfile(currentUser, {
      displayName,
      photoURL,
    })

    // Update profile in Firestore
    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        displayName,
        photoURL,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )

    return {
      success: true,
      user: {
        id: currentUser.uid,
        email: currentUser.email || "",
        displayName: displayName,
      },
    }
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw error
  }
}

// Update user settings
export async function updateUserSettings(settings: Record<string, any>): Promise<{ success: boolean }> {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error("No user is currently logged in")
    }

    // Update settings in Firestore
    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        settings,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )

    return { success: true }
  } catch (error) {
    console.error("Error updating user settings:", error)
    throw error
  }
}

// Get user settings
export async function getUserSettings(): Promise<Record<string, any> | null> {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      return null
    }

    const userDoc = await getDoc(doc(db, "users", currentUser.uid))
    const userData = userDoc.data()

    return userData?.settings || null
  } catch (error) {
    console.error("Error getting user settings:", error)
    return null
  }
}
