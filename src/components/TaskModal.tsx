import { useState, useEffect } from 'react'
import { TaskType, TaskResult, taskActionConfigs, TaskActionConfig } from '@/types/tasks'
import { taskConfigs } from '@/config/tasks'
import { systemPrompts, getUserPrompt } from '@/config/prompts'
import { DottedDialog } from '@/components/ui/dotted-dialog-wrapper'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/rainbow-toast'
import { createChatCompletion } from '@/services/openai'
import { getGoogleMapsLink, getWeatherData } from '@/services/location'
import { NotionButton } from '@/components/ui/notion-button'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import OpenAI from 'openai'
import { FormDataWithWeather } from '@/types/forms'

type ViewState = 'input' | 'loading' | 'result'

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
    discoveryTranscript: JSON.stringify({
      participants: {
        client: "Sarah Chen",
        role: "Head of Marketing",
        company: "TechCorp Inc.",
        interviewer: "Matt Flickman"
      },
      date: "2024-01-15",
      duration: "45 minutes",
      conversation: [
        {
          speaker: "client",
          text: "We're looking to create a series of videos that showcase our company culture and attract top talent."
        },
        {
          speaker: "interviewer",
          text: "That's great! Can you tell me more about what makes your company culture unique?"
        },
        {
          speaker: "client",
          text: "Well, we're a tech company but we have a really strong focus on work-life balance and professional development. We have flexible working hours, regular team building events, and a mentorship program. We also have a beautiful office space that we'd love to showcase."
        },
        {
          speaker: "interviewer",
          text: "Sounds perfect. What's your timeline looking like for this project?"
        },
        {
          speaker: "client",
          text: "We'd like to have this ready by mid-June as we're planning a big recruitment push in Q3. We're thinking maybe 2-3 videos, each around 2-3 minutes long."
        },
        {
          speaker: "interviewer",
          text: "And do you have any specific elements you'd like to highlight in these videos?"
        },
        {
          speaker: "client",
          text: "Yes, definitely want to show our team collaboration, our office space, maybe some interviews with current employees about why they love working here. We also have some unique perks like our rooftop garden and game room that would be great to feature."
        }
      ],
      keyPoints: [
        "Company culture focus",
        "Work-life balance",
        "Professional development",
        "Office space showcase",
        "Team collaboration",
        "Employee testimonials"
      ],
      timeline: {
        deadline: "2024-06-15",
        deliverables: "2-3 videos",
        videoDuration: "2-3 minutes each"
      }
    }, null, 2),
    requirements: 'Full video production setup, professional crew, and high-end equipment for corporate brand video'
  },
  outreach: {
    recipientName: 'Linnea Schuessler',
    subject: 'Video Production Partnership for Huel',
    company: 'Huel',
    role: 'Creative Strategist',
    familiarity: 'neverMet',
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

const BUSINESS_QUOTES = [
  "If you have < $10,000 saved up, don't buy crypto. Invest in the ability to make money. Then, you can restart the game as many times as you want.",
  "If you can't sit still, ignore notifications, and focus on one task for eight hours straight, never expect to build something great.",
  "If you can't explain why you believe what you believe, it's not your belief, it's someone else's.",
  "The only thing crazier than chasing your goals is expecting other people to understand them.",
  "The person who asks the most times gets the most. The problem is, people don't like being asked. So you have to give value consistently so you can earn the right to keep asking. Winners win because they take more shots on goal. But they only get those shots on goal because they know how to get into scoring position.",
  "If you want better clients, stop selling cheap stuff",
  "The best way to hit next year's goals is to not wait until next year to work on them.",
  "The best marketing is the kind that works.",
  "The reason it's taking so long is because you're in a rush.",
  "The cost of settling is higher than the price of ambition. You just pay it later."
]

const LoadingOverlay = () => {
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * BUSINESS_QUOTES.length))

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex(current => (current + 1) % BUSINESS_QUOTES.length)
    }, 7000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute inset-0 bg-[#F5F0E8] flex flex-col items-center justify-center z-50 p-8">
      <div className="w-12 h-12 border-4 border-black/20 border-t-black rounded-full animate-spin mb-4"></div>
      <p className="text-black text-lg font-medium text-center mb-12">
        Hold tight... Turbo is doing tedious work for you...
      </p>
      <div className="max-w-2xl w-full bg-black/5 border-2 border-black rounded-lg p-6">
        <p className="text-2xl font-bold text-black mb-3 text-left">💭 Words of Wisdom</p>
        <p className="text-lg text-black leading-relaxed">
          "{BUSINESS_QUOTES[quoteIndex]}"
        </p>
      </div>
    </div>
  )
}

