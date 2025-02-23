import { Layout } from '@/components/Layout'
import { useUser } from '@/contexts/UserContext'
import { useState, useEffect } from 'react'
import { useCompanyInfo } from '@/contexts/CompanyInfoContext'
import { User } from 'lucide-react'
import { UserInfo } from '@/types/outreach'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'

// Default user info structure (empty values)
const DEFAULT_USER_INFO: UserInfo = {
  name: '',
  company: '',
  companyName: '',
  businessType: '',
  role: '',
  email: '',
  conversationalStyle: 'professional',
  outreachType: 'getClients',
  messageStyle: 'direct'
}

export default function Profile() {
  const { initialized, profile, session, setProfile } = useAuth()
  const { user } = useUser()
  const { setIsInfoSaved } = useCompanyInfo()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingCompanyInfo, setIsEditingCompanyInfo] = useState(false)
  const navigate = useNavigate()
  
  // Initialize form data from profile
  const [formData, setFormData] = useState<UserInfo>(() => {
    if (profile) {
      return {
        ...DEFAULT_USER_INFO,
        name: profile.name || '',
        email: profile.email || '',
        companyName: profile.company_name || '',
        businessType: profile.business_type || '',
        conversationalStyle: profile.conversational_style || 'professional',
        role: profile.role || '',
        company: profile.company_name || '', // For backward compatibility
        outreachType: (profile.outreach_type as UserInfo['outreachType']) || 'getClients',
        messageStyle: (profile.message_style as UserInfo['messageStyle']) || 'direct'
      }
    }
    return DEFAULT_USER_INFO
  })

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        ...DEFAULT_USER_INFO,
        name: profile.name || '',
        email: profile.email || '',
        companyName: profile.company_name || '',
        businessType: profile.business_type || '',
        conversationalStyle: profile.conversational_style || 'professional',
        role: profile.role || '',
        company: profile.company_name || '', // For backward compatibility
        outreachType: (profile.outreach_type as UserInfo['outreachType']) || 'getClients',
        messageStyle: (profile.message_style as UserInfo['messageStyle']) || 'direct'
      })
    }
  }, [profile])

  // Show loading state while auth is initializing
  if (!initialized) {
    return (
      <div className="min-h-screen bg-turbo-beige flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-turbo-black/20 border-t-turbo-black rounded-full animate-spin"></div>
      </div>
    )
  }

  const handleInfoChange = (field: keyof UserInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveUserInfo = async () => {
    if (formData.name && formData.email) {
      setIsSubmitting(true)
      
      try {
        if (!session?.user?.id) {
          throw new Error('No user session found')
        }

        // Update Supabase profile with all relevant fields
        const { error: updateError } = await supabase
          .from('users')
          .update({
            name: formData.name,
            email: formData.email,
            conversational_style: formData.conversationalStyle,
            role: formData.role,
            outreach_type: formData.outreachType,
            message_style: formData.messageStyle,
            updated_at: new Date().toISOString()
          })
          .eq('id', session.user.id)

        if (updateError) throw updateError
        
        // Save to localStorage for backward compatibility
        localStorage.setItem('userInfo', JSON.stringify(formData))
        
        // Fetch updated profile data
        const { data: refreshedProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
          
        if (refreshedProfile) {
          setProfile(refreshedProfile)
        }
        
        setIsInfoSaved(true)
        setIsEditing(false)
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
        if (!session?.user?.id) {
          throw new Error('No user session found')
        }

        // Update Supabase profile
        const { error: updateError } = await supabase
          .from('users')
          .update({
            company_name: formData.companyName,
            business_type: formData.businessType,
            updated_at: new Date().toISOString()
          })
          .eq('id', session.user.id)

        if (updateError) throw updateError
        
        // Save to localStorage for backward compatibility
        localStorage.setItem('userInfo', JSON.stringify(formData))
        
        // Fetch updated profile data
        const { data: refreshedProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
          
        if (refreshedProfile) {
          setProfile(refreshedProfile)
        }
        
        setIsInfoSaved(true)
        setIsEditingCompanyInfo(false)
      } catch (error) {
        console.error('Error saving info:', error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleCancelUserInfo = () => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        name: profile.name || '',
        email: profile.email || ''
      }))
    }
    setIsEditing(false)
  }

  const handleCancelCompanyInfo = () => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        companyName: profile.company_name || '',
        businessType: profile.business_type || ''
      }))
    }
    setIsEditingCompanyInfo(false)
  }

  const isUserInfoValid = () => {
    return !!(formData.name && formData.email)
  }

  const isCompanyInfoValid = () => {
    return !!(formData.companyName && formData.businessType)
  }

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
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm font-medium text-turbo-black/60 hover:text-turbo-blue transition-colors"
                >
                  Edit Info
                </button>
              )}
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
                      value={formData.conversationalStyle}
                      onChange={(e) => handleInfoChange('conversationalStyle', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-turbo-black rounded-lg bg-turbo-beige focus:outline-none focus:ring-1 focus:ring-turbo-blue"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="friendly">Friendly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-turbo-black mb-1">
                      Role
                    </label>
                    <input
                      type="text"
                      value={formData.role}
                      onChange={(e) => handleInfoChange('role', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-turbo-black rounded-lg bg-turbo-beige focus:outline-none focus:ring-1 focus:ring-turbo-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-turbo-black mb-1">
                      Outreach Type
                    </label>
                    <select
                      value={formData.outreachType || ''}
                      onChange={(e) => handleInfoChange('outreachType', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-turbo-black rounded-lg bg-turbo-beige focus:outline-none focus:ring-1 focus:ring-turbo-blue"
                    >
                      <option value="">Select an outreach type</option>
                      <option value="getClients">Get Clients</option>
                      <option value="getJob">Get Job</option>
                      <option value="getSpeakers">Get Speakers</option>
                      <option value="getHotelStay">Get Hotel Stay</option>
                      <option value="getSponsors">Get Sponsors</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-turbo-black mb-1">
                      Message Style
                    </label>
                    <select
                      value={formData.messageStyle || ''}
                      onChange={(e) => handleInfoChange('messageStyle', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-turbo-black rounded-lg bg-turbo-beige focus:outline-none focus:ring-1 focus:ring-turbo-blue"
                    >
                      <option value="">Select a message style</option>
                      <option value="direct">Direct</option>
                      <option value="casual">Casual</option>
                      <option value="storytelling">Storytelling</option>
                    </select>
                  </div>

                  <div className="pt-4 mt-4 border-t border-turbo-black/10 flex justify-end gap-2">
                    <button
                      onClick={handleCancelUserInfo}
                      className="px-4 py-2 text-sm font-medium text-turbo-black hover:text-turbo-blue transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
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
                    <p className="font-medium">{profile?.name || 'Not set'}</p>
                  </div>
                  
                  <div>
                    <p className="text-turbo-black/60 mb-1">Email</p>
                    <p className="font-medium">{profile?.email || 'Not set'}</p>
                  </div>
                  
                  <div>
                    <p className="text-turbo-black/60 mb-1">Conversational Style</p>
                    <p className="font-medium">{profile?.conversational_style === 'professional' ? 'Professional' : profile?.conversational_style || 'Not set'}</p>
                  </div>
                  
                  <div>
                    <p className="text-turbo-black/60 mb-1">Role</p>
                    <p className="font-medium">{profile?.role || 'Not set'}</p>
                  </div>
                  
                  <div>
                    <p className="text-turbo-black/60 mb-1">Outreach Type</p>
                    <p className="font-medium">{profile?.outreach_type || 'Not set'}</p>
                  </div>
                  
                  <div>
                    <p className="text-turbo-black/60 mb-1">Message Style</p>
                    <p className="font-medium">{profile?.message_style || 'Not set'}</p>
                  </div>
                </>
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
                    <p className="font-medium">{profile?.company_name || 'Not set'}</p>
                  </div>
                  
                  <div>
                    <p className="text-turbo-black/60 mb-1">Business Type</p>
                    <p className="font-medium">{profile?.business_type || 'Not set'}</p>
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