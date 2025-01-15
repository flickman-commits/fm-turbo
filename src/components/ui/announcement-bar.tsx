import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface AnnouncementBarProps {
  children: React.ReactNode
  className?: string
}

export function AnnouncementBar({ children, className }: AnnouncementBarProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [shouldRender, setShouldRender] = useState(true)

  useEffect(() => {
    // Start fade out after 5 seconds
    const fadeTimeout = setTimeout(() => {
      setIsVisible(false)
    }, 5000)

    // Remove from DOM after fade animation completes
    const removeTimeout = setTimeout(() => {
      setShouldRender(false)
    }, 5500) // 5 seconds + 500ms for fade animation

    return () => {
      clearTimeout(fadeTimeout)
      clearTimeout(removeTimeout)
    }
  }, [])

  if (!shouldRender) return null

  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 hidden md:block transition-opacity duration-500",
        isVisible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      <div className="flex items-center justify-center w-full h-12 px-4 backdrop-blur-sm bg-background/80 border-t">
        <span className="text-sm text-foreground">
          {children}
        </span>
      </div>
    </div>
  )
} 