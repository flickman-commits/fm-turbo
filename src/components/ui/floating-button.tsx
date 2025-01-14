import { cn } from '@/lib/utils'

interface FloatingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  show: boolean
}

export function FloatingButton({ show, className, ...props }: FloatingButtonProps) {
  return (
    <div className={cn(
      "fixed bottom-16 left-1/2 -translate-x-1/2 z-40",
      "transition-all duration-500 ease-in-out transform",
      show ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
    )}>
      <button
        className={cn(
          "bg-white",
          "border border-black text-black font-normal",
          "hover:bg-gray-50",
          "dark:bg-black dark:border-white dark:text-white dark:hover:bg-gray-900",
          "px-8 py-2.5 rounded-full",
          "transition-colors duration-200",
          className
        )}
        {...props}
      />
    </div>
  )
} 