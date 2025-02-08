import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Home from '@/pages/Home'
import Profile from '@/pages/Profile'
import Settings from '@/pages/Settings'
import SignUp from '@/pages/SignUp'
import Outreach from '@/pages/Outreach'
import { UserProvider } from '@/contexts/UserContext'
import { CompanyInfoProvider } from '@/contexts/CompanyInfoContext'

// For testing purposes, we'll create a mock user
const mockUser = {
  id: '1',
  email: 'test@example.com',
  vimeoConnected: true,
  vimeoUserId: 'vimeo123'
}

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <CompanyInfoProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/outreach" element={<Outreach />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/signup" element={<SignUp />} />
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
      </UserProvider>
    </BrowserRouter>
  )
} 