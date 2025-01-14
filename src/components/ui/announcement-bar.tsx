import { cn } from "@/lib/utils"

interface AnnouncementBarProps {
  children: React.ReactNode
  className?: string
}

export function AnnouncementBar({ children, className }: AnnouncementBarProps) {
  return (
    <div className={cn("fixed bottom-0 left-0 right-0 z-50 hidden md:block", className)}>
      <div className="flex items-center justify-center w-full h-12 px-4 backdrop-blur-sm bg-background/80 border-t">
        <span className="text-sm text-foreground">
          {children}
        </span>
      </div>
    </div>
  )
} 