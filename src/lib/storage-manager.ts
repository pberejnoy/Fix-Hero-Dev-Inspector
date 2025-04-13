/**
 * Storage Manager
 * Enhanced data persistence mechanisms
 */

// Type declaration for the global chrome object
declare const chrome: any

// Storage types
export enum StorageType {
  LOCAL = "local",
  SYNC = "sync",
  SESSION = "session",
  INDEXED_DB = "indexeddb",
}

// Storage options
export interface StorageOptions {
  type: StorageType
  encrypted?: boolean
  compress?: boolean
  expiration?: number // Time in milliseconds
}

// Storage item metadata
interface StorageItemMetadata {
  timestamp: number
  expiration?: number
  encrypted: boolean
  compressed: boolean
  size: number
}

// Check if we're in a Chrome extension environment
const isExtensionEnvironment = typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id

// IndexedDB database name and version
const DB_NAME = "fixhero_storage"
const DB_VERSION = 1
const STORE_NAME = "data"

// Storage manager class
export class StorageManager {
  private db: IDBDatabase | null = null
  private dbPromise: Promise<IDBDatabase> | null = null
  private encryptionKey: CryptoKey | null = null

  constructor() {
    // Initialize storage manager
    this.initialize()
  }

  // Initialize storage manager
  private async initialize(): Promise<void> {
    // Initialize IndexedDB
    if (typeof indexedDB !== "undefined") {
      this.dbPromise = this.openDatabase()
    }

    // Generate encryption key if needed
    if (isExtensionEnvironment) {
      try {
        await this.getEncryptionKey()
      } catch (error) {
        console.error("Failed to initialize encryption key:", error)
      }
    }
  }

  // Open IndexedDB database
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = (event) => {
        console.error("Failed to open IndexedDB:", event)
        reject(new Error("Failed to open IndexedDB"))
      }

      request.onsuccess = (event) => {
        this.db = request.result
        resolve(request.result)
      }

