import { cn } from "@/lib/utils"

interface GmailButtonProps {
  onClick: () => void
  className?: string
}

export function GmailButton({ onClick, className }: GmailButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center h-[48px] px-8 py-2 text-base font-medium text-black bg-white hover:bg-gray-100 border-2 border-gray-200 rounded-[24px] transition-colors",
        className
      )}
    >
      <span className="flex items-center gap-2">
        Compose in <img src="/gmail-icon.png" alt="Gmail" className="h-4 w-auto relative top-[1px]" />
      </span>
    </button>
  )
} 