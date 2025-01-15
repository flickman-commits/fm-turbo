import { useState } from 'react'
import { TaskType } from '@/types/tasks'
import { taskConfigs } from '@/config/tasks'
import { systemPrompts, getUserPrompt } from '@/config/prompts'
import { DottedDialog } from '@/components/ui/dotted-dialog-wrapper'
import { Label } from '@/components/ui/label'
import { RainbowButton } from '@/components/ui/rainbow-button'
import { toast } from '@/components/ui/rainbow-toast'
import { createChatCompletion } from '@/services/openai'
import OpenAI from 'openai'

interface TaskResult {
  content: string;
  error?: string;
  timestamp: number;
  taskType: TaskType;
}

const testData: Record<TaskType, Record<string, string>> = {
  proposal: {
    eventType: 'Corporate Conference',
    clientName: 'TechCorp Inc.',
    eventDate: '2024-06-15',
    attendees: '250',
    budget: '$50,000',
    requirements: 'Full AV setup, stage design, and hybrid streaming capabilities'
  },
  outreach: {
    recipientName: 'Linnea Schuessler',
    subject: 'Video Production Partnership for Huel',
    company: 'Huel',
    role: 'Creative Strategist',
    keyPoints: 'Experienced in brand storytelling, product launches, and social media content creation. Specialized in food & beverage industry video production.'
  },
  runOfShow: {
    eventName: 'Product Launch Summit',
    eventDate: '2024-05-20',
    venue: 'Metropolitan Convention Center',
    duration: '4 hours',
    keyMoments: 'Opening keynote, product demo, panel discussion, networking reception'
  },
  budget: {
    eventType: 'Corporate Brand Video',
    productionDays: '3',
    crewSize: '8',
    equipmentNeeds: 'RED Camera Package, Lighting Kit, Audio Package, Gimbal, Drone',
    editingHours: '40',
    profitMargin: '25',
    additionalCosts: 'Travel for crew, Equipment insurance, Location permits, Catering'
  }
}

interface TaskDialogProps {
  taskType: TaskType | null
  onClose: () => void
  onComplete: (result: TaskResult) => void
}

export function TaskDialog({ taskType, onClose, onComplete }: TaskDialogProps) {
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  if (!taskType) return null
  const config = taskConfigs[taskType]

  const handleFillTestData = () => {
    setFormData(testData[taskType])
    toast.success('Test data filled')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const loadingToast = toast.loading('Generating content...')

    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content: systemPrompts[taskType]
        },
        {
          role: "user",
          content: getUserPrompt(taskType, formData)
        }
      ]

      const response = await createChatCompletion(messages)
      
      if (!response) {
        throw new Error('Failed to generate content')
      }

      onComplete({
        content: response.content || '',
        timestamp: new Date().getTime(),
        taskType,
      })
      
      toast.dismiss(loadingToast)
      toast.success('Content generated successfully!')
      onClose()
    } catch (error) {
      console.error('Error generating content:', error)
      toast.dismiss(loadingToast)
      toast.error('Failed to generate content. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DottedDialog
      open={true}
      onOpenChange={onClose}
      title={config.title}
      description={config.description}
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="flex justify-end p-4 md:p-6 pb-0">
          <button
            type="button"
            onClick={handleFillTestData}
            className="text-sm text-muted-foreground hover:text-foreground hover:bg-gray-100 px-2 py-1 rounded-md transition-colors"
          >
            Fill Test Data
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="space-y-4">
            {config.fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id} className="text-sm font-medium">
                  {field.label}
                </Label>
                <input
                  id={field.id}
                  type={field.type}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder={field.placeholder}
                  value={formData[field.id] || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-2 p-4 md:p-6 pt-4 border-t flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            Cancel
          </button>
          <RainbowButton
            type="submit"
            className="w-full sm:w-auto justify-center"
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate'}
          </RainbowButton>
        </div>
      </form>
    </DottedDialog>
  )
} 