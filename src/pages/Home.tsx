import { useState } from 'react'
import { TaskType, TaskResult } from '@/types/tasks'
import { TaskModal } from '@/components/TaskModal'
import { ResultModal } from '@/components/ResultModal'

export default function Home() {
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null)
  const [result, setResult] = useState<TaskResult | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})

  const handleTaskSelect = (task: TaskType) => {
    setSelectedTask(task)
  }

  const tasks: { type: TaskType; label: string }[] = [
    { type: 'proposal', label: 'CONTENT PROPOSAL' },
    { type: 'outreach', label: 'OUTREACH MESSAGE' },
    { type: 'runOfShow', label: 'RUN OF SHOW' },
    { type: 'budget', label: 'PRODUCTION BUDGET' },
    { type: 'contractorBrief', label: 'CONTRACTOR BRIEF' },
    { type: 'timelineFromTranscript', label: 'TIMELINE FROM TRANSCRIPT' }
  ]

  return (
    <main className="min-h-screen flex flex-col items-center justify-between px-4 py-12 bg-[#E0CFC0]">
      <div className="w-full max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-12 text-[#3D0C11] tracking-tight">
          WHAT WOULD YOU LIKE TO CREATE?
        </h1>
        
        <div className="space-y-4">
          {tasks.map((task) => (
            <div 
              key={task.type}
              className="flex items-center justify-between border-b border-[#3D0C11] pb-4 group cursor-pointer"
              onClick={() => handleTaskSelect(task.type)}
            >
              <h2 className="text-xl md:text-2xl font-semibold text-[#3D0C11] tracking-tight">
                {task.label}
              </h2>
              <button
                className="text-3xl text-[#3D0C11] hover:scale-110 transition-transform"
                aria-label={`Open ${task.label}`}
              >
                +
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto flex flex-row items-center mt-12">
        <span className="text-sm font-medium text-[#3D0C11] tracking-tight">A TOOL BY</span>
        <img 
          src="/fm-logo.png" 
          alt="Flickman Media Logo" 
          className="h-9 md:h-11 -ml-0.5 translate-y-[2px] [filter:brightness(0)_saturate(100%)_invert(9%)_sepia(29%)_saturate(2614%)_hue-rotate(314deg)_brightness(94%)_contrast(97%)]" 
        />
        <span className="text-sm font-medium text-[#3D0C11] tracking-tight translate-y-[2px] -ml-[8px]">.</span>
        <a 
          href="https://www.flickman.media/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-sm font-bold text-[#3D0C11] tracking-tight ml-2 hover:text-[#3D0C11]/80 transition-colors"
        >
          <span className="underline">WORK WITH US</span>.
        </a>
      </div>

      {selectedTask && (
        <TaskModal
          taskType={selectedTask}
          onClose={() => setSelectedTask(null)}
          onComplete={(result, data) => {
            setResult(result)
            setFormData(data)
          }}
        />
      )}

      {result && (
        <ResultModal
          result={result}
          onClose={() => setResult(null)}
          formData={formData}
        />
      )}
    </main>
  )
} 