"use client"

import { useState, useEffect } from "react"

interface RippleProps {
  color?: string
  duration?: number
}

interface RippleType {
  x: number
  y: number
  size: number
  id: number
}

export function RippleEffect({ color = "rgba(255, 255, 255, 0.7)", duration = 600 }: RippleProps) {
  const [ripples, setRipples] = useState<RippleType[]>([])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.currentTarget as HTMLElement
      const rect = target.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const size = Math.max(rect.width, rect.height) * 2

      const newRipple = {
        x,
        y,
        size,
        id: Date.now(),
      }

      setRipples((prevRipples) => [...prevRipples, newRipple])
    }

    document.addEventListener("click", handleClick)

    return () => {
      document.removeEventListener("click", handleClick)
    }
  }, [])

  useEffect(() => {
    if (ripples.length > 0) {
      const timeoutId = setTimeout(() => {
        setRipples((prevRipples) => prevRipples.slice(1))
      }, duration)

      return () => clearTimeout(timeoutId)
    }
  }, [ripples, duration])

  return (
    <>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          style={{
            position: "absolute",
            top: ripple.y - ripple.size / 2,
            left: ripple.x - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: color,
            borderRadius: "50%",
            transform: "scale(0)",
            animation: `ripple ${duration / 1000}s linear`,
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  )
}
