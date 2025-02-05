import { Home, History, User, Settings } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { links } from '@/config/links'
import { creditsManager } from '@/utils/credits'
import { useState, useEffect } from 'react'
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

interface UserInfo {
  companyName: string;
  userName: string;
  businessType: string;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const credits = creditsManager.getCredits()
  const [showFeatureRequest, setShowFeatureRequest] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo>(() => {
    const saved = localStorage.getItem('userInfo')
    return saved ? JSON.parse(saved) : {
      companyName: '',
      userName: '',
      businessType: ''
    }
  })

  const handleInfoChange = (field: keyof UserInfo, value: string) => {
    const newInfo = { ...userInfo, [field]: value }
    setUserInfo(newInfo)
    localStorage.setItem('userInfo', JSON.stringify(newInfo))
  }

  return (
    <div className="min-h-screen bg-turbo-beige">
      {/* Desktop Sidebar */}
      <aside className="fixed top-0 left-0 bottom-0 w-64 border-r border-turbo-black hidden md:flex flex-col bg-turbo-beige z-50">
        {/* Logo */}
        <div className="p-6 flex justify-center items-center">
          <Link to="/">
            <img 
              src="/turbo-logo.png" 
              alt="Turbo Logo" 
              className="h-12 w-auto" 
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

        {/* User Info Form */}
        <div className="px-4 py-6 border-t border-turbo-black">
          <div className="space-y-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-turbo-black mb-1">
                Company Name
              </label>
              <input
                type="text"
                id="companyName"
                value={userInfo.companyName}
                onChange={(e) => handleInfoChange('companyName', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-turbo-black rounded-lg bg-turbo-beige focus:outline-none focus:ring-1 focus:ring-turbo-blue"
              />
            </div>

            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-turbo-black mb-1">
                Your Name
              </label>
              <input
                type="text"
                id="userName"
                value={userInfo.userName}
                onChange={(e) => handleInfoChange('userName', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-turbo-black rounded-lg bg-turbo-beige focus:outline-none focus:ring-1 focus:ring-turbo-blue"
              />
            </div>

            <div>
              <label htmlFor="businessType" className="block text-sm font-medium text-turbo-black mb-1">
                Business Type
              </label>
              <select
                id="businessType"
                value={userInfo.businessType}
                onChange={(e) => handleInfoChange('businessType', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-turbo-black rounded-lg bg-turbo-beige focus:outline-none focus:ring-1 focus:ring-turbo-blue"
              >
                <option value="">Select type...</option>
                <option value="Video Production">Video Production</option>
                <option value="Photography">Photography</option>
                <option value="Graphic Design">Graphic Design</option>
                <option value="Branding">Branding</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>

            <button
              onClick={() => {
                localStorage.setItem('userInfo', JSON.stringify(userInfo))
              }}
              className="w-full px-4 py-2 text-sm font-medium text-turbo-beige bg-turbo-blue hover:bg-turbo-black rounded-lg transition-colors"
            >
              Save Information
            </button>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="p-4 border-t border-turbo-black">
          {/* Upgrade Button */}
          <a
            href={links.stripe}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden flex items-center justify-center w-full px-4 py-2 mb-4 text-sm font-medium text-turbo-beige bg-turbo-blue hover:bg-turbo-black rounded-full transition-colors"
          >
            Upgrade
          </a>

          {/* Credits Counter */}
          <div className="hidden flex items-center justify-between px-4 py-2 mb-4 text-sm text-turbo-black">
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