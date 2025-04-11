import type React from "react"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface AsyncButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  loadingText?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  children: React.ReactNode
}

export function AsyncButton({
  isLoading = false,
  loadingText,
  variant = "default",
  size = "default",
  children,
  disabled,
  ...props
}: AsyncButtonProps) {
  return (
    <Button variant={variant} size={size} disabled={isLoading || disabled} {...props}>
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" color={variant === "default" ? "white" : "primary"} className="mr-2" />
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
