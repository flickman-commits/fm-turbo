import { useState, useEffect } from 'react'
import { creditsManager } from '@/utils/credits'

export function CreditsCounter() {
  const [credits, setCredits] = useState<number>(0)

  useEffect(() => {
    // Load initial credits
    creditsManager.getCredits().then(setCredits)

    // Subscribe to credit changes
    const unsubscribe = creditsManager.addListener((newCredits) => {
      setCredits(newCredits)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="text-black/60">My Account</div>
      <div className="flex items-center gap-2 bg-black/5 px-3 py-1.5 rounded-full">
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="text-[#E94E1B]"
        >
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
        <span className="font-medium text-black">{credits} credits</span>
      </div>
    </div>
  )
} 