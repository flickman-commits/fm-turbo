import { useState } from 'react'
import { TaskType } from '@/types/tasks'
import { TaskModal } from '@/components/TaskModal'
import { FeatureRequestModal } from '@/components/FeatureRequestModal'
import { Layout } from '@/components/Layout'

export default function Home() {
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null)
  const [showFeatureModal, setShowFeatureModal] = useState(false)

  const handleTaskSelect = (task: TaskType) => {
    setSelectedTask(task)
  }

  const tasks: { type: TaskType; label: string; beta?: boolean }[] = [
    { type: 'proposal', label: 'CONTENT PROPOSAL' },
    { type: 'outreach', label: 'OUTREACH MESSAGE' },
    { type: 'runOfShow', label: 'RUN OF SHOW' },
    { type: 'budget', label: 'PRODUCTION BUDGET' },
    { type: 'contractorBrief', label: 'CONTRACTOR BRIEF' },
    { type: 'timelineFromTranscript', label: 'TIMELINE FROM TRANSCRIPT', beta: true },
    { type: 'trendingAudios', label: 'TRENDING AUDIOS' }
  ]

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl md:text-7xl font-bold mb-12 text-turbo-black tracking-tight">
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
              >
                +
              </button>
            </div>
          ))}
        </div>

        {/* Feature Request Button - Fixed Position */}
        <button
          onClick={() => setShowFeatureModal(true)}
          className="fixed bottom-8 right-8 h-10 px-6 font-medium text-turbo-black bg-turbo-beige hover:bg-turbo-blue hover:text-turbo-beige border border-turbo-black rounded-full transition-colors whitespace-nowrap z-10 text-sm hidden md:block"
        >
          Submit Feature Request
        </button>

        {/* Mobile Feature Request Button */}
        <button
          onClick={() => setShowFeatureModal(true)}
          className="fixed right-4 h-10 px-4 font-medium text-turbo-black bg-turbo-beige hover:bg-turbo-blue hover:text-turbo-beige border border-turbo-black rounded-full transition-colors whitespace-nowrap z-10 text-sm mb-[calc(env(safe-area-inset-bottom)+64px)] md:hidden"
        >
          Submit Feature Request
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
      </div>
    </Layout>
  )
} 