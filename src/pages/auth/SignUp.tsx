import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/components/ui/rainbow-toast'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp, session, initialized } = useAuth()
  const navigate = useNavigate()

  // Show loading state while auth is initializing
  if (!initialized) {
    return (
      <div className="min-h-screen bg-turbo-beige flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-turbo-black/20 border-t-turbo-black rounded-full animate-spin"></div>
      </div>
    )
  }

  // If we're initialized and have a session, redirect to home
  if (session) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      await signUp(email, password)
      navigate('/', { replace: true })
    } catch (error: any) {
      console.error('Error:', error.message)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-turbo-beige flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/turbo-logo.png" alt="Turbo" className="h-12 mx-auto mb-8" />
          <h1 className="text-2xl font-bold text-turbo-black mb-2">Create your account</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full px-4 py-3 rounded-lg border-2 border-turbo-black bg-turbo-beige placeholder:text-turbo-black/40 focus:outline-none focus:border-turbo-blue"
            />
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full px-4 py-3 rounded-lg border-2 border-turbo-black bg-turbo-beige placeholder:text-turbo-black/40 focus:outline-none focus:border-turbo-blue"
            />
          </div>

          <div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              required
              className="w-full px-4 py-3 rounded-lg border-2 border-turbo-black bg-turbo-beige placeholder:text-turbo-black/40 focus:outline-none focus:border-turbo-blue"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-turbo-black text-turbo-beige py-3 rounded-lg font-medium hover:bg-turbo-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-8 text-center">
          Already have an account?{' '}
          <a href="/login" className="text-turbo-blue hover:text-turbo-black transition-colors">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
} 