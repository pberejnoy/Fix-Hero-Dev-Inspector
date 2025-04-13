"use client"

import type React from "react"
import { signOut } from "firebase/auth"
import { auth } from "../../lib/firebase"

interface DashboardProps {
  user: any
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">FixHero Dev Inspector</h1>
        <button onClick={handleLogout} className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded">
          Logout
        </button>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600">Logged in as: {user.email}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded">
          Take Screenshot
        </button>
        <button className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded">Add Note</button>
        <button className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded">
          View Sessions
        </button>
        <button className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded">
          Export Data
        </button>
      </div>
    </div>
  )
}

export default Dashboard
