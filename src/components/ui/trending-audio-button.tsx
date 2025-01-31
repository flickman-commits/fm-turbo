import { cn } from "@/lib/utils"
import { InfoIcon } from "lucide-react"
import { useState, useRef, useEffect } from "react"

interface TrendingAudioButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  dropboxLink: string;
}

export function TrendingAudioButton({ className, dropboxLink, ...props }: TrendingAudioButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('top')
  const tooltipRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (showTooltip && tooltipRef.current && containerRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const containerRect = containerRef.current.getBoundingClientRect()
      
      // Check if tooltip would overflow at the top
      if (containerRect.top < tooltipRect.height + 8) {
        setTooltipPosition('bottom')
      } else {
        setTooltipPosition('top')
      }
    }
  }, [showTooltip])

  const handleClick = () => {
    window.open(dropboxLink, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="relative inline-flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
      <button
        onClick={handleClick}
        className={cn(
          "inline-flex items-center justify-center h-[40px] px-6 py-2 text-sm font-medium text-[#F5F0E8] bg-black hover:bg-[#29ABE2] rounded-full transition-colors w-full sm:w-auto whitespace-nowrap",
          className
        )}
        {...props}
      >
        Download Trending Audios
      </button>
      <div 
        ref={containerRef}
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <InfoIcon className="h-4 w-4 text-black hover:text-[#E94E1B] transition-colors cursor-help sm:cursor-default flex-shrink-0" />
        {showTooltip && (
          <div 
            ref={tooltipRef}
            className={cn(
              "absolute left-1/2 transform -translate-x-1/2 w-64 p-2 text-xs text-[#F5F0E8] bg-black rounded-md shadow-lg z-50",
              tooltipPosition === 'top' ? "bottom-full mb-2" : "top-full mt-2"
            )}
          >
            Every week we update this link with the 10 most trending audios on social media, ready for download.
            <div 
              className={cn(
                "absolute left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black",
                tooltipPosition === 'top' ? "bottom-0 translate-y-1/2 rotate-45" : "top-0 -translate-y-1/2 rotate-45"
              )}
            />
          </div>
        )}
      </div>
    </div>
  )
} 