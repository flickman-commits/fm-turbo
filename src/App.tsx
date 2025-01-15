import { Toaster } from 'sonner';
import Home from '@/pages/Home';
import { EasterEgg } from '@/components/EasterEgg';

export default function App() {
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