import { useState, useEffect } from 'react'
import { TaskType, TaskResult, taskActionConfigs, TaskActionConfig } from '@/types/tasks'
import { taskConfigs, FormField } from '@/config/tasks'
import { getSystemPrompts, getUserPrompt, getUserInfoFromProfile } from '@/config/prompts'
import { DottedDialog } from '@/components/ui/dotted-dialog-wrapper'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/rainbow-toast'
import { createChatCompletion } from '@/services/openai'
import { NotionButton } from '@/components/ui/notion-button'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import OpenAI from 'openai'
import { FormDataWithWeather, Video } from '@/types/forms'
import { creditsManager } from '@/utils/credits'
import { useUser } from '@/contexts/UserContext'
import { PortfolioVideoSelector } from '@/components/PortfolioVideoSelector'
import { links } from '@/config/links'
import { queryPerplexity } from '@/services/perplexity'
import { getOutreachSystemPrompt } from '@/config/outreachPrompt'
import { useCompanyInfo } from '@/contexts/CompanyInfoContext'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingOverlay } from '@/components/ui/loading-overlay'

type ViewState = 'input' | 'loading' | 'result'

const testData: Record<TaskType, FormDataWithWeather> = {
  contractorBrief: {
    contractorName: 'John Smith',
    contractorEmail: 'john@example.com',
    client: 'Acme Corp',
    startDate: '2023-12-15',
    endDate: '2023-12-16',
    location: 'New York City',
    pointOfContact: 'Jane Doe',
    contactEmail: 'jane@example.com',
    contactPhone: '555-0123',
    schedule: '9am - Setup\n10am - Filming\n12pm - Lunch\n1pm - More filming\n5pm - Wrap',
    role: 'Camera Operator',
    deliverables: 'Raw footage, color graded final cut',
    dailyRate: '500',
    numberOfDays: '2'
  },
  proposal: {
    projectType: 'Brand Story Video',
    clientName: 'Acme Corp',
    timelineInfo: 'Final video needed by end of Q1 2024',
    budget: '$20,000 - $30,000',
    additionalNotes: 'Looking for a cinematic feel with interviews and b-roll'
  },
  outreach: {
    recipientName: 'Tim Cook',
    company: 'Apple',
    familiarity: 'neverMet',
    keyPointsToEmphasize: 'talk about how you saw their new ads in NYC and they got you inspired'
  },
  runOfShow: {
    location: 'Empire State Building',
    address: '350 5th Ave, New York, NY 10118',
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
    clientName: 'Outbound Hotels',
    purpose: "We're creating an investor video that's supposed to explain all of the different parts of Outbound Hotels, how the company came to be, and also why it's so great",
    length: '3 minutes max',
    tone: 'uplifting, fun',
    additionalNotes: 'There are 4 different speakers and they all need to have a section of talking'
  }
}

const ViewState: Record<'Input' | 'Loading' | 'Result', ViewState> = {
  Input: 'input',
  Loading: 'loading',
  Result: 'result'
}

