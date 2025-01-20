import { useState } from 'react'
import { TaskType, TaskResult } from '@/types/tasks'
import { taskConfigs } from '@/config/tasks'
import { systemPrompts, getUserPrompt } from '@/config/prompts'
import { DottedDialog } from '@/components/ui/dotted-dialog-wrapper'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/rainbow-toast'
import { createChatCompletion } from '@/services/openai'
import { getGoogleMapsLink, getWeatherData } from '@/services/location'
import { ResultModal } from './ResultModal'
import OpenAI from 'openai'
import { FormDataWithWeather } from '@/types/forms'

const testData: Record<TaskType, FormDataWithWeather> = {
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
    location: 'The Malin',
    address: '387 Park Ave South, 5th Floor, New York, NY 10016',
    shootDate: '2023-12-16',
    crewMembers: `Flickman, Nick Brady, Natalia Ohanesian, Lilah Beldner, Holly & Brian`,
    callTimes: `7:45 AM (call) / 5:00 PM (wrap)`,
    schedule: `7:15 AM - Sunrise
7:45 AM - Arrive on site
8:00 - 9:00 AM - Go up to Malin, build out cameras, Nick to start setting up interview setup, Flickman to shoot b-roll on gimbal during this time
9:00 - 10:00 AM - Sana Labs is having real meeting in board room — we will shoot this on gimbal (can shoot on both cams if Nick is done setting up lighting equipment)
10:00 - 11:00 AM - Clean the Sana Labs office, set up decor, start getting office b-roll if it's clean, detail shots
11:00 AM - 12:00 PM - Real meeting in Sana Labs office (shoot this on gimbal)
12:00 - 1:00 PM - Choreographed / specialty shots in Sana Labs office
1:00 - 2:00 PM - Lunch break
2:00 - 3:30 PM - Shoot interviews
3:30 - 5:00 PM - Additional b-roll and breakdown gear
5:00 PM - Wrap shoot
4:30 PM - Sunset`
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

We shouldn't cut between speakers too often, the minimum would be 10 seconds of a speaker before showing the next`
  }
}

export function TaskModal({
  taskType,
  onClose,
  onComplete,
}: {
  taskType: TaskType
  onClose: () => void
  onComplete: (result: TaskResult, formData: FormDataWithWeather) => void
}) {
  const [formData, setFormData] = useState<FormDataWithWeather>({})
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TaskResult | null>(null)
  const [selectedFileName, setSelectedFileName] = useState('')

  if (!taskType) return null
  const config = taskConfigs[taskType]

  const isFormValid = () => {
    return config.fields.every(field => {
      const value = formData[field.id]
      return typeof value === 'string' && value.trim().length > 0
    })
  }

  const handleFillTestData = async () => {
    if (taskType === 'timelineFromTranscript') {
      try {
        const response = await fetch('/sana-labs-transcript.txt')
        const transcriptContent = await response.text()
        setFormData({
          ...testData[taskType],
          transcriptFile: transcriptContent
        })
        setSelectedFileName('sana-labs-transcript.txt')
      } catch (error) {
        console.error('Failed to load transcript file:', error)
        toast.error('Failed to load transcript file')
        setFormData(testData[taskType])
      }
    } else {
      setFormData(testData[taskType])
    }
    toast.success('Test data filled')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const loadingToast = toast.loading('Generating content...')

    try {
      const updatedFormData: FormDataWithWeather = { ...formData }
      
      if (taskType === 'runOfShow' && typeof formData.address === 'string' && typeof formData.shootDate === 'string') {
        try {
          // Get Google Maps link
          const googleMapsLink = await getGoogleMapsLink(formData.address)
          updatedFormData.googleMapsLink = googleMapsLink

          // Try to get weather data, but use fallbacks if it fails
          try {
            console.log('Fetching weather data for:', formData.address)
            const weatherData = await getWeatherData(formData.address, formData.shootDate)
            updatedFormData.weather = weatherData
          } catch (weatherError) {
            console.error('Weather data error:', weatherError)
            toast.error('Using default sunrise/sunset times')
            // Use the values from our test data as fallbacks
            updatedFormData.weather = {
              sunrise: '7:15 AM',
              sunset: '4:30 PM',
              temperature: 45,
              conditions: 'partly cloudy',
              high: 50,
              low: 40
            }
          }
        } catch (error) {
          console.error('Error with location services:', error)
          // If Google Maps link fails, use a basic fallback
          updatedFormData.googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.address)}`
        }
      }

      setFormData(updatedFormData)

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content: systemPrompts[taskType]
        },
        {
          role: "user",
          content: getUserPrompt(taskType, updatedFormData)
        }
      ]

      const response = await createChatCompletion(messages)
      
      if (!response) {
        throw new Error('Failed to generate content')
      }

      onComplete({
        content: response.content || '',
        taskType,
      }, updatedFormData)
      
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
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-shrink-0 flex justify-end p-4 md:p-6 pb-4 border-b border-[#3D0C11]">
          <button
            type="button"
            onClick={handleFillTestData}
            className="text-sm text-[#3D0C11]/80 hover:text-[#3D0C11] hover:bg-[#3D0C11]/10 px-2 py-1 rounded-md transition-colors"
          >
            Fill Test Data
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6">
              <div className="space-y-4">
                {config.fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id} className="text-sm font-medium text-[#3D0C11]">
                      {field.label}
                    </Label>
                    {field.type === 'textarea' ? (
                      <textarea
                        id={field.id}
                        className="flex min-h-[100px] w-full rounded-md border border-[#3D0C11] bg-[#E0CFC0] px-3 py-2 text-sm text-[#3D0C11] placeholder:text-[#3D0C11]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D0C11] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder={field.placeholder}
                        value={typeof formData[field.id] === 'string' ? formData[field.id] as string : ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                      />
                    ) : field.type === 'file' ? (
                      <div className="relative">
                        <input
                          id={field.id}
                          type="file"
                          accept=".txt"
                          className="flex h-10 w-full rounded-md border border-[#3D0C11] bg-[#E0CFC0] px-3 py-2 text-sm text-[#3D0C11] placeholder:text-[#3D0C11]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D0C11] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setSelectedFileName(file.name)
                              const reader = new FileReader()
                              reader.onload = (event) => {
                                setFormData(prev => ({ ...prev, [field.id]: event.target?.result as string }))
                              }
                              reader.readAsText(file)
                            } else {
                              setSelectedFileName('')
                            }
                          }}
                        />
                        {selectedFileName && (
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-sm text-[#3D0C11]/70">
                            {selectedFileName}
                          </div>
                        )}
                      </div>
                    ) : (
                      <input
                        id={field.id}
                        type={field.type}
                        className="flex h-10 w-full rounded-md border border-[#3D0C11] bg-[#E0CFC0] px-3 py-2 text-sm text-[#3D0C11] placeholder:text-[#3D0C11]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D0C11] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder={field.placeholder}
                        value={typeof formData[field.id] === 'string' ? formData[field.id] as string : ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-[#3D0C11] bg-[#E0CFC0] p-4 md:p-6 mt-auto">
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-[#3D0C11] hover:text-[#3D0C11] bg-[#E0CFC0] border border-[#3D0C11] rounded-full hover:bg-[#3D0C11]/10 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-[#E0CFC0] bg-[#3D0C11] rounded-full hover:bg-[#3D0C11]/90 transition-colors disabled:opacity-50 disabled:hover:bg-[#3D0C11]"
                disabled={isLoading || !isFormValid()}
              >
                {isLoading ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </form>
      </div>
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