import { useState } from 'react'
import { TaskType } from '@/types/tasks'
import { taskConfigs } from '@/config/tasks'
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
    recipientName: 'Sarah Johnson',
    subject: 'Creative Production Partnership',
    company: 'InnovateMedia',
    role: 'Creative Director',
    keyPoints: 'Award-winning production team, past work with Fortune 500 companies, specialized in hybrid events'
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
      // Create a prompt that includes the form data
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content: taskType === 'outreach' 
            ? "You are an expert event production assistant helping to generate professional content for Flickman Media. For outreach messages, create a clean, professional email format using markdown. Use '##' for sections and avoid using asterisks (*) for formatting. Keep the formatting minimal and business-appropriate."
            : "You are an expert event production assistant helping to generate professional content for Flickman Media. Always format your responses in clean, well-structured markdown with appropriate headers, lists, and emphasis where needed."
        },
        {
          role: "user",
          content: taskType === 'outreach'
            ? `Please create a professional outreach email with the following details:
              
Recipient: ${formData.recipientName}
Subject: ${formData.subject}
Company: ${formData.company}
Role: ${formData.role}
Key Points: ${formData.keyPoints}

Format it as a proper business email with a clear subject line, greeting, body paragraphs highlighting our value proposition, and a clear call to action. Use markdown for basic structure but keep the formatting clean and minimal.`
            : `Please create a detailed ${taskType} with the following details:\n${Object.entries(formData)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n')}\n\nPlease format the response in markdown with appropriate sections, bullet points, and formatting.`
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
      <form onSubmit={handleSubmit} className="space-y-6 mt-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleFillTestData}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Fill Test Data
          </button>
        </div>
        {config.fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.label}</Label>
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
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <RainbowButton
            type="submit"
            className="w-full sm:w-auto h-10 px-4 py-2 text-sm font-medium disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate'}
          </RainbowButton>
        </div>
      </form>
    </DottedDialog>
  )
} 