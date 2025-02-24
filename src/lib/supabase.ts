import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test function to directly create a user profile
export const testCreateUserProfile = async () => {
  // Get the current user first
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    console.error('No authenticated user found:', userError)
    return { success: false, error: { message: 'No authenticated user found' } }
  }

  const testUser = {
    id: user.id,
    email: user.email,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  console.log('Attempting to create test user:', testUser)
  
  const { data, error } = await supabase
    .from('users')
    .insert([testUser])
    .select()
    .single()

  if (error) {
    console.error('Error creating test user:', error)
    return { success: false, error }
  }

  console.log('Successfully created test user:', data)
  return { success: true, data }
}

// Initialize session from local storage if available
try {
  const savedSession = localStorage.getItem('turbo_auth_token')
  if (savedSession) {
    const { access_token } = JSON.parse(savedSession)
    if (access_token) {
      console.log('Found existing session token')
    }
  }
} catch (error) {
  console.error('Error reading saved session:', error)
  localStorage.removeItem('turbo_auth_token')
}

// Auth helper functions
export const signInWithGoogle = async () => {
  const redirectTo = window.location.hostname === 'localhost'
    ? 'http://localhost:5173/auth/v1/callback'
    : 'https://turbo.flickman.media/auth/v1/callback'

  console.log('Starting Google sign-in with redirect:', redirectTo)
  
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: false,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })
    
    if (error) {
      console.error('Google sign-in error:', error)
      throw error
    }
    
    console.log('Google sign-in initiated, redirecting...')
    return data
  } catch (error) {
    console.error('Error during Google sign-in:', error)
    throw error
  }
}

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  if (error) throw error
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
} 