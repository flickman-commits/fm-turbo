import { Home, History, User, Settings } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { FeatureRequestModal } from '@/components/FeatureRequestModal'
import { useCompanyInfo } from '@/contexts/CompanyInfoContext'

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
  email: string;
}

export function Layout({ children }: LayoutProps) {
  const { isInfoSaved, setIsInfoSaved } = useCompanyInfo()
  const location = useLocation()
  const [showFeatureRequest, setShowFeatureRequest] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Track current form state
  const [userInfo, setUserInfo] = useState<UserInfo>(() => {
    const saved = localStorage.getItem('userInfo')
    return saved ? JSON.parse(saved) : {
      companyName: '',
      userName: '',
      businessType: '',
      email: ''
    }
  })

  // Track saved info state
  const [savedInfo, setSavedInfo] = useState<UserInfo>(() => {
    const saved = localStorage.getItem('userInfo')
    return saved ? JSON.parse(saved) : {
      companyName: '',
      userName: '',
      businessType: '',
      email: ''
    }
  })

  const handleInfoChange = (field: keyof UserInfo, value: string) => {
    const newInfo = { ...userInfo, [field]: value }
    setUserInfo(newInfo)
  }

  const handleSaveInfo = async () => {
    if (userInfo.companyName && userInfo.userName && userInfo.businessType && userInfo.email) {
      setIsSubmitting(true)
      
      try {
        // Save to localStorage
        localStorage.setItem('userInfo', JSON.stringify(userInfo))
        setSavedInfo(userInfo)
        setIsInfoSaved(true)
        
        // Send to Google Sheets
        const date = new Date().toLocaleDateString()
        const time = new Date().toLocaleTimeString()
        
        await fetch('https://script.google.com/macros/s/AKfycbxCvoevTYrwn8VzrMxh6lmqIn35xhI-Q2xA3MbyA64O3mDrJeA0SjtEzcHGey4SWXUlHA/exec', {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userInfo.email,
            date,
            time
          })
        })
        
        console.log('Saved user info to localStorage and Google Sheets:', userInfo)
      } catch (error) {
        console.error('Error saving info:', error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const isFormValid = () => {
    return !!(userInfo.companyName && userInfo.userName && userInfo.businessType && userInfo.email)
  }

  return (
    <div className="min-h-screen bg-turbo-beige">
      {/* Mobile Logo - Only show on mobile */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Link to="/">
          <img 
            src="/turbo-logo.png" 
            alt="Turbo Logo" 
            className="h-9 w-auto"
          />
        </Link>
      </div>

      {/* Desktop Sidebar */}
      <aside className="fixed top-0 left-0 bottom-0 w-64 border-r border-turbo-black hidden md:flex flex-col bg-turbo-beige z-50">
        {/* Logo */}
        <div className="p-6 flex justify-start items-center">
          <Link to="/">
            <img 
              src="/turbo-logo.png" 
              alt="Turbo Logo" 
              className={`h-[60px] w-auto transition-opacity ${!isInfoSaved ? 'opacity-40' : ''}`}
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
                  ${!isInfoSaved ? 'md:opacity-40 md:pointer-events-none' : ''}
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

        {/* Update the Callout Box */}
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
        <div className="px-4 space-y-3 mb-6 hidden md:block">
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
            <label htmlFor="email" className="block text-sm font-medium text-turbo-black mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={userInfo.email}
              onChange={(e) => handleInfoChange('email', e.target.value)}
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
        </div>

        {/* Fixed Bottom Section */}
        <div className="flex-shrink-0 p-4 border-t border-turbo-black">
          <button
            onClick={handleSaveInfo}
            disabled={!isFormValid() || isSubmitting}
            className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors mb-4 hidden md:flex items-center justify-center ${
              isFormValid() && !isSubmitting
                ? 'bg-turbo-blue text-turbo-beige hover:bg-turbo-black'
                : 'bg-turbo-black/40 text-turbo-beige cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-turbo-beige border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Save Information'
            )}
          </button>

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

      {/* Main Content - Reduce top padding on mobile */}
      <main className="md:pl-64 min-h-screen pb-24 pt-10 md:pt-0">
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