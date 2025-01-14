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
    <main className="min-h-screen flex flex-col items-center pt-16 md:pt-32 pb-12 md:pb-24 bg-background">
      <div className="w-full max-w-[1200px] px-4 md:px-6 mx-auto flex flex-col items-center">
        <img 
          src="/src/assets/fm-turbo-logo.png" 
          alt="FM Turbo Logo" 
          className="h-16 md:h-24 mb-8 md:mb-16" 
        />
        <h2 className="text-3xl md:text-4xl font-medium text-center mb-12 md:mb-24 max-w-[800px] px-4">
          What would you like to create?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full max-w-3xl px-4">
          <RainbowButton 
            onClick={() => handleTaskSelect('proposal')}
            style={{ '--speed': '2.3s' } as React.CSSProperties}
            className="h-12 md:h-14 text-base md:text-lg"
          >
            Proposal
          </RainbowButton>
          <RainbowButton 
            onClick={() => handleTaskSelect('outreach')}
            style={{ '--speed': '3.1s' } as React.CSSProperties}
            className="h-12 md:h-14 text-base md:text-lg"
          >
            Outreach Message
          </RainbowButton>
          <RainbowButton 
            onClick={() => handleTaskSelect('runOfShow')}
            style={{ '--speed': '2.7s' } as React.CSSProperties}
            className="h-12 md:h-14 text-base md:text-lg"
          >
            Run of Show
          </RainbowButton>
          <RainbowButton 
            onClick={() => handleTaskSelect('followUp')}
            style={{ '--speed': '3.7s' } as React.CSSProperties}
            className="h-12 md:h-14 text-base md:text-lg"
          >
            Follow Up Sequence
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