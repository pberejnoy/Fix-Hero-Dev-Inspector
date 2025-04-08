"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Code, Palette, Database, ChevronDown, Users } from "lucide-react"

type UserRole = "frontend" | "backend" | "design" | "all"

interface RoleSelectorProps {
  onRoleChange: (role: UserRole) => void
  initialRole?: UserRole
}

export function RoleSelector({ onRoleChange, initialRole = "all" }: RoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole)

  // Load role from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRole = localStorage.getItem("fixhero_user_role") as UserRole | null
      if (savedRole) {
        setSelectedRole(savedRole)
        onRoleChange(savedRole)
      }
    }
  }, [onRoleChange])

  // Save role to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("fixhero_user_role", selectedRole)
    }
  }, [selectedRole])

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role)
    onRoleChange(role)
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "frontend":
        return <Code className="h-4 w-4" />
      case "backend":
        return <Database className="h-4 w-4" />
      case "design":
        return <Palette className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getRoleName = (role: UserRole) => {
    switch (role) {
      case "frontend":
        return "Frontend Developer"
      case "backend":
        return "Backend Developer"
      case "design":
        return "Designer"
      default:
        return "All Roles"
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          {getRoleIcon(selectedRole)}
          <span>{getRoleName(selectedRole)}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleRoleChange("frontend")}>
          <Code className="h-4 w-4 mr-2" />
          Frontend Developer
          {selectedRole === "frontend" && (
            <Badge variant="secondary" className="ml-2">
              Active
            </Badge>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRoleChange("backend")}>
          <Database className="h-4 w-4 mr-2" />
          Backend Developer
          {selectedRole === "backend" && (
            <Badge variant="secondary" className="ml-2">
              Active
            </Badge>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRoleChange("design")}>
          <Palette className="h-4 w-4 mr-2" />
          Designer
          {selectedRole === "design" && (
            <Badge variant="secondary" className="ml-2">
              Active
            </Badge>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleRoleChange("all")}>
          <Users className="h-4 w-4 mr-2" />
          All Roles
          {selectedRole === "all" && (
            <Badge variant="secondary" className="ml-2">
              Active
            </Badge>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
