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
            <div className="space-y-4">
              <div>
                <p className="text-black/60 mb-1">Username</p>
                <p className="font-medium">flickman</p>
              </div>

              <div>
                <p className="text-black/60 mb-1">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>

              <div>
                <p className="text-black/60 mb-1">Total Tasks Used</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">247</p>
                  <span className="text-xs text-black/40">all-time</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border-2 border-black">
            <h2 className="text-xl font-semibold mb-4">Company Info</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <img 
                  src="/fm-logo" 
                  alt="Company Logo" 
                  className="w-16 h-16 object-contain border border-black/10 rounded-lg"
                />
                <button className="px-4 py-2 text-sm font-medium text-[#F5F0E8] bg-black hover:bg-[#29ABE2] rounded-full transition-colors">
                  Update Logo
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-black/60 mb-1">Company Name</p>
                  <p className="font-medium">Flickman Media</p>
                </div>
                
                <div>
                  <p className="text-black/60 mb-1">City</p>
                  <p className="font-medium">New York City</p>
                </div>
                
                <div>
                  <p className="text-black/60 mb-1">Payment Terms With Clients</p>
                  <p className="font-medium">50% upfront, 50% upon completion</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border-2 border-black">
            <h2 className="text-xl font-semibold mb-4">Integrations</h2>
            <div className="space-y-6">
              {/* Vimeo Integration */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src="/vimeo-icon.png" 
                    alt="Vimeo" 
                    className="w-8 h-8 object-contain"
                  />
                  <div>
                    <p className="font-medium">Vimeo</p>
                    <p className="text-sm text-black/60">Connect your portfolio videos</p>
                  </div>
                </div>
                {user?.vimeoConnected ? (
                  <div className="flex items-center gap-4">
                    <p className="font-medium text-[#00A651]">Connected</p>
                    <button className="px-4 py-2 text-sm font-medium text-black hover:text-[#E94E1B] transition-colors">
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button className="px-6 py-2 text-sm font-medium text-[#F5F0E8] bg-black hover:bg-[#29ABE2] rounded-full transition-colors">
                    Connect
                  </button>
                )}
              </div>

              {/* Notion Integration */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src="/notion.svg" 
                    alt="Notion" 
                    className="w-8 h-8 object-contain"
                  />
                  <div>
                    <p className="font-medium">Notion</p>
                    <p className="text-sm text-black/60">Sync your documents</p>
                  </div>
                </div>
                <button className="px-6 py-2 text-sm font-medium text-[#F5F0E8] bg-black hover:bg-[#29ABE2] rounded-full transition-colors">
                  Coming Soon
                </button>
              </div>

              {/* Slack Integration */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src="/slack-logo.png" 
                    alt="Slack" 
                    className="w-8 h-8 object-contain"
                  />
                  <div>
                    <p className="font-medium">Slack</p>
                    <p className="text-sm text-black/60">Get notifications</p>
                  </div>
                </div>
                <button className="px-6 py-2 text-sm font-medium text-[#F5F0E8] bg-black hover:bg-[#29ABE2] rounded-full transition-colors">
                  Coming Soon
                </button>
              </div>
            </div>
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