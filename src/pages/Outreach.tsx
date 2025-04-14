import { Layout } from '@/components/Layout'
import { useState, useEffect, useCallback } from 'react'
import { Command } from 'lucide-react'
import { queryPerplexity } from '@/services/perplexity'
import { createEmailTemplates } from '@/services/email'
import { Prospect, UserInfo, EmailTemplate, ProspectResearch } from '@/types/outreach'
import { useAuth } from '@/contexts/AuthContext'
import { OutreachHeader } from '@/components/outreach/OutreachHeader'
import { OutreachSettings, MessageStyle, OutreachType } from '@/components/outreach/OutreachSettings'
import { EmailComposer } from '@/components/outreach/EmailComposer'
import { ProspectInfo } from '@/components/outreach/ProspectInfo'
import { OutreachInput } from '@/components/outreach/OutreachInput'

type HasList = 'yes' | 'no' | null

// Add new state types and enums
type ProspectStatus = 'pending' | 'researching' | 'research_complete' | 'generating_emails' | 'ready'
type InputMode = 'name' | 'company' | 'display'

// Add new state for queued emails
interface QueuedEmail {
  prospectId: string
  prospectName: string
  prospectEmail: string
  subject: string
  body: string
  templateIndex: number
}

// Define column mapping types
type ColumnKey = 'firstName' | 'lastName' | 'fullName' | 'email' | 'company' | 'title' | 'industry' | 'size'
type ColumnMappings = Record<ColumnKey, string[]>

// Define expected columns and their variations
const COLUMN_MAPPINGS: ColumnMappings = {
  firstName: ['first name', 'firstname', 'first_name', 'given name'],
  lastName: ['last name', 'lastname', 'last_name', 'surname', 'family name'],
  fullName: ['name', 'full name', 'contact name', 'person', 'contact'],
  email: ['email', 'email address', 'contact email', 'e-mail', 'email_address'],
  company: ['company', 'company name', 'organization', 'business', 'Company Name for Emails', 'company_name'],
  title: ['title', 'job title', 'position', 'role', 'job_title'],
  industry: ['industry', 'sector', 'business type', 'company_industry'],
  size: ['size', 'company size', 'employees', 'team size', 'company_size']
}

// Helper function to split full name into first and last name
const splitFullName = (fullName: string): { firstName: string; lastName: string } => {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' }
  }
  const firstName = parts[0]
  const lastName = parts.slice(1).join(' ')
  return { firstName, lastName }
}

// Helper function to find matching column
const findMatchingColumn = (headers: string[], targetField: ColumnKey): number => {
  const variations = COLUMN_MAPPINGS[targetField]
  const headerIndex = headers.findIndex(header => {
    if (!header) return false
    const cleanHeader = header.toLowerCase().trim()
    return variations.some(variation => 
      cleanHeader === variation.toLowerCase() ||
      cleanHeader.includes(variation.toLowerCase())
    )
  })
  return headerIndex
}

