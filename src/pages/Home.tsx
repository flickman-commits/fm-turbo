import { useState, useEffect } from 'react'
import { TaskType } from '@/types/tasks'
import { TaskModal } from '@/components/TaskModal'
import { FeatureRequestModal } from '@/components/FeatureRequestModal'
import { Layout } from '@/components/Layout'
import { useCompanyInfo } from '@/contexts/CompanyInfoContext'
import { VideoModal } from '@/components/VideoModal'
import { creditsManager } from '@/utils/credits'

export default function Home() {
  const { isInfoSaved } = useCompanyInfo()
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null)
  const [showFeatureModal, setShowFeatureModal] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [credits, setCredits] = useState(creditsManager.getCredits())
  const [isCreditsHovered, setIsCreditsHovered] = useState(false)

  useEffect(() => {
    // Subscribe to credit changes
    const unsubscribe = creditsManager.addListener((newCredits) => {
      setCredits(newCredits)
    })

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [])

  const handleTaskSelect = (task: TaskType) => {
    if (!isInfoSaved) {
      return // Early return if info isn't saved
    }
    setSelectedTask(task)
  }

  const handleRequestCredits = () => {
    const subject = encodeURIComponent("More Turbo Credits")
    const body = encodeURIComponent("Hey Matt,\n\nLoving Turbo so far... but I ran out of credits. Any way I could get some more?")
    window.location.href = `mailto:matt@flickmanmedia.com?subject=${subject}&body=${body}`
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
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Credits Counter - Adjust position for mobile */}
        <button
          onClick={handleRequestCredits}
          onMouseEnter={() => setIsCreditsHovered(true)}
          onMouseLeave={() => setIsCreditsHovered(false)}
          className="fixed top-3 right-4 md:right-8 bg-turbo-beige border border-turbo-black rounded-full px-3 py-1.5 text-sm font-medium z-50 opacity-70 hover:opacity-100 transition-all flex items-center gap-2 hover:bg-turbo-blue hover:text-turbo-beige hover:border-turbo-blue"
        >
          {isCreditsHovered ? (
            'GET MORE CREDITS'
          ) : (
            <>
              <span>{credits}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative top-[-1px]">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 17V17.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 13.5C11.9816 13.1754 12.0692 12.8536 12.2495 12.5832C12.4299 12.3127 12.6933 12.1091 13 12C13.3759 11.8563 13.7132 11.6272 13.9856 11.3309C14.2579 11.0346 14.4577 10.6794 14.5693 10.2926C14.6809 9.90587 14.7013 9.49751 14.6287 9.10095C14.5562 8.70438 14.3928 8.33333 14.1513 8.01853C13.9099 7.70374 13.5972 7.45508 13.2371 7.29433C12.877 7.13358 12.4809 7.06596 12.0858 7.09756C11.6907 7.12916 11.3094 7.25908 10.9765 7.47577C10.6437 7.69246 10.3696 7.98873 10.1807 8.33853" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </>
          )}
        </button>

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