export function TaskModal({
  taskType,
  onClose,
}: {
  taskType: TaskType
  onClose: () => void
}) {
  const [formData, setFormData] = useState<FormDataWithWeather>({})
  const [viewState, setViewState] = useState<ViewState>('input')
  const [result, setResult] = useState<TaskResult | null>(null)
  const [selectedFileName, setSelectedFileName] = useState('')
  const [isCopied, setIsCopied] = useState(false)

  if (!taskType) return null
  const config = taskConfigs[taskType]
  const isLoading = viewState === 'loading'

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
    setViewState('loading')

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

      const newResult = {
        content: response.content || '',
        taskType,
      }

      setResult(newResult)
      setViewState('result')
    } catch (error) {
      console.error('Error generating content:', error)
      toast.error('Failed to generate content. Please try again.')
      setViewState('input')
    }
  }

  const handleAction = (action: TaskActionConfig) => {
    switch (action.type) {
      case 'gmail':
        handleGmailCompose()
        break
      case 'notion':
        handleNotionDuplicate()
        break
      case 'copy':
        handleCopy()
        break
    }
  }

  const handleCopy = async () => {
    try {
      if (!result) return
      await navigator.clipboard.writeText(result.content)
      setIsCopied(true)
      toast.success('Content copied to clipboard!')
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy content')
    }
  }

  const handleGmailCompose = () => {
    try {
      if (!result) return
      // Format content for email using clean plain text
      const formattedContent = result.content
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/^# (.*?)$/gm, '\n$1\n')
        .replace(/^## (.*?)$/gm, '\n$1\n')
        .replace(/^### (.*?)$/gm, '\n$1\n')
        .replace(/^- (.*?)$/gm, '  • $1')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/^Subject:.*\n/m, '')

      let subject = ''
      const getValue = (key: string) => {
        const value = formData[key]
        return typeof value === 'string' ? value : ''
      }

      if (taskType === 'contractorBrief' && getValue('contractorEmail')) {
        subject = `Project Brief - ${getValue('client')}`
      } else if (taskType === 'runOfShow') {
        subject = `Run of Show - ${getValue('eventName')}`
      } else if (taskType === 'proposal') {
        subject = `Video Content Proposal - ${getValue('clientName')}`
      } else if (taskType === 'budget') {
        subject = `Production Budget - ${getValue('eventType')}`
      } else if (taskType === 'outreach') {
        subject = getValue('subject')
      } else {
        subject = `${taskType.charAt(0).toUpperCase() + taskType.slice(1)}`
      }

      const mailtoUrl = taskType === 'contractorBrief' && getValue('contractorEmail')
        ? `mailto:${getValue('contractorEmail')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(formattedContent)}`
        : `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(formattedContent)}`

      window.location.href = mailtoUrl
      toast.success('Opening email composer...')
    } catch (error) {
      console.error('Failed to prepare email:', error)
      toast.error('Failed to prepare email')
    }
  }

  const handleNotionDuplicate = async () => {
    try {
      if (!result) return
      await navigator.clipboard.writeText(result.content)
      window.location.href = 'notion://www.notion.so/new'
      toast.success('Opening Notion... Content copied to clipboard for pasting')
    } catch (error) {
      console.error('Failed to open Notion:', error)
      toast.error('Failed to open Notion')
    }
  }

  const markdownComponents: Components = {
    h1: (props) => <h1 className="text-2xl font-bold mb-4 text-black" {...props} />,
    h2: (props) => <h2 className="text-xl font-bold mb-3 text-black" {...props} />,
    p: ({ children, ...props }) => {
      if (typeof children === 'string') {
        if (children.includes('Weather Conditions:')) {
          const formattedContent = children
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\|(.*?)°F/g, '<span class="text-black">|$1°F</span>')
          return <p className="mb-2" dangerouslySetInnerHTML={{ __html: formattedContent }} />
        }
        if (children.includes('**') || children.includes('Yellow') || children.includes('Green') || children.includes('Orange') || children.includes('Blue')) {
          const formattedContent = children
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/Yellow/g, '<span class="text-[#E94E1B]">Yellow</span>')
            .replace(/Green/g, '<span class="text-[#29ABE2]">Green</span>')
            .replace(/Orange/g, '<span class="text-[#E94E1B]">Orange</span>')
            .replace(/Blue/g, '<span class="text-[#29ABE2]">Blue</span>')
          return <p className="mb-2" dangerouslySetInnerHTML={{ __html: formattedContent }} />
        }
      }
      return <p className="mb-2 text-black" {...props}>{children}</p>
    },
    ul: (props) => <ul className="list-disc pl-6 mb-4 text-black" {...props} />,
    li: ({ children, ...props }) => {
      if (typeof children === 'string' && (children.includes('**') || children.includes('Yellow') || children.includes('Green') || children.includes('Orange') || children.includes('Blue'))) {
        const formattedContent = children
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/Yellow/g, '<span class="text-[#E94E1B]">Yellow</span>')
          .replace(/Green/g, '<span class="text-[#29ABE2]">Green</span>')
          .replace(/Orange/g, '<span class="text-[#E94E1B]">Orange</span>')
          .replace(/Blue/g, '<span class="text-[#29ABE2]">Blue</span>')
        return <li className="mb-1" dangerouslySetInnerHTML={{ __html: formattedContent }} />
      }
      return <li className="mb-1 text-black" {...props}>{children}</li>
    },
    strong: (props) => <strong className="font-bold text-black" {...props} />,
    em: (props) => <em className="italic text-black" {...props} />,
    code: (props) => <code className="font-mono text-black" {...props} />,
    a: (props) => (
      <a
        className="text-black underline hover:text-[#29ABE2] transition-colors"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    )
  }

  const renderContent = () => {
    switch (viewState) {
      case 'loading':
        return <LoadingOverlay />
      case 'result':
        if (!result) return null
        const actions = taskActionConfigs[result.taskType] || []
        return (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 md:p-6">
                <div className="prose prose-sm max-w-none bg-[#F5F0E8] text-black prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-p:text-black prose-p:mb-4 prose-ul:list-disc prose-ul:pl-6 prose-li:mb-1 prose-pre:bg-black/5 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-code:text-black prose-code:bg-transparent prose-strong:font-bold">
                  {result.taskType === 'outreach' && formData.subject ? (
                    <>
                      <div className="mb-6">
                        <strong>Subject Line:</strong> {typeof formData.subject === 'string' ? formData.subject : ''}
                      </div>
                      <div>
                        <strong>Body:</strong>
                        <div className="mt-2">
                          <ReactMarkdown components={markdownComponents}>
                            {result.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </>
                  ) : (
                    <ReactMarkdown components={markdownComponents}>
                      {result.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 flex flex-col sm:flex-row justify-between gap-3 sm:gap-2 p-4 md:p-6 border-t border-black">
              <button
                onClick={() => setViewState('input')}
                className="inline-flex items-center justify-center h-[48px] px-6 py-2 text-base font-medium text-black bg-[#F5F0E8] hover:bg-[#29ABE2] hover:text-[#F5F0E8] border-2 border-black rounded-full transition-colors min-w-[100px]"
              >
                Back
              </button>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                {actions.map((action) => {
                  switch (action.type) {
                    case 'gmail':
                      return (
                        <button
                          key="gmail"
                          onClick={() => handleAction(action)}
                          className="inline-flex items-center justify-center h-[48px] px-8 py-2 text-sm font-medium text-black bg-[#F5F0E8] hover:bg-[#29ABE2] hover:text-[#F5F0E8] border-2 border-black rounded-full transition-colors min-w-[180px]"
                        >
                          <span className="flex items-center gap-2 whitespace-nowrap">
                            Compose in <img src="/gmail-icon.png" alt="Gmail" className="h-4 w-auto relative top-[1px]" />
                          </span>
                        </button>
                      )
                    case 'notion':
                      return (
                        <NotionButton
                          key="notion"
                          onClick={() => handleAction(action)}
                          className="text-black bg-[#F5F0E8] hover:bg-[#E94E1B] hover:text-[#F5F0E8] border-2 border-black min-w-[180px] text-sm whitespace-nowrap"
                        />
                      )
                    case 'copy':
                      return (
                        <button
                          key="copy"
                          onClick={() => handleAction(action)}
                          disabled={isCopied}
                          className="inline-flex items-center justify-center h-[48px] px-8 py-2 text-sm font-medium text-[#F5F0E8] bg-black hover:bg-[#29ABE2] rounded-full transition-colors disabled:opacity-50 min-w-[180px] whitespace-nowrap"
                        >
                          {isCopied ? 'Copied!' : action.label}
                        </button>
                      )
                    default:
                      return null
                  }
                })}
              </div>
            </div>
          </div>
        )
      case 'input':
        return (
          <>
            <div className="flex-shrink-0 flex justify-end p-4 md:p-6 pb-4 border-b border-black">
              <button
                type="button"
                onClick={handleFillTestData}
                className="text-sm text-black/80 hover:text-black hover:bg-[#29ABE2]/10 px-2 py-1 rounded-md transition-colors"
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
                        <Label htmlFor={field.id} className="text-sm font-medium text-black">
                          {field.label}
                        </Label>
                        {field.type === 'textarea' ? (
                          <textarea
                            id={field.id}
                            className="flex min-h-[100px] w-full rounded-md border border-black bg-[#F5F0E8] px-3 py-2 text-sm text-black placeholder:text-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#29ABE2] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder={field.placeholder}
                            value={typeof formData[field.id] === 'string' ? formData[field.id] as string : ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                          />
                        ) : field.type === 'file' ? (
                          <div className="space-y-2">
                            <div className="relative flex items-center">
                              <input
                                id={field.id}
                                type="file"
                                accept=".json"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    setSelectedFileName(file.name)
                                    const reader = new FileReader()
                                    reader.onload = (event) => {
                                      try {
                                        const jsonContent = JSON.parse(event.target?.result as string)
                                        const formattedJson = JSON.stringify(jsonContent, null, 2)
                                        setFormData(prev => ({ ...prev, [field.id]: formattedJson }))
                                      } catch (error) {
                                        console.error('Failed to parse JSON file:', error)
                                        toast.error('Invalid JSON file format')
                                      }
                                    }
                                    reader.readAsText(file)
                                  } else {
                                    setSelectedFileName('')
                                    setFormData(prev => ({ ...prev, [field.id]: '' }))
                                  }
                                }}
                              />
                              <div className="flex h-10 w-full rounded-md border border-black bg-[#F5F0E8] text-sm text-black">
                                <div className="flex items-center px-3 border-r border-black">
                                  Choose File
                                </div>
                                <div className="flex items-center px-3 flex-1">
                                  {selectedFileName || 'No file chosen'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : field.type === 'buttonSelect' ? (
                          <div className="flex items-center gap-2 p-1 bg-[#F5F0E8]/50 rounded-full border-2 border-black">
                            {field.options?.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                  formData[field.id] === option.value || (!formData[field.id] && option.default)
                                    ? 'bg-black text-[#F5F0E8]'
                                    : 'text-black hover:bg-[#29ABE2] hover:text-[#F5F0E8]'
                                }`}
                                onClick={() => setFormData(prev => ({ ...prev, [field.id]: option.value }))}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        ) : field.type === 'select' ? (
                          <select
                            id={field.id}
                            className="flex h-10 w-full rounded-md border border-black bg-[#F5F0E8] px-3 py-2 text-sm text-black placeholder:text-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#29ABE2] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={typeof formData[field.id] === 'string' ? formData[field.id] as string : field.options?.find(opt => opt.default)?.value || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                          >
                            {field.options?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            id={field.id}
                            type={field.type}
                            className="flex h-10 w-full rounded-md border border-black bg-[#F5F0E8] px-3 py-2 text-sm text-black placeholder:text-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#29ABE2] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

              <div className="flex-shrink-0 border-t border-black bg-[#F5F0E8] p-4 md:p-6 mt-auto">
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-black hover:text-[#F5F0E8] bg-[#F5F0E8] border-2 border-black rounded-full hover:bg-[#E94E1B] transition-colors disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-[#F5F0E8] bg-black hover:bg-[#29ABE2] rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-black"
                    disabled={isLoading || !isFormValid()}
                  >
                    {isLoading ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </div>
            </form>
          </>
        )
    }
  }

  return (
    <DottedDialog
      open={true}
      onOpenChange={onClose}
      title={viewState === 'result' && result ? `Your ${
        result.taskType === 'runOfShow' ? 'Run of Show' : 
        result.taskType === 'contractorBrief' ? 'Contractor Brief' :
        result.taskType.charAt(0).toUpperCase() + result.taskType.slice(1)
      }` : config.title}
      description={viewState === 'result' ? 'View and share your generated content' : config.description}
    >
      <div className="flex flex-col h-full overflow-hidden relative bg-[#F5F0E8]">
        {renderContent()}
      </div>
    </DottedDialog>
  )
} 