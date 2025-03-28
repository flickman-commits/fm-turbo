import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/rainbow-toast'
import { useNavigate } from 'react-router-dom'
import { UserProfile } from '@/types/user'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  initialized: boolean
  setProfile: (profile: UserProfile | null) => void
  incrementTasksUsed: () => Promise<void>
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

  // Function to increment tasks used counter
  const incrementTasksUsed = async () => {
    if (!session?.user?.id) return

    try {
      const { data: updatedProfile, error } = await supabase
        .from('users')
        .update({
          tasks_used: (profile?.tasks_used || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id)
        .select()
        .single()

      if (error) throw error
      
      if (updatedProfile) {
        setProfile(updatedProfile)
      }
    } catch (error) {
      console.error('❌ Error incrementing tasks counter:', error)
    }
  }

  // Function to handle profile fetching/creation
  const handleProfile = async (userId: string, userEmail: string) => {
    const { data: existingProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError && profileError.code === 'PGRST116') {
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
      console.log('✅ Auth: New profile created')
      return newProfile
    } else if (!profileError) {
      return existingProfile
    }
    return null
  }

  useEffect(() => {
    let isSubscribed = true

    // Function to handle auth state updates
    const handleAuthChange = async (newSession: Session | null) => {
      if (!isSubscribed) return

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
        setInitialized(true)
        initializationComplete.current = true
      }
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
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
      console.log('🔒 Auth: State changed -', _event)
      handleAuthChange(session)
    })

    return () => {
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
    setProfile,
    incrementTasksUsed,
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