// Helper function to safely extract value from CSV row
const extractValue = (values: string[], columnIndex: number): string => {
  if (columnIndex < 0 || columnIndex >= values.length) return ''
  const value = values[columnIndex]
  return value ? value.trim().replace(/^["']|["']$/g, '') : ''
}

const OutreachContent = () => {
  const { incrementTasksUsed, profile } = useAuth()
  
  // Add back necessary constants
  const RESEARCH_WINDOW_SIZE = 3

  // Move all state declarations to the top
  const [chatMode, setChatMode] = useState(() => {
    const saved = localStorage.getItem('outreachChatMode')
    return saved ? JSON.parse(saved) : true
  })
  const [inputMode, setInputMode] = useState<InputMode>('name')
  const [prospectName, setProspectName] = useState('')
  const [prospectCompany, setProspectCompany] = useState('')
  const [outreachType, setOutreachType] = useState<OutreachType>(profile?.outreach_type as OutreachType || 'getClients')
  const [messageStyle, setMessageStyle] = useState<MessageStyle>('direct')
  const [hasList, setHasList] = useState<HasList>('no')
  const [showMainUI, setShowMainUI] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [currentProspectIndex, setCurrentProspectIndex] = useState(0)
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0)
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  const [isResearching, setIsResearching] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isGeneratingEmails, setIsGeneratingEmails] = useState(false)
  const [processingQueue, setProcessingQueue] = useState<Set<string>>(new Set())
  const [prospectStatuses, setProspectStatuses] = useState<Record<string, ProspectStatus>>({})
  const [queuedEmails, setQueuedEmails] = useState<QueuedEmail[]>([])
  const [isMobile, setIsMobile] = useState(false)

  const currentProspect = prospects[currentProspectIndex]

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'text/csv') {
      setIsLoading(true)
      setChatMode(false)
      try {
        await parseCSV(file)
        setShowMainUI(true)
      } catch (error) {
        console.error('Error parsing CSV:', error)
        setIsLoading(false)
      }
    }
  }

  // Add effect to check for mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 768 // 768px is standard tablet/mobile breakpoint
      if (isMobileView !== isMobile) {
        setIsMobile(isMobileView)
      }
    }
    
    checkMobile() // Check initially
    window.addEventListener('resize', checkMobile) // Listen for resize
    
    return () => window.removeEventListener('resize', checkMobile) // Cleanup
  }, [isMobile])

  // Handle selections
  const handleHasListSelect = (value: HasList) => {
    setHasList(value)
    if (value === 'no') {
      setChatMode(true)
      setIsLoading(true)
      setShowMainUI(true)
    }
  }

  // Navigation functions
  const goToNextTemplate = () => {
    if (currentTemplateIndex < emailTemplates.length - 1) {
      setCurrentTemplateIndex((prev: number) => prev + 1)
    }
  }

  const goToPreviousTemplate = () => {
    if (currentTemplateIndex > 0) {
      setCurrentTemplateIndex((prev: number) => prev - 1)
    }
  }

  const goToNextProspect = () => {
    if (currentProspectIndex < prospects.length - 1) {
      setCurrentProspectIndex((prev: number) => prev + 1)
    }
  }

  const goToPreviousProspect = () => {
    if (currentProspectIndex > 0) {
      setCurrentProspectIndex((prev: number) => prev - 1)
    }
  }

  // Queue management
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

  const handleRemoveFromQueue = () => {
    setQueuedEmails((prev: QueuedEmail[]) => 
      prev.filter(
        email => !(email.prospectId === currentProspect?.id && email.templateIndex === currentTemplateIndex)
      )
    )
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
        userInfo
      })

      const templates = await createEmailTemplates(prospect, research, {
        ...userInfo,
        outreachType: outreachType || 'getClients',
        messageStyle: messageStyle || 'direct'
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

      // Increment tasks counter after successful generation
      await incrementTasksUsed()

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

  // Load user info from profile
  useEffect(() => {
    console.log('🔄 Loading user info from profile...')
    if (profile) {
      const userInfoFromProfile: UserInfo = {
        name: profile.name || 'User',
        company: profile.company_name || 'Your Company',
        companyName: profile.company_name || 'Your Company',
        role: profile.role || 'Professional',
        email: profile.email || '',
        businessType: profile.business_type || 'business',
        messageStyle: (profile.message_style as MessageStyle) || 'direct',
        outreachType: (profile.outreach_type as OutreachType) || 'getClients'
      }
      console.log('✅ Successfully loaded user info from profile:', userInfoFromProfile)
      setUserInfo(userInfoFromProfile)
    } else {
      console.log('ℹ️ Creating default user info based on outreach type')
      // Create default user info based on outreach type
      const defaultUserInfo: UserInfo = {
        name: 'User',
        company: 'Your Company',
        companyName: 'Your Company',
        role: 'Professional',
        email: '',
        businessType: outreachType || 'business',
        messageStyle: 'direct',
        outreachType: outreachType || 'getClients'
      }
      setUserInfo(defaultUserInfo)
    }
  }, [profile, outreachType])

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

  // Loading effect
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [isLoading])

  // Update handleNewContact to generate a unique ID for new contacts
  const handleNewContact = () => {
    // Log queued emails before clearing state
    console.log('Currently queued emails:', queuedEmails)
    
    // Reset all input and UI states
    setProspectName('')
    setProspectCompany('')
    setInputMode('name')
    
    // Clear email templates and reset all template-related states
    setEmailTemplates([])
    setCurrentTemplateIndex(0)
    setIsResearching(false)
    setIsGeneratingEmails(false)
    
    // Only clear prospects if in chat mode to preserve list functionality
    if (chatMode) {
      // Instead of creating an empty prospect, we'll clear the prospects array
      // This prevents the useEffect from triggering email generation
      setProspects([])
      // Also clear the prospect status to ensure fresh UI state
      setProspectStatuses({})
    }
    
    // Log queued emails after clearing state to verify they're preserved
    console.log('Queued emails after reset:', queuedEmails)
  }

  // Update handleChatSubmit to handle first and last name
  const handleChatSubmit = async () => {
    if (!userInfo) return

    setInputMode('display')
    setIsResearching(true)

    // Split the entered name into first and last name
    const { firstName, lastName } = splitFullName(prospectName)

    // Create a single prospect with a unique ID
    const newProspect: Prospect = {
      id: `single-prospect-${Date.now()}`,
      firstName,
      lastName,
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

  // Add batch send function
  const handleBatchSend = () => {
    queuedEmails.forEach(email => {
      const mailtoLink = `mailto:${email.prospectEmail}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`
      window.open(mailtoLink, '_blank')
    })
    setQueuedEmails([])
  }

  // Update the keyboard navigation handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts if user is editing text
    if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
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
    prospects.length, 
    currentProspectIndex, 
    queuedEmails.length,
    chatMode,
    handleNewContact,
    goToPreviousTemplate,
    goToNextTemplate,
    goToPreviousProspect,
    goToNextProspect,
    handleQueueSingleEmail,
    handleQueueEmail,
    handleBatchSend
  ])

  // Reset emails sent counter at midnight
  useEffect(() => {
    const now = new Date()
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const timeUntilMidnight = tomorrow.getTime() - now.getTime()

    const timer = setTimeout(() => {
      setQueuedEmails([])
    }, timeUntilMidnight)

    return () => clearTimeout(timer)
  }, [queuedEmails])

  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Update the localStorage effects
  useEffect(() => {
    localStorage.setItem('outreachChatMode', JSON.stringify(chatMode))
  }, [chatMode])

  useEffect(() => {
    localStorage.setItem('outreachInputMode', JSON.stringify(inputMode))
  }, [inputMode])

  useEffect(() => {
    localStorage.setItem('outreachProspectName', JSON.stringify(prospectName))
  }, [prospectName])

  useEffect(() => {
    localStorage.setItem('outreachProspectCompany', JSON.stringify(prospectCompany))
  }, [prospectCompany])

  useEffect(() => {
    localStorage.setItem('outreachType', JSON.stringify(outreachType))
  }, [outreachType])

  useEffect(() => {
    localStorage.setItem('outreachMessageStyle', JSON.stringify(messageStyle))
  }, [messageStyle])

  useEffect(() => {
    localStorage.setItem('outreachHasList', JSON.stringify(hasList))
  }, [hasList])

  useEffect(() => {
    localStorage.setItem('outreachShowMainUI', JSON.stringify(showMainUI))
  }, [showMainUI])

  useEffect(() => {
    localStorage.setItem('outreachProspects', JSON.stringify(prospects))
  }, [prospects])

  useEffect(() => {
    localStorage.setItem('outreachCurrentProspectIndex', JSON.stringify(currentProspectIndex))
  }, [currentProspectIndex])

  useEffect(() => {
    localStorage.setItem('outreachEmailTemplates', JSON.stringify(emailTemplates))
  }, [emailTemplates])

  useEffect(() => {
    localStorage.setItem('outreachQueuedEmails', JSON.stringify(queuedEmails))
  }, [queuedEmails])

  useEffect(() => {
    localStorage.setItem('outreachProspectStatuses', JSON.stringify(prospectStatuses))
  }, [prospectStatuses])

  useEffect(() => {
    localStorage.setItem('outreachCurrentTemplateIndex', JSON.stringify(currentTemplateIndex))
  }, [currentTemplateIndex])

  // Update the beforeUnload handler
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem('outreachChatMode')
      localStorage.removeItem('outreachInputMode')
      localStorage.removeItem('outreachProspectName')
      localStorage.removeItem('outreachProspectCompany')
      localStorage.removeItem('outreachType')
      localStorage.removeItem('outreachMessageStyle')
      localStorage.removeItem('outreachHasList')
      localStorage.removeItem('outreachShowMainUI')
      localStorage.removeItem('outreachProspects')
      localStorage.removeItem('outreachCurrentProspectIndex')
      localStorage.removeItem('outreachEmailTemplates')
      localStorage.removeItem('outreachQueuedEmails')
      localStorage.removeItem('outreachProspectStatuses')
      localStorage.removeItem('outreachCurrentTemplateIndex')
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // Parse CSV function
  const parseCSV = async (file: File) => {
    console.log('🔄 Starting CSV parsing...')
    try {
      const text = await file.text()
      const rows = text.split('\n').map(row => row.trim()).filter(row => row)
      
      if (rows.length === 0) {
        throw new Error('CSV file is empty')
      }

      // Clean and normalize headers
      const headers = rows[0].split(',').map(header => header?.trim().toLowerCase() || '')
      console.log('📊 Found headers:', headers)

      // Find indices for our required columns
      const columnIndices = {
        firstName: findMatchingColumn(headers, 'firstName'),
        lastName: findMatchingColumn(headers, 'lastName'),
        fullName: findMatchingColumn(headers, 'fullName'),
        email: findMatchingColumn(headers, 'email'),
        company: findMatchingColumn(headers, 'company'),
        title: findMatchingColumn(headers, 'title'),
        industry: findMatchingColumn(headers, 'industry'),
        size: findMatchingColumn(headers, 'size')
      }

      console.log('📊 Column mapping results:', columnIndices)

      const parsedProspects = rows.slice(1)
        .map((row, index) => {
          try {
            // Split the row and clean each value
            const values = row.split(',').map(value => value?.trim() || '')
            
            // Handle name fields
            let firstName = ''
            let lastName = ''
            
            // First try to get first name and last name from separate columns
            if (columnIndices.firstName >= 0 || columnIndices.lastName >= 0) {
              firstName = extractValue(values, columnIndices.firstName)
              lastName = extractValue(values, columnIndices.lastName)
            }
            
            // If separate name fields aren't found or are empty, try to split full name
            if ((!firstName && !lastName) && columnIndices.fullName >= 0) {
              const fullName = extractValue(values, columnIndices.fullName)
              if (fullName) {
                const nameParts = fullName.split(/\s+/)
                firstName = nameParts[0] || ''
                lastName = nameParts.slice(1).join(' ') || ''
              }
            }

            // Create prospect object with all available data
            const prospect: Prospect = {
              id: `prospect-${Date.now()}-${index}`,
              firstName: firstName || '',
              lastName: lastName || '',
              name: `${firstName} ${lastName}`.trim() || extractValue(values, columnIndices.fullName) || 'Unknown',
              email: extractValue(values, columnIndices.email),
              company: extractValue(values, columnIndices.company),
              title: extractValue(values, columnIndices.title),
              industry: extractValue(values, columnIndices.industry),
              size: extractValue(values, columnIndices.size)
            }

            // Log each parsed prospect for debugging
            console.log(`📊 Parsed prospect ${index + 1}:`, prospect)
            
            return prospect
          } catch (error) {
            console.error(`Error parsing row ${index + 1}:`, error)
            return null
          }
        })
        .filter((prospect): prospect is Prospect => {
          if (!prospect) return false
          
          // Ensure we have at least some valid data
          const hasName = prospect.firstName || prospect.lastName || prospect.name
          const hasIdentifier = hasName || prospect.email || prospect.company
          
          if (!hasIdentifier) {
            console.warn('Skipping prospect with no identifying information:', prospect)
            return false
          }
          
          return true
        })

      if (parsedProspects.length === 0) {
        throw new Error('No valid prospects found in CSV. Please check the file format.')
      }

      console.log(`✅ Successfully parsed ${parsedProspects.length} prospects from CSV`)
      setProspects(parsedProspects)
      setCurrentProspectIndex(0)
      return parsedProspects
    } catch (error) {
      console.error('Error parsing CSV:', error)
      throw error
    }
  }

  // Helper function to regenerate emails for current prospect
  const regenerateEmailsForCurrentProspect = async (newOutreachType?: OutreachType, newMessageStyle?: MessageStyle) => {
    if (!currentProspect?.research || !userInfo) return
    
    console.log('🔄 Regenerating emails with new settings...')
    setIsGeneratingEmails(true)
    
    try {
      const templates = await createEmailTemplates(
        currentProspect,
        currentProspect.research,
        {
          ...userInfo,
          outreachType: newOutreachType || outreachType || 'getClients',
          messageStyle: newMessageStyle || messageStyle || 'direct'
        }
      )
      
      // Update the prospects array with new templates
      setProspects(prevProspects => {
        const updatedProspects = [...prevProspects]
        const index = updatedProspects.findIndex(p => p.id === currentProspect.id)
        if (index !== -1) {
          updatedProspects[index] = {
            ...updatedProspects[index],
            emailTemplates: templates
          }
        }
        return updatedProspects
      })
      
      // Update current email templates
      setEmailTemplates(templates)
      setCurrentTemplateIndex(0)
    } catch (error) {
      console.error('Error regenerating emails:', error)
    } finally {
      setIsGeneratingEmails(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <OutreachHeader />
        {(prospects.length > 0 || currentProspect || isResearching || isGeneratingEmails) && (
          <button
            onClick={handleNewContact}
            className="px-4 py-2 bg-turbo-blue text-white rounded-lg hover:bg-turbo-blue/90 transition-colors flex items-center gap-2"
          >
            New Contact
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-white/30 bg-white/10 px-1.5 font-mono text-[10px] font-medium">
              <Command className="h-3 w-3" />
              <span className="text-xs">H</span>
            </kbd>
          </button>
        )}
      </div>

      <div className="grid grid-cols-[1fr_350px] gap-6">
        <div className="flex flex-col gap-4">
          {(!prospects.length || !currentProspect) && !isResearching && !isGeneratingEmails ? (
            <div className="rounded-lg border-2 border-turbo-black/10 p-4 bg-white">
              <OutreachInput
                prospectName={prospectName}
                setProspectName={setProspectName}
                prospectCompany={prospectCompany}
                setProspectCompany={setProspectCompany}
                inputMode={inputMode}
                setInputMode={setInputMode}
                handleChatSubmit={handleChatSubmit}
                handleFileChange={handleFileChange}
                hasList={hasList}
                setHasList={handleHasListSelect}
              />
            </div>
          ) : (
            <EmailComposer
              isGeneratingEmails={isGeneratingEmails}
              emailTemplates={emailTemplates}
              currentTemplateIndex={currentTemplateIndex}
              setEmailTemplates={setEmailTemplates}
              goToPreviousTemplate={goToPreviousTemplate}
              goToNextTemplate={goToNextTemplate}
              currentProspect={currentProspect}
              prospectStatuses={prospectStatuses}
              queuedEmails={queuedEmails}
              onQueueEmail={handleQueueEmail}
              onRemoveFromQueue={handleRemoveFromQueue}
            />
          )}

          <OutreachSettings
            outreachType={outreachType}
            messageStyle={messageStyle}
            setOutreachType={setOutreachType}
            setMessageStyle={setMessageStyle}
            profile={profile}
            setProfile={setUserInfo}
            userInfo={userInfo}
            setUserInfo={setUserInfo}
            onRegenerateEmails={regenerateEmailsForCurrentProspect}
          />
        </div>

        <ProspectInfo
          prospect={currentProspect}
          isResearching={isResearching}
        />
      </div>

      {/* Send Queued Button */}
      {queuedEmails.length > 0 && (
        <div className="fixed bottom-8 right-8">
          <button
            onClick={handleBatchSend}
            className="px-6 py-3 bg-turbo-blue text-white rounded-full hover:bg-turbo-blue/90 transition-colors flex items-center gap-2 shadow-lg"
          >
            Send {queuedEmails.length} Queued
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-white/30 bg-white/10 px-1.5 font-mono text-[10px] font-medium">
              <Command className="h-3 w-3" />
              <span className="text-xs">B</span>
            </kbd>
          </button>
        </div>
      )}
    </div>
  )
}

export default function Outreach() {
  const { initialized } = useAuth()

  if (!initialized) {
    return (
      <div className="min-h-screen bg-turbo-beige flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-turbo-black/20 border-t-turbo-black rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <Layout>
      <OutreachContent />
    </Layout>
  )
} 