import { useEffect, useState } from 'react'
import { toast } from '@/components/ui/rainbow-toast'
import { AnnouncementBar } from '@/components/ui/announcement-bar'

interface EasterEggProps {
  onSecret: () => void
}

export function EasterEgg({ onSecret }: EasterEggProps) {
  const [buffer, setBuffer] = useState('')
  const keyword = 'FLICKMAN'

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const newBuffer = (buffer + e.key).slice(-keyword.length)
      setBuffer(newBuffer)

      if (newBuffer.toUpperCase() === keyword) {
        onSecret()
        toast.success("You've unlocked $500 off your next project!", {
          description: (
            <a 
              href="https://www.flickman.media" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium text-purple-500 underline hover:text-purple-600"
            >
              Claim your offer here
            </a>
          ),
          duration: 8000,
        })
        setBuffer('')
      }
    }

    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
  }, [buffer, onSecret])

  return (
    <AnnouncementBar>
      <span>Type <strong>flickman</strong> for a surprise.</span>
    </AnnouncementBar>
  )
} 