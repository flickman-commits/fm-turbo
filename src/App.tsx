import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Home from '@/pages/Home'
import SignUp from '@/pages/SignUp'
import Checkout from '@/pages/Checkout'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/checkout" element={<Checkout />} />
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
  )
} 