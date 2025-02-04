import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Home from '@/pages/Home'
import History from '@/pages/History'
import Profile from '@/pages/Profile'
import Settings from '@/pages/Settings'
import SignUp from '@/pages/SignUp'
import { UserProvider } from '@/contexts/UserContext'

// For testing purposes, we'll create a mock user
const mockUser = {
  id: '1',
  email: 'test@example.com',
  vimeoConnected: true,
  vimeoUserId: 'vimeo123'
}

export default function App() {
  return (
    <UserProvider initialUser={mockUser}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/sign-up" element={<SignUp />} />
        </Routes>
        <Toaster 
          position="bottom-center"
          className="max-md:!bottom-auto max-md:!top-24 !z-[100]"
          toastOptions={{
            className: "max-md:data-[state=open]:animate-in max-md:data-[state=open]:slide-in-from-top-24 max-md:data-[state=closed]:animate-out max-md:data-[state=closed]:fade-out max-md:data-[state=closed]:slide-out-to-top-24 max-md:data-[swipe=move]:translate-y-[var(--y)] max-md:data-[swipe=cancel]:translate-y-0"
          }}
          closeButton={false}
        />
      </Router>
    </UserProvider>
  )
} 