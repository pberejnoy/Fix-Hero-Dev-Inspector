"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  loadingText?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  children: React.ReactNode
  withRipple?: boolean
}

export function AnimatedButton({
  isLoading = false,
  loadingText,
  variant = "default",
  size = "default",
  children,
  disabled,
  withRipple = true,
  ...props
}: AnimatedButtonProps) {
  const [ripples, setRipples] = useState<{ x: number; y: number; size: number; id: number }[]>([])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!withRipple || isLoading || disabled) return

    const button = e.currentTarget
    const rect = button.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const size = Math.max(rect.width, rect.height) * 2

    const newRipple = {
      x,
      y,
      size,
      id: Date.now(),
    }

    setRipples((prev) => [...prev, newRipple])

    // Remove ripple after animation completes
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id))
    }, 600)

    // Call the original onClick handler
    if (props.onClick) {
      props.onClick(e)
    }
  }

  return (
    <motion.div
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      transition={{ duration: 0.2 }}
      className="relative"
    >
      <Button
        variant={variant}
        size={size}
        disabled={isLoading || disabled}
        onClick={handleClick}
        {...props}
        className={`relative overflow-hidden ${props.className || ""}`}
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" color={variant === "default" ? "white" : "primary"} className="mr-2" />
            {loadingText || children}
          </>
        ) : (
          children
        )}

        {/* Ripple effect */}
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-white/20 pointer-events-none animate-ripple"
            style={{
              top: ripple.y - ripple.size / 2,
              left: ripple.x - ripple.size / 2,
              width: ripple.size,
              height: ripple.size,
            }}
          />
        ))}
      </Button>
    </motion.div>
  )
}
