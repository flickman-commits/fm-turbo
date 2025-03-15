import { useState, useEffect } from 'react'
import { TaskType } from '@/types/tasks'
import { TaskModal } from '@/components/TaskModal'
import { FeatureRequestModal } from '@/components/FeatureRequestModal'
import { Layout } from '@/components/Layout'
import { VideoModal } from '@/components/VideoModal'
import { creditsManager } from '@/utils/credits'
import { useAuth } from '@/contexts/AuthContext'
import { BarChart3, Clock, FileText, Plus, Sparkles, Target } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Home() {
  const { initialized, profile } = useAuth()
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null)
  const [showFeatureModal, setShowFeatureModal] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [lastFeedbackCredit, setLastFeedbackCredit] = useState(() => {
    const saved = localStorage.getItem('lastFeedbackCredit')
    return saved ? parseInt(saved) : 0
  })

  useEffect(() => {
    // Subscribe to credit changes
    const unsubscribe = creditsManager.addListener((newCredits) => {      
      // Check if 10 or more credits have been used since last feedback
      const creditsSinceLastFeedback = lastFeedbackCredit - newCredits
      if (creditsSinceLastFeedback >= 10) {
        setShowFeatureModal(true)
        setLastFeedbackCredit(newCredits)
        localStorage.setItem('lastFeedbackCredit', String(newCredits))
      }
    })

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [lastFeedbackCredit])

  const handleTaskSelect = (task: TaskType) => {
    setSelectedTask(task)
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
    <Layout>
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
          {/* Quick Stats */}
          <div className="p-6 bg-white rounded-xl border-2 border-turbo-black">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Available Credits</h3>
              <BarChart3 className="w-5 h-5 text-turbo-black/40" />
            </div>
            <p className="text-3xl font-bold text-turbo-black mb-2">
              {creditsManager.getCredits()}
            </p>
            <p className="text-sm text-turbo-black/60 mb-4">
              {profile?.tasks_used || 0} tasks completed
            </p>
            <Link
              to="/profile#billing"
              className="inline-block w-full px-4 py-2 text-sm font-medium text-turbo-beige bg-turbo-blue hover:bg-turbo-black rounded-lg transition-colors text-center"
            >
              Get More Credits
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="p-6 bg-white rounded-xl border-2 border-turbo-black">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Recent Activity</h3>
              <Clock className="w-5 h-5 text-turbo-black/40" />
            </div>
            <div className="space-y-3">
              <Link 
                to="/timeline"
                className="block p-3 rounded-lg bg-turbo-black/5 hover:bg-turbo-blue/10 transition-colors"
              >
                <p className="text-sm font-medium">Last Timeline Created</p>
                <p className="text-xs text-turbo-black/60">2 days ago</p>
              </Link>
              <Link 
                to="/outreach"
                className="block p-3 rounded-lg bg-turbo-black/5 hover:bg-turbo-blue/10 transition-colors"
              >
                <p className="text-sm font-medium">Last Outreach Campaign</p>
                <p className="text-xs text-turbo-black/60">5 days ago</p>
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-6 bg-white rounded-xl border-2 border-turbo-black">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Quick Actions</h3>
              <Sparkles className="w-5 h-5 text-turbo-black/40" />
            </div>
            <div className="space-y-2">
              <button
                onClick={() => handleTaskSelect('runOfShow')}
                className="w-full p-2 text-sm font-medium text-turbo-black hover:text-turbo-blue flex items-center gap-2 rounded-lg hover:bg-turbo-blue/10 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Run of Show
              </button>
              <button
                onClick={() => handleTaskSelect('contractorBrief')}
                className="w-full p-2 text-sm font-medium text-turbo-black hover:text-turbo-blue flex items-center gap-2 rounded-lg hover:bg-turbo-blue/10 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Contractor Brief
              </button>
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