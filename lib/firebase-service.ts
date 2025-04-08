import { db } from "@/lib/firebase-config"
import { updateDoc, collection, query, where, getDocs } from "firebase/firestore"

/**
 * Updates the status of an issue in Firestore
 */
export async function updateIssueStatus(issueId: string, status: string): Promise<void> {
  try {
    // First, find the issue document
    const issuesQuery = query(collection(db, "issues"), where("id", "==", issueId))
    const querySnapshot = await getDocs(issuesQuery)

    if (querySnapshot.empty) {
      throw new Error(`Issue with ID ${issueId} not found`)
    }

    // Update the issue document
    const issueDoc = querySnapshot.docs[0]
    await updateDoc(issueDoc.ref, { status })

    return
  } catch (error) {
    console.error("Error updating issue status:", error)
    throw error
  }
}

/**
 * Updates multiple issues' status in Firestore
 */
export async function updateMultipleIssuesStatus(issueIds: string[], status: string): Promise<void> {
  try {
    // For each issue ID, find and update the document
    const updatePromises = issueIds.map(async (issueId) => {
      const issuesQuery = query(collection(db, "issues"), where("id", "==", issueId))
      const querySnapshot = await getDocs(issuesQuery)

      if (!querySnapshot.empty) {
        const issueDoc = querySnapshot.docs[0]
        return updateDoc(issueDoc.ref, { status })
      }
    })

    await Promise.all(updatePromises)

    return
  } catch (error) {
    console.error("Error updating multiple issues status:", error)
    throw error
  }
}

/**
 * Deletes an issue from Firestore
 */
export async function deleteIssue(issueId: string): Promise<void> {
  try {
    // First, find the issue document
    const issuesQuery = query(collection(db, "issues"), where("id", "==", issueId))
    const querySnapshot = await getDocs(issuesQuery)

    if (querySnapshot.empty) {
      throw new Error(`Issue with ID ${issueId} not found`)
    }

    // Delete the issue document
    const issueDoc = querySnapshot.docs[0]
    await updateDoc(issueDoc.ref, { deleted: true, deletedAt: new Date() })

    return
  } catch (error) {
    console.error("Error deleting issue:", error)
    throw error
  }
}

/**
 * Deletes multiple issues from Firestore
 */
export async function deleteMultipleIssues(issueIds: string[]): Promise<void> {
  try {
    // For each issue ID, find and update the document
    const deletePromises = issueIds.map(async (issueId) => {
      const issuesQuery = query(collection(db, "issues"), where("id", "==", issueId))
      const querySnapshot = await getDocs(issuesQuery)

      if (!querySnapshot.empty) {
        const issueDoc = querySnapshot.docs[0]
        return updateDoc(issueDoc.ref, { deleted: true, deletedAt: new Date() })
      }
    })

    await Promise.all(deletePromises)

    return
  } catch (error) {
    console.error("Error deleting multiple issues:", error)
    throw error
  }
}
