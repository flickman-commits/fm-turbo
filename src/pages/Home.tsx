import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Production } from '@/types/productions'
import { Link } from 'react-router-dom'
import { FileText, Send, Scale, Plus } from 'lucide-react'
import { creditsManager } from '@/utils/credits'
import { motion } from 'framer-motion'

// Status badge component
const StatusBadge = ({ status }: { status: Production['status'] }) => {
  const colors = {
    pre_production: 'bg-blue-100 text-blue-800',
    production: 'bg-yellow-100 text-yellow-800',
    post_production: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-800'
  }

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status]}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

// Add CircularProgress component
const CircularProgress = ({ 
  value, 
  max, 
  size = 120, 
  strokeWidth = 8,
  label,
  sublabel,
  color = '#2563EB' // turbo-blue
}: { 
  value: number
  max: number
  size?: number
  strokeWidth?: number
  label: string
  sublabel?: React.ReactNode
  color?: string
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min((value / max) * 100, 100)
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg width={size} height={size} className="rotate-[-90deg]">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold">{value}</span>
          {sublabel && (
            <div className="text-sm text-turbo-blue hover:text-turbo-blue/80 transition-colors">
              {sublabel}
            </div>
          )}
        </div>
      </div>
      <h3 className="mt-4 text-sm font-medium text-turbo-black/60">{label}</h3>
    </div>
  )
}

export default function Home() {
  const { initialized, profile } = useAuth()
  const [productions, setProductions] = useState<Production[]>([])
  const [isLoadingProductions, setIsLoadingProductions] = useState(true)
  const [credits, setCredits] = useState<number | null>(null)
  const [isLoadingCredits, setIsLoadingCredits] = useState(true)

  // Fetch productions
  useEffect(() => {
    const loadProductions = async () => {
      if (!profile?.id) return

      try {
        const { data, error } = await supabase
          .from('productions')
          .select('*')
          .eq('user_id', profile.id)
          .not('status', 'eq', 'archived')
          .order('updated_at', { ascending: false })

        if (error) throw error
        setProductions(data || [])
      } catch (error) {
        console.error('Error loading productions:', error)
      } finally {
        setIsLoadingProductions(false)
      }
    }

    loadProductions()
  }, [profile?.id])

  // Initialize credits manager and fetch credits
  useEffect(() => {
    const initializeCredits = async () => {
      if (!profile?.id) return

      try {
        setIsLoadingCredits(true)
        await creditsManager.initialize(profile.id)
        const currentCredits = await creditsManager.getCredits()
        setCredits(currentCredits)
      } catch (error) {
        console.error('Failed to initialize credits:', error)
      } finally {
        setIsLoadingCredits(false)
      }
    }

    initializeCredits()
  }, [profile?.id])

  // Subscribe to credit changes
  useEffect(() => {
    if (!profile?.id) return

    const unsubscribe = creditsManager.addListener((newCredits) => {
      setCredits(newCredits)
    })

    return unsubscribe
  }, [profile?.id])

  if (!initialized) {
    return (
      <div className="min-h-screen bg-turbo-beige flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-turbo-black/20 border-t-turbo-black rounded-full animate-spin"></div>
      </div>
    )
  }

  const bizDevTasks = [
    {
      type: 'proposal',
      label: 'Content Proposals',
      description: 'Generate professional video content proposals',
      icon: FileText,
      path: '/proposals'
    },
    {
      type: 'outreach',
      label: 'Outreach Messages',
      description: 'Create personalized outreach messages',
      icon: Send,
      path: '/outreach'
    },
    {
      type: 'negotiation',
      label: 'Negotiation',
      description: 'Get expert advice on client negotiations',
      icon: Scale,
      path: '/negotiation'
    }
  ]

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 tracking-tight text-turbo-black">
            Welcome back{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-lg text-turbo-black/60">
            Here's what's happening with your productions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
          {/* Main Content */}
          <div className="space-y-8">
            {/* Productions Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Current Productions</h2>
              </div>

              {isLoadingProductions ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-turbo-black/20 border-t-turbo-black rounded-full animate-spin" />
                </div>
              ) : productions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border-2 border-turbo-black/10">
                  <FileText className="w-12 h-12 mx-auto text-turbo-black/20 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No active productions</h3>
                  <p className="text-turbo-black/60 mb-6">Create your first production to get started</p>
                  <Link
                    to="/productions/new"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-turbo-blue text-white rounded-lg hover:bg-turbo-blue/90 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Production</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {productions.map(production => (
                    <Link
                      key={production.id}
                      to={`/productions/${production.id}`}
                      className="block p-6 bg-white rounded-xl border-2 border-turbo-black hover:border-turbo-blue transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-xl font-semibold">{production.name}</h3>
                        <StatusBadge status={production.status} />
                      </div>
                      {production.client_name && (
                        <p className="text-turbo-black/60 mb-4">
                          Client: {production.client_name}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-turbo-black/60">
                        {production.start_date && (
                          <span>Started: {new Date(production.start_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Biz Dev Tasks Section */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Biz Dev Tasks</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {bizDevTasks.map(task => (
                  <Link
                    key={task.type}
                    to={task.path}
                    className="block p-6 bg-white rounded-xl border-2 border-turbo-black hover:border-turbo-blue transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-turbo-black/5 flex items-center justify-center group-hover:bg-turbo-blue/10 mb-4">
                      <task.icon className="w-5 h-5 text-turbo-black/40 group-hover:text-turbo-blue" />
                    </div>
                    <h3 className="font-semibold mb-2 group-hover:text-turbo-blue">{task.label}</h3>
                    <p className="text-sm text-turbo-black/60">{task.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Account Insights Panel */}
          <div className="bg-white rounded-xl border-2 border-turbo-black p-8 space-y-12 lg:sticky lg:top-8">
            <h2 className="text-xl font-bold">Account Insights</h2>
            
            <div className="grid grid-cols-1 gap-12">
              {/* Tasks Completed */}
              <CircularProgress
                value={profile?.tasks_used || 0}
                max={100}
                label="Tasks Completed"
                color="#2563EB"
              />

              {/* Available Credits */}
              {isLoadingCredits ? (
                <div className="flex justify-center">
                  <div className="w-8 h-8 border-4 border-turbo-black/20 border-t-turbo-black rounded-full animate-spin" />
                </div>
              ) : (
                <CircularProgress
                  value={credits || 0}
                  max={100}
                  label="Available Credits"
                  sublabel={
                    <Link
                      to="/profile#billing"
                      className="text-sm text-turbo-blue hover:text-turbo-blue/80 transition-colors"
                    >
                      Get More
                    </Link>
                  }
                  color="#0891B2" // cyan-600
                />
              )}

              {/* Active Productions */}
              {isLoadingProductions ? (
                <div className="flex justify-center">
                  <div className="w-8 h-8 border-4 border-turbo-black/20 border-t-turbo-black rounded-full animate-spin" />
                </div>
              ) : (
                <CircularProgress
                  value={productions.filter(p => p.status !== 'archived' && p.status !== 'completed').length}
                  max={10}
                  label="Active Productions"
                  color="#059669" // emerald-600
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
} 