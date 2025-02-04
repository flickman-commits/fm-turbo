import { Layout } from '@/components/Layout'
import { useUser } from '@/contexts/UserContext'

export default function Profile() {
  const { user } = useUser()

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl md:text-7xl font-bold mb-12 text-black tracking-tight">
          My Profile
        </h1>
        
        <div className="space-y-8">
          <div className="p-6 bg-white rounded-xl border-2 border-black">
            <h2 className="text-xl font-semibold mb-4">Account Details</h2>
            <div className="space-y-2">
              <p className="text-black/60">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border-2 border-black">
            <h2 className="text-xl font-semibold mb-4">Vimeo Connection</h2>
            {user?.vimeoConnected ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-black/60">Status</p>
                  <p className="font-medium text-[#00A651]">Connected</p>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-black hover:text-[#E94E1B] transition-colors">
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-black/60 mb-4">
                  Connect your Vimeo account to include portfolio videos in your proposals
                </p>
                <button className="px-6 py-2 text-sm font-medium text-[#F5F0E8] bg-black hover:bg-[#29ABE2] rounded-full transition-colors">
                  Connect Vimeo
                </button>
              </div>
            )}
          </div>

          {/* Coming Soon Features */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 text-black">Coming Soon</h2>
            <div className="space-y-4">
              <div className="p-6 bg-white rounded-xl border-2 border-black/20">
                <div className="flex items-start gap-4">
                  <div className="bg-[#E94E1B]/10 rounded-lg p-3">
                    <span className="text-2xl">🔗</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Connect Your Data</h3>
                    <p className="text-black/60">Integrate with your favorite tools and services to streamline your workflow</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white rounded-xl border-2 border-black/20">
                <div className="flex items-start gap-4">
                  <div className="bg-[#E94E1B]/10 rounded-lg p-3">
                    <span className="text-2xl">⚙️</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Customize How You Like Things Done</h3>
                    <p className="text-black/60">Personalize your experience with custom templates and preferences</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
} 