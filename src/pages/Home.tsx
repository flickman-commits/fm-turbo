import { useState } from 'react'
import { TaskType, TaskResult } from '@/types/tasks'
import { TaskModal } from '@/components/TaskModal'
import { ResultModal } from '@/components/ResultModal'
import { FormDataWithWeather } from '@/types/forms'
import { TrendingAudioButton } from '@/components/ui/trending-audio-button'
import { links } from '@/config/links'

export default function Home() {
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null)

  const handleTaskSelect = (task: TaskType) => {
    setSelectedTask(task)
  }

  const handleTaskComplete = (taskResult: TaskResult, formData: FormDataWithWeather) => {
    // Do nothing - we're handling the result in the TaskModal now
  }

  const tasks: { type: TaskType; label: string; beta?: boolean }[] = [
    { type: 'proposal', label: 'CONTENT PROPOSAL' },
    { type: 'outreach', label: 'OUTREACH MESSAGE' },
    { type: 'runOfShow', label: 'RUN OF SHOW' },
    { type: 'budget', label: 'PRODUCTION BUDGET' },
    { type: 'contractorBrief', label: 'CONTRACTOR BRIEF' },
    { type: 'timelineFromTranscript', label: 'TIMELINE FROM TRANSCRIPT', beta: true }
  ]

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12 bg-[#E0CFC0]">
      <div className="w-full max-w-3xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold mb-12 text-[#3D0C11] tracking-tight text-center">
          What would you like to create today?
        </h1>
        
        <div className="space-y-4 mb-8">
          {tasks.map((task) => (
            <div 
              key={task.type}
              className="flex items-center justify-between border-b border-[#3D0C11] pb-4 group cursor-pointer"
              onClick={() => handleTaskSelect(task.type)}
            >
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-semibold text-[#3D0C11] tracking-tight">
                  {task.label}
                </h2>
                {task.beta && (
                  <span className="px-1.5 py-0.5 text-xs font-medium bg-[#3D0C11] text-[#E0CFC0] rounded">
                    BETA
                  </span>
                )}
              </div>
              <button
                className="text-3xl text-[#3D0C11] hover:scale-110 transition-transform"
                aria-label={`Open ${task.label}`}
              >
                +
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4 mt-8">
          <div className="flex flex-row items-center">
            <span className="text-sm font-medium text-[#3D0C11] tracking-tight">A TOOL BY</span>
            <a 
              href={links.flickmanMedia}
              target="_blank" 
              rel="noopener noreferrer"
              className="-ml-0.5"
            >
              <img 
                src="/fm-logo.png" 
                alt="Flickman Media Logo" 
                className="h-9 md:h-11 translate-y-[2px] [filter:brightness(0)_saturate(100%)_invert(9%)_sepia(29%)_saturate(2614%)_hue-rotate(314deg)_brightness(94%)_contrast(97%)]" 
              />
            </a>
            <span className="text-sm font-medium text-[#3D0C11] tracking-tight translate-y-[2px] -ml-[8px]">.</span>
            <a 
              href={links.flickmanMedia}
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm font-bold text-[#3D0C11] tracking-tight ml-2 hover:text-[#3D0C11]/80 transition-colors"
            >
              <span className="underline">WORK WITH US</span>.
            </a>
          </div>
          <TrendingAudioButton dropboxLink={links.trendingAudios} />
        </div>
      </div>

      {selectedTask && (
        <TaskModal
          taskType={selectedTask}
          onClose={() => setSelectedTask(null)}
          onComplete={handleTaskComplete}
        />
      )}
    </main>
  )
} 