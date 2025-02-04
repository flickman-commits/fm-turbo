import { useState } from 'react'
import { TaskType } from '@/types/tasks'
import { TaskModal } from '@/components/TaskModal'
import { links } from '@/config/links'
import { Layout } from '@/components/Layout'

export default function Home() {
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null)

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
        <h1 className="text-4xl md:text-7xl font-bold mb-12 text-black tracking-tight">
          What would you like to create today?
        </h1>
        
        <div className="space-y-4 mb-8">
          {tasks.map((task, index) => {
            // Alternate between the three accent colors
            const colors = ['#E94E1B', '#00A651', '#29ABE2']
            const colorIndex = index % 3
            const accentColor = colors[colorIndex]
            
            return (
              <div 
                key={task.type}
                className="flex items-center justify-between border-b border-black pb-4 group cursor-pointer hover:border-[var(--accent-color)]"
                onClick={() => handleTaskSelect(task.type)}
                style={{ '--accent-color': accentColor } as any}
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-black group-hover:text-[var(--accent-color)] transition-colors">
                    {task.label}
                  </h2>
                  {task.beta && (
                    <span className="px-1.5 py-0.5 text-xs font-medium bg-black text-[#F5F0E8] rounded">
                      BETA
                    </span>
                  )}
                </div>
                <button
                  className="text-3xl text-black hover:text-[var(--accent-color)] hover:scale-110 transition-all"
                  style={{ '--accent-color': accentColor } as any}
                  aria-label={`Open ${task.label}`}
                >
                  +
                </button>
              </div>
            )
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4">
          <div className="flex flex-row items-center">
            <span className="text-sm font-medium text-black tracking-tight">A TOOL BY</span>
            <a 
              href={links.flickmanMedia}
              target="_blank" 
              rel="noopener noreferrer"
              className="-ml-0.5"
            >
              <img 
                src="/fm-logo.png" 
                alt="Flickman Media Logo" 
                className="h-9 md:h-11 translate-y-[2px]" 
              />
            </a>
            <span className="text-sm font-medium text-black tracking-tight translate-y-[2px] -ml-[8px]">.</span>
            <a 
              href={links.flickmanMedia}
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm font-bold text-[#E94E1B] tracking-tight ml-2 hover:text-[#00A651] transition-colors"
            >
              <span className="underline">WORK WITH US</span>.
            </a>
          </div>
        </div>
      </div>

      {selectedTask && (
        <TaskModal
          taskType={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </Layout>
  )
} 