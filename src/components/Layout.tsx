import { Home, History, User, Settings } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { links } from '@/config/links'
import { creditsManager } from '@/utils/credits'
import { useState } from 'react'
import { FeatureRequestModal } from '@/components/FeatureRequestModal'
import { CompanyInfoContext, useCompanyInfo } from '@/contexts/CompanyInfoContext'

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
  const { isInfoSaved, setIsInfoSaved } = useCompanyInfo()
  const location = useLocation()
  const credits = creditsManager.getCredits()
  const [showFeatureRequest, setShowFeatureRequest] = useState(false)
  
  // Track current form state
  const [userInfo, setUserInfo] = useState<UserInfo>(() => {
    const saved = localStorage.getItem('userInfo')
    return saved ? JSON.parse(saved) : {
      companyName: '',
      userName: '',
      businessType: ''
    }
  })

  // Track saved info state
  const [savedInfo, setSavedInfo] = useState<UserInfo>(() => {
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
  }

  const handleSaveInfo = () => {
    if (userInfo.companyName && userInfo.userName && userInfo.businessType) {
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
      setSavedInfo(userInfo) // Update the saved info state
      setIsInfoSaved(true)
      console.log('Saved user info to localStorage:', userInfo)
    }
  }

  const isFormValid = () => {
    return !!(userInfo.companyName && userInfo.userName && userInfo.businessType)
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
                  ${!isInfoSaved ? 'opacity-50 pointer-events-none' : ''}
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

        {/* Callout Box */}
        <div className={`px-4 py-3 mx-4 mb-4 rounded-lg border-2 ${
          isInfoSaved 
            ? 'bg-turbo-green/10 border-turbo-green' 
            : 'bg-red-100 border-red-500'
        }`}>
          <p className="text-sm text-turbo-black font-medium mb-1">
            {isInfoSaved ? '✅ Information Saved' : '⚠️ Action Required'}
          </p>
          {isInfoSaved ? (
            <>
              <p className="text-sm text-turbo-black/80 mb-2">
                You may now start using the tasks.
              </p>
              <div className="mt-2 pt-2 border-t border-turbo-green/20">
                <div className="font-medium text-sm text-turbo-black">Current Information:</div>
                <div className="text-xs mt-1 text-turbo-black/80">
                  <div>Company: {savedInfo.companyName}</div>
                  <div>Name: {savedInfo.userName}</div>
                  <div>Business: {savedInfo.businessType}</div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-red-700 font-medium">
              Please fill in your company information below to start using the tasks.
            </p>
          )}
        </div>

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
              onClick={handleSaveInfo}
              disabled={!isFormValid()}
              className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isFormValid()
                  ? 'bg-turbo-blue text-turbo-beige hover:bg-turbo-black'
                  : 'bg-turbo-black/40 text-turbo-beige cursor-not-allowed'
              }`}
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
            className={`hidden flex items-center justify-center w-full px-4 py-2 mb-4 text-sm font-medium text-turbo-beige bg-turbo-blue hover:bg-turbo-black rounded-full transition-colors ${
              !isInfoSaved ? 'opacity-50 pointer-events-none' : ''
            }`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Upgrade
          </a>

          {/* Credits Counter */}
          <div className={`hidden flex items-center justify-between px-4 py-2 mb-4 text-sm text-turbo-black ${
            !isInfoSaved ? 'opacity-50' : ''
          }`}>
            <span>Credits</span>
            <span className="font-medium">{credits}</span>
          </div>

          {/* Profile & Settings */}
          <div className="flex items-center justify-between">
            <Link
              to="/profile"
              className={`
                flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors
                ${!isInfoSaved ? 'opacity-50 pointer-events-none' : ''}
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
                ${!isInfoSaved ? 'opacity-50 pointer-events-none' : ''}
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
      <nav className={`fixed bottom-0 left-0 right-0 bg-turbo-beige border-t border-turbo-black flex md:hidden items-center justify-around px-4 py-2 z-50 ${
        !isInfoSaved ? 'opacity-50 pointer-events-none' : ''
      }`}>
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
      <main className={`md:pl-64 min-h-screen pb-24 ${!isInfoSaved ? 'opacity-50 pointer-events-none' : ''}`}>
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