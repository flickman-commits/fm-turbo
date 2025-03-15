import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiresProfile?: boolean
}

export function ProtectedRoute({ children, requiresProfile = true }: ProtectedRouteProps) {
  const { session, profile, initialized } = useAuth()
  const location = useLocation()

  // Only log when there's a state change that affects routing
  if (!initialized) {
    return (
      <div className="min-h-screen bg-turbo-beige flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-turbo-black/20 border-t-turbo-black rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!session) {
    console.log('🔒 Auth: Redirecting to welcome page - No active session')
    return <Navigate to="/welcome" state={{ from: location }} replace />
  }

  if (requiresProfile && !profile && location.pathname !== '/') {
    console.log('🔒 Auth: Redirecting to profile setup - Profile required but not found')
    return <Navigate to="/profile" state={{ from: location }} replace />
  }

  return <>{children}</>
} 