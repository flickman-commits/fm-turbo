import { useState, useEffect } from 'react'
import { TaskType, TaskResult } from '@/types/tasks'
import { taskConfigs } from '@/config/tasks'
import { TaskModal } from '@/components/TaskModal'
import { ResultModal } from '@/components/ResultModal'
import { RainbowButton } from '@/components/ui/rainbow-button'

const COLORS = [
  'text-[#FF1CF7]',
  'text-[#00FF00]',
  'text-[#00FFE0]',
  'text-[#FF8E00]',
  'text-[#00FF85]'
]

export default function Home() {
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null)
  const [result, setResult] = useState<TaskResult | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [colorIndex, setColorIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex(prev => (prev + 1) % COLORS.length)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleTaskSelect = (task: TaskType) => {
    setSelectedTask(task)
  }

  const handleTaskComplete = (result: TaskResult, data: Record<string, string>) => {
    setResult(result)
    setFormData(data)
  }

  return (
    <main className="h-screen flex flex-col items-center justify-center fixed inset-0 bg-background md:translate-y-12 -translate-y-[5%]">
      <div className="w-full max-w-[1200px] px-4 md:px-6 mx-auto flex flex-col items-center">
        <div className="flex flex-col items-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-semibold text-center tracking-tight whitespace-nowrap animate-fade-in animation-delay-200">
            What would you like to
          </h2>
          <div className={`text-6xl md:text-7xl font-semibold text-center tracking-tight whitespace-nowrap transition-all duration-300 ${COLORS[colorIndex]}`}>
            CREATE
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full max-w-3xl px-4 mb-12 mt-8">
          <RainbowButton 
            onClick={() => handleTaskSelect('proposal')}
            style={{ '--speed': '2.3s' } as React.CSSProperties}
            className="h-12 md:h-14 text-base md:text-lg animate-fade-in-up animation-delay-300"
          >
            Content Proposal
          </RainbowButton>
          <RainbowButton 
            onClick={() => handleTaskSelect('outreach')}
            style={{ '--speed': '3.1s' } as React.CSSProperties}
            className="h-12 md:h-14 text-base md:text-lg animate-fade-in-up animation-delay-400"
          >
            Outreach Message
          </RainbowButton>
          <RainbowButton 
            onClick={() => handleTaskSelect('runOfShow')}
            style={{ '--speed': '2.7s' } as React.CSSProperties}
            className="h-12 md:h-14 text-base md:text-lg animate-fade-in-up animation-delay-500"
          >
            Run of Show
          </RainbowButton>
          <RainbowButton 
            onClick={() => handleTaskSelect('budget')}
            style={{ '--speed': '3.7s' } as React.CSSProperties}
            className="h-12 md:h-14 text-base md:text-lg animate-fade-in-up animation-delay-600"
          >
            Production Budget
          </RainbowButton>
          <RainbowButton 
            onClick={() => handleTaskSelect('contractorBrief')}
            style={{ '--speed': '2.9s' } as React.CSSProperties}
            className="h-12 md:h-14 text-base md:text-lg animate-fade-in-up animation-delay-700"
          >
            Contractor Brief Email
          </RainbowButton>
        </div>
        <div className="relative h-16 md:h-36 w-full flex justify-center">
          <img 
            src="/fm-logo.png" 
            alt="Flickman Media Logo" 
            className="h-16 md:h-20 animate-fade-in absolute" 
          />
          <img 
            src="/turbo.png" 
            alt="Turbo" 
            className="h-16 md:h-20 absolute animate-slide-in" 
          />
        </div>
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