export function TaskModal({
  taskType,
  onClose,
}: {
  taskType: TaskType
  onClose: () => void
}) {
  const { user } = useUser()
  const { isInfoSaved } = useCompanyInfo()
  const { session, incrementTasksUsed } = useAuth()
  const [formData, setFormData] = useState<FormDataWithWeather>({})
  const [viewState, setViewState] = useState<ViewState>('input')
  const [result, setResult] = useState<TaskResult | null>(null)
  const [selectedFileName, setSelectedFileName] = useState('')
  const [copiedButtons, setCopiedButtons] = useState<Record<string, boolean>>({})

  if (!taskType) return null
  const config = taskConfigs[taskType]
  const isLoading = viewState === ViewState.Loading

  const isFieldRequired = (field: FormField) => {
    // Special case for file inputs - if they're marked as optional, they're never required
    if (field.type === 'file' && field.optional) {
      return false;
    }
    
    if (field.optional) {
      const [dependentField, value] = field.optional.split('=')
      return formData[dependentField] !== value
    }
    return true
  }

  const isFormValid = () => {
    return config.fields.every(field => {
      // Skip validation for hidden fields
      if (field.showIf) {
        const [dependentField, value] = field.showIf.split('=')
        if (formData[dependentField] !== value) {
          return true
        }
      }

      // Skip validation for optional fields
      if (field.type === 'file' && field.optional) {
        return true;
      }

      if (field.optional) {
        const [dependentField, value] = field.optional.split('=')
        if (formData[dependentField] === value) {
          return true
        }
      }

      const value = formData[field.id]
      return typeof value === 'string' && value.trim().length > 0
    })
  }

  const shouldShowField = (field: FormField) => {
    if (!field.showIf) return true
    const [dependentField, value] = field.showIf.split('=')
    return formData[dependentField] === value
  }

  const handleFillTestData = async () => {
    if (taskType === 'timelineFromTranscript') {
      try {
        const response = await fetch('/outbound-transcript.txt')
        if (!response.ok) {
          throw new Error('Failed to fetch transcript file')
        }
        const transcriptContent = await response.text()
        
        // Create a File object from the content
        const file = new File(
          [transcriptContent],
          'outbound-transcript.txt',
          { type: 'text/plain' }
        )
        
        // Create a DataTransfer object to simulate a file input
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        
        // Find the file input element and set its files
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
        if (fileInput) {
          fileInput.files = dataTransfer.files
        }

        setFormData({
          ...testData[taskType],
          transcriptFile: transcriptContent
        })
        setSelectedFileName('outbound-transcript.txt')
      } catch (error) {
        console.error('Failed to load transcript file:', error)
        toast.error('Failed to load transcript file')
      }
    } else if (taskType === 'proposal') {
      try {
        const response = await fetch('/discovery-call-transcript.json')
        if (!response.ok) {
          throw new Error('Failed to fetch discovery call transcript')
        }
        const transcriptContent = await response.text()
        
        // Create a File object from the content
        const file = new File(
          [transcriptContent],
          'discovery-call-transcript.json',
          { type: 'application/json' }
        )
        
        // Create a DataTransfer object to simulate a file input
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        
        // Find the file input element and set its files
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
        if (fileInput) {
          fileInput.files = dataTransfer.files
        }

        setFormData({
          ...testData[taskType],
          discoveryTranscript: transcriptContent
        })
        setSelectedFileName('discovery-call-transcript.json')
      } catch (error) {
        console.error('Failed to load discovery call transcript:', error)
        toast.error('Failed to load discovery call transcript')
      }
    } else {
      setFormData({
        ...testData[taskType],
        familiarity: 'neverMet',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid()) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const credits = await creditsManager.getCredits()
      if (credits <= 0) {
        toast.error('No credits remaining')
        return
      }

      setViewState(ViewState.Loading)

      // Get user info for prompts
      const userInfo = session?.user?.id ? await getUserInfoFromProfile(session.user.id) : null

      const updatedFormData: FormDataWithWeather = { ...formData }
      
      if (taskType === 'outreach' && typeof formData.recipientName === 'string' && typeof formData.company === 'string') {
        console.log('Initiating Perplexity API call for:', formData.recipientName, formData.company)
        try {
          const research = await queryPerplexity(formData.recipientName, formData.company)
          updatedFormData.perplexityResearch = String(research)
          console.log('Perplexity research result:', research)
        } catch (error) {
          console.error('Perplexity research error:', error)
          updatedFormData.perplexityResearch = "Couldn't find any relevant data"
        }
      }

      console.log('Preparing to send request to OpenAI with updated form data:', updatedFormData)

      if (!userInfo) {
        toast.error('User information is required. Please complete your profile.')
        setViewState(ViewState.Input)
        return
      }

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = taskType === 'outreach' ? [
        {
          role: "system",
          content: getOutreachSystemPrompt(userInfo)
        },
        {
          role: "user",
          content: getUserPrompt(taskType, updatedFormData, userInfo)
        }
      ] : [
        {
          role: "system",
          content: getSystemPrompts(taskType, userInfo)
        },
        {
          role: "user",
          content: getUserPrompt(taskType, updatedFormData, userInfo)
        }
      ]

      console.log('OpenAI API system prompt:', getSystemPrompts(taskType, userInfo))
      console.log('OpenAI API user prompt:', getUserPrompt(taskType, updatedFormData, userInfo))

      const response = await createChatCompletion(messages)
      
      if (!response || !response.content) {
        throw new Error('Failed to generate content')
      }

      console.log('Received response from OpenAI:', response)

      creditsManager.useCredit()

      let content = response.content
      
      // Parse JSON response for timeline from transcript
      if (taskType === 'timelineFromTranscript' && content) {
        try {
          const jsonData = JSON.parse(content)
          content = `# Timeline Overview
${jsonData.overview}

# Selected Segments

${jsonData.segments.map((segment: any, index: number) => `
### Segment ${index + 1}
- **Time in Final Video:** ${segment.startTimecode} - ${segment.endTimecode}
- **Source Timecode:** ${segment.sourceStartTimecode} - ${segment.sourceEndTimecode}
- **Speaker:** ${segment.speaker} (${segment.speakerColor})
- **Content:** "${segment.content}"
- **Duration:** ${segment.duration}s
- **Rationale:** ${segment.rationale}
`).join('\n')}

# Total Run Time
${jsonData.totalRunTime}

# Editing Notes and Recommendations
${jsonData.editingNotes.map((note: string) => `- ${note}`).join('\n')}
`
        } catch (error) {
          console.error('Error parsing timeline JSON:', error)
          toast.error('Error parsing timeline data')
          content = response.content
        }
      }

      const newResult = {
        content,
        taskType,
        research: String(updatedFormData.perplexityResearch || '')
      }
      
      setResult(newResult)
      setViewState(ViewState.Result)
      await incrementTasksUsed()
    } catch (error) {
      console.error('Error generating content:', error)
      toast.error('Failed to generate content. Please try again.')
      setViewState(ViewState.Input)
      setResult(null)
    }
  }

  const handleRegenerate = async () => {
    try {
      const credits = await creditsManager.getCredits()
      if (credits <= 0) {
        toast.error('No credits remaining')
        return
      }

      setViewState(ViewState.Loading)

      // Get user info for prompts
      const userInfo = session?.user?.id ? await getUserInfoFromProfile(session.user.id) : null

      const updatedFormData: FormDataWithWeather = { ...formData }
      
      if (taskType === 'outreach' && typeof formData.recipientName === 'string' && typeof formData.company === 'string') {
        console.log('Initiating Perplexity API call for:', formData.recipientName, formData.company)
        try {
          const research = await queryPerplexity(formData.recipientName, formData.company)
          updatedFormData.perplexityResearch = String(research)
          console.log('Perplexity research result:', research)
        } catch (error) {
          console.error('Perplexity research error:', error)
          updatedFormData.perplexityResearch = "Couldn't find any relevant data"
        }
      }

      console.log('Preparing to send request to OpenAI with updated form data:', updatedFormData)

      if (!userInfo) {
        toast.error('User information is required. Please complete your profile.')
        setViewState(ViewState.Result)
        return
      }

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = taskType === 'outreach' ? [
        {
          role: "system",
          content: getOutreachSystemPrompt(userInfo)
        },
        {
          role: "user",
          content: getUserPrompt(taskType, updatedFormData, userInfo)
        }
      ] : [
        {
          role: "system",
          content: getSystemPrompts(taskType, userInfo)
        },
        {
          role: "user",
          content: getUserPrompt(taskType, updatedFormData, userInfo)
        }
      ];
      
      const response = await createChatCompletion(messages);
      
      if (!response) {
        throw new Error('Failed to generate content');
      }
      
      creditsManager.useCredit();
      
      const newResult = {
        content: response.content || '',
        taskType,
        research: String(updatedFormData.perplexityResearch || '')
      };
      
      setResult(newResult);
      setViewState(ViewState.Result);
    } catch (error) {
      console.error('Error regenerating content:', error);
      setViewState(ViewState.Result);
      toast.error('Failed to regenerate content');
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (isFormValid() && !isLoading && isInfoSaved) {
          const form = document.querySelector('form')
          if (form) {
            e.preventDefault()
            form.requestSubmit()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFormValid, isLoading, isInfoSaved])

  const handleAction = async (action: TaskActionConfig) => {
    if (action.type === 'download') {
      window.open(links.trendingAudios, '_blank', 'noopener,noreferrer')
      return
    }
    switch (action.type) {
      case 'gmail':
        handleGmailCompose()
        break
      case 'notion':
        handleNotionDuplicate()
        break
      case 'copy':
        handleCopy(action.label)
        break
    }
  }

  const handleCopy = async (buttonLabel: string) => {
    try {
      if (!result) return
      await navigator.clipboard.writeText(result.content)
      setCopiedButtons(prev => ({ ...prev, [buttonLabel]: true }))
      toast.success('Content copied to clipboard!')
      setTimeout(() => {
        setCopiedButtons(prev => ({ ...prev, [buttonLabel]: false }))
      }, 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy content')
    }
  }

  const handleGmailCompose = () => {
    try {
      if (!result) return

      const getValue = (key: string) => {
        const value = formData[key]
        return typeof value === 'string' ? value : ''
      }

      // Extract subject line for outreach tasks
      let subject = ''
      if (taskType === 'outreach') {
        const subjectMatch = result.content.match(/^Subject: (.+)$/m)
        subject = subjectMatch ? subjectMatch[1] : ''
      }

      // Format content for email using clean plain text
      const formattedContent = result.content
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/^# (.*?)$/gm, '\n$1\n')
        .replace(/^## (.*?)$/gm, '\n$1\n')
        .replace(/^### (.*?)$/gm, '\n$1\n')
        .replace(/^- (.*?)$/gm, '  • $1')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/^Subject:.*\n/m, '') // Remove subject line from body

      // Set subject based on task type
      if (!subject) {
        if (taskType === 'contractorBrief' && getValue('contractorEmail')) {
          subject = `Project Brief - ${getValue('client')}`
        } else if (taskType === 'runOfShow') {
          subject = `Run of Show - ${getValue('eventName')}`
        } else if (taskType === 'proposal') {
          subject = `Video Content Proposal - ${getValue('clientName')}`
        } else if (taskType === 'budget') {
          subject = `Production Budget - ${getValue('eventType')}`
        } else {
          subject = `${taskType.charAt(0).toUpperCase() + taskType.slice(1)}`
        }
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

  const handleFieldChange = (fieldId: string, value: string | Video[]) => {
    if (Array.isArray(value)) {
      // Handle Video[] type
      setFormData(prev => ({
        ...prev,
        [fieldId]: value as Video[]
      }))
    } else {
      // Handle string type
      setFormData(prev => ({
        ...prev,
        [fieldId]: value
      }))
    }
  }

  const markdownComponents: Components = {
    h1: (props) => <h1 className="text-2xl font-bold mb-4 text-turbo-black" {...props} />,
    h2: (props) => <h2 className="text-xl font-bold mb-3 text-turbo-black" {...props} />,
    p: ({ children, ...props }) => {
      if (typeof children === 'string') {
        if (children.includes('Weather Conditions:')) {
          const formattedContent = children
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\|(.*?)°F/g, '<span class="text-turbo-black">|$1°F</span>')
          return <p className="mb-2" dangerouslySetInnerHTML={{ __html: formattedContent }} />
        }
        if (children.includes('**') || children.includes('Yellow') || children.includes('Green') || children.includes('Orange') || children.includes('Blue')) {
          const formattedContent = children
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/Yellow/g, '<span class="text-turbo-blue">Yellow</span>')
            .replace(/Green/g, '<span class="text-turbo-green">Green</span>')
            .replace(/Orange/g, '<span class="text-turbo-blue">Orange</span>')
            .replace(/Blue/g, '<span class="text-turbo-blue">Blue</span>')
          return <p className="mb-2" dangerouslySetInnerHTML={{ __html: formattedContent }} />
        }
      }
      return <p className="mb-2 text-turbo-black" {...props}>{children}</p>
    },
    ul: (props) => <ul className="list-disc pl-6 mb-4 text-turbo-black" {...props} />,
    li: ({ children, ...props }) => {
      if (typeof children === 'string' && (children.includes('**') || children.includes('Yellow') || children.includes('Green') || children.includes('Orange') || children.includes('Blue'))) {
        const formattedContent = children
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/Yellow/g, '<span class="text-turbo-blue">Yellow</span>')
          .replace(/Green/g, '<span class="text-turbo-green">Green</span>')
          .replace(/Orange/g, '<span class="text-turbo-blue">Orange</span>')
          .replace(/Blue/g, '<span class="text-turbo-blue">Blue</span>')
        return <li className="mb-1" dangerouslySetInnerHTML={{ __html: formattedContent }} />
      }
      return <li className="mb-1 text-turbo-black" {...props}>{children}</li>
    },
    strong: (props) => <strong className="font-bold text-turbo-black" {...props} />,
    em: (props) => <em className="italic text-turbo-black" {...props} />,
    code: (props) => <code className="font-mono text-turbo-black" {...props} />,
    a: (props) => (
      <a
        className="text-turbo-black underline hover:text-turbo-blue transition-colors"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    )
  }

  const getTaskTitle = () => {
    switch (taskType) {
      case 'proposal':
        return 'Content Proposal'
      case 'outreach':
        return 'Outreach Message'
      case 'runOfShow':
        return 'Run of Show'
      case 'budget':
        return 'Production Budget'
      case 'contractorBrief':
        return 'Contractor Brief'
      case 'timelineFromTranscript':
        return 'Timeline from Transcript'
      default:
        return ''
    }
  }

  const renderContent = () => {
    switch (viewState) {
      case ViewState.Result:
        if (!result) return null

        const formattedMessage = result.content
        const formattedResearch = result.research || ''

        return (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 md:p-6">
                <div className="prose prose-sm max-w-none bg-turbo-beige text-turbo-black prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-p:text-turbo-black prose-p:mb-4 prose-ul:list-disc prose-ul:pl-6 prose-li:mb-1 prose-pre:bg-turbo-black/5 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-code:text-turbo-black prose-code:bg-transparent prose-strong:font-bold">
                  {(taskConfigs[result.taskType].resultSections?.length ?? 0) > 0 ? (
                    taskConfigs[result.taskType].resultSections?.map((section, index) => {
                      const content = section.contentKey === 'research' ? formattedResearch : formattedMessage;
                      return (
                        <div key={`${section.id}-${index}`}>
                          <ReactMarkdown components={markdownComponents}>
                            {content}
                          </ReactMarkdown>
                        </div>
                      );
                    })
                  ) : (
                    <ReactMarkdown components={markdownComponents}>
                      {formattedMessage}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 flex flex-col sm:flex-row justify-between gap-3 sm:gap-2 p-4 md:p-6 border-t border-turbo-black">
              <button
                onClick={handleRegenerate}
                className="inline-flex items-center justify-center h-[48px] px-6 py-2 text-base font-medium text-turbo-beige bg-turbo-black hover:bg-turbo-blue hover:text-turbo-beige border-2 border-turbo-black rounded-full transition-colors min-w-[100px]"
              >
                Regenerate
              </button>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                {taskActionConfigs[result.taskType]?.map((action) => {
                  switch (action.type) {
                    case 'gmail':
                      return (
                        <button
                          key="gmail"
                          onClick={() => handleAction(action)}
                          className="inline-flex items-center justify-center h-[48px] px-8 py-2 text-sm font-medium text-turbo-black bg-turbo-beige hover:bg-turbo-blue hover:text-turbo-white border-2 border-turbo-black rounded-full transition-colors min-w-[180px]"
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
                          className="text-turbo-black bg-turbo-beige hover:bg-turbo-blue hover:text-turbo-white border-2 border-turbo-black min-w-[180px] text-sm whitespace-nowrap"
                        />
                      )
                    case 'copy':
                      return (
                        <button
                          key="copy"
                          onClick={() => handleAction(action)}
                          disabled={copiedButtons[action.label]}
                          className="inline-flex items-center justify-center h-[48px] px-8 py-2 text-sm font-medium text-turbo-beige bg-turbo-black hover:bg-turbo-blue rounded-full transition-colors disabled:opacity-50 min-w-[180px] whitespace-nowrap"
                        >
                          {copiedButtons[action.label] ? 'Copied!' : action.label}
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
      case ViewState.Input:
        return (
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 md:p-6">
                <div className="space-y-4">
                  {config.fields.map((field) => (
                    shouldShowField(field) && (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id} className="text-sm font-medium text-turbo-black">
                          {field.label}
                          {isFieldRequired(field) && <span className="text-[#E94E1B] ml-1">*</span>}
                          {field.helpLink && (
                            <a
                              href={field.helpLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-turbo-blue hover:text-turbo-blue/80 text-sm font-medium transition-colors"
                            >
                              ({field.helpText})
                            </a>
                          )}
                        </Label>
                        {field.type === 'portfolioSelector' ? (
                          <div className="space-y-2">
                            <Label htmlFor={field.id}>{field.label}</Label>
                            {user ? (
                              <PortfolioVideoSelector
                                projectType={formData.projectType as string || ''}
                                userId={user.id}
                                onSelect={(videos) => handleFieldChange(field.id, videos)}
                              />
                            ) : (
                              <div className="text-center py-6 text-turbo-black/60">
                                Please sign in to include portfolio videos in your proposal
                              </div>
                            )}
                          </div>
                        ) : field.type === 'textarea' ? (
                          <textarea
                            id={field.id}
                            className="flex min-h-[100px] w-full rounded-md border border-turbo-black bg-turbo-beige px-3 py-2 text-base text-turbo-black placeholder:text-turbo-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-turbo-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder={field.placeholder}
                            value={typeof formData[field.id] === 'string' ? formData[field.id] as string : ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            required={isFieldRequired(field)}
                            enterKeyHint="next"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                const inputs = Array.from(document.querySelectorAll('input:not([type="file"]), textarea, select'));
                                const currentIndex = inputs.indexOf(e.target as HTMLElement);
                                const nextInput = inputs[currentIndex + 1] as HTMLElement;
                                if (nextInput) {
                                  nextInput.focus();
                                } else {
                                  // If it's the last field and form is valid, submit
                                  if (isFormValid()) {
                                    const form = document.querySelector('form');
                                    form?.requestSubmit();
                                  }
                                }
                              }
                            }}
                          />
                        ) : field.type === 'file' ? (
                          <div className="space-y-2">
                            <div className="relative flex items-center">
                              <input
                                type="file"
                                id={field.id}
                                accept={field.accept}
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    const reader = new FileReader()
                                    reader.onload = (e) => {
                                      handleFieldChange(field.id, typeof e.target?.result === 'string' ? e.target.result : '')
                                    }
                                    setSelectedFileName(file.name)
                                    reader.readAsText(file)
                                  }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                required={isFieldRequired(field)}
                              />
                              <div className="flex h-10 w-full rounded-md border border-turbo-black bg-turbo-beige text-sm text-turbo-black">
                                <div className="flex items-center px-3 border-r border-turbo-black">
                                  Choose File
                                </div>
                                <div className="flex items-center px-3 flex-1">
                                  {selectedFileName || 'No file chosen'}
                                </div>
                              </div>
                            </div>
                            {taskType === 'proposal' && field.id === 'discoveryTranscript' && (
                              <p className="text-sm text-turbo-black/50">
                                Please upload a JSON file containing the discovery call transcript. The file should include participant information, conversation details, and key points.
                              </p>
                            )}
                          </div>
                        ) : field.type === 'buttonSelect' ? (
                          <div className="flex items-center gap-2 p-1 bg-turbo-beige/50 rounded-full border-2 border-turbo-black">
                            {field.options?.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                  formData[field.id] === option.value || (!formData[field.id] && option.default)
                                    ? 'bg-turbo-black text-turbo-beige'
                                    : 'text-turbo-black hover:bg-turbo-blue hover:text-turbo-beige'
                                }`}
                                onClick={() => handleFieldChange(field.id, option.value)}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        ) : field.type === 'select' ? (
                          <select
                            id={field.id}
                            className="flex h-10 w-full rounded-md border border-turbo-black bg-turbo-beige px-3 py-2 text-base text-turbo-black placeholder:text-turbo-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-turbo-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={typeof formData[field.id] === 'string' ? formData[field.id] as string : field.options?.find(opt => opt.default)?.value || ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            required={isFieldRequired(field)}
                            enterKeyHint="next"
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
                            className="flex h-10 w-full rounded-md border border-turbo-black bg-turbo-beige px-3 py-2 text-base text-turbo-black placeholder:text-turbo-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-turbo-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder={field.placeholder}
                            value={typeof formData[field.id] === 'string' ? formData[field.id] as string : ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            required={isFieldRequired(field)}
                            enterKeyHint="next"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const inputs = Array.from(document.querySelectorAll('input:not([type="file"]), textarea, select'));
                                const currentIndex = inputs.indexOf(e.target as HTMLElement);
                                const nextInput = inputs[currentIndex + 1] as HTMLElement;
                                if (nextInput) {
                                  nextInput.focus();
                                } else {
                                  // If it's the last field and form is valid, submit
                                  if (isFormValid()) {
                                    const form = document.querySelector('form');
                                    form?.requestSubmit();
                                  }
                                }
                              }
                            }}
                          />
                        )}
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 border-t border-turbo-black bg-turbo-beige p-4 md:p-6 mt-auto">
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-turbo-black hover:text-turbo-white bg-turbo-beige border-2 border-turbo-black rounded-full hover:bg-turbo-blue transition-colors disabled:opacity-50"
                  disabled={viewState === ViewState.Loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-turbo-beige bg-turbo-black hover:bg-turbo-blue rounded-full transition-colors disabled:opacity-80 disabled:bg-turbo-black/40 disabled:cursor-not-allowed disabled:text-turbo-beige group relative"
                  disabled={viewState === ViewState.Loading || !isFormValid()}
                >
                  <span className="flex items-center justify-center gap-2">
                    {viewState === ViewState.Loading ? 'Generating...' : (
                      <>
                        Generate
                        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-turbo-beige/30 bg-turbo-beige/10 px-1.5 font-mono text-[10px] font-medium text-turbo-beige opacity-50 group-hover:opacity-75">
                          <span className="text-xs">⌘</span>
                          <span className="text-xs">↵</span>
                        </kbd>
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </form>
        )
      default:
        return null
    }
  }

  // Update the CSS styles for enterKeyHint
  useEffect(() => {
    // Add the style to the document head
    const style = document.createElement('style')
    style.textContent = `
      @supports (color: env(keyboard-button)) {
        input[enterkeyhint="next"],
        textarea[enterkeyhint="next"],
        select[enterkeyhint="next"] {
          color-scheme: light;
          --keyboard-button-color: #2563eb;
        }

        /* Only capitalize the keyboard button itself */
        ::-webkit-keyboard-button {
          text-transform: capitalize;
        }
      }
    `
    document.head.appendChild(style)
    
    // Cleanup
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <DottedDialog
      open={true}
      onOpenChange={onClose}
      title={viewState === ViewState.Result && result ? `Your ${getTaskTitle()}` : config.title}
      description={viewState === ViewState.Result ? 'View and share your generated content' : config.description}
      headerLeftAction={viewState === ViewState.Result ? (
        <button
          onClick={() => setViewState(ViewState.Input)}
          className="text-sm text-turbo-black/60 hover:text-turbo-black hover:bg-turbo-blue/10 px-3 py-1 rounded-md transition-colors"
        >
          Back to Form
        </button>
      ) : undefined}
      headerRightAction={viewState === ViewState.Input ? (
        <button
          type="button"
          onClick={handleFillTestData}
          className="text-sm text-turbo-black/80 hover:text-turbo-black hover:bg-turbo-blue/10 px-3 py-1 rounded-md transition-colors"
        >
          Fill Test Data
        </button>
      ) : undefined}
    >
      <div className="flex flex-col h-full overflow-hidden relative bg-turbo-beige">
        {viewState === ViewState.Loading ? (
          <LoadingOverlay className="z-50" />
        ) : (
          <>
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-turbo-black">
              <h2 className="text-xl font-bold text-turbo-black">{getTaskTitle()}</h2>
              <button
                onClick={onClose}
                className="text-turbo-black hover:text-turbo-blue transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {renderContent()}
          </>
        )}
      </div>
    </DottedDialog>
  )
} 