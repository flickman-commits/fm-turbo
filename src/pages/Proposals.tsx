import { useState, useEffect } from 'react'
import { FormDataWithWeather } from '@/types/forms'
import { getUserInfoFromProfile, getSystemPrompts, getUserPrompt } from '@/config/prompts'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/rainbow-toast'
import { createChatCompletion } from '@/services/openai'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import { creditsManager } from '@/utils/credits'
import { Layout } from '@/components/Layout'
import { taskConfigs } from '@/config/tasks'
import { NotionButton } from '@/components/ui/notion-button'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
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

export default function Proposals() {
  const { initialized, session, incrementTasksUsed } = useAuth()
  const [formData, setFormData] = useState<FormDataWithWeather>(() => {
    const saved = localStorage.getItem('proposal_form_data')
    return saved ? JSON.parse(saved) : {}
  })
  const [viewState, setViewState] = useState<ViewState>(() => {
    const savedResult = localStorage.getItem('proposal_result')
    const savedViewState = localStorage.getItem('proposal_view_state')
    
    if (savedResult && savedViewState === ViewState.Result) {
      return ViewState.Result
    }
    return ViewState.Input
  })
  const [result, setResult] = useState<{ content: string } | null>(() => {
    const saved = localStorage.getItem('proposal_result')
    return saved ? JSON.parse(saved) : null
  })
  const [selectedFileName, setSelectedFileName] = useState(() => {
    return localStorage.getItem('proposal_selected_filename') || ''
  })
  const [copiedButtons, setCopiedButtons] = useState<Record<string, boolean>>({})

  const config = taskConfigs.proposal

  const isFieldRequired = (field: any) => {
    if (field.optional) {
      return false
    }
    return true
  }

  const isFormValid = () => {
    return config.fields.every(field => {
      if (field.optional) {
        return true
      }

      const value = formData[field.id]
      return typeof value === 'string' && value.trim().length > 0
    })
  }

  useEffect(() => {
    localStorage.setItem('proposal_form_data', JSON.stringify(formData))
  }, [formData])

  useEffect(() => {
    if (viewState !== ViewState.Loading) {
      localStorage.setItem('proposal_view_state', viewState)
    }
  }, [viewState])

  useEffect(() => {
    if (result) {
      localStorage.setItem('proposal_result', JSON.stringify(result))
    }
  }, [result])

  useEffect(() => {
    localStorage.setItem('proposal_selected_filename', selectedFileName)
  }, [selectedFileName])

  // Add keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        const valid = isFormValid()
        if (valid && viewState !== ViewState.Loading) {
          generateProposal({ preventDefault: () => {} } as React.FormEvent)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewState, formData, isFormValid])

  // Clear loading state on unmount or navigation
  useEffect(() => {
    return () => {
      if (viewState === ViewState.Loading) {
        setViewState(ViewState.Input)
        localStorage.removeItem('proposal_view_state')
      }
    }
  }, [viewState])

  const handleBackToForm = () => {
    setViewState(ViewState.Input)
    setResult(null)
    localStorage.removeItem('proposal_result')
    localStorage.removeItem('proposal_view_state')
  }

  const handleFillTestData = async () => {
    try {
      const response = await fetch('/discovery-call-transcript.json')
      if (!response.ok) {
        throw new Error('Failed to fetch discovery call transcript')
      }
      const transcriptContent = await response.text()
      
      setFormData({
        projectType: 'US Creative Partner',
        clientName: 'Oanda',
        timelineInfo: 'Event filming on Jan 7th 2024, rough cut needed by Jan 21st, final deliverables by Feb 10th 2024',
        budget: '$50,000',
        discoveryTranscript: transcriptContent,
        requirements: 'Full video production setup with localized content for US market, professional crew, and high-end equipment for corporate brand video. Focus on creating content that resonates with US traders while maintaining global brand standards.',
        additionalNotes: "please emphasize that we've worked with financial institutions before so we understand this market",
        portfolioVideos: [
          {
            id: '1042629726',
            title: '"Tax Optimization" | Evergreen Wealth',
            description: 'A professional corporate video showcasing financial expertise and complex topics in an engaging way.',
            url: 'https://vimeo.com/1042629726',
            thumbnail: null,
            views: 0,
            likes: 0,
            projectType: 'corporate'
          },
          {
            id: '1030922649',
            title: '"Join Us" | Regeneration.VC',
            description: 'Flickman Media filmed & edited an event recap of ReAssembly 2024 -- a 2-day climate week conference that brought together visionaries and changemakers in the climate world.',
            url: 'https://vimeo.com/1030922649',
            thumbnail: null,
            views: 0,
            likes: 0,
            projectType: 'corporate'
          },
          {
            id: '926038873',
            title: '"Celebrating 20 Years" | Lure Fishbar',
            description: 'A brand-focused video that effectively tells the story of an established business while maintaining professionalism and engagement.',
            url: 'https://vimeo.com/926038873',
            thumbnail: null,
            views: 0,
            likes: 0,
            projectType: 'brand'
          }
        ]
      })
      setSelectedFileName('discovery-call-transcript.json')
    } catch (error) {
      console.error('Failed to load discovery call transcript:', error)
      toast.error('Failed to load discovery call transcript')
    }
  }

  const generateProposal = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setViewState(ViewState.Loading)
      localStorage.removeItem('proposal_result')
      localStorage.removeItem('proposal_view_state')
      
      console.log('🔄 Getting user info for proposal generation...')
      const userInfo = session?.user?.id ? await getUserInfoFromProfile(session.user.id) : null
      
      if (!userInfo) {
        console.error('❌ No user info available')
        toast.error('User information is required. Please complete your profile.')
        setViewState(ViewState.Input)
        return
      }
      
      console.log('📝 Generating proposal with user info:', userInfo)
      console.log('Form data being sent:', formData)
      
      const messages = [
        {
          role: "system" as const,
          content: getSystemPrompts('proposal', userInfo)
        },
        {
          role: "user" as const,
          content: getUserPrompt('proposal', formData, userInfo)
        }
      ]

      console.log('🔄 Sending messages to OpenAI:', messages)

      const response = await createChatCompletion(messages)
      
      console.log('✅ Received response from OpenAI:', response)
      
      if (!response?.content) {
        console.error('❌ No content received from OpenAI')
        throw new Error('Failed to generate content')
      }

      console.log('📊 Response content:', response.content)

      creditsManager.useCredit()
      await incrementTasksUsed()
      
      const newResult = { content: response.content }
      console.log('💾 Setting result:', newResult)
      setResult(newResult)
      localStorage.setItem('proposal_result', JSON.stringify(newResult))
      localStorage.setItem('proposal_view_state', ViewState.Result)
      setViewState(ViewState.Result)
    } catch (error) {
      console.error('❌ Error generating proposal:', error)
      toast.error('Failed to generate content. Please try again.')
      setViewState(ViewState.Input)
    }
  }

  const handleCopy = async () => {
    try {
      if (!result) return
      await navigator.clipboard.writeText(result.content)
      setCopiedButtons(prev => ({ ...prev, 'Copy to Clipboard': true }))
      toast.success('Content copied to clipboard!')
      setTimeout(() => {
        setCopiedButtons(prev => ({ ...prev, 'Copy to Clipboard': false }))
      }, 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy content')
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

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  const markdownComponents: Components = {
    h1: (props) => <h1 className="text-2xl font-bold mb-4 text-turbo-black mt-6" {...props} />,
    h2: (props) => <h2 className="text-xl font-bold mb-3 text-turbo-black mt-4" {...props} />,
    h3: (props) => <h3 className="text-lg font-bold mb-2 text-turbo-black mt-3" {...props} />,
    p: (props) => <p className="mb-4 text-turbo-black leading-relaxed" {...props} />,
    ul: (props) => <ul className="list-disc pl-6 mb-4 text-turbo-black space-y-2" {...props} />,
    ol: (props) => <ol className="list-decimal pl-6 mb-4 text-turbo-black space-y-2" {...props} />,
    li: (props) => <li className="text-turbo-black" {...props} />,
    strong: (props) => <strong className="font-bold text-turbo-black" {...props} />,
    em: (props) => <em className="italic text-turbo-black" {...props} />,
    a: (props) => (
      <a
        className="text-turbo-blue hover:text-turbo-black underline transition-colors"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    ),
    blockquote: (props) => (
      <blockquote className="border-l-4 border-turbo-black pl-4 italic my-4" {...props} />
    ),
    hr: () => <hr className="my-8 border-t-2 border-turbo-black/10" />,
    table: (props) => (
      <div className="overflow-x-auto my-6">
        <table className="min-w-full divide-y divide-turbo-black/10" {...props} />
      </div>
    ),
    th: (props) => (
      <th className="px-4 py-2 text-left font-bold text-turbo-black bg-turbo-black/5" {...props} />
    ),
    td: (props) => <td className="px-4 py-2 text-turbo-black border-t border-turbo-black/10" {...props} />
  }

  if (!initialized) {
    return (
      <div className="min-h-screen bg-turbo-beige flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-turbo-black/20 border-t-turbo-black rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <Layout>
      <div className="bg-turbo-beige min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-8 relative min-h-[calc(100vh-4rem)]">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-turbo-black mb-2">Content Proposals</h1>
            <p className="text-lg text-turbo-black/60">
              Generate professional video content proposals from discovery call transcripts or project requirements.
            </p>
          </div>

          {viewState === ViewState.Loading && <LoadingOverlay />}

          {viewState === ViewState.Input && (
            <form onSubmit={generateProposal} className="space-y-6">
              <div className="bg-turbo-beige border-2 border-turbo-black rounded-lg p-6 space-y-6">
                {config.fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id} className="text-sm font-medium text-turbo-black">
                      {field.label}
                      {isFieldRequired(field) && <span className="text-[#E94E1B] ml-1">*</span>}
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
                                if (typeof e.target?.result === 'string') {
                                  handleFieldChange(field.id, e.target.result)
                                }
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
                  onClick={handleFillTestData}
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
                        Generate Proposal
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
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown components={markdownComponents}>
                  {result.content}
                </ReactMarkdown>
              </div>
              
              <div className="mt-6 flex justify-between">
                <button
                  onClick={handleBackToForm}
                  className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-turbo-black hover:text-turbo-white bg-turbo-beige hover:bg-turbo-blue border-2 border-turbo-black rounded-full transition-colors"
                >
                  Back to Form
                </button>
                <div className="flex gap-2">
                  <NotionButton
                    onClick={handleNotionDuplicate}
                    className="text-turbo-black bg-turbo-beige hover:bg-turbo-blue hover:text-turbo-white border-2 border-turbo-black"
                  />
                  <button
                    onClick={handleCopy}
                    disabled={copiedButtons['Copy to Clipboard']}
                    className="px-6 py-3 text-sm font-medium text-turbo-beige bg-turbo-black hover:bg-turbo-blue rounded-full transition-colors"
                  >
                    {copiedButtons['Copy to Clipboard'] ? 'Copied!' : 'Copy to Clipboard'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
} 