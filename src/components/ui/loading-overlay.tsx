import { useState, useEffect } from 'react'

interface LoadingOverlayProps {
  className?: string
  message?: string
  error?: boolean
}

export function LoadingOverlay({ 
  className = "",
  message = "Hold tight... Turbo is doing tedious work so you don't have to.",
  error = false
}: LoadingOverlayProps) {
  const [progress, setProgress] = useState(0)

  // Handle progress bar animation
  useEffect(() => {
    if (error) {
      setProgress(100)
      return
    }

    const interval = setInterval(() => {
      setProgress(current => {
        if (current >= 90) return current
        return current + 1
      })
    }, 300)

    return () => clearInterval(interval)
  }, [error])

  return (
    <div className={`fixed inset-0 bg-turbo-beige flex flex-col items-center justify-center z-50 overflow-hidden ${className}`}>
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-turbo-black/5">
        <div 
          className={`h-full transition-all duration-300 ease-out ${
            error 
              ? 'bg-[#E94E1B]' 
              : 'bg-gradient-to-r from-turbo-blue/40 to-turbo-blue'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="w-full max-w-4xl px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          {/* Left side - Animation */}
          <div className="w-full md:w-1/2 flex justify-center">
            <img 
              src="/turbo-typing-beige.gif" 
              alt="Turbo typing" 
              className="w-64 h-auto mx-auto transition-transform hover:scale-105"
            />
          </div>

          {/* Right side - Content */}
          <div className="w-full md:w-1/2 text-center md:text-left">
            <h2 className={`text-xl md:text-2xl font-bold mb-2 ${
              error ? 'text-[#E94E1B]' : 'text-turbo-black'
            }`}>
              {error ? 'Oops! Something went wrong' : message}
            </h2>
            <p className="text-turbo-black/60 text-base">
              {error 
                ? 'Please try again or contact support if the issue persists'
                : 'This usually takes 20-30 seconds'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}