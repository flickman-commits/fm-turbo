import { useState, useEffect } from 'react'
import { TaskType } from '@/types/tasks'
import { TaskModal } from '@/components/TaskModal'
import { FeatureRequestModal } from '@/components/FeatureRequestModal'
import { Layout } from '@/components/Layout'
import { VideoModal } from '@/components/VideoModal'
import { creditsManager } from '@/utils/credits'

export default function Home() {
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

  const tasks: { type: TaskType; label: string; beta?: boolean }[] = [
    { type: 'proposal', label: 'CONTENT PROPOSAL' },
    { type: 'runOfShow', label: 'RUN OF SHOW' },
    { type: 'budget', label: 'PRODUCTION BUDGET' },
    { type: 'contractorBrief', label: 'CONTRACTOR BRIEF' }
  ]

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-4xl md:text-7xl font-bold mb-12 tracking-tight text-turbo-black">
          What would you like to create today?
        </h1>
        
        <div className="space-y-4 mb-8">
          {tasks.map((task) => (
            <div 
              key={task.type}
              className="flex items-center justify-between border-b border-turbo-black pb-4 group cursor-pointer hover:border-turbo-blue"
              onClick={() => handleTaskSelect(task.type)}
            >
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-turbo-black group-hover:text-turbo-blue transition-colors">
                  {task.label}
                </h2>
                {task.beta && (
                  <span className="px-1.5 py-0.5 text-xs font-medium bg-turbo-blue text-turbo-beige rounded">
                    BETA
                  </span>
                )}
              </div>
              <button
                className="text-3xl text-turbo-black group-hover:text-turbo-blue hover:scale-110 transition-all"
                aria-label={`Open ${task.label}`}
                onClick={(e) => {
                  e.stopPropagation()
                  handleTaskSelect(task.type)
                }}
              >
                +
              </button>
            </div>
          ))}
        </div>

        {/* Help Link */}
        <div className="text-center">
          <button
            onClick={() => setShowVideoModal(true)}
            className="text-sm font-medium underline transition-colors text-turbo-blue hover:text-turbo-black"
          >
            IF YOU NEED HELP USING TURBO CLICK HERE
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