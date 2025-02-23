import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/rainbow-toast'
import { useNavigate } from 'react-router-dom'

interface UserProfile {
  id: string
  email: string
  company_name?: string
  business_type?: string
  website_url?: string
  company_size?: string
  industry?: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  initialized: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [initialized, setInitialized] = useState(false)
  const navigate = useNavigate()

  // Add a ref to track initialization status
  const initializationComplete = useRef(false)

  // Function to handle profile fetching/creation
  const handleProfile = async (userId: string, userEmail: string) => {
    console.log('👤 Fetching user profile for:', userId)
    const { data: existingProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError && profileError.code === 'PGRST116') {
      console.log('🆕 Creating new profile for:', userId)
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert([{
          id: userId,
          email: userEmail,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (createError) {
        console.error('❌ Error creating user profile:', createError)
        toast.error('Failed to create user profile')
        return null
      }
      console.log('✅ Created new profile:', newProfile?.id)
      return newProfile
    } else if (!profileError) {
      console.log('✅ Found existing profile:', existingProfile?.id)
      return existingProfile
    }
    return null
  }

  useEffect(() => {
    console.log('🔄 Starting auth initialization...')
    let isSubscribed = true

    // Function to handle auth state updates
    const handleAuthChange = async (newSession: Session | null) => {
      if (!isSubscribed) return

      console.log('📝 Handling auth state:', { 
        userId: newSession?.user?.id,
        initialized: initializationComplete.current
      })

      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (newSession?.user) {
        const profile = await handleProfile(newSession.user.id, newSession.user.email!)
        if (isSubscribed) {
          setProfile(profile)
        }
      } else {
        setProfile(null)
      }

      // Only mark as initialized once
      if (!initializationComplete.current && isSubscribed) {
        console.log('✅ Auth initialization complete')
        setInitialized(true)
        initializationComplete.current = true
      }
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('📥 Got initial session:', session?.user?.id)
      handleAuthChange(session)
    }).catch(error => {
      console.error('❌ Error getting initial session:', error)
      if (isSubscribed && !initializationComplete.current) {
        setInitialized(true)
        initializationComplete.current = true
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔄 Auth state changed:', _event, session?.user?.id)
      handleAuthChange(session)
    })

    return () => {
      console.log('🧹 Cleaning up auth subscriptions')
      isSubscribed = false
      subscription.unsubscribe()
    }
  }, []) // Keep empty dependency array

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      })
      
      if (error) throw error
      
      if (data?.user) {
        toast.success('Signed in successfully!')
      } else {
        throw new Error('No user data returned from sign in')
      }
    } catch (error: any) {
      console.error('Error in sign in process:', error)
      if (error.message.includes('Email not confirmed')) {
        toast.error('Please verify your email address before signing in.')
      } else if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password. Please try again.')
      } else {
        toast.error('Failed to sign in: ' + error.message)
      }
      throw error
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: window.location.origin + '/auth/callback'
        }
      })
      if (error) throw error

      toast.success('Please check your email to verify your account before signing in.')
      navigate('/login', { 
        replace: true,
        state: { 
          email,
          justVerified: true 
        }
      })
    } catch (error: any) {
      console.error('Error in signup process:', error)
      if (error.message?.includes('User already registered')) {
        toast.error('This email is already registered. Please sign in instead.')
      } else if (error.message?.includes('Password')) {
        toast.error('Password must be at least 6 characters long.')
      } else {
        toast.error('Failed to create account. Please try again.')
      }
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast.success('Signed out successfully!')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out')
      throw error
    }
  }

  const value = {
    user,
    session,
    profile,
    initialized,
    signIn,
    signUp,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 