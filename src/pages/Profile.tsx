import { Layout } from '@/components/Layout'
import { useState, useEffect } from 'react'
import { useCompanyInfo } from '@/contexts/CompanyInfoContext'
import { User, CreditCard, Upload } from 'lucide-react'
import { UserInfo } from '@/types/outreach'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { creditsManager } from '@/utils/credits'
import { toast } from 'react-hot-toast'

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
  const { setIsInfoSaved } = useCompanyInfo()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingCompanyInfo, setIsEditingCompanyInfo] = useState(false)
  const [credits, setCredits] = useState<number>(0)
  const [isLoadingCredits, setIsLoadingCredits] = useState(true)
  const [openProductions, setOpenProductions] = useState<number>(0)
  const [isLoadingProductions, setIsLoadingProductions] = useState(true)
  
  // Handle scroll to billing section
  useEffect(() => {
    if (window.location.hash === '#billing') {
      const billingSection = document.getElementById('billing')
      if (billingSection) {
        setTimeout(() => {
          billingSection.scrollIntoView({ behavior: 'smooth' })
        }, 100) // Small delay to ensure content is rendered
      }
    }
  }, [])

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

  // Update useEffect for credits loading to log the process
  useEffect(() => {
    const loadCredits = async () => {
      try {
        console.log('🔄 Loading credits...')
        if (!session?.user?.id) {
          console.log('❌ No user session')
          return
        }
        
        await creditsManager.initialize(session.user.id)
        const currentCredits = await creditsManager.getCredits()
        console.log('✅ Credits loaded:', currentCredits)
        setCredits(currentCredits)
      } catch (error) {
        console.error('Failed to load credits:', error)
      } finally {
        setIsLoadingCredits(false)
      }
    }

    loadCredits()
  }, [session?.user?.id])

  // Load open productions count
  useEffect(() => {
    const loadOpenProductions = async () => {
      if (!session?.user?.id) return
      
      try {
        setIsLoadingProductions(true)
        const { data, error } = await supabase
          .from('productions')
          .select('id', { count: 'exact' })
          .eq('user_id', session.user.id)
          .not('status', 'in', '("completed","archived")')

        if (error) throw error
        setOpenProductions(data?.length || 0)
      } catch (error) {
        console.error('Failed to load productions:', error)
      } finally {
        setIsLoadingProductions(false)
      }
    }

    loadOpenProductions()
  }, [session?.user?.id])

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
          // Keep existing avatar_url if it exists
          avatar_url: profile?.avatar_url || null,
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
        const { data: refreshedProfile, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
          
        if (fetchError) throw fetchError
        
        if (refreshedProfile) {
          console.log('👤 Updated profile data:', refreshedProfile)
          setProfile(refreshedProfile)
          // Update form data with refreshed profile
          setFormData(prev => ({
            ...prev,
            name: refreshedProfile.name || '',
            email: refreshedProfile.email || '',
            messageStyle: (refreshedProfile.message_style as UserInfo['messageStyle']) || 'professional',
            role: refreshedProfile.role || '',
            outreachType: (refreshedProfile.outreach_type as UserInfo['outreachType']) || 'getClients'
          }))
        }
        
        setIsInfoSaved(true)
        setIsEditing(false)
        toast.success('Profile updated successfully!')
      } catch (error) {
        console.error('❌ Error saving info:', error)
        toast.error('Failed to update profile')
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !session?.user?.id) return
    
    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)')
        return
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB in bytes
      if (file.size > maxSize) {
        toast.error('Image size must be less than 5MB')
        return
      }
      
      // Show loading state
      setIsSubmitting(true)
      
      // Upload image to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${session.user.id}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`
      
      console.log('📤 Uploading file:', { fileName, filePath, type: file.type, size: file.size })
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type, // Explicitly set the content type
          metadata: {
            owner: session.user.id,
            mimetype: file.type
          }
        })
      
      if (uploadError) {
        console.error('❌ Upload error:', uploadError)
        throw uploadError
      }
      
      // Get the Supabase URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)
      
      console.log('🔗 Generated public URL:', publicUrl)
      
      // Ensure URL uses the correct protocol
      const finalUrl = publicUrl.replace('http://', 'https://')
      console.log('🔒 Final secure URL:', finalUrl)
      
      // Update user profile with new avatar URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          avatar_url: finalUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id)
      
      if (updateError) {
        console.error('❌ Profile update error:', updateError)
        throw updateError
      }
      
      // Fetch updated profile
      const { data: refreshedProfile, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      if (fetchError) {
        console.error('❌ Profile fetch error:', fetchError)
        throw fetchError
      }
        
      if (refreshedProfile) {
        console.log('✅ Profile updated successfully:', refreshedProfile)
        setProfile(refreshedProfile)
        // Update form data with refreshed profile
        setFormData(prev => ({
          ...prev,
          avatar_url: refreshedProfile.avatar_url || null
        }))
      }
      
      toast.success('Profile picture updated successfully!')
    } catch (error) {
      console.error('❌ Error in handleImageUpload:', error)
      toast.error('Failed to update profile picture')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Top Section with Photo and Stats */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Left Column - Photo */}
          <div className="flex-shrink-0">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-turbo-black/5 flex items-center justify-center border-2 border-turbo-black overflow-hidden">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile?.name || 'Profile'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-turbo-black/40" />
                )}
              </div>
              {isEditing && (
                <label className="absolute inset-0 flex items-center justify-center bg-turbo-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center text-turbo-beige">
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-xs">Update Photo</span>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Right Column - Info */}
          <div className="flex-grow">
            <h1 className="text-4xl font-bold mb-4 text-turbo-black">
              {profile?.name || 'Your Profile'}
            </h1>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-6 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-turbo-beige border-2 border-turbo-black flex items-center justify-center">
                  <span className="text-sm font-bold">{profile?.tasks_used || 0}</span>
                </div>
                <span className="text-turbo-black/60">Tasks Created</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-turbo-beige border-2 border-turbo-black flex items-center justify-center">
                  <span className="text-sm font-bold">{credits}</span>
                </div>
                <span className="text-turbo-black/60">Credits Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-turbo-beige border-2 border-turbo-black flex items-center justify-center">
                  {isLoadingProductions ? (
                    <span className="w-4 h-4 border-2 border-turbo-black/20 border-t-turbo-black rounded-full animate-spin" />
                  ) : (
                    <span className="text-sm font-bold">{openProductions}</span>
                  )}
                </div>
                <span className="text-turbo-black/60">Open Productions</span>
              </div>
            </div>

            {/* Identity Markers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile && profile.role && (
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-turbo-black/60" />
                  <span>{profile.role}</span>
                </div>
              )}
              {profile?.company_name && (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-turbo-black/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                  <span>Works at {profile.company_name}</span>
                </div>
              )}
              {profile?.business_type && (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-turbo-black/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{profile.business_type}</span>
                </div>
              )}
              {profile?.message_style && (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-turbo-black/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <span>{profile.message_style} communication style</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Buttons - Mobile Friendly */}
        {!isEditing && !isEditingCompanyInfo && (
          <div className="flex flex-col gap-3 mb-8 px-4 md:px-0">
            <button
              onClick={() => setIsEditing(true)}
              className="w-full md:w-auto px-6 py-3 text-sm font-medium text-turbo-beige bg-turbo-black hover:bg-turbo-blue rounded-lg transition-colors"
            >
              Edit Profile
            </button>
            <button
              onClick={() => setIsEditingCompanyInfo(true)}
              className="w-full md:w-auto px-6 py-3 text-sm font-medium text-turbo-black bg-turbo-beige hover:bg-turbo-blue hover:text-turbo-beige border-2 border-turbo-black rounded-lg transition-colors"
            >
              Edit Company
            </button>
          </div>
        )}

        {/* Edit Forms */}
        {(isEditing || isEditingCompanyInfo) && (
          <div className="bg-white border-2 border-turbo-black rounded-xl p-8 mb-8">
            {isEditing && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-turbo-black mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInfoChange('name', e.target.value)}
                      className="w-full px-3 py-2 text-sm border-2 border-turbo-black rounded-lg bg-turbo-beige focus:outline-none focus:ring-2 focus:ring-turbo-blue"
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
                      className="w-full px-3 py-2 text-sm border-2 border-turbo-black rounded-lg bg-turbo-beige focus:outline-none focus:ring-2 focus:ring-turbo-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-turbo-black mb-1">
                      Role
                    </label>
                    <input
                      type="text"
                      value={formData.role}
                      onChange={(e) => handleInfoChange('role', e.target.value)}
                      className="w-full px-3 py-2 text-sm border-2 border-turbo-black rounded-lg bg-turbo-beige focus:outline-none focus:ring-2 focus:ring-turbo-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-turbo-black mb-1">
                      Message Style
                    </label>
                    <select
                      value={formData.messageStyle}
                      onChange={(e) => handleInfoChange('messageStyle', e.target.value)}
                      className="w-full px-3 py-2 text-sm border-2 border-turbo-black rounded-lg bg-turbo-beige focus:outline-none focus:ring-2 focus:ring-turbo-blue"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="friendly">Friendly</option>
                      <option value="direct">Direct</option>
                      <option value="storytelling">Storytelling</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-turbo-black mb-1">
                      Outreach Type
                    </label>
                    <select
                      value={formData.outreachType || ''}
                      onChange={(e) => handleInfoChange('outreachType', e.target.value)}
                      className="w-full px-3 py-2 text-sm border-2 border-turbo-black rounded-lg bg-turbo-beige focus:outline-none focus:ring-2 focus:ring-turbo-blue"
                    >
                      <option value="">Select an outreach type</option>
                      <option value="getClients">Get Clients</option>
                      <option value="getJob">Get Job</option>
                      <option value="getSpeakers">Get Speakers</option>
                      <option value="getHotelStay">Get Hotel Stay</option>
                      <option value="getSponsors">Get Sponsors</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 flex justify-end gap-2">
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
              </div>
            )}

            {isEditingCompanyInfo && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Edit Company</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-turbo-black mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => handleInfoChange('companyName', e.target.value)}
                      className="w-full px-3 py-2 text-sm border-2 border-turbo-black rounded-lg bg-turbo-beige focus:outline-none focus:ring-2 focus:ring-turbo-blue"
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
                      className="w-full px-3 py-2 text-sm border-2 border-turbo-black rounded-lg bg-turbo-beige focus:outline-none focus:ring-2 focus:ring-turbo-blue"
                    />
                  </div>
                </div>

                <div className="pt-6 flex justify-end gap-2">
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
              </div>
            )}
          </div>
        )}

        {/* Request Credits Section */}
        <div className="bg-turbo-beige p-8 rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-turbo-black" />
              <h2 className="text-xl font-semibold">Need More Credits?</h2>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <p className="text-3xl font-bold text-turbo-black mb-2">
                {isLoadingCredits ? (
                  <span className="inline-block w-12 h-8 bg-turbo-black/5 rounded animate-pulse" />
                ) : (
                  `${credits} credits remaining`
                )}
              </p>
              <p className="text-turbo-black/60">Use credits to generate content with AI</p>
            </div>
            
            <button
              onClick={() => {
                const subject = encodeURIComponent("More Turbo Credits")
                const body = encodeURIComponent("Hey Matt,\n\nLoving Turbo so far... but I ran out of credits. Any way I could get some more?")
                window.location.href = `mailto:matt@flickmanmedia.com?subject=${subject}&body=${body}`
              }}
              className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-turbo-beige bg-turbo-black hover:bg-turbo-blue rounded-full transition-colors"
            >
              Request More Credits
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
} 