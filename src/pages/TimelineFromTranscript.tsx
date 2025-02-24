import { useState, useEffect } from 'react'
import { FormDataWithWeather } from '@/types/forms'
import { getUserInfoFromProfile, getSystemPrompts, getUserPrompt } from '@/config/prompts'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/rainbow-toast'
import { createChatCompletion } from '@/services/openai'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import { creditsManager } from '@/utils/credits'
import { useCompanyInfo } from '@/contexts/CompanyInfoContext'
import { Layout } from '@/components/Layout'
import { SegmentCard, TimelineVisual, TimelineDescription, TimelineData } from '@/components/timeline'
import { useAuth } from '@/contexts/AuthContext'

type ViewState = 'input' | 'loading' | 'result'

const ViewState: Record<'Input' | 'Loading' | 'Result', ViewState> = {
  Input: 'input',
  Loading: 'loading',
  Result: 'result'
}

const BUSINESS_QUOTES = [
  "If you can't sit still, ignore notifications, and focus on one task for eight hours straight, never expect to build something great.",
  "The best way to hit next year's goals is to not wait until next year to work on them.",
  "The reason it's taking so long is because you're in a rush.",
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
    <div className="absolute inset-0 bg-turbo-beige flex flex-col items-center justify-center z-10">
      <div className="max-w-2xl w-full px-4">
        <div className="w-12 h-12 border-4 border-turbo-black/20 border-t-turbo-black rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-turbo-black text-lg font-medium text-center mb-12">
          Hold tight... Turbo is doing tedious work for you...
        </p>
        <div className="bg-turbo-black/5 border-2 border-turbo-black rounded-lg p-6">
          <p className="text-2xl font-bold text-turbo-black mb-3 text-left">💭 Words of Wisdom</p>
          <p className="text-lg text-turbo-black leading-relaxed">
            "{BUSINESS_QUOTES[quoteIndex]}"
          </p>
        </div>
      </div>
    </div>
  )
}

type TimelineResult = {
  content: string | TimelineData
  totalDuration?: number
}

