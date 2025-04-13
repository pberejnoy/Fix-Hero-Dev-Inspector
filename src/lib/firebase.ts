import { initializeApp } from "firebase/app"
import { getAuth, connectAuthEmulator } from "firebase/auth"
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore"
import { getStorage, connectStorageEmulator } from "firebase/storage"

// Check if we're in a Chrome extension environment
const isExtensionEnvironment = typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id

// Get Firebase config from environment variables or extension storage
const getFirebaseConfig = async () => {
  // Default config (used in development or as fallback)
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId:
      import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  }

  // If in extension environment, try to get config from storage
  if (isExtensionEnvironment && chrome.storage) {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get("firebaseConfig", (result) => {
          if (result.firebaseConfig) {
            resolve(result.firebaseConfig)
          } else {
            // If not in storage, use default and save it
            chrome.storage.local.set({ firebaseConfig: config })
            resolve(config)
          }
        })
      })
    } catch (error) {
      console.error("Error getting Firebase config from storage:", error)
      return config
    }
  }

  return config
}

// Initialize Firebase
let app, auth, db, fbStorage

const initializeFirebase = async () => {
  const firebaseConfig = await getFirebaseConfig()

  // Check if we have all required Firebase config values
  const isFirebaseConfigValid = Object.values(firebaseConfig).every(
    (value) => value !== undefined && value !== null && value !== "",
  )

  if (isFirebaseConfigValid) {
    try {
      app = initializeApp(firebaseConfig)
      auth = getAuth(app)
      db = getFirestore(app)
      fbStorage = getStorage(app)

      // Use emulators in development environment
      if (import.meta.env.DEV && !isExtensionEnvironment) {
        connectAuthEmulator(auth, "http://localhost:9099")
        connectFirestoreEmulator(db, "localhost", 8080)
        connectStorageEmulator(fbStorage, "localhost", 9199)
      }

      console.log("Firebase initialized successfully")
      return { app, auth, db, storage: fbStorage }
    } catch (error) {
      console.error("Error initializing Firebase:", error)
      return createMockImplementations()
    }
  } else {
    console.warn("Firebase configuration is incomplete. Using mock implementations.")
    return createMockImplementations()
  }
}

// Create mock implementations for development
function createMockImplementations() {
  const mockData = {}

  const mockAuth: any = {
    currentUser: null,
    onAuthStateChanged: (callback) => {
      callback(null)
      return () => {}
    },
    signInWithEmailAndPassword: async (_, email, password) => {
      console.log("[MOCK] Sign in with", email, password)
      const mockUser = {
        uid: "mock-user-123",
        email,
        displayName: "Mock User",
      }

      // Simulate successful login
      setTimeout(() => {
        // @ts-ignore
        mockAuth.currentUser = mockUser
        // Trigger any auth state listeners
        // @ts-ignore
        mockAuth._authStateListeners.forEach((listener) => listener(mockUser))
      }, 500)

      return { user: mockUser }
    },
    createUserWithEmailAndPassword: async (_, email, password) => {
      console.log("[MOCK] Create user with", email, password)
      const mockUser = {
        uid: "mock-user-123",
        email,
        displayName: "Mock User",
      }
      return { user: mockUser }
    },
    signOut: async () => {
      console.log("[MOCK] Sign out")
      // @ts-ignore
      mockAuth.currentUser = null
      // Trigger any auth state listeners
      // @ts-ignore
      mockAuth._authStateListeners.forEach((listener) => listener(null))
      return Promise.resolve()
    },
    // For internal mock use
    _authStateListeners: [] as Array<(user: any) => void>,
  }

  // Add special handler for onAuthStateChanged in mock
  mockAuth.onAuthStateChanged = (callback) => {
    // @ts-ignore
    mockAuth._authStateListeners.push(callback)
    // Initial call with current user
    callback(mockAuth.currentUser)
    // Return unsubscribe function
    return () => {
      // @ts-ignore
      mockAuth._authStateListeners = mockAuth._authStateListeners.filter((listener) => listener !== callback)
    }
  }

  const mockDb: any = {
    collection: (path) => ({
      doc: (id) => ({
        get: async () => ({
          exists: true,
          data: () => ({ id, createdAt: new Date(), ...mockData[path]?.[id] }),
        }),
        set: async (data) => {
          console.log(`[MOCK] Setting document ${path}/${id}:`, data)
          if (!mockData[path]) mockData[path] = {}
          mockData[path][id] = data
          return Promise.resolve()
        },
        update: async (data) => {
          console.log(`[MOCK] Updating document ${path}/${id}:`, data)
          if (!mockData[path]) mockData[path] = {}
          mockData[path][id] = { ...mockData[path][id], ...data }
          return Promise.resolve()
        },
        delete: async () => {
          console.log(`[MOCK] Deleting document ${path}/${id}`)
          if (mockData[path]) delete mockData[path][id]
          return Promise.resolve()
        },
      }),
      add: async (data) => {
        const id = `mock-${Date.now()}`
        console.log(`[MOCK] Adding document to ${path} with ID ${id}:`, data)
        if (!mockData[path]) mockData[path] = {}
        mockData[path][id] = data
        return { id }
      },
      where: () => ({
        get: async () => ({
          docs: Object.entries(mockData[path] || {}).map(([id, data]) => ({
            id,
            data: () => data,
          })),
        }),
      }),
    }),
  }

  const mockStorage: any = {
    ref: (path) => ({
      put: async (file) => {
        console.log(`[MOCK] Uploading file to ${path}:`, file)
        return {
          ref: {
            getDownloadURL: async () => `https://mock-storage-url.com/${path}`,
          },
        }
      },
      getDownloadURL: async () => `https://mock-storage-url.com/${path}`,
    }),
  }

  return { app: null, auth: mockAuth, db: mockDb, storage: mockStorage }
}

// Initialize Firebase and export the instances
const firebaseInstances = await initializeFirebase()
export const { app, auth, db, storage } = firebaseInstances