      request.onupgradeneeded = (event) => {
        const db = request.result

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "key" })
        }
      }
    })
  }

  // Get or create encryption key
  private async getEncryptionKey(): Promise<CryptoKey> {
    if (this.encryptionKey) {
      return this.encryptionKey
    }

    if (!isExtensionEnvironment) {
      throw new Error("Encryption is only available in the extension environment")
    }

    return new Promise((resolve, reject) => {
      chrome.storage.local.get("encryptionKey", async (result) => {
        if (result.encryptionKey) {
          // Convert stored key to CryptoKey
          try {
            const keyData = this.base64ToArrayBuffer(result.encryptionKey)
            this.encryptionKey = await window.crypto.subtle.importKey("raw", keyData, { name: "AES-GCM" }, false, [
              "encrypt",
              "decrypt",
            ])
            resolve(this.encryptionKey)
          } catch (error) {
            reject(error)
          }
        } else {
          // Generate new encryption key
          try {
            this.encryptionKey = await window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
              "encrypt",
              "decrypt",
            ])

            // Export and store the key
            const keyData = await window.crypto.subtle.exportKey("raw", this.encryptionKey)
            const keyString = this.arrayBufferToBase64(keyData)

            chrome.storage.local.set({ encryptionKey: keyString }, () => {
              resolve(this.encryptionKey!)
            })
          } catch (error) {
            reject(error)
          }
        }
      })
    })
  }

  // Set an item in storage
  public async setItem<T>(key: string, value: T, options: Partial<StorageOptions> = {}): Promise<void> {
    const defaultOptions: StorageOptions = {
      type: StorageType.LOCAL,
      encrypted: false,
      compress: false,
    }

    const mergedOptions: StorageOptions = { ...defaultOptions, ...options }

    // Prepare the data
    let data = JSON.stringify(value)
    let encrypted = false
    let compressed = false

    // Compress if requested
    if (mergedOptions.compress) {
      try {
        data = await this.compressData(data)
        compressed = true
      } catch (error) {
        console.error("Failed to compress data:", error)
      }
    }

    // Encrypt if requested
    if (mergedOptions.encrypted) {
      try {
        data = await this.encryptData(data)
        encrypted = true
      } catch (error) {
        console.error("Failed to encrypt data:", error)
      }
    }

    // Create metadata
    const metadata: StorageItemMetadata = {
      timestamp: Date.now(),
      expiration: mergedOptions.expiration ? Date.now() + mergedOptions.expiration : undefined,
      encrypted,
      compressed,
      size: data.length,
    }

    // Store the data based on the storage type
    switch (mergedOptions.type) {
      case StorageType.LOCAL:
        await this.setLocalItem(key, data, metadata)
        break
      case StorageType.SYNC:
        await this.setSyncItem(key, data, metadata)
        break
      case StorageType.SESSION:
        this.setSessionItem(key, data, metadata)
        break
      case StorageType.INDEXED_DB:
        await this.setIndexedDBItem(key, data, metadata)
        break
    }
  }

  // Get an item from storage
  public async getItem<T>(key: string, options: Partial<StorageOptions> = {}): Promise<T | null> {
    const defaultOptions: StorageOptions = {
      type: StorageType.LOCAL,
      encrypted: false,
      compress: false,
    }

    const mergedOptions: StorageOptions = { ...defaultOptions, ...options }

    // Get the data based on the storage type
    let result: { data: string; metadata: StorageItemMetadata } | null = null

    switch (mergedOptions.type) {
      case StorageType.LOCAL:
        result = await this.getLocalItem(key)
        break
      case StorageType.SYNC:
        result = await this.getSyncItem(key)
        break
      case StorageType.SESSION:
        result = this.getSessionItem(key)
        break
      case StorageType.INDEXED_DB:
        result = await this.getIndexedDBItem(key)
        break
    }

    if (!result) {
      return null
    }

    // Check if the item has expired
    if (result.metadata.expiration && result.metadata.expiration < Date.now()) {
      // Remove the expired item
      this.removeItem(key, { type: mergedOptions.type })
      return null
    }

    let data = result.data

    // Decrypt if needed
    if (result.metadata.encrypted) {
      try {
        data = await this.decryptData(data)
      } catch (error) {
        console.error("Failed to decrypt data:", error)
        return null
      }
    }

    // Decompress if needed
    if (result.metadata.compressed) {
      try {
        data = await this.decompressData(data)
      } catch (error) {
        console.error("Failed to decompress data:", error)
        return null
      }
    }

    // Parse the data
    try {
      return JSON.parse(data) as T
    } catch (error) {
      console.error("Failed to parse data:", error)
      return null
    }
  }

  // Remove an item from storage
  public async removeItem(key: string, options: Partial<StorageOptions> = {}): Promise<void> {
    const defaultOptions: StorageOptions = {
      type: StorageType.LOCAL,
    }

    const mergedOptions: StorageOptions = { ...defaultOptions, ...options }

    // Remove the item based on the storage type
    switch (mergedOptions.type) {
      case StorageType.LOCAL:
        await this.removeLocalItem(key)
        break
      case StorageType.SYNC:
        await this.removeSyncItem(key)
        break
      case StorageType.SESSION:
        this.removeSessionItem(key)
        break
      case StorageType.INDEXED_DB:
        await this.removeIndexedDBItem(key)
        break
    }
  }

  // Clear all items from storage
  public async clear(options: Partial<StorageOptions> = {}): Promise<void> {
    const defaultOptions: StorageOptions = {
      type: StorageType.LOCAL,
    }

    const mergedOptions: StorageOptions = { ...defaultOptions, ...options }

    // Clear the storage based on the storage type
    switch (mergedOptions.type) {
      case StorageType.LOCAL:
        await this.clearLocal()
        break
      case StorageType.SYNC:
        await this.clearSync()
        break
      case StorageType.SESSION:
        this.clearSession()
        break
      case StorageType.INDEXED_DB:
        await this.clearIndexedDB()
        break
    }
  }

  // Get all keys in storage
  public async keys(options: Partial<StorageOptions> = {}): Promise<string[]> {
    const defaultOptions: StorageOptions = {
      type: StorageType.LOCAL,
    }

    const mergedOptions: StorageOptions = { ...defaultOptions, ...options }

    // Get the keys based on the storage type
    switch (mergedOptions.type) {
      case StorageType.LOCAL:
        return this.getLocalKeys()
      case StorageType.SYNC:
        return this.getSyncKeys()
      case StorageType.SESSION:
        return this.getSessionKeys()
      case StorageType.INDEXED_DB:
        return this.getIndexedDBKeys()
      default:
        return []
    }
  }

  // Get the size of storage
  public async getSize(options: Partial<StorageOptions> = {}): Promise<number> {
    const defaultOptions: StorageOptions = {
      type: StorageType.LOCAL,
    }

    const mergedOptions: StorageOptions = { ...defaultOptions, ...options }

    // Get the size based on the storage type
    switch (mergedOptions.type) {
      case StorageType.LOCAL:
        return this.getLocalSize()
      case StorageType.SYNC:
        return this.getSyncSize()
      case StorageType.SESSION:
        return this.getSessionSize()
      case StorageType.INDEXED_DB:
        return this.getIndexedDBSize()
      default:
        return 0
    }
  }

  // Set an item in local storage
  private async setLocalItem(key: string, data: string, metadata: StorageItemMetadata): Promise<void> {
    if (!isExtensionEnvironment) {
      localStorage.setItem(`${key}:data`, data)
      localStorage.setItem(`${key}:metadata`, JSON.stringify(metadata))
      return
    }

    return new Promise((resolve, reject) => {
      chrome.storage.local.set(
        {
          [`${key}:data`]: data,
          [`${key}:metadata`]: metadata,
        },
        () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError)
          } else {
            resolve()
          }
        },
      )
    })
  }

  // Get an item from local storage
  private async getLocalItem(key: string): Promise<{ data: string; metadata: StorageItemMetadata } | null> {
    if (!isExtensionEnvironment) {
      const data = localStorage.getItem(`${key}:data`)
      const metadataStr = localStorage.getItem(`${key}:metadata`)

      if (!data || !metadataStr) {
        return null
      }

      try {
        const metadata = JSON.parse(metadataStr) as StorageItemMetadata
        return { data, metadata }
      } catch (error) {
        return null
      }
    }

    return new Promise((resolve, reject) => {
      chrome.storage.local.get([`${key}:data`, `${key}:metadata`], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
          return
        }

        const data = result[`${key}:data`]
        const metadata = result[`${key}:metadata`]

        if (!data || !metadata) {
          resolve(null)
          return
        }

        resolve({ data, metadata })
      })
    })
  }

  // Remove an item from local storage
  private async removeLocalItem(key: string): Promise<void> {
    if (!isExtensionEnvironment) {
      localStorage.removeItem(`${key}:data`)
      localStorage.removeItem(`${key}:metadata`)
      return
    }

    return new Promise((resolve, reject) => {
      chrome.storage.local.remove([`${key}:data`, `${key}:metadata`], () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve()
        }
      })
    })
  }

  // Clear local storage
  private async clearLocal(): Promise<void> {
    if (!isExtensionEnvironment) {
      localStorage.clear()
      return
    }

    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve()
        }
      })
    })
  }

  // Get all keys in local storage
  private async getLocalKeys(): Promise<string[]> {
    if (!isExtensionEnvironment) {
      const keys: string[] = []

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)

        if (key && key.endsWith(":data")) {
          keys.push(key.replace(":data", ""))
        }
      }

      return keys
    }

    return new Promise((resolve, reject) => {
      chrome.storage.local.get(null, (items) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
          return
        }

        const keys: string[] = []

        for (const key in items) {
          if (key.endsWith(":data")) {
            keys.push(key.replace(":data", ""))
          }
        }

        resolve(keys)
      })
    })
  }

  // Get the size of local storage
  private async getLocalSize(): Promise<number> {
    if (!isExtensionEnvironment) {
      let size = 0

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)

        if (key) {
          size += key.length + localStorage.getItem(key)!.length
        }
      }

      return size
    }

    return new Promise((resolve, reject) => {
      chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve(bytesInUse)
        }
      })
    })
  }

  // Set an item in sync storage
  private async setSyncItem(key: string, data: string, metadata: StorageItemMetadata): Promise<void> {
    if (!isExtensionEnvironment) {
      // Fallback to local storage in non-extension environment
      await this.setLocalItem(key, data, metadata)
      return
    }

    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(
        {
          [`${key}:data`]: data,
          [`${key}:metadata`]: metadata,
        },
        () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError)
          } else {
            resolve()
          }
        },
      )
    })
  }

  // Get an item from sync storage
  private async getSyncItem(key: string): Promise<{ data: string; metadata: StorageItemMetadata } | null> {
    if (!isExtensionEnvironment) {
      // Fallback to local storage in non-extension environment
      return this.getLocalItem(key)
    }

    return new Promise((resolve, reject) => {
      chrome.storage.sync.get([`${key}:data`, `${key}:metadata`], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
          return
        }

        const data = result[`${key}:data`]
        const metadata = result[`${key}:metadata`]

        if (!data || !metadata) {
          resolve(null)
          return
        }

        resolve({ data, metadata })
      })
    })
  }

  // Remove an item from sync storage
  private async removeSyncItem(key: string): Promise<void> {
    if (!isExtensionEnvironment) {
      // Fallback to local storage in non-extension environment
      await this.removeLocalItem(key)
      return
    }

    return new Promise((resolve, reject) => {
      chrome.storage.sync.remove([`${key}:data`, `${key}:metadata`], () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve()
        }
      })
    })
  }

  // Clear sync storage
  private async clearSync(): Promise<void> {
    if (!isExtensionEnvironment) {
      // Fallback to local storage in non-extension environment
      await this.clearLocal()
      return
    }

    return new Promise((resolve, reject) => {
      chrome.storage.sync.clear(() => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve()
        }
      })
    })
  }

  // Get all keys in sync storage
  private async getSyncKeys(): Promise<string[]> {
    if (!isExtensionEnvironment) {
      // Fallback to local storage in non-extension environment
      return this.getLocalKeys()
    }

    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(null, (items) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
          return
        }

        const keys: string[] = []

        for (const key in items) {
          if (key.endsWith(":data")) {
            keys.push(key.replace(":data", ""))
          }
        }

        resolve(keys)
      })
    })
  }

  // Get the size of sync storage
  private async getSyncSize(): Promise<number> {
    if (!isExtensionEnvironment) {
      // Fallback to local storage in non-extension environment
      return this.getLocalSize()
    }

    return new Promise((resolve, reject) => {
      chrome.storage.sync.getBytesInUse(null, (bytesInUse) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve(bytesInUse)
        }
      })
    })
  }

  // Set an item in session storage
  private setSessionItem(key: string, data: string, metadata: StorageItemMetadata): void {
    sessionStorage.setItem(`${key}:data`, data)
    sessionStorage.setItem(`${key}:metadata`, JSON.stringify(metadata))
  }

  // Get an item from session storage
  private getSessionItem(key: string): { data: string; metadata: StorageItemMetadata } | null {
    const data = sessionStorage.getItem(`${key}:data`)
    const metadataStr = sessionStorage.getItem(`${key}:metadata`)

    if (!data || !metadataStr) {
      return null
    }

    try {
      const metadata = JSON.parse(metadataStr) as StorageItemMetadata
      return { data, metadata }
    } catch (error) {
      return null
    }
  }

  // Remove an item from session storage
  private removeSessionItem(key: string): void {
    sessionStorage.removeItem(`${key}:data`)
    sessionStorage.removeItem(`${key}:metadata`)
  }

  // Clear session storage
  private clearSession(): void {
    sessionStorage.clear()
  }

  // Get all keys in session storage
  private getSessionKeys(): string[] {
    const keys: string[] = []

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)

      if (key && key.endsWith(":data")) {
        keys.push(key.replace(":data", ""))
      }
    }

    return keys
  }

  // Get the size of session storage
  private getSessionSize(): number {
    let size = 0

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)

      if (key) {
        size += key.length + sessionStorage.getItem(key)!.length
      }
    }

    return size
  }

  // Set an item in IndexedDB
  private async setIndexedDBItem(key: string, data: string, metadata: StorageItemMetadata): Promise<void> {
    const db = await this.getDatabase()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)

      const request = store.put({
        key,
        data,
        metadata,
      })

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  // Get an item from IndexedDB
  private async getIndexedDBItem(key: string): Promise<{ data: string; metadata: StorageItemMetadata } | null> {
    const db = await this.getDatabase()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly")
      const store = transaction.objectStore(STORE_NAME)

      const request = store.get(key)

      request.onsuccess = () => {
        if (request.result) {
          resolve({
            data: request.result.data,
            metadata: request.result.metadata,
          })
        } else {
          resolve(null)
        }
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  // Remove an item from IndexedDB
  private async removeIndexedDBItem(key: string): Promise<void> {
    const db = await this.getDatabase()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)

      const request = store.delete(key)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  // Clear IndexedDB
  private async clearIndexedDB(): Promise<void> {
    const db = await this.getDatabase()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)

      const request = store.clear()

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  // Get all keys in IndexedDB
  private async getIndexedDBKeys(): Promise<string[]> {
    const db = await this.getDatabase()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly")
      const store = transaction.objectStore(STORE_NAME)

      const request = store.getAllKeys()

      request.onsuccess = () => {
        resolve(request.result as string[])
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  // Get the size of IndexedDB
  private async getIndexedDBSize(): Promise<number> {
    const db = await this.getDatabase()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly")
      const store = transaction.objectStore(STORE_NAME)

      const request = store.getAll()

      request.onsuccess = () => {
        let size = 0

        for (const item of request.result) {
          size += item.key.length + item.data.length + JSON.stringify(item.metadata).length
        }

        resolve(size)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  // Get IndexedDB database
  private async getDatabase(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db
    }

    if (this.dbPromise) {
      return this.dbPromise
    }
  }
}
