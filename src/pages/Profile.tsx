import { Layout } from '@/components/Layout'
import { useUser } from '@/contexts/UserContext'
import { useState, useEffect } from 'react'
import { useCompanyInfo } from '@/contexts/CompanyInfoContext'
import { User, Bell, CreditCard, Key } from 'lucide-react'
import { UserInfo } from '@/types/outreach'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { creditsManager } from '@/utils/credits'

// Default user info structure (empty values)
const DEFAULT_USER_INFO: UserInfo = {
  name: '',
  company: '',
  companyName: '',
  businessType: '',
  role: '',
  email: '',
  messageStyle: 'professional',
  outreachType: 'getClients'
}

export default function Account() {
  const { initialized, profile, session, setProfile } = useAuth()
  const { user } = useUser()
  const { setIsInfoSaved } = useCompanyInfo()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingCompanyInfo, setIsEditingCompanyInfo] = useState(false)
  
  // Initialize form data from profile
  const [formData, setFormData] = useState<UserInfo>(() => {
    if (profile) {
      return {
        ...DEFAULT_USER_INFO,
        name: profile.name || '',
        email: profile.email || '',
        companyName: profile.company_name || '',
        businessType: profile.business_type || '',
        messageStyle: (profile.message_style as UserInfo['messageStyle']) || 'professional',
        role: profile.role || '',
        company: profile.company_name || '', // For backward compatibility
        outreachType: (profile.outreach_type as UserInfo['outreachType']) || 'getClients'
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
        messageStyle: (profile.message_style as UserInfo['messageStyle']) || 'professional',
        role: profile.role || '',
        company: profile.company_name || '', // For backward compatibility
        outreachType: (profile.outreach_type as UserInfo['outreachType']) || 'getClients'
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

        // Create update object for logging and updating
        const updateData = {
          name: formData.name,
          email: formData.email,
          message_style: formData.messageStyle,
          role: formData.role,
          outreach_type: formData.outreachType,
          updated_at: new Date().toISOString()
        }

        console.log('📝 Updating user info:', updateData)

        // Update Supabase profile with all relevant fields
        const { error: updateError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', session.user.id)

        if (updateError) throw updateError
        
        console.log('✅ User info updated successfully')
        
        // Fetch updated profile data
        const { data: refreshedProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
          
        if (refreshedProfile) {
          console.log('👤 Updated profile data:', refreshedProfile)
          setProfile(refreshedProfile)
        }
        
        setIsInfoSaved(true)
        setIsEditing(false)
      } catch (error) {
        console.error('❌ Error saving info:', error)
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

        // Create update object for logging and updating
        const updateData = {
          company_name: formData.companyName,
          business_type: formData.businessType,
          updated_at: new Date().toISOString()
        }

        console.log('🏢 Updating company info:', updateData)

        // Update Supabase profile
        const { error: updateError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', session.user.id)

        if (updateError) throw updateError
        
        console.log('✅ Company info updated successfully')
        
        // Fetch updated profile data
        const { data: refreshedProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
          
        if (refreshedProfile) {
          console.log('👤 Updated profile data:', refreshedProfile)
          setProfile(refreshedProfile)
        }
        
        setIsInfoSaved(true)
        setIsEditingCompanyInfo(false)
      } catch (error) {
        console.error('❌ Error saving info:', error)
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
          Profile Settings
        </h1>
        
        <div className="space-y-8">
          {/* Profile Section */}
          <div className="p-6 bg-white rounded-xl border-2 border-turbo-black">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Profile</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm font-medium text-turbo-black/60 hover:text-turbo-blue transition-colors"
                >
                  Edit Profile
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
                      Message Style
                    </label>
                    <select
                      value={formData.messageStyle}
                      onChange={(e) => handleInfoChange('messageStyle', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-turbo-black rounded-lg bg-turbo-beige focus:outline-none focus:ring-1 focus:ring-turbo-blue"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="friendly">Friendly</option>
                      <option value="direct">Direct</option>
                      <option value="storytelling">Storytelling</option>
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
                    <p className="text-turbo-black/60 mb-1">Message Style</p>
                    <p className="font-medium">{profile?.message_style === 'professional' ? 'Professional' : profile?.message_style || 'Not set'}</p>
                  </div>
                  
                  <div>
                    <p className="text-turbo-black/60 mb-1">Role</p>
                    <p className="font-medium">{profile?.role || 'Not set'}</p>
                  </div>
                  
                  <div>
                    <p className="text-turbo-black/60 mb-1">Outreach Type</p>
                    <p className="font-medium">{profile?.outreach_type || 'Not set'}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Company Info Section */}
          <div className="p-6 bg-white rounded-xl border-2 border-turbo-black">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Company Information</h2>
              {!isEditingCompanyInfo && (
                <button
                  onClick={() => setIsEditingCompanyInfo(true)}
                  className="text-sm font-medium text-turbo-black/60 hover:text-turbo-blue transition-colors"
                >
                  Edit Company
                </button>
              )}
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
                  <p className="font-medium">{profile?.tasks_used || 0}</p>
                  <span className="text-xs text-turbo-black/40">all-time</span>
                </div>
              </div>
            </div>
          </div>

          {/* Credits & Billing Section */}
          <div className="p-6 bg-white rounded-xl border-2 border-turbo-black">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-turbo-black" />
                <h2 className="text-xl font-semibold">Credits & Billing</h2>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <p className="text-sm text-turbo-black/60 mb-2">Available Credits</p>
                <p className="text-3xl font-bold text-turbo-black">{creditsManager.getCredits()}</p>
              </div>
              
              <button
                onClick={() => {
                  const subject = encodeURIComponent("More Turbo Credits")
                  const body = encodeURIComponent("Hey Matt,\n\nLoving Turbo so far... but I ran out of credits. Any way I could get some more?")
                  window.location.href = `mailto:matt@flickmanmedia.com?subject=${subject}&body=${body}`
                }}
                className="w-full px-4 py-3 text-sm font-medium text-turbo-beige bg-turbo-black hover:bg-turbo-blue rounded-lg transition-colors"
              >
                Request More Credits
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
} 