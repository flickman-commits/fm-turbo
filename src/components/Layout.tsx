import { Home, User, Send, Clock, FileText, Calendar, LayoutDashboard, Menu, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { FeatureRequestModal } from '@/components/FeatureRequestModal'
import { creditsManager } from '@/utils/credits'
import { NavigationItem } from '@/components/navigation/NavigationItem'

const navigationCategories = {
  main: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  ],
  preProduction: [
    { name: 'Run of Show', icon: Calendar, path: '/run-of-show' },
    { name: 'Contractor Brief', icon: FileText, path: '/contractor-brief' },
  ],
  clientWork: [
    { name: 'Proposals', icon: FileText, path: '/proposals' },
    { name: 'Outreach', icon: Send, path: '/outreach' },
  ],
  postProduction: [
    { name: 'Timeline', icon: Clock, path: '/timeline', beta: true },
  ]
}

// Mobile navigation shows main actions
const mobileNavigationItems: Array<{ name: string; icon: LucideIcon; path: string; beta?: boolean }> = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Tasks', icon: Menu, path: '#' },
  { name: 'Profile', icon: User, path: '/profile' }
]

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [showFeatureRequest, setShowFeatureRequest] = useState(false)
  const [credits, setCredits] = useState(creditsManager.getCredits())
  const [isCreditsHovered, setIsCreditsHovered] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
        <nav className="flex-1 px-4 overflow-y-auto">
          {/* Main Navigation */}
          {navigationCategories.main.map((item) => (
            <NavigationItem key={item.name} item={item} />
          ))}

          {/* Pre-Production Section */}
          <div className="mt-8">
            <h3 className="text-sm font-medium text-turbo-black/60 px-4 mb-2">
              Pre-Production
            </h3>
            {navigationCategories.preProduction.map((item) => (
              <NavigationItem key={item.name} item={item} />
            ))}
          </div>

          {/* Client Work Section */}
          <div className="mt-8">
            <h3 className="text-sm font-medium text-turbo-black/60 px-4 mb-2">
              Client Work
            </h3>
            {navigationCategories.clientWork.map((item) => (
              <NavigationItem key={item.name} item={item} />
            ))}
          </div>

          {/* Post-Production Section */}
          <div className="mt-8">
            <h3 className="text-sm font-medium text-turbo-black/60 px-4 mb-2">
              Post-Production
            </h3>
            {navigationCategories.postProduction.map((item) => (
              <NavigationItem key={item.name} item={item} />
            ))}
          </div>
        </nav>

        {/* Fixed Bottom Section */}
        <div className="flex-shrink-0 p-4 border-t border-turbo-black">
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
            <span>Profile Settings</span>
          </Link>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-turbo-beige z-50 md:hidden">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-turbo-black/10">
              <h2 className="text-xl font-bold text-turbo-black">Tasks</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-turbo-black hover:text-turbo-blue"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation Content */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
              {/* Pre-Production Section */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-turbo-black/60 px-4 mb-2">
                  Pre-Production
                </h3>
                {navigationCategories.preProduction.map((item) => (
                  <NavigationItem 
                    key={item.name} 
                    item={item}
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                ))}
              </div>

              {/* Client Work Section */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-turbo-black/60 px-4 mb-2">
                  Client Work
                </h3>
                {navigationCategories.clientWork.map((item) => (
                  <NavigationItem 
                    key={item.name} 
                    item={item}
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                ))}
              </div>

              {/* Post-Production Section */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-turbo-black/60 px-4 mb-2">
                  Post-Production
                </h3>
                {navigationCategories.postProduction.map((item) => (
                  <NavigationItem 
                    key={item.name} 
                    item={item}
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-turbo-beige border-t border-turbo-black flex md:hidden items-center justify-around px-4 py-2 z-40">
        {mobileNavigationItems.map((item) => {
          const isActive = item.path === '#' ? isMobileMenuOpen : location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.name}
              onClick={() => {
                if (item.path === '#') {
                  setIsMobileMenuOpen(true);
                } else {
                  location.pathname !== item.path && navigate(item.path);
                }
              }}
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
            </button>
          );
        })}
      </nav>

      {/* Main Content */}
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