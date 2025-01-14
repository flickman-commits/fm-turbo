import { useState } from 'react';
import { Toaster } from 'sonner';
import Home from '@/pages/Home';
import { EasterEgg } from '@/components/EasterEgg';

export default function App() {
  const [easterEggUnlocked, setEasterEggUnlocked] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <Home />
      <EasterEgg onSecret={() => setEasterEggUnlocked(true)} />
    </div>
  );
} 