/**
 * Background Task Manager
 * Efficiently manages background tasks and event listeners
 */

// Type declaration for the global chrome object
declare const chrome: any

// Task types
export enum TaskType {
  SYNC = "sync",
  CLEANUP = "cleanup",
  NOTIFICATION = "notification",
  ANALYTICS = "analytics",
}

// Task priority
export enum TaskPriority {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

// Task interface
export interface Task {
  id: string
  type: TaskType
  priority: TaskPriority
  execute: () => Promise<void>
  interval?: number // For recurring tasks (in milliseconds)
  lastRun?: number
}

// Task manager class
export class BackgroundTaskManager {
  private tasks: Map<string, Task> = new Map()
  private isRunning = false
  private timers: Map<string, NodeJS.Timeout> = new Map()
  private eventListeners: Map<string, Function> = new Map()

  // Check if we're in a Chrome extension environment
  private isExtensionEnvironment = typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id

  constructor() {
    // Initialize the task manager
    this.initialize()
  }

  // Initialize the task manager
  private initialize(): void {
    if (!this.isExtensionEnvironment) {
      console.log("Background task manager is only available in the extension environment")
      return
    }

    // Set up event listeners for extension lifecycle events
    this.setupEventListeners()
  }

  // Set up event listeners
  private setupEventListeners(): void {
    // Listen for extension suspend/resume events
    if (chrome.runtime.onSuspend) {
      const suspendListener = () => {
        console.log("Extension suspending, pausing tasks")
        this.pauseAllTasks()
      }

      chrome.runtime.onSuspend.addListener(suspendListener)
      this.eventListeners.set("suspend", suspendListener)
    }

    if (chrome.runtime.onSuspendCanceled) {
      const resumeListener = () => {
        console.log("Extension resume, resuming tasks")
        this.resumeAllTasks()
      }

      chrome.runtime.onSuspendCanceled.addListener(resumeListener)
      this.eventListeners.set("resume", resumeListener)
    }

    // Listen for idle state changes to optimize resource usage
    if (chrome.idle) {
      const idleListener = (state: string) => {
        if (state === "idle" || state === "locked") {
          console.log(`System ${state}, reducing task frequency`)
          this.reduceTasks()
        } else if (state === "active") {
          console.log("System active, resuming normal task frequency")
          this.resumeAllTasks()
        }
      }

      chrome.idle.onStateChanged.addListener(idleListener)
      this.eventListeners.set("idle", idleListener)

      // Set idle detection threshold to 60 seconds
      chrome.idle.setDetectionInterval(60)
    }
  }

  // Register a new task
  public registerTask(task: Task): void {
    this.tasks.set(task.id, task)

    // If it's a recurring task, schedule it
    if (task.interval) {
      this.scheduleTask(task)
    }

    console.log(`Task registered: ${task.id} (${task.type}, ${task.priority})`)
  }

  // Unregister a task
  public unregisterTask(taskId: string): void {
    // Clear any timers
    if (this.timers.has(taskId)) {
      clearTimeout(this.timers.get(taskId))
      this.timers.delete(taskId)
    }

    // Remove the task
    this.tasks.delete(taskId)

    console.log(`Task unregistered: ${taskId}`)
  }

  // Schedule a task
  private scheduleTask(task: Task): void {
    // Clear any existing timer
    if (this.timers.has(task.id)) {
      clearTimeout(this.timers.get(task.id))
    }

    // Schedule the task
    const timer = setTimeout(async () => {
      await this.executeTask(task.id)

      // Reschedule if it's a recurring task
      if (task.interval) {
        this.scheduleTask(task)
      }
    }, task.interval)

    // Store the timer
    this.timers.set(task.id, timer)
  }

  // Execute a task
  public async executeTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId)
    if (!task) {
      console.error(`Task not found: ${taskId}`)
      return
    }

    try {
      console.log(`Executing task: ${taskId}`)
      await task.execute()

      // Update last run time
      task.lastRun = Date.now()
      this.tasks.set(taskId, task)

      console.log(`Task completed: ${taskId}`)
    } catch (error) {
      console.error(`Error executing task ${taskId}:`, error)
    }
  }

  // Execute all tasks of a specific type
  public async executeTasksByType(type: TaskType): Promise<void> {
    const tasks = Array.from(this.tasks.values()).filter((task) => task.type === type)

    // Sort by priority
    tasks.sort((a, b) => {
      const priorityOrder = { [TaskPriority.HIGH]: 0, [TaskPriority.MEDIUM]: 1, [TaskPriority.LOW]: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

    // Execute tasks sequentially to avoid overwhelming the system
    for (const task of tasks) {
      await this.executeTask(task.id)
    }
  }

  // Pause all tasks
  public pauseAllTasks(): void {
    // Clear all timers
    for (const [taskId, timer] of this.timers.entries()) {
      clearTimeout(timer)
    }

    this.isRunning = false
    console.log("All tasks paused")
  }

  // Resume all tasks
  public resumeAllTasks(): void {
    // Reschedule all recurring tasks
    for (const task of this.tasks.values()) {
      if (task.interval) {
        this.scheduleTask(task)
      }
    }

    this.isRunning = true
    console.log("All tasks resumed")
  }

  // Reduce task frequency during idle periods
  private reduceTasks(): void {
    // Pause low priority tasks
    for (const [taskId, timer] of this.timers.entries()) {
      const task = this.tasks.get(taskId)
      if (task && task.priority === TaskPriority.LOW) {
        clearTimeout(timer)
        this.timers.delete(taskId)
      }
    }

    // Reduce frequency of medium priority tasks
    for (const task of this.tasks.values()) {
      if (task.priority === TaskPriority.MEDIUM && task.interval) {
        // Double the interval
        const originalInterval = task.interval
        task.interval *= 2

        // Reschedule with the new interval
        this.scheduleTask(task)

        // Restore the original interval (it will be used when resuming)
        task.interval = originalInterval
      }
    }

    console.log("Task frequency reduced for idle state")
  }

  // Clean up resources
  public cleanup(): void {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }

    this.timers.clear()

    // Remove all event listeners
    for (const [event, listener] of this.eventListeners.entries()) {
      if (event === "suspend" && chrome.runtime.onSuspend) {
        chrome.runtime.onSuspend.removeListener(listener)
      } else if (event === "resume" && chrome.runtime.onSuspendCanceled) {
        chrome.runtime.onSuspendCanceled.removeListener(listener)
      } else if (event === "idle" && chrome.idle) {
        chrome.idle.onStateChanged.removeListener(listener)
      }
    }

    this.eventListeners.clear()

    console.log("Background task manager cleaned up")
  }
}

// Create and export a singleton instance
export const backgroundTaskManager = new BackgroundTaskManager()
