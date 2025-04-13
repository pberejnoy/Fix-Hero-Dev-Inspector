"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { auth } from "../lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import Login from "../components/auth/Login"
import Dashboard from "../components/dashboard/Dashboard"

const Panel: React.FC = () => {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return <div className="container mx-auto p-4">{user ? <Dashboard user={user} /> : <Login />}</div>
}

export default Panel
