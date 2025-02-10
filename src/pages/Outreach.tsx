import { Layout } from '@/components/Layout'
import { useState, useEffect, useCallback } from 'react'
import { Command, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { queryPerplexity } from '@/services/perplexity'
import { createEmailTemplates } from '@/services/email'
import { Prospect, UserInfo, EmailTemplate, ProspectResearch } from '@/types/outreach'
import { DEFAULT_USER_INFO } from '@/config/constants'

type OutreachType = 'getClients' | 'getJob' | 'getSpeakers'
type MessageStyle = 'direct' | 'casual' | 'storytelling'
type OnboardingStep = 1 | 2 | 3 | 4
type HasList = 'yes' | 'no' | null
type SlideDirection = 'forward' | 'back' | null

// Add new state types and enums
type ProspectStatus = 'pending' | 'researching' | 'research_complete' | 'generating_emails' | 'ready'
type InputMode = 'name' | 'company' | 'display'

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
        !isActive && direction === null && "translate-x-full opacity-0",
        !isActive && direction === 'forward' && (
          currentStep > step 
            ? "-translate-x-full opacity-0"
            : "translate-x-full opacity-0"
        ),
        !isActive && direction === 'back' && (
          currentStep < step
            ? "translate-x-full opacity-0"
            : "-translate-x-full opacity-0"
        ),
        isActive && "translate-x-0 opacity-100"
      )}
    >
      {children}
    </div>
  )
}

// Add new state for queued emails
interface QueuedEmail {
  prospectId: string
  prospectName: string
  prospectEmail: string
  subject: string
  body: string
  templateIndex: number
}

