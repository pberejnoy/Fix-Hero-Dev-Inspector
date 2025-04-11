import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../lib/firebase-config";
import type { User } from "../../lib/types";

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

// Logout user
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth)
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
  return new Promise((resolve) => {
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
