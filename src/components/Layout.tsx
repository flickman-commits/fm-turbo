import { Home, User, Settings, Send } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { FeatureRequestModal } from '@/components/FeatureRequestModal'
import { creditsManager } from '@/utils/credits'

const navigationItems = [
  { name: 'Home', icon: Home, path: '/' },
  { name: 'Outreach', icon: Send, path: '/outreach' },
]

const mobileNavigationItems = [
  ...navigationItems,
  { name: 'Profile', icon: User, path: '/profile' },
  { name: 'Settings', icon: Settings, path: '/settings' },
]

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const [showFeatureRequest, setShowFeatureRequest] = useState(false)
  const [credits, setCredits] = useState(creditsManager.getCredits())
  const [isCreditsHovered, setIsCreditsHovered] = useState(false)

  // Subscribe to credit changes
  useState(() => {
    const unsubscribe = creditsManager.addListener((newCredits) => {
      setCredits(newCredits)
    })
    return () => unsubscribe()
  })

  const handleRequestCredits = () => {
    const subject = encodeURIComponent("More Turbo Credits")
    const body = encodeURIComponent("Hey Matt,\n\nLoving Turbo so far... but I ran out of credits. Any way I could get some more?")
    window.location.href = `mailto:matt@flickmanmedia.com?subject=${subject}&body=${body}`
  }

  return (
    <div className="min-h-screen bg-turbo-beige">
      {/* Mobile Header - Fixed at top */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-turbo-beige border-b border-turbo-black/10 flex items-center justify-between px-4 z-50">
        <Link to="/">
          <img 
            src="/turbo-logo.png" 
            alt="Turbo Logo" 
            className="h-9 w-auto"
          />
        </Link>
        <button
          onClick={handleRequestCredits}
          onMouseEnter={() => setIsCreditsHovered(true)}
          onMouseLeave={() => setIsCreditsHovered(false)}
          className="bg-turbo-beige border border-turbo-black rounded-full px-3 py-1.5 text-sm font-medium opacity-70 hover:opacity-100 transition-all flex items-center gap-2 hover:bg-turbo-blue hover:text-turbo-beige hover:border-turbo-blue"
        >
          {isCreditsHovered ? (
            'GET MORE CREDITS'
          ) : (
            <>
              <span>{credits}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative top-[-1px]">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 17V17.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 13.5C11.9816 13.1754 12.0692 12.8536 12.2495 12.5832C12.4299 12.3127 12.6933 12.1091 13 12C13.3759 11.8563 13.7132 11.6272 13.9856 11.3309C14.2579 11.0346 14.4577 10.6794 14.5693 10.2926C14.6809 9.90587 14.7013 9.49751 14.6287 9.10095C14.5562 8.70438 14.3928 8.33333 14.1513 8.01853C13.9099 7.70374 13.5972 7.45508 13.2371 7.29433C12.877 7.13358 12.4809 7.06596 12.0858 7.09756C11.6907 7.12916 11.3094 7.25908 10.9765 7.47577C10.6437 7.69246 10.3696 7.98873 10.1807 8.33853" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </>
          )}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="fixed top-0 left-0 bottom-0 w-64 border-r border-turbo-black hidden md:flex flex-col bg-turbo-beige z-50">
        {/* Logo */}
        <div className="p-6 flex justify-start items-center">
          <Link to="/">
            <img 
              src="/turbo-logo.png" 
              alt="Turbo Logo" 
              className="h-[60px] w-auto"
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg mb-2
                  transition-colors duration-200
                  ${isActive 
                    ? 'bg-turbo-blue text-turbo-beige' 
                    : 'text-turbo-black hover:bg-turbo-black/5'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Fixed Bottom Section */}
        <div className="flex-shrink-0 p-4 border-t border-turbo-black">
          {/* Profile & Settings */}
          <div className="flex items-center justify-between">
            <Link
              to="/profile"
              className={`
                flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors
                ${location.pathname === '/profile' 
                  ? 'bg-turbo-blue text-turbo-beige' 
                  : 'text-turbo-black hover:bg-turbo-black/5'
                }
              `}
            >
              <User className="w-4 h-4" />
              <span>My Profile</span>
            </Link>
            <Link
              to="/settings"
              className={`
                p-2 rounded-lg transition-colors
                ${location.pathname === '/settings'
                  ? 'bg-turbo-blue text-turbo-beige'
                  : 'text-turbo-black hover:bg-turbo-black/5'
                }
              `}
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-turbo-beige border-t border-turbo-black flex md:hidden items-center justify-around px-4 py-2 z-50">
        {mobileNavigationItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`
                flex flex-col items-center gap-1 p-2
                transition-colors duration-200
                ${isActive 
                  ? 'text-turbo-blue' 
                  : 'text-turbo-black hover:text-turbo-blue'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Main Content - Adjust padding for mobile header */}
      <main className="md:pl-64 min-h-screen pb-24 pt-20 md:pt-0">
        {children}
      </main>

      {showFeatureRequest && (
        <FeatureRequestModal
          onClose={() => setShowFeatureRequest(false)}
        />
      )}
    </div>
  )
} 