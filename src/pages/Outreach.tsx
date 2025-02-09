import { Layout } from '@/components/Layout'
import { useState, useEffect, useCallback } from 'react'
import { Command, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { queryPerplexity } from '@/services/perplexity'
import { generateEmailTemplates } from '@/services/email'
import { Prospect, UserInfo, EmailTemplate, ProspectResearch } from '@/types/outreach'
import { DEFAULT_USER_INFO } from '@/config/constants'

type OutreachType = 'getClients' | 'getJob' | 'getSpeakers'
type OnboardingStep = 1 | 2 | 3
type HasList = 'yes' | 'no' | null
type SlideDirection = 'forward' | 'back' | null

// Add new state types and enums
type ProspectStatus = 'pending' | 'researching' | 'research_complete' | 'generating_emails' | 'ready'

interface QuestionProps {
  isActive: boolean
  direction: SlideDirection
  children: React.ReactNode
  step: number
  currentStep: number
}

// Question wrapper component to handle animations
const Question = ({ isActive, direction, children, step, currentStep }: QuestionProps) => {
  return (
    <div
      className={cn(
        "absolute inset-0 transition-transform duration-500 ease-in-out",
        // When not active and no direction (initial state)
        !isActive && direction === null && "translate-x-full opacity-0",
        // When not active and going forward
        !isActive && direction === 'forward' && (
          currentStep > step 
            ? "-translate-x-full opacity-0"  // Previous question slides left
            : "translate-x-full opacity-0"   // Next question waits on right
        ),
        // When not active and going back
        !isActive && direction === 'back' && (
          currentStep < step
            ? "translate-x-full opacity-0"   // Next question slides right
            : "-translate-x-full opacity-0"  // Previous question waits on left
        ),
        // Active state is always centered
        isActive && "translate-x-0 opacity-100"
      )}
    >
      {children}
    </div>
  )
}

export default function Outreach() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1)
  const [outreachType, setOutreachType] = useState<OutreachType | null>(null)
  const [hasList, setHasList] = useState<HasList>(null)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [showMainUI, setShowMainUI] = useState(false)
  const [slideDirection, setSlideDirection] = useState<SlideDirection>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // New state for prospects
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [currentProspectIndex, setCurrentProspectIndex] = useState(0)
  const currentProspect = prospects[currentProspectIndex]

  // New state for email templates and research
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0)
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  const [isResearching, setIsResearching] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  // Research queue management
  const RESEARCH_WINDOW_SIZE = 3
  const [researchQueue, setResearchQueue] = useState<Set<string>>(new Set())

  // Add new state for tracking email generation
  const [isGeneratingEmails, setIsGeneratingEmails] = useState(false)

  // Add new state for process tracking
  const [processingQueue, setProcessingQueue] = useState<Set<string>>(new Set())
  const [prospectStatuses, setProspectStatuses] = useState<Record<string, ProspectStatus>>({})

  // Add new state for tracking emails sent today
  const [emailsSentToday, setEmailsSentToday] = useState(0)

  // Add new state for tracking if user is editing
  const [isEditing, setIsEditing] = useState(false)

  // Handle navigation
  const goToNextStep = () => {
    setCurrentStep(prev => (prev < 3 ? (prev + 1) as OnboardingStep : prev))
    setSlideDirection('forward')
    // Reset direction after animation completes
    setTimeout(() => setSlideDirection(null), 500)
  }

  const goToPreviousStep = () => {
    setCurrentStep(prev => (prev > 1 ? (prev - 1) as OnboardingStep : prev))
    setSlideDirection('back')
    // Reset direction after animation completes
    setTimeout(() => setSlideDirection(null), 500)
  }

  // Handle selections
  const handleOutreachTypeSelect = (type: OutreachType) => {
    setOutreachType(type)
    
    // Get current user info
    const currentUserInfo = localStorage.getItem('userInfo')
    const userInfo = currentUserInfo ? JSON.parse(currentUserInfo) : DEFAULT_USER_INFO
    
    // Update both outreachType and outreachContext
    const updatedUserInfo = {
      ...userInfo,
      outreachType: type,
      outreachContext: getOutreachContext(type)
    }
    
    // Save back to localStorage
    localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))
    
    goToNextStep()
  }

  const handleHasListSelect = (value: HasList) => {
    setHasList(value)
    if (value === 'no') {
      setIsLoading(true)
      setShowMainUI(true)
    } else {
      goToNextStep()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'text/csv') {
      setCsvFile(file)
      setIsLoading(true)
      try {
        await parseCSV(file)
        setShowMainUI(true)
      } catch (error) {
        console.error('Error parsing CSV:', error)
        setIsLoading(false)
      }
    }
  }

  // Parse CSV function
  const parseCSV = async (file: File) => {
    console.log('🔄 Starting CSV parsing...')
    const text = await file.text()
    const rows = text.split('\n')
    const headers = rows[0].split(',').map(header => header.trim())
    
    const parsedProspects: Prospect[] = rows.slice(1)
      .filter(row => row.trim()) // Skip empty rows
      .map((row, index) => {
        const values = row.split(',').map(value => value.trim())
        const prospect: Partial<Prospect> = {
          id: `prospect-${index}`,
        }
        
        headers.forEach((header, i) => {
          const value = values[i]
          switch(header.toLowerCase()) {
            case 'name':
              prospect.name = value
              break
            case 'title':
              prospect.title = value
              break
            case 'email':
              prospect.email = value
              break
            case 'company':
              prospect.company = value
              break
            case 'industry':
              prospect.industry = value
              break
            case 'size':
              prospect.size = value
              break
            default:
              prospect[header.toLowerCase()] = value
          }
        })
        
        return prospect as Prospect
      })

    console.log(`✅ Successfully parsed ${parsedProspects.length} prospects from CSV`)
    setProspects(parsedProspects)
    setCurrentProspectIndex(0)
  }

  // Navigation functions
  const goToNextProspect = () => {
    if (currentProspectIndex < prospects.length - 1) {
      setCurrentProspectIndex(prev => prev + 1)
    }
  }

  const goToPreviousProspect = () => {
    if (currentProspectIndex > 0) {
      setCurrentProspectIndex(prev => prev - 1)
    }
  }

  // Update the research and email generation process
  const processProspect = async (prospect: Prospect, isCurrentProspect: boolean = false) => {
    if (!userInfo) return

    try {
      // Update status to researching
      setProspectStatuses(prev => ({ ...prev, [prospect.id]: 'researching' }))
      
      // 1. Research Phase
      console.log(`🔍 Starting research for ${prospect.name}...`)
      const researchResponse = await queryPerplexity(prospect.name, prospect.company)
      
      // Log the full Perplexity response
      console.log('📝 Perplexity Raw Response:', {
        prospect: prospect.name,
        company: prospect.company,
        response: researchResponse
      })
      
      // 2. Parse and store research
      let parsedResearch: {
        companyInfo: string[]
        personInfo: string[]
        sources: string[]
        title?: string
      }

      try {
        // Try to parse the JSON response
        parsedResearch = JSON.parse(researchResponse)
        console.log('✅ Successfully parsed JSON response:', parsedResearch)
      } catch (error) {
        console.error('❌ Failed to parse JSON response:', error)
        // Fallback to empty arrays if parsing fails
        parsedResearch = {
          companyInfo: [],
          personInfo: [],
          sources: [],
          title: ''
        }
      }

      const research: ProspectResearch = {
        companyInfo: parsedResearch.companyInfo || [],
        personInfo: parsedResearch.personInfo || [],
        sources: parsedResearch.sources || [],
        rawResponse: researchResponse
      }

      // Log the parsed research data
      console.log('🔍 Parsed Research Data:', {
        prospect: prospect.name,
        companyInfo: research.companyInfo,
        personInfo: research.personInfo,
        sources: research.sources
      })

      // 3. Update prospect with research and title if available
      setProspects(prevProspects => {
        const updatedProspects = [...prevProspects]
        const index = updatedProspects.findIndex(p => p.id === prospect.id)
        if (index !== -1) {
          updatedProspects[index] = {
            ...updatedProspects[index],
            research,
            // Update title if we got one from Perplexity
            ...(parsedResearch.title && { title: parsedResearch.title })
          }
        }
        return updatedProspects
      })

      // Update status to research complete
      setProspectStatuses(prev => ({ ...prev, [prospect.id]: 'research_complete' }))

      // If this is the current prospect, trigger UI update for research
      if (isCurrentProspect) {
        setIsResearching(false)
        setIsGeneratingEmails(true)
      }

      // 4. Generate emails
      console.log(`📧 Starting email generation for ${prospect.name}...`)
      setProspectStatuses(prev => ({ ...prev, [prospect.id]: 'generating_emails' }))

      // Log the data being sent to email generation
      console.log('📨 Email Generation Input:', {
        prospect: {
          name: prospect.name,
          title: prospect.title,
          company: prospect.company,
          email: prospect.email
        },
        research: {
          companyInfo: research.companyInfo,
          personInfo: research.personInfo
        },
        userInfo: {
          ...userInfo,
          outreachContext: userInfo.outreachContext
        }
      })

      const templates = await generateEmailTemplates(prospect, research, userInfo)

      // Log the generated email templates
      console.log('✉️ Generated Email Templates:', {
        prospect: prospect.name,
        templateCount: templates.length,
        templates: templates.map(t => ({
          subject: t.subject,
          bodyPreview: t.body.substring(0, 100) + '...'
        }))
      })

      // 5. Store email templates
      setProspects(prevProspects => {
        const updatedProspects = [...prevProspects]
        const index = updatedProspects.findIndex(p => p.id === prospect.id)
        if (index !== -1) {
          updatedProspects[index] = {
            ...updatedProspects[index],
            emailTemplates: templates
          }
        }
        return updatedProspects
      })

      // Mark as ready
      setProspectStatuses(prev => ({ ...prev, [prospect.id]: 'ready' }))

      // If this is the current prospect, update UI with emails
      if (isCurrentProspect) {
        setEmailTemplates(templates)
        setCurrentTemplateIndex(0)
        setIsGeneratingEmails(false)
      }

    } catch (error) {
      console.error(`Error processing prospect ${prospect.name}:`, error)
      setProspectStatuses(prev => ({ ...prev, [prospect.id]: 'pending' }))
    } finally {
      // Remove from processing queue
      setProcessingQueue(prev => {
        const newQueue = new Set(prev)
        newQueue.delete(prospect.id)
        return newQueue
      })
    }
  }

  // Update the queue processing function
  const processQueue = async () => {
    if (!userInfo) return

    // Get prospects that need processing
    const currentIndex = currentProspectIndex
    const targetIndices = Array.from(
      { length: RESEARCH_WINDOW_SIZE },
      (_, i) => currentIndex + i
    ).filter(index => index < prospects.length)

    // Filter for prospects that need processing
    const prospectsToProcess = targetIndices
      .map(index => prospects[index])
      .filter(prospect => {
        const status = prospectStatuses[prospect.id] || 'pending'
        const isProcessing = processingQueue.has(prospect.id)
        return status === 'pending' && !isProcessing
      })

    // Add to processing queue and start processing
    if (prospectsToProcess.length > 0) {
      setProcessingQueue(prev => {
        const newQueue = new Set(prev)
        prospectsToProcess.forEach(p => newQueue.add(p.id))
        return newQueue
      })

      // Process each prospect
      for (const prospect of prospectsToProcess) {
        const isCurrentProspect = prospect.id === currentProspect?.id
        await processProspect(prospect, isCurrentProspect)
      }
    }
  }

  // Load user info from localStorage
  useEffect(() => {
    console.log('🔄 Loading user info from localStorage...')
    const storedUserInfo = localStorage.getItem('userInfo')
    if (storedUserInfo) {
      const parsedUserInfo = JSON.parse(storedUserInfo)
      console.log('✅ Successfully loaded user info:', parsedUserInfo)
      setUserInfo(parsedUserInfo)
    } else {
      console.log('ℹ️ Creating default user info based on outreach type')
      // Create default user info based on outreach type
      const defaultUserInfo: UserInfo = {
        name: 'User',
        company: 'Your Company',
        role: 'Professional',
        businessType: outreachType || 'business',
        outreachContext: getOutreachContext(outreachType),
        companyName: 'Your Company'
      }
      localStorage.setItem('userInfo', JSON.stringify(defaultUserInfo))
      setUserInfo(defaultUserInfo)
    }
  }, [outreachType])

  // Helper function to get outreach context based on type
  const getOutreachContext = (type: OutreachType | null): string => {
    switch (type) {
      case 'getClients':
        return 'discussing potential collaboration opportunities'
      case 'getJob':
        return 'exploring career opportunities'
      case 'getSpeakers':
        return 'inviting speakers to our event'
      default:
        return 'discussing business opportunities'
    }
  }

  // Update the useEffect hooks
  useEffect(() => {
    if (showMainUI && prospects.length > 0 && userInfo) {
      processQueue()
    }
  }, [showMainUI, prospects, userInfo])

  useEffect(() => {
    if (currentProspect && userInfo) {
      // If current prospect isn't ready, process it immediately
      const status = prospectStatuses[currentProspect.id] || 'pending'
      if (status === 'pending' && !processingQueue.has(currentProspect.id)) {
        processProspect(currentProspect, true)
      }
      // Process queue for upcoming prospects
      processQueue()
    }
  }, [currentProspectIndex, userInfo])

  // Navigation functions for email templates
  const goToNextTemplate = () => {
    if (currentTemplateIndex < emailTemplates.length - 1) {
      setCurrentTemplateIndex(prev => prev + 1)
    }
  }

  const goToPreviousTemplate = () => {
    if (currentTemplateIndex > 0) {
      setCurrentTemplateIndex(prev => prev - 1)
    }
  }

  // Loading effect
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [isLoading])

  // Handle sending email
  const handleSendEmail = () => {
    const template = emailTemplates[currentTemplateIndex]
    if (template && currentProspect?.email) {
      const mailtoLink = `mailto:${currentProspect.email}?subject=${encodeURIComponent(template.subject)}&body=${encodeURIComponent(template.body)}`
      window.location.href = mailtoLink
      setEmailsSentToday(prev => prev + 1)
    }
  }

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts if user is editing text
    if (isEditing || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
      return
    }

    // Handle template navigation with F/J
    if (e.key.toLowerCase() === 'j') {
      e.preventDefault()
      if (!isResearching && currentTemplateIndex < emailTemplates.length - 1) {
        goToNextTemplate()
      }
    } else if (e.key.toLowerCase() === 'f') {
      e.preventDefault()
      if (!isResearching && currentTemplateIndex > 0) {
        goToPreviousTemplate()
      }
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSendEmail()
    }
  }, [emailTemplates, currentTemplateIndex, currentProspect?.email, isResearching, isEditing])

  // Reset emails sent counter at midnight
  useEffect(() => {
    const now = new Date()
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const timeUntilMidnight = tomorrow.getTime() - now.getTime()

    const timer = setTimeout(() => {
      setEmailsSentToday(0)
    }, timeUntilMidnight)

    return () => clearTimeout(timer)
  }, [emailsSentToday])

  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (showMainUI) {
    if (isLoading) {
      return (
        <Layout>
          <div className="h-screen flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-turbo-blue border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-lg text-turbo-black/60">Getting setup to Turbocharge your outreach</p>
          </div>
        </Layout>
      )
    }

    return (
      <Layout>
        {/* Inspirational Callout Bar */}
        <div className="bg-turbo-blue text-white py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <p className="text-lg font-medium">100 outreach emails a day will make you rich.</p>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                {emailsSentToday}/100 emails sent today
              </div>
              <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-500 ease-out"
                  style={{ width: `${Math.min((emailsSentToday / 100) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-[350px_1fr_300px] gap-6 min-h-[calc(100vh-200px)]">
            {/* Left Column - Prospect & Company Info */}
            <div>
              {/* Consolidated Prospect Card */}
              <div className="rounded-lg border-2 border-turbo-black/10 p-6">
                <h3 className="text-lg font-semibold mb-4">Current Prospect</h3>
                
                {/* Basic Info */}
                <div className="space-y-2 mb-6">
                  <p className="text-sm font-medium text-turbo-black">Basic Info</p>
                  <div className="space-y-2">
                    <p className="text-sm text-turbo-black/60">
                      {currentProspect?.name || 'Name'}
                    </p>
                    <p className="text-sm text-turbo-black/60">
                      {currentProspect?.title || 'Title'}
                    </p>
                    <p className="text-sm text-turbo-black/60">
                      {currentProspect?.company || 'Company'}
                    </p>
                    <p className="text-sm text-turbo-black/60">
                      {currentProspect?.email || 'Email'}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-turbo-black/10 my-6" />

                {/* Personal Insights */}
                {currentProspect?.research?.personInfo && currentProspect.research.personInfo.length > 0 && (
                  <>
                    <div className="mb-6">
                      <p className="text-sm font-medium text-turbo-black mb-2">Personal Insights</p>
                      <div className="space-y-2">
                        {currentProspect.research.personInfo.map((info, index) => (
                          <div 
                            key={index}
                            className="text-sm text-turbo-black/60 pl-2 border-l-2 border-turbo-blue/20"
                          >
                            {info}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-turbo-black/10 my-6" />
                  </>
                )}

                {/* Company Insights */}
                {currentProspect?.research?.companyInfo && currentProspect.research.companyInfo.length > 0 && (
                  <>
                    <div className="mb-6">
                      <p className="text-sm font-medium text-turbo-black mb-2">Company Insights</p>
                      <div className="space-y-2">
                        {currentProspect.research.companyInfo.map((info, index) => (
                          <div 
                            key={index}
                            className="text-sm text-turbo-black/60 pl-2 border-l-2 border-turbo-blue/20"
                          >
                            {info}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-turbo-black/10 my-6" />
                  </>
                )}

                {/* Sources */}
                {currentProspect?.research?.sources && currentProspect.research.sources.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-turbo-black mb-2">Sources</p>
                    <div className="space-y-1">
                      {currentProspect.research.sources.map((source, index) => (
                        <a
                          key={index}
                          href={source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-turbo-blue hover:underline block truncate"
                        >
                          {source}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Center Column - Email Content */}
            <div className="flex flex-col">
              <div className="flex-1 rounded-lg border-2 border-turbo-black/10 p-6 overflow-hidden">
                <div className="mb-4 h-[300px] overflow-y-auto relative">
                  <div 
                    className="transition-transform duration-300 ease-in-out absolute inset-0"
                    style={{ transform: `translateX(${-currentTemplateIndex * 100}%)` }}
                  >
                    {emailTemplates.map((template, index) => (
                      <div 
                        key={index}
                        className="absolute inset-0 w-full transition-opacity duration-300"
                        style={{ 
                          transform: `translateX(${index * 100}%)`,
                          opacity: currentTemplateIndex === index ? 1 : 0,
                          pointerEvents: currentTemplateIndex === index ? 'auto' : 'none'
                        }}
                      >
                        <div className="relative group">
                          <div className="flex items-center mb-4">
                            <span className="font-bold text-turbo-black mr-2">Subject:</span>
                            <input
                              type="text"
                              value={template?.subject || ''}
                              onChange={(e) => {
                                const newTemplates = [...emailTemplates]
                                newTemplates[index] = {
                                  ...template,
                                  subject: e.target.value
                                }
                                setEmailTemplates(newTemplates)
                                setIsEditing(true)
                              }}
                              onFocus={() => setIsEditing(true)}
                              onBlur={() => setIsEditing(false)}
                              className="flex-1 p-2 border-b-2 border-transparent hover:border-turbo-black/10 focus:border-turbo-blue focus:outline-none transition-colors rounded-lg"
                              placeholder="Subject line..."
                            />
                          </div>
                          {isEditing && (
                            <button
                              onClick={() => setIsEditing(false)}
                              className="absolute bottom-2 right-2 px-3 py-1.5 bg-turbo-blue text-white text-sm rounded-full flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Save
                              <span className="text-xs">↵</span>
                            </button>
                          )}
                        </div>
                        <div className="relative group h-[200px]">
                          <textarea
                            value={template?.body || ''}
                            onChange={(e) => {
                              const newTemplates = [...emailTemplates]
                              newTemplates[index] = {
                                ...template,
                                body: e.target.value
                              }
                              setEmailTemplates(newTemplates)
                              setIsEditing(true)
                            }}
                            onFocus={() => setIsEditing(true)}
                            onBlur={() => setIsEditing(false)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                e.preventDefault()
                                setIsEditing(false)
                              }
                            }}
                            className="w-full h-full p-2 text-turbo-black whitespace-pre-wrap resize-none border-2 border-transparent hover:border-turbo-black/10 focus:border-turbo-blue focus:outline-none transition-colors rounded-lg bg-[#FAF9F6]"
                            placeholder="Email body content will go here..."
                          />
                          {isEditing && (
                            <button
                              onClick={() => setIsEditing(false)}
                              className="absolute bottom-2 right-2 px-3 py-1.5 bg-turbo-blue text-white text-sm rounded-full flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Save
                              <span className="text-xs">↵</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {isResearching ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="w-8 h-8 border-4 border-turbo-blue border-t-transparent rounded-full animate-spin mb-4" />
                      <p className="text-turbo-black/60">Researching prospect...</p>
                    </div>
                  ) : isGeneratingEmails ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="w-8 h-8 border-4 border-turbo-blue border-t-transparent rounded-full animate-spin mb-4" />
                      <p className="text-turbo-black/60">Writing email starters...</p>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Navigation and Send Controls */}
              <div className="flex items-center justify-between mt-4 px-4">
                <div className="flex gap-4 items-center">
                  <div className="flex flex-col items-center">
                    <button 
                      onClick={goToPreviousTemplate}
                      disabled={currentTemplateIndex === 0 || isResearching}
                      className="p-2 text-turbo-black/40 hover:text-turbo-blue transition-colors disabled:opacity-30 disabled:hover:text-turbo-black/40"
                    >
                      <ArrowLeft className="w-6 h-6" />
                    </button>
                    <kbd className="mt-1 inline-flex h-5 items-center gap-1 rounded border border-turbo-black/30 bg-turbo-black/5 px-1.5 font-mono text-[10px] font-medium text-turbo-black/60">
                      F
                    </kbd>
                  </div>
                  <div className="flex flex-col items-center">
                    <button 
                      onClick={goToNextTemplate}
                      disabled={currentTemplateIndex === emailTemplates.length - 1 || isResearching}
                      className="p-2 text-turbo-black/40 hover:text-turbo-blue transition-colors disabled:opacity-30 disabled:hover:text-turbo-black/40"
                    >
                      <ArrowLeft className="w-6 h-6 rotate-180" />
                    </button>
                    <kbd className="mt-1 inline-flex h-5 items-center gap-1 rounded border border-turbo-black/30 bg-turbo-black/5 px-1.5 font-mono text-[10px] font-medium text-turbo-black/60">
                      J
                    </kbd>
                  </div>
                </div>

                {/* Template Position Indicators */}
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4].map((index) => (
                    <div
                      key={index}
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        currentTemplateIndex === index
                          ? "bg-turbo-blue"
                          : index < emailTemplates.length
                            ? "bg-turbo-black/20"
                            : "bg-turbo-black/10"
                      )}
                    />
                  ))}
                </div>

                <button
                  onClick={handleSendEmail}
                  disabled={isResearching || !emailTemplates[currentTemplateIndex] || !currentProspect?.email}
                  className="px-6 py-3 bg-turbo-blue text-white rounded-full hover:bg-turbo-blue/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  Send
                  <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-white/30 bg-white/10 px-1.5 font-mono text-[10px] font-medium">
                    <Command className="h-3 w-3" />
                    <span className="text-xs">↵</span>
                  </kbd>
                </button>
              </div>
            </div>

            {/* Right Column - List Progress */}
            <div className="rounded-lg border-2 border-turbo-black/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Your List</h3>
                <span className="text-sm text-turbo-black/60">
                  {currentProspectIndex + 1}/{prospects.length}
                </span>
              </div>
              <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                {prospects.map((prospect, index) => (
                  <div
                    key={prospect.id}
                    onClick={() => setCurrentProspectIndex(index)}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-colors",
                      index === currentProspectIndex 
                        ? "bg-turbo-black/5" 
                        : "hover:bg-turbo-black/5",
                      // Gray out prospects that aren't ready and aren't being processed
                      prospectStatuses[prospect.id] !== 'ready' && !processingQueue.has(prospect.id) && "opacity-50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{prospect.name}</p>
                        <p className="text-xs text-turbo-black/60">{prospect.company}</p>
                      </div>
                      {// Only show spinner for prospects currently in the processing queue
                      processingQueue.has(prospect.id) && (
                        <div className="w-4 h-4 border-2 border-turbo-blue border-t-transparent rounded-full animate-spin" />
                      )}
                      {// Show checkmark for completed prospects
                      prospectStatuses[prospect.id] === 'ready' && (
                        <svg className="w-4 h-4 text-turbo-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="h-1 bg-turbo-black/10 rounded-full">
            <div 
              className="h-full bg-turbo-blue rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="min-h-[60vh] flex flex-col relative">
          {/* Back Button */}
          {currentStep > 1 && (
            <button
              onClick={goToPreviousStep}
              className="absolute -top-20 left-0 text-turbo-black/60 hover:text-turbo-blue transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}

          {/* Questions Container */}
          <div className="flex-1 relative overflow-hidden">
            {/* Question 1 */}
            <Question 
              isActive={currentStep === 1} 
              direction={slideDirection}
              step={1}
              currentStep={currentStep}
            >
              <div className="space-y-8">
                <h2 className="text-4xl font-bold tracking-tight text-turbo-black">
                  What are you doing outreach for?
                </h2>
                <div className="grid gap-4">
                  <button
                    onClick={() => handleOutreachTypeSelect('getClients')}
                    className={cn(
                      "p-4 text-left rounded-lg border-2 transition-colors",
                      outreachType === 'getClients'
                        ? 'border-turbo-blue bg-turbo-blue text-turbo-beige'
                        : 'border-turbo-black hover:bg-turbo-black/5'
                    )}
                  >
                    Get new clients
                  </button>
                  <button
                    onClick={() => handleOutreachTypeSelect('getJob')}
                    className={cn(
                      "p-4 text-left rounded-lg border-2 transition-colors",
                      outreachType === 'getJob'
                        ? 'border-turbo-blue bg-turbo-blue text-turbo-beige'
                        : 'border-turbo-black hover:bg-turbo-black/5'
                    )}
                  >
                    Land a new job
                  </button>
                  <button
                    onClick={() => handleOutreachTypeSelect('getSpeakers')}
                    className={cn(
                      "p-4 text-left rounded-lg border-2 transition-colors",
                      outreachType === 'getSpeakers'
                        ? 'border-turbo-blue bg-turbo-blue text-turbo-beige'
                        : 'border-turbo-black hover:bg-turbo-black/5'
                    )}
                  >
                    Get speakers for an event
                  </button>
                </div>
              </div>
            </Question>

            {/* Question 2 */}
            <Question 
              isActive={currentStep === 2} 
              direction={slideDirection}
              step={2}
              currentStep={currentStep}
            >
              <div className="space-y-8">
                <h2 className="text-4xl font-bold tracking-tight text-turbo-black">
                  Do you have a list you want to work through?
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleHasListSelect('yes')}
                    className={cn(
                      "p-4 text-center rounded-lg border-2 transition-colors",
                      hasList === 'yes'
                        ? 'border-turbo-blue bg-turbo-blue text-turbo-beige'
                        : 'border-turbo-black hover:bg-turbo-black/5'
                    )}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => handleHasListSelect('no')}
                    className={cn(
                      "p-4 text-center rounded-lg border-2 transition-colors",
                      hasList === 'no'
                        ? 'border-turbo-blue bg-turbo-blue text-turbo-beige'
                        : 'border-turbo-black hover:bg-turbo-black/5'
                    )}
                  >
                    No
                  </button>
                </div>
              </div>
            </Question>

            {/* Question 3 */}
            <Question 
              isActive={currentStep === 3} 
              direction={slideDirection}
              step={3}
              currentStep={currentStep}
            >
              <div className="space-y-8">
                <h2 className="text-4xl font-bold tracking-tight text-turbo-black">
                  Import List Here
                </h2>
                <div className="space-y-4">
                  <label 
                    className={cn(
                      "flex flex-col items-center justify-center w-full h-32",
                      "border-2 border-dashed rounded-lg",
                      "cursor-pointer transition-colors",
                      csvFile 
                        ? 'border-turbo-blue bg-turbo-blue/5' 
                        : 'border-turbo-black hover:bg-turbo-black/5'
                    )}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <p className="mb-2 text-sm text-turbo-black">
                        {csvFile ? csvFile.name : 'Click to upload CSV file'}
                      </p>
                      <p className="text-xs text-turbo-black/60">
                        Only CSV files are accepted
                      </p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".csv"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>
            </Question>
          </div>
        </div>
      </div>
    </Layout>
  )
} 