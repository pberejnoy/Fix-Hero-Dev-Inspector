"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface ConfettiProps {
  duration?: number
  pieces?: number
}

export function Confetti({ duration = 3000, pieces = 100 }: ConfettiProps) {
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsActive(false)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  if (!isActive) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {Array.from({ length: pieces }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{
            top: "-10%",
            left: `${Math.random() * 100}%`,
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            top: "100%",
            rotate: Math.random() * 360 * (Math.random() > 0.5 ? 1 : -1),
          }}
          transition={{
            duration: Math.random() * 2 + 1,
            ease: "easeOut",
          }}
          style={{
            backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
            width: `${Math.random() * 10 + 5}px`,
            height: `${Math.random() * 10 + 5}px`,
            borderRadius: Math.random() > 0.5 ? "50%" : "0",
          }}
        />
      ))}
    </div>
  )
}
