import { Layout } from '@/components/Layout'

export default function Settings() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl md:text-7xl font-bold mb-12 text-black tracking-tight">
          Settings
        </h1>
        
        <div className="space-y-8">
          <div className="p-6 bg-white rounded-xl border-2 border-black">
            <h2 className="text-xl font-semibold mb-4">Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-black/60">Receive updates about your tasks</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-black/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#29ABE2]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-black/60">Coming soon</p>
                </div>
                <label className="relative inline-flex items-center cursor-not-allowed opacity-50">
                  <input type="checkbox" className="sr-only peer" disabled />
                  <div className="w-11 h-6 bg-black/20 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border-2 border-black">
            <h2 className="text-xl font-semibold mb-4">Danger Zone</h2>
            <button className="px-4 py-2 text-sm font-medium text-[#E94E1B] hover:text-black transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
} 