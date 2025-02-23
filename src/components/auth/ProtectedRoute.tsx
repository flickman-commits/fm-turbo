import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiresProfile?: boolean
}

export function ProtectedRoute({ children, requiresProfile = true }: ProtectedRouteProps) {
  const { session, profile, initialized } = useAuth()
  const location = useLocation()

  console.log('🔒 ProtectedRoute:', {
    path: location.pathname,
    initialized,
    hasSession: !!session,
    hasProfile: !!profile,
    requiresProfile
  })

  // Show loading state while auth is initializing
  if (!initialized) {
    console.log('⏳ Auth not initialized, showing loading state')
    return (
      <div className="min-h-screen bg-turbo-beige flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-turbo-black/20 border-t-turbo-black rounded-full animate-spin"></div>
      </div>
    )
  }

  // If we're initialized and there's no session, redirect to welcome
  if (!session) {
    console.log('🚫 No session found, redirecting to welcome')
    return <Navigate to="/welcome" state={{ from: location }} replace />
  }

  // If we require a profile and don't have one, redirect to profile setup
  if (requiresProfile && !profile) {
    console.log('👤 No profile found, redirecting to profile setup')
    return <Navigate to="/profile" state={{ from: location }} replace />
  }

  console.log('✅ All checks passed, rendering protected content')
  // If we have a session and (profile if required), render the protected content
  return <>{children}</>
} 