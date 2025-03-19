import { useState, useEffect } from 'react'
import { TaskType } from '@/types/tasks'
import { TaskModal } from '@/components/TaskModal'
import { FeatureRequestModal } from '@/components/FeatureRequestModal'
import { Layout } from '@/components/Layout'
import { VideoModal } from '@/components/VideoModal'
import { creditsManager } from '@/utils/credits'
import { useAuth } from '@/contexts/AuthContext'
import { BarChart3, Clock, FileText, Target, Send, Scale } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

// Counter component without animation
const Counter = ({ value, className = "text-7xl" }: { value: number; className?: string }) => {
  return (
    <span className={`font-bold text-turbo-black tabular-nums ${className}`}>
      {value}
    </span>
  )
}

export default function Home() {
  const { initialized, profile } = useAuth()
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null)
  const [showFeatureModal, setShowFeatureModal] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)
  const [isLoadingCredits, setIsLoadingCredits] = useState(true)
  const [lastFeedbackCredit, setLastFeedbackCredit] = useState(() => {
    const saved = localStorage.getItem('lastFeedbackCredit')
    return saved ? parseInt(saved) : 0
  })
  const navigate = useNavigate()

  // Initialize credits manager and fetch initial credits
  useEffect(() => {
    let mounted = true

    const initializeCredits = async () => {
      if (!profile?.id) return

      try {
        setIsLoadingCredits(true)
        await creditsManager.initialize(profile.id)
        if (mounted) {
          const currentCredits = await creditsManager.getCredits()
          setCredits(currentCredits)
        }
      } catch (error) {
        console.error('Failed to initialize credits:', error)
      } finally {
        if (mounted) {
          setIsLoadingCredits(false)
        }
      }
    }

    initializeCredits()

    return () => {
      mounted = false
    }
  }, [profile?.id])

  // Subscribe to credit changes
  useEffect(() => {
    if (!profile?.id) return

    const unsubscribe = creditsManager.addListener((newCredits) => {      
      setCredits(newCredits)
      
      // Check if 10 or more credits have been used since last feedback
      const creditsSinceLastFeedback = lastFeedbackCredit - newCredits
      if (creditsSinceLastFeedback >= 10) {
        setShowFeatureModal(true)
        setLastFeedbackCredit(newCredits)
        localStorage.setItem('lastFeedbackCredit', String(newCredits))
      }
    })

    return unsubscribe
  }, [profile?.id, lastFeedbackCredit])

  const handleTaskSelect = (task: TaskType) => {
    // Tasks with dedicated pages
    switch (task) {
      case 'outreach':
        navigate('/outreach')
        return
      case 'proposal':
        navigate('/proposals')
        return
      case 'negotiation':
        navigate('/negotiation')
        return
      default:
        setSelectedTask(task)
    }
  }

  const tasks: { type: TaskType; label: string; description: string; icon: typeof FileText; beta?: boolean }[] = [
    { 
      type: 'runOfShow',
      label: 'Run of Show',
      description: 'Create a detailed timeline for your event or production',
      icon: Clock
    },
    { 
      type: 'contractorBrief',
      label: 'Contractor Brief',
      description: 'Generate comprehensive briefs for your contractors',
      icon: FileText
    },
    {
      type: 'outreach',
      label: 'Outreach Message',
      description: 'Create personalized outreach messages for potential clients',
      icon: Send
    },
    {
      type: 'negotiation',
      label: 'Negotiation',
      description: 'Get expert advice on client negotiations and pricing',
      icon: Scale
    },
    {
      type: 'proposal',
      label: 'Content Proposal',
      description: 'Generate professional video content proposals',
      icon: FileText
    }
  ]

  // Show loading state while auth is initializing
  if (!initialized) {
    return (
      <div className="min-h-screen bg-turbo-beige flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-turbo-black/20 border-t-turbo-black rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <Layout onTaskSelect={setSelectedTask}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-turbo-black">
            Welcome back{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-lg text-turbo-black/60">
            Here's what's happening with your tasks
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Tasks Completed */}
          <div className="p-8 bg-white rounded-xl border-2 border-turbo-black">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-semibold text-lg">Tasks Completed</h3>
              <FileText className="w-5 h-5 text-turbo-black/40" />
            </div>
            <div className="flex flex-col items-center justify-center py-6">
              <Counter value={profile?.tasks_used || 0} />
              <div className="w-full h-2 bg-turbo-black/5 rounded-full overflow-hidden mt-6">
                <motion.div 
                  className="h-full bg-turbo-blue"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(((profile?.tasks_used || 0) / 100) * 100, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <p className="text-sm text-turbo-black/60 mt-6">
                Keep creating amazing content!
              </p>
            </div>
          </div>

          {/* Available Credits */}
          <div className="p-8 bg-white rounded-xl border-2 border-turbo-black">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-semibold text-lg">Available Credits</h3>
              <BarChart3 className="w-5 h-5 text-turbo-black/40" />
            </div>
            <div className="flex flex-col items-center justify-center py-6">
              {isLoadingCredits ? (
                <div className="w-32 h-32 border-4 border-turbo-black/20 border-t-turbo-blue rounded-full animate-spin" />
              ) : (
                <>
                  <div className="relative mb-6">
                    <svg className="w-32 h-32" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth="10"
                      />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="10"
                        strokeDasharray="283"
                        initial={{ strokeDashoffset: 283 }}
                        animate={{ 
                          strokeDashoffset: 283 - (Math.min((credits || 0) / 100 * 283, 283))
                        }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Counter value={credits ?? 0} className="text-5xl" />
                    </div>
                  </div>
                  <Link
                    to="/profile#billing"
                    className="inline-block px-6 py-3 text-sm font-medium text-turbo-beige bg-turbo-blue hover:bg-turbo-black rounded-lg transition-colors"
                  >
                    Get More Credits
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="p-8 bg-white rounded-xl border-2 border-turbo-black">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-semibold text-lg">Recent Activity</h3>
              <Clock className="w-5 h-5 text-turbo-black/40" />
            </div>
            <div className="space-y-4">
              <Link 
                to="/timeline"
                className="block p-4 rounded-lg bg-turbo-black/5 hover:bg-turbo-blue/10 transition-colors"
              >
                <p className="text-base font-medium">Last Timeline Created</p>
                <p className="text-sm text-turbo-black/60 mt-1">2 days ago</p>
              </Link>
              <Link 
                to="/outreach"
                className="block p-4 rounded-lg bg-turbo-black/5 hover:bg-turbo-blue/10 transition-colors"
              >
                <p className="text-base font-medium">Last Outreach Campaign</p>
                <p className="text-sm text-turbo-black/60 mt-1">5 days ago</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Available Tasks */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-turbo-black">Available Tasks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((task) => (
              <button
                key={task.type}
                onClick={() => handleTaskSelect(task.type)}
                className="flex items-start gap-4 p-6 bg-white rounded-xl border-2 border-turbo-black hover:border-turbo-blue group transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-turbo-black/5 flex items-center justify-center group-hover:bg-turbo-blue/10">
                  <task.icon className="w-5 h-5 text-turbo-black/40 group-hover:text-turbo-blue" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold mb-1 group-hover:text-turbo-blue">
                    {task.label}
                    {task.beta && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-turbo-blue text-turbo-beige rounded">
                        BETA
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-turbo-black/60">
                    {task.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Help Section */}
        <div className="text-center mb-16">
          <button
            onClick={() => setShowVideoModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-turbo-black hover:text-turbo-blue transition-colors"
          >
            <Target className="w-4 h-4" />
            Need help getting started?
          </button>
        </div>

        {/* Feature Request Button */}
        <button
          onClick={() => setShowFeatureModal(true)}
          className="fixed right-4 bottom-4 h-10 px-4 font-medium text-turbo-black bg-turbo-beige hover:bg-turbo-blue hover:text-turbo-beige border border-turbo-black rounded-full transition-colors whitespace-nowrap z-10 text-sm mb-[calc(env(safe-area-inset-bottom)+64px)] md:bottom-8 md:right-8 md:mb-0"
        >
          Give Us Feedback
        </button>

        {selectedTask && (
          <TaskModal
            taskType={selectedTask}
            onClose={() => setSelectedTask(null)}
          />
        )}

        {showFeatureModal && (
          <FeatureRequestModal
            onClose={() => setShowFeatureModal(false)}
          />
        )}

        {showVideoModal && (
          <VideoModal
            onClose={() => setShowVideoModal(false)}
          />
        )}
      </div>
    </Layout>
  )
} 