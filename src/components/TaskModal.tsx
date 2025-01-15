import { useState } from 'react'
import { TaskType, TaskResult } from '@/types/tasks'
import { taskConfigs } from '@/config/tasks'
import { systemPrompts, getUserPrompt } from '@/config/prompts'
import { DottedDialog } from '@/components/ui/dotted-dialog-wrapper'
import { Label } from '@/components/ui/label'
import { RainbowButton } from '@/components/ui/rainbow-button'
import { toast } from '@/components/ui/rainbow-toast'
import { createChatCompletion } from '@/services/openai'
import { ResultModal } from './ResultModal'
import OpenAI from 'openai'

const testData: Record<TaskType, Record<string, string>> = {
  contractorBrief: {
    contractorName: 'Nick',
    contractorEmail: 'nick@example.com',
    client: 'Evergreen Wealth',
    startDate: '2024-12-07',
    endDate: '2024-12-08',
    location: 'Miami, FL',
    pointOfContact: 'Matt Hickman',
    contactEmail: 'matt@flickmanmedia.com',
    contactPhone: '5039156104',
    schedule: `Saturday, December 7th (Shoot):
7:30 AM - Leave Crew Hotel & Uber to Studio
7:50 AM - Arrive at Studio
8:00 AM - We are let in to studio
9:30 AM-11 AM - First shot
11-1:30 PM - Film Tax Strategies
1:30 PM Lunch on location (PA to order on Uber Eats)
3:00 PM - 6:00 PM Shoot Miami cityscape location
7:00 PM Crew dinner. Make game plan for tomorrow — get some outdoor shots, more run and gun, delivering lines, run and gun

Sunday, December 8th - Miami, FL (Shoot):
6:56 AM - Sunrise
6:45 AM - Meet for Breakfast & Coffee
7:00 AM - Leave for Jack Daniel's HQ
7:30 AM - 9:30 AM Shoot for social on Day 2 — Shoot horizontal and cut vertical
1:30 PM Lunch on location or in Lynchburg
3:30 PM - 6:30 PM Shoot Miami cityscape location
7:00 PM Crew dinner
5:30 PM Sunset`,
    role: `Director of Photography (DP): You will be responsible for overseeing all the visual elements of the shoot. This includes setting up and operating camera equipment, framing and composing shots, selecting appropriate lenses, and managing lighting setups to achieve the desired aesthetic. You will work closely with the Matt and crew to ensure the visual style aligns with the creative vision of the project.`,
    dailyRate: '1500',
    numberOfDays: '2'
  },
  proposal: {
    projectType: 'Corporate Brand Video',
    clientName: 'TechCorp Inc.',
    deliveryDate: '2024-06-15',
    budget: '$50,000',
    requirements: 'Full video production setup, professional crew, and high-end equipment for corporate brand video'
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
  },
  timelineFromTranscript: {
    clientName: 'The Malin',
    purpose: 'Build brand awareness for Sana Labs as an innovative AI company and highlight the synergy between Sana Labs and The Malin through their shared appreciation for design.',
    length: '2-3 minutes',
    tone: 'Inspiring',
    additionalNotes: `I'm going to give you a transcript from some interviews we recorded - we recorded 4 different employees who work at Sana Labs, which is a company that creates two main AI products -

The four employees names are Timmy (his interview starts at 0 seconds), Velm (his interview starts at 7:14), Lisa (her interview starts at 17:54) and Nick (his interview starts at 30:45)

Each of them has a different perspective on working at Sana labs

The purpose of this video is to highlight that Sana Labs is an exciting new company that is doing big things in the world of AI, we also want to highlight how design-forward Sana Labs is and tie their scandanavian roots and love of design with their decision to work at the Malin (because the Malin is very design forward as well)

The general structure of the video is going to be as follows:
- Explaining what Sana Labs is and what they do
- talk about the excitement in AI, what they are excited about
- talk about how Sana labs is a very design forward company
- talk about why Sana labs chose to work at the Malin (using the design forward approach of the malin and sana labs as the segway into that section)

We shouldn't cut between speakers too often, the minimum would be 10 seconds of a speaker before showing the next`,
    transcriptFile: '/sana-labs-transcript.txt'
  }
}

export function TaskModal({
  taskType,
  onClose,
  onComplete,
}: {
  taskType: TaskType
  onClose: () => void
  onComplete: (result: TaskResult, formData: Record<string, string>) => void
}) {
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TaskResult | null>(null)

  if (!taskType) return null
  const config = taskConfigs[taskType]

  const isFormValid = () => {
    return config.fields.every(field => formData[field.id]?.trim())
  }

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
        taskType,
      }, formData)
      
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
        <div className="flex-shrink-0 flex justify-end p-4 md:p-6 pb-0">
          <button
            type="button"
            onClick={handleFillTestData}
            className="text-sm text-muted-foreground hover:text-foreground hover:bg-gray-100 px-2 py-1 rounded-md transition-colors"
          >
            Fill Test Data
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 md:p-6 pt-0">
            <div className="space-y-4">
              {config.fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id} className="text-sm font-medium">
                    {field.label}
                  </Label>
                  {field.type === 'textarea' ? (
                    <textarea
                      id={field.id}
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder={field.placeholder}
                      value={formData[field.id] || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                    />
                  ) : field.type === 'file' ? (
                    <input
                      id={field.id}
                      type="file"
                      accept=".txt"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = (event) => {
                            setFormData(prev => ({ ...prev, [field.id]: event.target?.result as string }))
                          }
                          reader.readAsText(file)
                        }
                      }}
                    />
                  ) : (
                    <input
                      id={field.id}
                      type={field.type}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder={field.placeholder}
                      value={formData[field.id] || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 border-t bg-white p-4 md:p-6">
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-2">
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
              disabled={isLoading || !isFormValid()}
            >
              {isLoading ? 'Generating...' : 'Generate'}
            </RainbowButton>
          </div>
        </div>
      </form>
      {result && (
        <ResultModal
          result={result}
          onClose={() => setResult(null)}
          formData={formData}
        />
      )}
    </DottedDialog>
  )
} 