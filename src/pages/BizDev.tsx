import { Layout } from '@/components/Layout'
import { FileText, Send, Scale } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function BizDev() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Business Development</h1>
          <p className="text-lg text-turbo-black/60">
            Tools to help you grow your business and manage client relationships
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Proposals */}
          <Link
            to="/proposals"
            className="block p-6 bg-white rounded-xl border-2 border-turbo-black hover:border-turbo-blue transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="bg-turbo-blue/10 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-turbo-blue" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Content Proposals</h3>
                <p className="text-turbo-black/60">
                  Generate professional video content proposals from discovery call transcripts or project requirements.
                </p>
              </div>
            </div>
          </Link>

          {/* Outreach */}
          <Link
            to="/outreach"
            className="block p-6 bg-white rounded-xl border-2 border-turbo-black hover:border-turbo-blue transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="bg-turbo-blue/10 p-3 rounded-lg">
                <Send className="w-6 h-6 text-turbo-blue" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Outreach</h3>
                <p className="text-turbo-black/60">
                  Create personalized outreach messages for potential clients based on their company and role.
                </p>
              </div>
            </div>
          </Link>

          {/* Negotiation */}
          <Link
            to="/negotiation"
            className="block p-6 bg-white rounded-xl border-2 border-turbo-black hover:border-turbo-blue transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="bg-turbo-blue/10 p-3 rounded-lg">
                <Scale className="w-6 h-6 text-turbo-blue" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Negotiation</h3>
                <p className="text-turbo-black/60">
                  Get expert advice on client negotiations and pricing strategies for your video projects.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </Layout>
  )
} 