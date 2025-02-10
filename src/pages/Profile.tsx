import { Layout } from '@/components/Layout'
import { useUser } from '@/contexts/UserContext'
import { useState, useEffect } from 'react'
import { useCompanyInfo } from '@/contexts/CompanyInfoContext'
import { User } from 'lucide-react'
import { UserInfo } from '@/types/outreach'

// Default user info for mobile
const DEFAULT_USER_INFO: UserInfo = {
  name: 'User',
  company: 'Your Company',
  companyName: 'Your Company',
  businessType: 'Video Production',
  role: 'Professional',
  email: '',
  conversationalStyle: 'friendly',
  outreachType: 'getClients',
  outreachContext: 'discussing business opportunities',
  messageStyle: 'direct'
}

export default function Profile() {
  const { user } = useUser()
  const { setIsInfoSaved } = useCompanyInfo()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingCompanyInfo, setIsEditingCompanyInfo] = useState(false)
  const [formData, setFormData] = useState<UserInfo>(() => {
    const saved = localStorage.getItem('userInfo')
    return saved ? JSON.parse(saved) : DEFAULT_USER_INFO
  })
  const [userInfo, setUserInfo] = useState<UserInfo>(() => {
    const saved = localStorage.getItem('userInfo')
    return saved ? JSON.parse(saved) : DEFAULT_USER_INFO
  })

  useEffect(() => {
    // Set default user info if not already set
    if (!localStorage.getItem('userInfo')) {
      localStorage.setItem('userInfo', JSON.stringify(DEFAULT_USER_INFO))
      setIsInfoSaved(true)
    }
  }, [setIsInfoSaved])

  const handleInfoChange = (field: keyof UserInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveUserInfo = async () => {
    if (formData.name && formData.email) {
      setIsSubmitting(true)
      
      try {
        // Update userInfo with form data
        const updatedInfo = {
          ...userInfo,
          name: formData.name,
          email: formData.email,
          conversationalStyle: formData.conversationalStyle
        }
        setUserInfo(updatedInfo)
        
        // Save to localStorage
        localStorage.setItem('userInfo', JSON.stringify(updatedInfo))
        console.log('User Info saved:', updatedInfo)
        setIsEditing(false)
        
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
            email: updatedInfo.email,
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

  const handleSaveCompanyInfo = async () => {
    if (formData.companyName && formData.businessType) {
      setIsSubmitting(true)
      
      try {
        // Update userInfo with form data
        const updatedInfo = {
          ...userInfo,
          companyName: formData.companyName,
          businessType: formData.businessType
        }
        setUserInfo(updatedInfo)
        
        // Save to localStorage
        localStorage.setItem('userInfo', JSON.stringify(updatedInfo))
        console.log('Company Info saved:', updatedInfo)
        setIsEditingCompanyInfo(false)
      } catch (error) {
        console.error('Error saving info:', error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleCancelUserInfo = () => {
    setFormData(userInfo) // Reset form to current userInfo
    setIsEditing(false)
  }

  const handleCancelCompanyInfo = () => {
    setFormData(userInfo) // Reset form to current userInfo
    setIsEditingCompanyInfo(false)
  }

  const isUserInfoValid = () => {
    return !!(formData.name && formData.email)
  }

  const isCompanyInfoValid = () => {
    return !!(formData.companyName && formData.businessType)
  }

  // Update form data when editing starts
  useEffect(() => {
    if (isEditing || isEditingCompanyInfo) {
      setFormData(userInfo)
    }
  }, [isEditing, isEditingCompanyInfo, userInfo])

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl md:text-7xl font-bold mb-12 text-turbo-black tracking-tight">
          My Profile
        </h1>
        
        <div className="space-y-8">
          {/* Your Info Section */}
          <div className="p-6 bg-white rounded-xl border-2 border-turbo-black">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Your Info</h2>
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm font-medium text-turbo-black/60 hover:text-turbo-blue transition-colors"
              >
                Edit Info
              </button>
            </div>
            <div className="space-y-6">
              {isEditing ? (
                <>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-full bg-turbo-black/5 flex items-center justify-center">
                      <User className="w-8 h-8 text-turbo-black/40" />
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-turbo-beige bg-turbo-blue hover:bg-turbo-black rounded-full transition-colors">
                      Update Photo
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-turbo-black mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInfoChange('name', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-turbo-black rounded-lg bg-turbo-beige focus:outline-none focus:ring-1 focus:ring-turbo-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-turbo-black mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInfoChange('email', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-turbo-black rounded-lg bg-turbo-beige focus:outline-none focus:ring-1 focus:ring-turbo-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-turbo-black mb-1">
                      Conversational Style
                    </label>
                    <select
                      value={formData.conversationalStyle || 'professional'}
                      onChange={(e) => handleInfoChange('conversationalStyle', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-turbo-black rounded-lg bg-turbo-beige focus:outline-none focus:ring-1 focus:ring-turbo-blue"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="friendly">Friendly</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-full bg-turbo-black/5 flex items-center justify-center">
                      <User className="w-8 h-8 text-turbo-black/40" />
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-turbo-black/60 mb-1">Your Name</p>
                    <p className="font-medium">{userInfo.name}</p>
                  </div>
                  
                  <div>
                    <p className="text-turbo-black/60 mb-1">Email</p>
                    <p className="font-medium">{userInfo.email}</p>
                  </div>
                  
                  <div>
                    <p className="text-turbo-black/60 mb-1">Conversational Style</p>
                    <p className="font-medium">{userInfo.conversationalStyle || 'Professional'}</p>
                  </div>
                </>
              )}

              {isEditing && (
                <div className="pt-4 mt-4 border-t border-turbo-black/10 flex justify-end gap-2">
                  <button
                    onClick={handleCancelUserInfo}
                    className="px-4 py-2 text-sm font-medium text-turbo-black hover:text-turbo-blue transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveUserInfo}
                    disabled={!isUserInfoValid() || isSubmitting}
                    className={`px-6 py-2 text-sm font-medium text-turbo-beige rounded-full transition-colors ${
                      isUserInfoValid() && !isSubmitting
                        ? 'bg-turbo-blue hover:bg-turbo-black'
                        : 'bg-turbo-black/40 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Company Info Section */}
          <div className="p-6 bg-white rounded-xl border-2 border-turbo-black">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Company Info</h2>
              <button
                onClick={() => setIsEditingCompanyInfo(true)}
                className="text-sm font-medium text-turbo-black/60 hover:text-turbo-blue transition-colors"
              >
                Edit Info
              </button>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-8">
                <img 
                  src="/fm-logo.png" 
                  alt="Company Logo" 
                  className="w-16 h-16 object-contain border border-turbo-black/10 rounded-lg"
                />
                {isEditingCompanyInfo && (
                  <button className="px-4 py-2 text-sm font-medium text-turbo-beige bg-turbo-blue hover:bg-turbo-black rounded-full transition-colors">
                    Update Logo
                  </button>
                )}
              </div>

              {isEditingCompanyInfo ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-turbo-black mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => handleInfoChange('companyName', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-turbo-black rounded-lg bg-turbo-beige focus:outline-none focus:ring-1 focus:ring-turbo-blue"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-turbo-black mb-1">
                      Business Type
                    </label>
                    <input
                      type="text"
                      value={formData.businessType}
                      onChange={(e) => handleInfoChange('businessType', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-turbo-black rounded-lg bg-turbo-beige focus:outline-none focus:ring-1 focus:ring-turbo-blue"
                    />
                  </div>

                  <div className="pt-4 mt-4 border-t border-turbo-black/10 flex justify-end gap-2">
                    <button
                      onClick={handleCancelCompanyInfo}
                      className="px-4 py-2 text-sm font-medium text-turbo-black hover:text-turbo-blue transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveCompanyInfo}
                      disabled={!isCompanyInfoValid() || isSubmitting}
                      className={`px-6 py-2 text-sm font-medium text-turbo-beige rounded-full transition-colors ${
                        isCompanyInfoValid() && !isSubmitting
                          ? 'bg-turbo-blue hover:bg-turbo-black'
                          : 'bg-turbo-black/40 cursor-not-allowed'
                      }`}
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-turbo-black/60 mb-1">Company Name</p>
                    <p className="font-medium">{userInfo.companyName}</p>
                  </div>
                  
                  <div>
                    <p className="text-turbo-black/60 mb-1">Business Type</p>
                    <p className="font-medium">{userInfo.businessType}</p>
                  </div>
                </>
              )}

              <div>
                <p className="text-turbo-black/60 mb-1">Total Tasks Used</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">247</p>
                  <span className="text-xs text-turbo-black/40">all-time</span>
                </div>
              </div>
            </div>
          </div>

          {/* Integrations Section */}
          <div className="p-6 bg-white rounded-xl border-2 border-turbo-black">
            <h2 className="text-xl font-semibold mb-6">Integrations</h2>
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
        </div>
      </div>
    </Layout>
  )
} 