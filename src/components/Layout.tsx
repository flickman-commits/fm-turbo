import { Home, History, User, Settings } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { links } from '@/config/links'
import { creditsManager } from '@/utils/credits'
import { useState } from 'react'
import { FeatureRequestModal } from '@/components/FeatureRequestModal'

const navigationItems = [
  { name: 'Home', icon: Home, path: '/' },
  { name: 'History', icon: History, path: '/history' },
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
  const credits = creditsManager.getCredits()
  const [showFeatureRequest, setShowFeatureRequest] = useState(false)

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {/* Desktop Sidebar */}
      <aside className="fixed top-0 left-0 bottom-0 w-64 border-r border-black hidden md:flex flex-col bg-[#F5F0E8] z-50">
        {/* Logo */}
        <div className="p-6">
          <Link to="/">
            <img 
              src="/fm-logo.png" 
              alt="Flickman Media Logo" 
              className="h-11 w-auto" 
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4">
          {navigationItems.map((item, index) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            // Alternate between brand colors for active states
            const activeColors = ['#E94E1B', '#00A651']
            const activeColor = activeColors[index % activeColors.length]
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg mb-2
                  transition-colors duration-200
                  ${isActive 
                    ? 'bg-[var(--active-color)] text-[#F5F0E8]' 
                    : 'text-black hover:bg-black/5'
                  }
                `}
                style={{ '--active-color': activeColor } as any}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-black">
          {/* Upgrade Button */}
          <a
            href={links.stripe}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full px-4 py-2 mb-4 text-sm font-medium text-[#F5F0E8] bg-[#E94E1B] hover:bg-[#00A651] rounded-full transition-colors"
          >
            Upgrade
          </a>

          {/* Credits Counter */}
          <div className="flex items-center justify-between px-4 py-2 mb-4 text-sm text-black">
            <span>Credits</span>
            <span className="font-medium">{credits}</span>
          </div>

          {/* Profile & Settings */}
          <div className="flex items-center justify-between">
            <Link
              to="/profile"
              className={`
                flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors
                ${location.pathname === '/profile' 
                  ? 'bg-[#29ABE2] text-[#F5F0E8]' 
                  : 'text-black hover:bg-black/5'
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
                  ? 'bg-[#29ABE2] text-[#F5F0E8]'
                  : 'text-black hover:bg-black/5'
                }
              `}
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#F5F0E8] border-t border-black flex md:hidden items-center justify-around px-4 py-2 z-50">
        {mobileNavigationItems.map((item, index) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          // Alternate between brand colors for active states
          const activeColors = ['#E94E1B', '#00A651', '#29ABE2', '#29ABE2']
          const activeColor = activeColors[index % activeColors.length]
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`
                flex flex-col items-center gap-1 p-2
                transition-colors duration-200
                ${isActive 
                  ? 'text-[var(--active-color)]' 
                  : 'text-black hover:text-[#29ABE2]'
                }
              `}
              style={{ '--active-color': activeColor } as any}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Main Content */}
      <main className="md:pl-64 min-h-screen pb-24">
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