export default function Outreach() {
  // Move chat interface state inside component
  const [chatMode, setChatMode] = useState(false)
  const [inputMode, setInputMode] = useState<InputMode>('name')
  const [prospectName, setProspectName] = useState('')
  const [prospectCompany, setProspectCompany] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1)
  const [outreachType, setOutreachType] = useState<OutreachType>('getClients')
  const [messageStyle, setMessageStyle] = useState<MessageStyle>('direct')
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

  // Add new state for tracking email generation
  const [isGeneratingEmails, setIsGeneratingEmails] = useState(false)

  // Add new state for process tracking
  const [processingQueue, setProcessingQueue] = useState<Set<string>>(new Set())
  const [prospectStatuses, setProspectStatuses] = useState<Record<string, ProspectStatus>>({})

  // Add new state for tracking emails sent today
  const [emailsSentToday, setEmailsSentToday] = useState(0)

  // Fix isEditing declaration - only use the value since setter is not needed
  const isEditing = false

  // Add new state for queued emails
  const [queuedEmails, setQueuedEmails] = useState<QueuedEmail[]>([])

  // Add mobile check state
  const [isMobile, setIsMobile] = useState(false)

  // Add effect to check for mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // 768px is standard tablet/mobile breakpoint
    }
    
    checkMobile() // Check initially
    window.addEventListener('resize', checkMobile) // Listen for resize
    
    return () => window.removeEventListener('resize', checkMobile) // Cleanup
  }, [])

  // Handle navigation
  const goToNextStep = () => {
    setCurrentStep(prev => (prev < 4 ? (prev + 1) as OnboardingStep : prev))
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
      outreachContext: getOutreachContext(type),
      messageStyle: messageStyle
    }
    
    // Save back to localStorage
    localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))
    
    goToNextStep()
  }

  const handleMessageStyleSelect = (style: MessageStyle) => {
    setMessageStyle(style)
    
    // Get current user info
    const currentUserInfo = localStorage.getItem('userInfo')
    const userInfo = currentUserInfo ? JSON.parse(currentUserInfo) : DEFAULT_USER_INFO
    
    // Update messageStyle
    const updatedUserInfo = {
      ...userInfo,
      messageStyle: style
    }
    
    // Save back to localStorage
    localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))
    
    goToNextStep()
  }

  const handleHasListSelect = (value: HasList) => {
    setHasList(value)
    if (value === 'no') {
      setChatMode(true)
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
              prospect.company = value.trim().replace(/^["']|["']$/g, '')
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
          outreachContext: userInfo.outreachContext,
          outreachType: outreachType,
          messageStyle: messageStyle
        }
      })

      const templates = await createEmailTemplates(prospect, research, {
        ...userInfo,
        outreachType: outreachType,
        messageStyle: messageStyle
      })

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
        companyName: 'Your Company',
        role: 'Professional',
        email: '',
        conversationalStyle: 'friendly',
        businessType: outreachType || 'business',
        outreachContext: getOutreachContext(outreachType),
        messageStyle: 'direct',
        outreachType: outreachType || 'getClients'
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
      // Reset template index when switching prospects
      setCurrentTemplateIndex(0)
      
      // Update email templates if they exist for the current prospect
      if (currentProspect.emailTemplates) {
        setEmailTemplates(currentProspect.emailTemplates)
      } else {
        setEmailTemplates([])
      }
      
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

  // Update the isCurrentTemplateQueued function to be more specific
  const isCurrentTemplateQueued = useCallback(() => {
    if (!currentProspect) return false
    return queuedEmails.some(
      email => email.prospectId === currentProspect.id && email.templateIndex === currentTemplateIndex
    )
  }, [queuedEmails, currentProspect?.id, currentTemplateIndex])

  // Update handleNewContact to generate a unique ID for new contacts
  const handleNewContact = () => {
    // Log queued emails before clearing state
    console.log('Currently queued emails:', queuedEmails)
    
    // Reset all input and UI states
    setProspectName('')
    setProspectCompany('')
    setInputMode('name')
    setIsSubmitted(false)
    
    // Clear email templates and reset all template-related states
    setEmailTemplates([])
    setCurrentTemplateIndex(0)
    setIsResearching(false)
    setIsGeneratingEmails(false)
    
    // Only clear prospects if in chat mode to preserve list functionality
    if (chatMode) {
      const newProspectId = `single-prospect-${Date.now()}`
      setProspects([{
        id: newProspectId,
        name: '',
        company: '',
        title: '',
        email: ''
      }])
      // Also clear the prospect status to ensure fresh UI state
      setProspectStatuses({})
    }
    
    // Log queued emails after clearing state to verify they're preserved
    console.log('Queued emails after reset:', queuedEmails)
  }

  // Update handleChatSubmit to use unique IDs
  const handleChatSubmit = async () => {
    if (!userInfo) return

    setIsSubmitted(true)
    setInputMode('display')
    setIsResearching(true)

    // Create a single prospect with a unique ID
    const newProspect: Prospect = {
      id: `single-prospect-${Date.now()}`,
      name: prospectName,
      company: prospectCompany,
      title: '',
      email: '',
    }

    setProspects([newProspect])
    setCurrentProspectIndex(0)
    await processProspect(newProspect, true)
  }

  // Add new function to handle single prospect queue
  const handleQueueSingleEmail = () => {
    const template = emailTemplates[currentTemplateIndex]
    if (template && currentProspect) {
      const queuedEmail: QueuedEmail = {
        prospectId: currentProspect.id,
        prospectName: currentProspect.name,
        prospectEmail: currentProspect.email || '', // Handle empty email for single prospect
        subject: template.subject,
        body: template.body,
        templateIndex: currentTemplateIndex
      }
      setQueuedEmails(prev => [...prev, queuedEmail])
    }
  }

  // Modify handleQueueEmail to include templateIndex
  const handleQueueEmail = () => {
    const template = emailTemplates[currentTemplateIndex]
    if (template && currentProspect?.email) {
      const queuedEmail: QueuedEmail = {
        prospectId: currentProspect.id,
        prospectName: currentProspect.name,
        prospectEmail: currentProspect.email,
        subject: template.subject,
        body: template.body,
        templateIndex: currentTemplateIndex
      }
      setQueuedEmails(prev => [...prev, queuedEmail])
      goToNextProspect()
    }
  }

  // Add function to remove from queue
  const handleRemoveFromQueue = () => {
    setQueuedEmails(prev => 
      prev.filter(
        email => !(email.prospectId === currentProspect?.id && email.templateIndex === currentTemplateIndex)
      )
    )
  }

  // Add batch send function
  const handleBatchSend = () => {
    queuedEmails.forEach(email => {
      const mailtoLink = `mailto:${email.prospectEmail}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`
      window.open(mailtoLink, '_blank')
    })
    setEmailsSentToday(prev => prev + queuedEmails.length)
    setQueuedEmails([])
  }

  // Update the keyboard navigation handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts if user is editing text
    if (isEditing || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
      return
    }

    // Change new contact shortcut from N to H (Cmd/Ctrl + H)
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'h') {
      e.preventDefault() // Prevent browser's history
      handleNewContact()
      return
    }

    // Handle template and prospect navigation with IJKL
    switch(e.key.toLowerCase()) {
      case 'j':
        e.preventDefault()
        if (!isResearching && currentTemplateIndex > 0) {
          goToPreviousTemplate()
        }
        break
      case 'l':
        e.preventDefault()
        if (!isResearching && currentTemplateIndex < emailTemplates.length - 1) {
          goToNextTemplate()
        }
        break
      case 'i':
        e.preventDefault()
        if (currentProspectIndex > 0) {
          goToPreviousProspect()
        }
        break
      case 'k':
        e.preventDefault()
        if (currentProspectIndex < prospects.length - 1) {
          goToNextProspect()
        }
        break
      case 'enter':
        if ((e.metaKey || e.ctrlKey) && !isResearching && emailTemplates[currentTemplateIndex]) {
          e.preventDefault()
          if (chatMode) {
            handleQueueSingleEmail()
          } else if (currentProspect?.email) {
            handleQueueEmail()
          }
        }
        break
    }

    // Add batch send shortcut (Cmd/Ctrl + B)
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault()
      if (queuedEmails.length > 0) {
        handleBatchSend()
      }
    }
  }, [
    emailTemplates, 
    currentTemplateIndex, 
    currentProspect?.email, 
    isResearching, 
    isEditing, 
    prospects.length, 
    currentProspectIndex, 
    queuedEmails.length,
    chatMode,
    handleQueueEmail,
    handleQueueSingleEmail,
    handleBatchSend
  ])

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

  if (isMobile) {
    return (
      <Layout>
        <div className="h-screen flex flex-col items-center justify-center px-6 text-center">
          <p className="text-xl font-medium text-turbo-black mb-4">
            The Outreach feature is only available on Desktop currently.
          </p>
          <p className="text-turbo-black/60">
            You can check out the other features on mobile.
          </p>
        </div>
      </Layout>
    )
  }

  if (showMainUI) {
    if (isLoading) {
      return (
        <Layout>
          <div className="h-screen flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-turbo-blue border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-lg text-turbo-black/60">Getting ready to Turbocharge your outreach</p>
          </div>
        </Layout>
      )
    }

    return (
      <Layout>
        {/* Inspirational Callout Bar */}
        <div className="bg-turbo-blue text-white py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <p className="text-lg font-medium">50 outreach emails a day could change your business forever.</p>
            <div className="flex items-center gap-6">
              <button
                onClick={handleBatchSend}
                disabled={queuedEmails.length === 0}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full transition-colors",
                  queuedEmails.length > 0 
                    ? "bg-white text-turbo-blue hover:bg-white/90"
                    : "bg-white/20 text-white/60 cursor-not-allowed"
                )}
              >
                Send {queuedEmails.length} Queued
                <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-current/30 bg-current/10 px-1.5 font-mono text-[10px] font-medium">
                  <Command className="h-3 w-3" />
                  <span className="text-xs">B</span>
                </kbd>
              </button>
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  {emailsSentToday}/50 emails sent today
                </div>
                <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-500 ease-out"
                    style={{ width: `${Math.min((emailsSentToday / 50) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-[1fr_350px] gap-6 min-h-[calc(100vh-200px)]">
            {/* Left Column - List + Email Composer */}
            <div className="flex flex-col gap-4">
              {/* Chat Bar or Current Prospect Bar */}
              {chatMode ? (
                    <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-turbo-black">Who You Want to Talk To</h3>
                    <a 
                      href="https://www.youtube.com/watch?v=S7YrRcAkGf8" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-turbo-blue hover:text-turbo-black transition-colors"
                    >
                      learn how to get their email
                    </a>
                  </div>
                  <div className="flex items-center justify-between bg-white rounded-lg border-2 border-turbo-black/10 p-6 overflow-hidden min-h-[72px]">
                    <div className="flex-1 flex items-center gap-4 relative">
                      <div className="w-full flex items-center gap-4">
                        {/* Name Input */}
                        <div 
                          className={cn(
                            "w-full flex items-center gap-4 absolute inset-0 transition-all duration-300",
                            inputMode === 'name' ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
                          )}
                        >
                          <input
                            type="text"
                            value={prospectName}
                            onChange={(e) => setProspectName(e.target.value)}
                            placeholder="Who do you want to reach out to?"
                            className="flex-1 px-4 py-3 text-sm bg-transparent focus:outline-none"
                            onKeyDown={(e) => {
                              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && prospectName) {
                                e.preventDefault()
                                setInputMode('company')
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              if (prospectName) {
                                setInputMode('company')
                              }
                            }}
                            disabled={!prospectName}
                            className="px-6 py-3 text-sm font-medium text-turbo-beige bg-turbo-blue hover:bg-turbo-blue/90 disabled:opacity-50 rounded-full transition-colors"
                          >
                            Next
                          </button>
                          </div>

                        {/* Company Input */}
                        <div 
                          className={cn(
                            "w-full flex items-center gap-4 absolute inset-0 transition-all duration-300",
                            inputMode === 'company' ? "translate-x-0 opacity-100" : 
                            inputMode === 'name' ? "translate-x-full opacity-0" : "-translate-x-full opacity-0"
                          )}
                        >
                          <input
                            type="text"
                            value={prospectCompany}
                            onChange={(e) => setProspectCompany(e.target.value)}
                            placeholder="What company are they at?"
                            className="flex-1 px-4 py-3 text-sm bg-transparent focus:outline-none"
                            onKeyDown={(e) => {
                              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && prospectCompany) {
                                e.preventDefault()
                                handleChatSubmit()
                              }
                            }}
                          />
                          <button
                            onClick={handleChatSubmit}
                            disabled={!prospectCompany}
                            className="px-6 py-3 text-sm font-medium text-turbo-beige bg-turbo-blue hover:bg-turbo-blue/90 disabled:opacity-50 rounded-full transition-colors"
                          >
                            Submit
                          </button>
                      </div>

                        {/* Display State */}
                        <div 
                          className={cn(
                            "w-full flex items-center justify-between absolute inset-0 transition-all duration-300",
                            inputMode === 'display' ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-turbo-black">{prospectName}</span>
                            <span className="text-sm text-turbo-black/60">at {prospectCompany}</span>
                </div>
                          <button
                            onClick={handleNewContact}
                            className="px-6 py-3 text-sm font-medium text-turbo-beige bg-turbo-blue hover:bg-turbo-blue/90 rounded-full transition-colors flex items-center gap-2"
                          >
                            New Contact
                            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-white/30 bg-white/10 px-1.5 font-mono text-[10px] font-medium">
                              <Command className="h-3 w-3" />
                              <span className="text-xs">H</span>
                            </kbd>
                          </button>
              </div>
                    </div>
                  </div>
                  </div>
                </div>
              ) : (
                // Original Current Prospect Bar
                <div className="flex items-center justify-between bg-white rounded-lg border-2 border-turbo-black/10 p-4 overflow-hidden">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col relative h-[48px] w-[300px]">
                      {prospects.map((prospect, index) => (
                        <div
                          key={prospect.id}
                          className={cn(
                            "absolute top-0 left-0 w-full h-full flex flex-col justify-center transition-all duration-300",
                            index === currentProspectIndex 
                              ? "translate-y-0 opacity-100 pointer-events-auto" 
                              : index < currentProspectIndex
                                ? "-translate-y-12 opacity-0 pointer-events-none"
                                : "translate-y-12 opacity-0 pointer-events-none"
                          )}
                          style={{
                            transform: `translateY(${index === currentProspectIndex ? 0 : index < currentProspectIndex ? -48 : 48}px)`
                          }}
                        >
                          <div className="flex flex-col justify-center">
                            <span className="text-sm font-medium text-turbo-black truncate leading-tight">{prospect.name}</span>
                            <span className="text-xs text-turbo-black/60 truncate leading-tight">{prospect.company}</span>
                          </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  <div className="flex items-center gap-4">
                    {/* Status Indicator */}
                    <div className="flex items-center gap-1">
                      {(() => {
                        const status = prospectStatuses[currentProspect?.id || ''] || 'pending'
                        if (status === 'researching' || status === 'generating_emails') {
                          return (
                            <div className="w-4 h-4 border-2 border-turbo-blue border-t-transparent rounded-full animate-spin" />
                          )
                        } else if (status === 'ready') {
                          return (
                            <svg className="w-4 h-4 text-turbo-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )
                        } else {
                          return (
                            <svg className="w-4 h-4 text-turbo-black/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )
                        }
                      })()}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-center">
                        <button 
                          onClick={goToPreviousProspect}
                          disabled={currentProspectIndex === 0}
                          className="p-1 text-turbo-black/40 hover:text-turbo-blue transition-colors disabled:opacity-30"
                        >
                          <ArrowLeft className="w-4 h-4 rotate-90" />
                        </button>
                        <kbd className="mt-1 inline-flex h-5 items-center gap-1 rounded border border-turbo-black/30 bg-turbo-black/5 px-1.5 font-mono text-[10px] font-medium text-turbo-black/60">
                          I
                        </kbd>
                      </div>
                      <div className="flex flex-col items-center">
                        <button 
                          onClick={goToNextProspect}
                          disabled={currentProspectIndex === prospects.length - 1}
                          className="p-1 text-turbo-black/40 hover:text-turbo-blue transition-colors disabled:opacity-30"
                        >
                          <ArrowLeft className="w-4 h-4 -rotate-90" />
                        </button>
                        <kbd className="mt-1 inline-flex h-5 items-center gap-1 rounded border border-turbo-black/30 bg-turbo-black/5 px-1.5 font-mono text-[10px] font-medium text-turbo-black/60">
                          K
                        </kbd>
                    </div>
                      <span className="text-sm text-turbo-black/60 ml-2">
                        {currentProspectIndex + 1}/{prospects.length}
                      </span>
                </div>
              </div>
            </div>
              )}

              {/* Email Composer */}
              <div className="flex-1 rounded-lg border-2 border-turbo-black/10 p-6 overflow-hidden flex flex-col bg-white">
                <h3 className="text-xl font-semibold mb-6 text-turbo-black">What You're Going to Send <span className="text-turbo-black/60">(editable)</span></h3>
                <div className="flex-1 relative">
                  {isGeneratingEmails || (emailTemplates.length === 0 && (prospectStatuses[currentProspect?.id || ''] === 'researching' || prospectStatuses[currentProspect?.id || ''] === 'generating_emails')) ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-8 h-8 border-4 border-turbo-blue border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-turbo-black/60">Writing email starters...</p>
                      </div>
                  ) : emailTemplates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-turbo-black/40">
                      <p>No email templates available yet</p>
                    </div>
                  ) : (
                    <div 
                      className="absolute inset-0 transition-transform duration-300 ease-in-out"
                      style={{ transform: `translateX(${-currentTemplateIndex * 100}%)` }}
                    >
                      {emailTemplates.map((template, index) => (
                        <div 
                          key={index}
                          className="absolute inset-0 w-full transition-opacity duration-300 flex flex-col"
                          style={{ 
                            transform: `translateX(${index * 100}%)`,
                            opacity: currentTemplateIndex === index ? 1 : 0,
                            pointerEvents: currentTemplateIndex === index ? 'auto' : 'none'
                          }}
                        >
                          {queuedEmails.some(
                            email => email.prospectId === currentProspect?.id && email.templateIndex === index
                          ) && (
                            <div className="absolute top-0 right-0 bg-turbo-black/5 text-turbo-black/60 px-3 py-1 rounded-bl-lg text-sm flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Queued
                            </div>
                          )}
                          <div className="relative group mb-4">
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
                                }}
                                className="flex-1 p-2 border-b-2 border-transparent hover:border-turbo-black/10 focus:border-turbo-blue focus:outline-none transition-colors rounded-lg"
                                placeholder="Subject line..."
                              />
                  </div>
                </div>
                          <div className="relative group flex-1">
                            <textarea
                              value={template?.body || ''}
                              onChange={(e) => {
                                const newTemplates = [...emailTemplates]
                                newTemplates[index] = {
                                  ...template,
                                  body: e.target.value
                                }
                                setEmailTemplates(newTemplates)
                              }}
                              className="w-full h-full p-4 text-turbo-black whitespace-pre-wrap resize-none border-2 border-transparent hover:border-turbo-black/10 focus:border-turbo-blue focus:outline-none transition-colors rounded-lg bg-[#FAF9F6]"
                              placeholder="Email body content will go here..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              {/* Navigation and Send Controls */}
                <div className="flex items-center justify-between mt-6 px-4">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-turbo-black/40 whitespace-nowrap mb-2">Browse through email starters</span>
                    <div className="flex gap-8 items-center">
                      <div className="flex flex-col items-center">
                  <button 
                    onClick={goToPreviousTemplate}
                    disabled={currentTemplateIndex === 0 || isResearching}
                    className="p-2 text-turbo-black/40 hover:text-turbo-blue transition-colors disabled:opacity-30 disabled:hover:text-turbo-black/40"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                        <div className="flex flex-col items-center gap-1">
                          <kbd className="inline-flex h-5 items-center gap-1 rounded border border-turbo-black/30 bg-turbo-black/5 px-1.5 font-mono text-[10px] font-medium text-turbo-black/60">
                            J
                          </kbd>
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                  <button 
                    onClick={goToNextTemplate}
                    disabled={currentTemplateIndex === emailTemplates.length - 1 || isResearching}
                    className="p-2 text-turbo-black/40 hover:text-turbo-blue transition-colors disabled:opacity-30 disabled:hover:text-turbo-black/40"
                  >
                    <ArrowLeft className="w-6 h-6 rotate-180" />
                  </button>
                        <div className="flex flex-col items-center gap-1">
                          <kbd className="inline-flex h-5 items-center gap-1 rounded border border-turbo-black/30 bg-turbo-black/5 px-1.5 font-mono text-[10px] font-medium text-turbo-black/60">
                            L
                          </kbd>
                </div>
                      </div>
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
                    onClick={() => {
                      if (isCurrentTemplateQueued()) {
                        handleRemoveFromQueue()
                      } else {
                        chatMode ? handleQueueSingleEmail() : handleQueueEmail()
                      }
                    }}
                    disabled={isResearching || !emailTemplates[currentTemplateIndex] || (!currentProspect?.email && !chatMode)}
                    className={cn(
                      "px-6 py-3 rounded-full flex items-center gap-2 transition-colors",
                      isCurrentTemplateQueued()
                        ? "bg-turbo-black/10 text-turbo-black hover:bg-turbo-black/20"
                        : "bg-turbo-blue text-white hover:bg-turbo-blue/90",
                      "disabled:opacity-50",
                      // Hide button during name/company input
                      (inputMode === 'name' || inputMode === 'company') && "hidden"
                    )}
                  >
                    {isCurrentTemplateQueued() ? (
                      <>
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Queued</span>
                        </div>
                        <span className="text-xs opacity-60">(click to remove)</span>
                      </>
                    ) : (
                      <>
                        Queue Email
                        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-white/30 bg-white/10 px-1.5 font-mono text-[10px] font-medium">
                          <Command className="h-3 w-3" />
                          <span className="text-xs">↵</span>
                        </kbd>
                      </>
                    )}
                </button>
                </div>
              </div>
            </div>

            {/* Right Column - Prospect Info */}
            <div className="rounded-lg border-2 border-turbo-black/10 p-6 bg-white">
              {isResearching ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                  <div className="w-8 h-8 border-4 border-turbo-blue border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-turbo-black/60">Researching this lovely person...</p>
                  <p className="text-sm text-turbo-black/40 mt-2">Finding all the good stuff about them</p>
              </div>
              ) : !currentProspect ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                  <p className="text-turbo-black/40">No personal or company insights yet.</p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-turbo-black">{currentProspect?.name}</h2>
                      <p className="text-lg text-turbo-black/60">
                        {currentProspect?.title} 
                        {currentProspect?.title && currentProspect?.company && ' at '}
                        {currentProspect?.company}
                      </p>
                    </div>
                  </div>

                  {/* Personal Insights */}
                  {currentProspect?.research?.personInfo && currentProspect.research.personInfo.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm font-medium text-turbo-black mb-2">Personal Insights</p>
                      <div className="space-y-2">
                        {currentProspect.research.personInfo.map((info, index) => (
                          <div 
                            key={index}
                            className="text-sm text-turbo-black/60 pl-4 relative"
                          >
                            <div className="absolute left-0 top-[0.5em] w-1.5 h-1.5 rounded-full bg-turbo-blue" />
                            {info}
                      </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Company Insights */}
                  {currentProspect?.research?.companyInfo && currentProspect.research.companyInfo.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm font-medium text-turbo-black mb-2">Company Insights</p>
                      <div className="space-y-2">
                        {currentProspect.research.companyInfo.map((info, index) => (
                          <div 
                            key={index}
                            className="text-sm text-turbo-black/60 pl-4 relative"
                          >
                            <div className="absolute left-0 top-[0.5em] w-1.5 h-1.5 rounded-full bg-turbo-blue" />
                            {info}
                    </div>
                        ))}
                  </div>
                    </div>
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
                </>
              )}
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
              style={{ width: `${(currentStep / 4) * 100}%` }}
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

            {/* Question 2 - Message Style */}
            <Question 
              isActive={currentStep === 2} 
              direction={slideDirection}
              step={2}
              currentStep={currentStep}
            >
              <div className="space-y-8">
                <h2 className="text-4xl font-bold tracking-tight text-turbo-black">
                  Choose which high-converting messaging style you want
                </h2>
                <div className="grid gap-4">
                  <button
                    onClick={() => handleMessageStyleSelect('direct')}
                    className={cn(
                      "p-6 text-left rounded-lg border-2 transition-colors",
                      messageStyle === 'direct'
                        ? 'border-turbo-blue bg-turbo-blue text-turbo-beige'
                        : 'border-turbo-black hover:bg-turbo-black/5'
                    )}
                  >
                    <div className="space-y-2">
                      <div className="font-semibold">Direct & Professional</div>
                      <p className="text-sm opacity-80">Clear and straight to the point. Perfect for busy executives and formal industries.</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleMessageStyleSelect('casual')}
                    className={cn(
                      "p-6 text-left rounded-lg border-2 transition-colors",
                      messageStyle === 'casual'
                        ? 'border-turbo-blue bg-turbo-blue text-turbo-beige'
                        : 'border-turbo-black hover:bg-turbo-black/5'
                    )}
                  >
                    <div className="space-y-2">
                      <div className="font-semibold">Casual & Friendly</div>
                      <p className="text-sm opacity-80">Warm and conversational. Great for creative industries and building personal connections.</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleMessageStyleSelect('storytelling')}
                    className={cn(
                      "p-6 text-left rounded-lg border-2 transition-colors",
                      messageStyle === 'storytelling'
                        ? 'border-turbo-blue bg-turbo-blue text-turbo-beige'
                        : 'border-turbo-black hover:bg-turbo-black/5'
                    )}
                  >
                    <div className="space-y-2">
                      <div className="font-semibold">Story-Driven</div>
                      <p className="text-sm opacity-80">Engaging and narrative-focused. Ideal for building emotional connections and memorable outreach.</p>
                    </div>
                  </button>
                </div>
              </div>
            </Question>

            {/* Question 3 - Has List (previously Question 2) */}
            <Question 
              isActive={currentStep === 3} 
              direction={slideDirection}
              step={3}
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

            {/* Question 4 */}
            <Question 
              isActive={currentStep === 4} 
              direction={slideDirection}
              step={4}
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
                      "border-turbo-black hover:bg-turbo-black/5",
                      "border-turbo-blue hover:bg-turbo-blue/5",
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