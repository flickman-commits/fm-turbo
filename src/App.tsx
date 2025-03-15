import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import Home from '@/pages/Home'
import Profile from '@/pages/Profile'
import Welcome from '@/pages/Welcome'
import SignUp from '@/pages/auth/SignUp'
import Login from '@/pages/auth/Login'
import Outreach from '@/pages/Outreach'
import TimelineFromTranscript from '@/pages/TimelineFromTranscript'
import Proposals from '@/pages/Proposals'
import { CompanyInfoProvider } from '@/contexts/CompanyInfoContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CompanyInfoProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/auth/v1/callback" element={<Login />} />

            {/* Root Route with Auth Check */}
            <Route path="/" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />

            {/* Protected Routes */}
            <Route path="/proposals" element={
              <ProtectedRoute>
                <Proposals />
              </ProtectedRoute>
            } />
            <Route path="/outreach" element={
              <ProtectedRoute>
                <Outreach />
              </ProtectedRoute>
            } />
            <Route path="/timeline" element={
              <ProtectedRoute>
                <TimelineFromTranscript />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute requiresProfile={false}>
                <Profile />
              </ProtectedRoute>
            } />

            {/* Redirect unmatched routes to home (will be protected) */}
            <Route path="*" element={
              <ProtectedRoute>
                <Navigate to="/" replace />
              </ProtectedRoute>
            } />
          </Routes>
          <Toaster 
            position="bottom-center"
            className="max-md:!bottom-auto max-md:!top-24 !z-[100]"
            toastOptions={{
              className: "max-md:data-[state=open]:animate-in max-md:data-[state=open]:slide-in-from-top-24 max-md:data-[state=closed]:animate-out max-md:data-[state=closed]:fade-out max-md:data-[state=closed]:slide-out-to-top-24 max-md:data-[state=swipe=move]:translate-y-[var(--y)] max-md:data-[state=swipe=cancel]:translate-y-0"
            }}
            closeButton={false}
          />
        </CompanyInfoProvider>
      </AuthProvider>
    </BrowserRouter>
  )
} 