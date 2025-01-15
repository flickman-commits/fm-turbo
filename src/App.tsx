import { Toaster } from 'sonner';
import Home from '@/pages/Home';
import { EasterEgg } from '@/components/EasterEgg';
import { useEffect, useState } from 'react';

export default function App() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Toaster 
        position="bottom-center"
        className="max-md:!bottom-auto max-md:!top-0"
        closeButton={false}
      />
      <Home />
      <EasterEgg onSecret={() => {}} />
    </div>
  );
} 