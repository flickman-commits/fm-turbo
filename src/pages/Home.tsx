import { useState } from 'react'
import { TaskType } from '@/types/tasks'
import { TaskModal } from '@/components/TaskModal'
import { FeatureRequestModal } from '@/components/FeatureRequestModal'
import { Layout } from '@/components/Layout'
import { useCompanyInfo } from '@/contexts/CompanyInfoContext'
import { VideoModal } from '@/components/VideoModal'

export default function Home() {
  const { isInfoSaved } = useCompanyInfo()
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null)
  const [showFeatureModal, setShowFeatureModal] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)

  const handleTaskSelect = (task: TaskType) => {
    if (!isInfoSaved) {
      return // Early return if info isn't saved
    }
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
        <h1 className={`text-4xl md:text-7xl font-bold mb-12 tracking-tight ${
          isInfoSaved ? 'text-turbo-black' : 'text-turbo-black/40'
        }`}>
          What would you like to create today?
        </h1>
        
        <div className="space-y-4 mb-8">
          {tasks.map((task) => (
            <div 
              key={task.type}
              className={`flex items-center justify-between border-b border-turbo-black pb-4 group ${
                isInfoSaved 
                  ? 'cursor-pointer hover:border-turbo-blue' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
              onClick={() => isInfoSaved && handleTaskSelect(task.type)}
            >
              <div className="flex items-center gap-2">
                <h2 className={`text-xl md:text-2xl font-semibold tracking-tight text-turbo-black ${
                  isInfoSaved ? 'group-hover:text-turbo-blue' : ''
                } transition-colors`}>
                  {task.label}
                </h2>
                {task.beta && (
                  <span className="px-1.5 py-0.5 text-xs font-medium bg-turbo-blue text-turbo-beige rounded">
                    BETA
                  </span>
                )}
              </div>
              <button
                className={`text-3xl text-turbo-black ${
                  isInfoSaved 
                    ? 'group-hover:text-turbo-blue hover:scale-110' 
                    : 'cursor-not-allowed'
                } transition-all`}
                aria-label={`Open ${task.label}`}
                disabled={!isInfoSaved}
                onClick={(e) => {
                  e.stopPropagation()
                  if (isInfoSaved) {
                    handleTaskSelect(task.type)
                  }
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
            disabled={!isInfoSaved}
            className={`text-sm font-medium underline transition-colors ${
              isInfoSaved 
                ? 'text-turbo-blue hover:text-turbo-black' 
                : 'text-turbo-black/40 cursor-not-allowed'
            }`}
          >
            IF YOU NEED HELP USING TURBO CLICK HERE
          </button>
        </div>

        {/* Feature Request Button */}
        <button
          onClick={() => setShowFeatureModal(true)}
          disabled={!isInfoSaved}
          className={`fixed right-4 bottom-4 h-10 px-4 font-medium text-turbo-black bg-turbo-beige hover:bg-turbo-blue hover:text-turbo-beige border border-turbo-black rounded-full transition-colors whitespace-nowrap z-10 text-sm mb-[calc(env(safe-area-inset-bottom)+64px)] md:bottom-8 md:right-8 md:mb-0 ${
            !isInfoSaved ? 'opacity-50 cursor-not-allowed hover:bg-turbo-beige hover:text-turbo-black' : ''
          }`}
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

        {showVideoModal && (
          <VideoModal
            onClose={() => setShowVideoModal(false)}
          />
        )}
      </div>
    </Layout>
  )
} 