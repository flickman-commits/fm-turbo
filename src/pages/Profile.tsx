import { Layout } from '@/components/Layout'
import { useUser } from '@/contexts/UserContext'
import { useState, useEffect } from 'react'
import { useCompanyInfo } from '@/contexts/CompanyInfoContext'

// Default user info for mobile
const DEFAULT_USER_INFO = {
  companyName: 'Flickman Media',
  userName: 'Matt Hickman',
  businessType: 'Video Production',
  email: 'matt@flickmanmedia.com'
}

interface UserInfo {
  companyName: string;
  userName: string;
  businessType: string;
  email: string;
}

export default function Profile() {
  const { user } = useUser()
  const { isInfoSaved, setIsInfoSaved } = useCompanyInfo()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  // Track current form state
  const [userInfo, setUserInfo] = useState<UserInfo>(() => {
    const saved = localStorage.getItem('userInfo')
    return saved ? JSON.parse(saved) : (isMobile ? DEFAULT_USER_INFO : {
      companyName: '',
      userName: '',
      businessType: '',
      email: ''
    })
  })

  useEffect(() => {
    // Set default user info for mobile on first load
    if (isMobile && !localStorage.getItem('userInfo')) {
      localStorage.setItem('userInfo', JSON.stringify(DEFAULT_USER_INFO))
      setIsInfoSaved(true)
    }

    // Handle window resize
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl md:text-7xl font-bold mb-12 text-turbo-black tracking-tight">
          My Profile
        </h1>
        
        <div className="space-y-8">
          {/* Company Info Section - Show form on mobile */}
          <div className="p-6 bg-white rounded-xl border-2 border-turbo-black">
            <h2 className="text-xl font-semibold mb-4">Company Info</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <img 
                  src="/fm-logo.png" 
                  alt="Company Logo" 
                  className="w-16 h-16 object-contain border border-turbo-black/10 rounded-lg"
                />
                <button className="px-4 py-2 text-sm font-medium text-turbo-beige bg-turbo-blue hover:bg-turbo-black rounded-full transition-colors">
                  Update Logo
                </button>
              </div>
              
              {/* Show form fields on mobile */}
              <div className="md:hidden space-y-4">
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

                <button
                  onClick={handleSaveInfo}
                  disabled={!isFormValid() || isSubmitting}
                  className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
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
              </div>

              {/* Show static info on desktop */}
              <div className="hidden md:block space-y-4">
                <div>
                  <p className="text-turbo-black/60 mb-1">Company Name</p>
                  <p className="font-medium">{userInfo.companyName}</p>
                </div>
                
                <div>
                  <p className="text-turbo-black/60 mb-1">Your Name</p>
                  <p className="font-medium">{userInfo.userName}</p>
                </div>
                
                <div>
                  <p className="text-turbo-black/60 mb-1">Business Type</p>
                  <p className="font-medium">{userInfo.businessType}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border-2 border-turbo-black">
            <h2 className="text-xl font-semibold mb-4">Account Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-turbo-black/60 mb-1">Username</p>
                <p className="font-medium">flickman</p>
              </div>

              <div>
                <p className="text-turbo-black/60 mb-1">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>

              <div>
                <p className="text-turbo-black/60 mb-1">Total Tasks Used</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">247</p>
                  <span className="text-xs text-turbo-black/40">all-time</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border-2 border-turbo-black">
            <h2 className="text-xl font-semibold mb-4">Integrations</h2>
            <div className="space-y-6">
              {/* Vimeo Integration */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src="/vimeo-icon.png" 
                    alt="Vimeo" 
                    className="w-8 h-8 object-contain"
                  />
                  <div>
                    <p className="font-medium">Vimeo</p>
                    <p className="text-sm text-turbo-black/60">Connect your portfolio videos</p>
                  </div>
                </div>
                {user?.vimeoConnected ? (
                  <div className="flex items-center gap-4">
                    <p className="font-medium text-turbo-green">Connected</p>
                    <button className="px-4 py-2 text-sm font-medium text-turbo-black hover:text-turbo-blue transition-colors">
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button className="px-6 py-2 text-sm font-medium text-turbo-beige bg-turbo-blue hover:bg-turbo-black rounded-full transition-colors">
                    Connect
                  </button>
                )}
              </div>

              {/* Notion Integration */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src="/notion.svg" 
                    alt="Notion" 
                    className="w-8 h-8 object-contain"
                  />
                  <div>
                    <p className="font-medium">Notion</p>
                    <p className="text-sm text-turbo-black/60">Sync your documents</p>
                  </div>
                </div>
                <button className="px-6 py-2 text-sm font-medium text-turbo-beige bg-turbo-blue hover:bg-turbo-black rounded-full transition-colors">
                  Coming Soon
                </button>
              </div>

              {/* Slack Integration */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src="/slack-logo.png" 
                    alt="Slack" 
                    className="w-8 h-8 object-contain"
                  />
                  <div>
                    <p className="font-medium">Slack</p>
                    <p className="text-sm text-turbo-black/60">Get notifications</p>
                  </div>
                </div>
                <button className="px-6 py-2 text-sm font-medium text-turbo-beige bg-turbo-blue hover:bg-turbo-black rounded-full transition-colors">
                  Coming Soon
                </button>
              </div>
            </div>
          </div>

          {/* Coming Soon Features */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 text-turbo-black">Coming Soon</h2>
            <div className="space-y-4">
              <div className="p-6 bg-white rounded-xl border-2 border-turbo-black/20">
                <div className="flex items-start gap-4">
                  <div className="bg-turbo-blue/10 rounded-lg p-3">
                    <span className="text-2xl">🔗</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Connect Your Data</h3>
                    <p className="text-turbo-black/60">Integrate with your favorite tools and services to streamline your workflow</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white rounded-xl border-2 border-turbo-black/20">
                <div className="flex items-start gap-4">
                  <div className="bg-turbo-blue/10 rounded-lg p-3">
                    <span className="text-2xl">⚙️</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Customize How You Like Things Done</h3>
                    <p className="text-turbo-black/60">Personalize your experience with custom templates and preferences</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
} 