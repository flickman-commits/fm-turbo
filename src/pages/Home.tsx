import { useState } from 'react'
import { TaskType, TaskResult } from '@/types/tasks'
import { RainbowButton } from '@/components/ui/rainbow-button'
import { TaskDialog } from '@/components/TaskDialog'
import { ResultDisplay } from '@/components/ResultDisplay'

export default function Home() {
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null)
  const [result, setResult] = useState<TaskResult | null>(null)

  const handleTaskSelect = (task: TaskType) => {
    setSelectedTask(task)
  }

  const handleTaskComplete = (result: TaskResult) => {
    setResult(result)
  }

  return (
    <main className="min-h-screen flex flex-col items-center pt-24 md:pt-32 pb-12 md:pb-24 bg-background">
      <div className="w-full max-w-[1200px] px-4 md:px-6 mx-auto flex flex-col items-center">
        <div className="relative h-20 md:h-48 mb-12 md:mb-16 w-full flex justify-center">
          <img 
            src="/fm-logo.png" 
            alt="Flickman Media Logo" 
            className="h-20 md:h-48 animate-fade-in absolute" 
          />
          <img 
            src="/turbo.png" 
            alt="Turbo" 
            className="h-20 md:h-48 absolute animate-slide-in" 
          />
        </div>
        <h2 className="text-3xl md:text-4xl font-medium text-center mb-6 md:mb-8 max-w-[800px] px-4 animate-fade-in animation-delay-200">
          What would you like to create?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full max-w-3xl px-4">
          <RainbowButton 
            onClick={() => handleTaskSelect('proposal')}
            style={{ '--speed': '2.3s' } as React.CSSProperties}
            className="h-12 md:h-14 text-base md:text-lg animate-fade-in-up animation-delay-300"
          >
            Proposal
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
        </div>
      </div>

      {selectedTask && (
        <TaskDialog
          taskType={selectedTask}
          onClose={() => setSelectedTask(null)}
          onComplete={handleTaskComplete}
        />
      )}

      {result && (
        <ResultDisplay
          result={result}
          onClose={() => setResult(null)}
        />
      )}
    </main>
  )
} 