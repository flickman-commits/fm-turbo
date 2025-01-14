import { Toaster } from 'sonner';
import Home from '@/pages/Home';
import { EasterEgg } from '@/components/EasterEgg';

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <Home />
      <EasterEgg onSecret={() => {}} />
    </div>
  );
} 