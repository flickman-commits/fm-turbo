import { cn } from "@/lib/utils"

interface NotionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function NotionButton({ className, ...props }: NotionButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center h-[48px] px-8 py-2 text-base font-medium text-black bg-white hover:bg-gray-100 border-2 border-gray-200 rounded-full transition-colors",
        className
      )}
      {...props}
    >
      <span className="flex items-center gap-2">
        Duplicate to <img src="/notion.svg" alt="Notion" className="h-5 w-auto relative top-[1px]" />
      </span>
    </button>
  )
} 