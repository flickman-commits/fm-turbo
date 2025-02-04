import { useState } from 'react';
import { vimeoService } from '@/services/vimeo';
import { toast } from '@/components/ui/rainbow-toast';

export function VimeoConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const isValid = await vimeoService.validateCredentials();
      if (isValid) {
        setIsConnected(true);
        toast.success('Successfully connected to Vimeo!');
        // Here we would typically:
        // 1. Store the connection status in the user's profile
        // 2. Trigger initial video sync
        // 3. Update UI to show connected state
      } else {
        toast.error('Failed to connect to Vimeo. Please check your credentials.');
      }
    } catch (error) {
      console.error('Vimeo connection error:', error);
      toast.error('Failed to connect to Vimeo. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-black">Vimeo Connection</h3>
          <p className="text-sm text-black/60">
            Connect your Vimeo account to automatically include portfolio videos in your proposals
          </p>
        </div>
        <button
          onClick={handleConnect}
          disabled={isConnecting || isConnected}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            isConnected
              ? 'bg-green-500 text-white cursor-default'
              : 'bg-black text-[#F5F0E8] hover:bg-[#29ABE2]'
          }`}
        >
          {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Connect Vimeo'}
        </button>
      </div>
      {isConnected && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            Your Vimeo account is connected. Your videos will be automatically synced and available for use in proposals.
          </p>
        </div>
      )}
    </div>
  );
} 