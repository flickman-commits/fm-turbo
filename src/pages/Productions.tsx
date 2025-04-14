import { Layout } from '@/components/Layout'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Production, ProductionStatus } from '@/types/productions'
import { Film, Plus, Calendar, Clock, CheckCircle, Archive } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'

export default function Productions() {
  const { session } = useAuth()
  const [productions, setProductions] = useState<Production[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<ProductionStatus | 'all'>('all')

  useEffect(() => {
    const loadProductions = async () => {
      if (!session?.user?.id) return

      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('productions')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setProductions(data || [])
      } catch (error) {
        console.error('Error loading productions:', error)
        toast.error('Failed to load productions')
      } finally {
        setIsLoading(false)
      }
    }

    loadProductions()
  }, [session?.user?.id])

  const filteredProductions = selectedStatus === 'all'
    ? productions
    : productions.filter(p => p.status === selectedStatus)

  const getStatusColor = (status: ProductionStatus) => {
    switch (status) {
      case 'pre_production':
        return 'bg-blue-100 text-blue-800'
      case 'production':
        return 'bg-yellow-100 text-yellow-800'
      case 'post_production':
        return 'bg-purple-100 text-purple-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Productions</h1>
          <p className="text-lg text-turbo-black/60">
            Manage your video productions and track their progress
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-4">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              selectedStatus === 'all'
                ? 'bg-turbo-blue text-white'
                : 'bg-turbo-black/5 hover:bg-turbo-black/10'
            }`}
          >
            All Productions
          </button>
          <button
            onClick={() => setSelectedStatus('pre_production')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              selectedStatus === 'pre_production'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-turbo-black/5 hover:bg-turbo-black/10'
            }`}
          >
            Pre-Production
          </button>
          <button
            onClick={() => setSelectedStatus('production')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              selectedStatus === 'production'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-turbo-black/5 hover:bg-turbo-black/10'
            }`}
          >
            Production
          </button>
          <button
            onClick={() => setSelectedStatus('post_production')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              selectedStatus === 'post_production'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-turbo-black/5 hover:bg-turbo-black/10'
            }`}
          >
            Post-Production
          </button>
          <button
            onClick={() => setSelectedStatus('completed')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              selectedStatus === 'completed'
                ? 'bg-green-100 text-green-800'
                : 'bg-turbo-black/5 hover:bg-turbo-black/10'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setSelectedStatus('archived')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              selectedStatus === 'archived'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-turbo-black/5 hover:bg-turbo-black/10'
            }`}
          >
            Archived
          </button>
        </div>

        {/* Productions Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-turbo-black/20 border-t-turbo-black rounded-full animate-spin" />
          </div>
        ) : filteredProductions.length === 0 ? (
          <div className="text-center py-12">
            <Film className="w-12 h-12 mx-auto text-turbo-black/20 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No productions found</h3>
            <p className="text-turbo-black/60 mb-6">
              {selectedStatus === 'all'
                ? 'Create your first production to get started'
                : `No ${selectedStatus.replace('_', ' ')} productions found`}
            </p>
            <Link
              to="/productions/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-turbo-blue text-white rounded-lg hover:bg-turbo-blue/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create Production</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProductions.map(production => (
              <Link
                key={production.id}
                to={`/productions/${production.id}`}
                className="block p-6 bg-white rounded-xl border-2 border-turbo-black hover:border-turbo-blue transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold">{production.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(production.status)}`}>
                    {production.status.replace('_', ' ')}
                  </span>
                </div>
                {production.client_name && (
                  <p className="text-turbo-black/60 mb-4">
                    Client: {production.client_name}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-turbo-black/60">
                  {production.start_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(production.start_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {production.end_date && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(production.end_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
} 