export default function TimelineFromTranscript() {
  const { isInfoSaved } = useCompanyInfo()
  const { initialized, session, incrementTasksUsed } = useAuth()
  const [formData, setFormData] = useState<FormDataWithWeather>({})
  const [viewState, setViewState] = useState<ViewState>(ViewState.Input)
  const [result, setResult] = useState<TimelineResult | null>(null)
  const [selectedFileName, setSelectedFileName] = useState('')
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState(0)

  const fields = [
    { 
      id: 'transcriptFile', 
      label: 'Transcript File', 
      type: 'file', 
      placeholder: 'Upload your transcript file',
      accept: '.txt,text/plain',
      helpLink: 'https://www.youtube.com/watch?v=fwHZYS0tduE',
      helpText: 'teach me how to get this file'
    },
    { id: 'clientName', label: 'Client Name', type: 'text', placeholder: 'Enter client name' },
    { id: 'purpose', label: 'Purpose of Video', type: 'textarea', placeholder: 'What is the main purpose or goal of this video?' },
    { id: 'length', label: 'Length of Video', type: 'text', placeholder: 'Desired final video length' },
    { id: 'tone', label: 'Tone of Video', type: 'text', placeholder: 'Desired tone or style of the video' },
    { id: 'additionalNotes', label: 'Additional Notes', type: 'textarea', placeholder: 'Please provide as much detail as possible about what you want to achieve with this video, including any specific moments or themes you want to highlight' }
  ]

  const isFormValid = () => {
    console.log('Checking form validation...')
    console.log('Current formData:', formData)
    
    const validation = fields.every(field => {
      const value = formData[field.id]
      console.log(`Validating field ${field.id}:`, { value, type: field.type })
      
      if (field.type === 'file') {
        const isValid = Boolean(value && typeof value === 'string' && value.length > 0)
        console.log(`File field ${field.id} validation:`, isValid)
        return isValid
      }
      
      const isValid = Boolean(value && typeof value === 'string' && value.trim().length > 0)
      console.log(`Field ${field.id} validation:`, isValid)
      return isValid
    })
    
    console.log('Form validation result:', validation)
    console.log('isInfoSaved:', isInfoSaved)
    console.log('viewState:', viewState)
    return validation
  }

  const handleTestData = async () => {
    try {
      const response = await fetch('/outbound-transcript.txt')
      if (!response.ok) {
        throw new Error('Failed to fetch transcript file')
      }
      const transcriptContent = await response.text()
      
      setFormData({
        clientName: 'Outbound Hotels',
        purpose: "We're creating an investor video that's supposed to explain all of the different parts of Outbound Hotels, how the company came to be, and also why it's so great",
        length: '3 minutes max',
        tone: 'uplifting, fun',
        additionalNotes: 'There are 4 different speakers and they all need to have a section of talking',
        transcriptFile: transcriptContent
      })
      setSelectedFileName('outbound-transcript.txt')
    } catch (error) {
      console.error('Failed to load transcript file:', error)
      toast.error('Failed to load transcript file')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Submit attempted')
    console.log('Current formData:', formData)
    
    const valid = isFormValid()
    console.log('Form validation on submit:', valid)
    
    if (!valid) {
      console.log('Form validation failed')
      toast.error('Please fill in all required fields')
      return
    }

    if (creditsManager.getCredits() <= 0) {
      console.log('No credits remaining')
      toast.error('No credits remaining')
      return
    }

    console.log('Starting submission...')
    setViewState(ViewState.Loading)
    
    try {
      console.log('🔄 Getting user info for timeline generation...')
      const userInfo = session?.user?.id ? await getUserInfoFromProfile(session.user.id) : null
      
      if (!userInfo) {
        console.error('❌ No user info available')
        toast.error('User information is required. Please complete your profile.')
        setViewState(ViewState.Input)
        return
      }
      
      console.log('📝 Generating timeline with user info:', userInfo)
      
      const messages = [
        {
          role: "system" as const,
          content: getSystemPrompts('timelineFromTranscript', userInfo)
        },
        {
          role: "user" as const,
          content: getUserPrompt('timelineFromTranscript', formData, userInfo)
        }
      ]

      const response = await createChatCompletion(messages)
      
      if (!response) {
        throw new Error('Failed to generate content')
      }

      creditsManager.useCredit()
      await incrementTasksUsed()

      let content = response.content || ''
      
      try {
        const jsonData = JSON.parse(content) as TimelineData
        const totalDuration = parseInt(jsonData.totalRunTime.split(' ')[0]) // Assuming format "180 seconds"
        
        setResult({ 
          content: jsonData,
          totalDuration
        })
        setViewState(ViewState.Result)
      } catch (error) {
        console.error('Error parsing timeline JSON:', error)
        toast.error('Error parsing timeline data')
        content = response.content || ''
        setResult({ content })
        setViewState(ViewState.Result)
      }
    } catch (error) {
      console.error('❌ Error generating timeline:', error)
      toast.error('Failed to generate content. Please try again.')
      setViewState(ViewState.Input)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        const valid = isFormValid()
        if (valid && viewState !== ViewState.Loading) {
          handleSubmit({ preventDefault: () => {} } as React.FormEvent)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewState, formData, isFormValid, handleSubmit])

  const handleFieldChange = (fieldId: string, value: string) => {
    console.log('Field changed:', fieldId, value)
    setFormData(prev => {
      const newData = {
        ...prev,
        [fieldId]: value
      }
      console.log('Updated formData:', newData)
      return newData
    })
  }

  const markdownComponents: Components = {
    h1: (props) => <h1 className="text-2xl font-bold mb-4 text-turbo-black" {...props} />,
    h2: (props) => <h2 className="text-xl font-bold mb-3 text-turbo-black" {...props} />,
    h3: (props) => <h3 className="text-lg font-bold mb-2 text-turbo-black" {...props} />,
    p: (props) => <p className="mb-2 text-turbo-black" {...props} />,
    ul: (props) => <ul className="list-disc pl-6 mb-4 text-turbo-black" {...props} />,
    li: (props) => <li className="mb-1 text-turbo-black" {...props} />,
    strong: (props) => <strong className="font-bold text-turbo-black" {...props} />,
    em: (props) => <em className="italic text-turbo-black" {...props} />
  }

  return (
    <Layout>
      <div className="bg-turbo-beige min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-8 relative min-h-[calc(100vh-4rem)]">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-turbo-black mb-2">Timeline from Transcript</h1>
            <p className="text-lg text-turbo-black/60">
              Convert interview transcripts into organized timelines automatically, cutting post-production planning time in half.
            </p>
          </div>

          {viewState === ViewState.Loading && <LoadingOverlay />}

          {viewState === ViewState.Input && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-turbo-beige border-2 border-turbo-black rounded-lg p-6 space-y-6">
                {fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id} className="text-sm font-medium text-turbo-black">
                      {field.label}
                      <span className="text-[#E94E1B] ml-1">*</span>
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
                    {field.type === 'file' ? (
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
                    ) : field.type === 'textarea' ? (
                      <textarea
                        id={field.id}
                        className="flex min-h-[100px] w-full rounded-md border border-turbo-black bg-turbo-beige px-3 py-2 text-base text-turbo-black placeholder:text-turbo-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-turbo-blue focus-visible:ring-offset-2"
                        placeholder={field.placeholder}
                        value={formData[field.id] as string || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      />
                    ) : (
                      <input
                        id={field.id}
                        type={field.type}
                        className="flex h-10 w-full rounded-md border border-turbo-black bg-turbo-beige px-3 py-2 text-base text-turbo-black placeholder:text-turbo-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-turbo-blue focus-visible:ring-offset-2"
                        placeholder={field.placeholder}
                        value={formData[field.id] as string || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleTestData}
                  className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-turbo-black hover:text-turbo-white bg-turbo-beige hover:bg-turbo-blue border-2 border-turbo-black rounded-full transition-colors"
                >
                  Fill Test Data
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid() || viewState === ViewState.Loading}
                  className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-turbo-beige bg-turbo-black hover:bg-turbo-blue rounded-full transition-colors disabled:opacity-80 disabled:bg-turbo-black/40 disabled:cursor-not-allowed disabled:text-turbo-beige group relative"
                >
                  <span className="flex items-center justify-center gap-2">
                    {viewState === ViewState.Loading ? 'Generating...' : (
                      <>
                        Generate Timeline
                        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-turbo-beige/30 bg-turbo-beige/10 px-1.5 font-mono text-[10px] font-medium text-turbo-beige opacity-50 group-hover:opacity-75">
                          <span className="text-xs">⌘</span>
                          <span className="text-xs">↵</span>
                        </kbd>
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>
          )}

          {viewState === ViewState.Result && result && (
            <div className="bg-turbo-beige border-2 border-turbo-black rounded-lg p-6">
              {typeof result.content === 'string' ? (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown components={markdownComponents}>
                    {result.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="space-y-8">
                  <TimelineDescription 
                    overview={result.content.overview}
                    editingNotes={result.content.editingNotes}
                    showOverviewOnly={true}
                  />

                  <SegmentCard 
                    segment={result.content.segments[selectedSegmentIndex]} 
                  />
                  
                  {result.totalDuration && (
                    <TimelineVisual 
                      segments={result.content.segments}
                      totalDuration={result.totalDuration}
                      selectedSegmentIndex={selectedSegmentIndex}
                      onSegmentClick={setSelectedSegmentIndex}
                    />
                  )}
                  
                  <TimelineDescription 
                    overview={result.content.overview}
                    editingNotes={result.content.editingNotes}
                    showEditingNotesOnly={true}
                  />
                </div>
              )}
              
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setViewState(ViewState.Input)}
                  className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-turbo-black hover:text-turbo-white bg-turbo-beige hover:bg-turbo-blue border-2 border-turbo-black rounded-full transition-colors"
                >
                  Back to Form
                </button>
                <button
                  onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
                  className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-turbo-beige bg-turbo-black hover:bg-turbo-blue rounded-full transition-colors"
                >
                  Regenerate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
} 