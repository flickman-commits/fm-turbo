import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { SplashCursor } from '@/components/ui/splash-cursor';
import { EasterEgg } from '@/components/EasterEgg';
import { FloatingButton } from '@/components/ui/floating-button';
import Home from '@/pages/Home';
import { useState } from 'react';

// Create a client
const queryClient = new QueryClient();

export default function App() {
  const [showSplash, setShowSplash] = useState(false);
  const [easterEggUnlocked, setEasterEggUnlocked] = useState(false);

  const handleSecret = () => {
    setShowSplash(true);
    setEasterEggUnlocked(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              border: 'none',
            },
          }}
        />
        {showSplash && <SplashCursor />}
        <FloatingButton 
          show={easterEggUnlocked} 
          onClick={() => setShowSplash(false)}
        >
          Get rid of cursor splash
        </FloatingButton>
        <EasterEgg onSecret={handleSecret} />
      </BrowserRouter>
    </QueryClientProvider>
  );
} 