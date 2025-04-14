import { Layout } from '@/components/Layout'
import { BackButton } from '@/components/ui/back-button'
import { useState, useEffect } from 'react'
import { Upload, Copy, Check, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import { createChatCompletion } from '@/services/openai'
import { getUserInfoFromProfile, getSystemPrompts, getUserPrompt } from '@/config/prompts'
import { toast } from '@/components/ui/rainbow-toast'
import { creditsManager } from '@/utils/credits'
import { useAuth } from '@/contexts/AuthContext'
import { createWorker } from 'tesseract.js'

type ViewState = 'input' | 'loading' | 'result'

export default function Negotiation() {
  const { session, incrementTasksUsed } = useAuth()
  const [viewState, setViewState] = useState<ViewState>('input')
  const [emailText, setEmailText] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [responses, setResponses] = useState<string[]>(['', '', ''])
  const [rationales, setRationales] = useState<string[]>(['', '', ''])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessingScreenshot, setIsProcessingScreenshot] = useState(false)

  // Initialize credits manager
  useEffect(() => {
    const initializeCredits = async () => {
      if (!session?.user?.id) return
      try {
        await creditsManager.initialize(session.user.id)
      } catch (error) {
        console.error('Failed to initialize credits:', error)
      }
    }
    initializeCredits()
  }, [session?.user?.id])

  const extractTextFromImage = async (file: File): Promise<string> => {
    try {
      setIsProcessingScreenshot(true)
      const worker = await createWorker()
      
      // Convert File to base64
      const base64Image = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })

      // Perform OCR
      const { data: { text } } = await worker.recognize(base64Image)
      await worker.terminate()

      // Clean up the extracted text
      const cleanedText = text
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim()

      return cleanedText
    } catch (error) {
      console.error('Error processing screenshot:', error)
      throw new Error('Failed to extract text from screenshot')
    } finally {
      setIsProcessingScreenshot(false)
    }
  }

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setScreenshot(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      try {
        const extractedText = await extractTextFromImage(file)
        setEmailText(extractedText)
      } catch (error) {
        toast.error('Failed to extract text from screenshot. Please try again or paste the text manually.')
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setScreenshot(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      try {
        const extractedText = await extractTextFromImage(file)
        setEmailText(extractedText)
      } catch (error) {
        toast.error('Failed to extract text from screenshot. Please try again or paste the text manually.')
      }
    }
  }

  const handleCopy = (index: number) => {
    navigator.clipboard.writeText(responses[index])
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleSubmit = async () => {
    if (!emailText && !screenshot) return
    
    try {
      const credits = await creditsManager.getCredits()
      if (credits <= 0) {
        toast.error('No credits remaining')
        return
      }

      setViewState('loading')

      // Get user info for prompts
      const userInfo = session?.user?.id ? await getUserInfoFromProfile(session.user.id) : null
      
      if (!userInfo) {
        toast.error('User information is required. Please complete your profile.')
        setViewState('input')
        return
      }

      const messages = [
        {
          role: "system" as const,
          content: getSystemPrompts('negotiation', userInfo)
        },
        {
          role: "user" as const,
          content: getUserPrompt('negotiation', { emailText }, userInfo)
        }
      ]

      const response = await createChatCompletion(messages)
      
      if (!response?.content) {
        throw new Error('Failed to generate content')
      }

      // Parse the JSON response
      try {
        const parsedResponse = JSON.parse(response.content)
        if (Array.isArray(parsedResponse.responses) && Array.isArray(parsedResponse.rationale)) {
          setResponses(parsedResponse.responses)
          setRationales(parsedResponse.rationale)
        } else {
          throw new Error('Invalid response format')
        }
      } catch (error) {
        console.error('Error parsing OpenAI response:', error)
        toast.error('Failed to parse response. Please try again.')
        return
      }

      creditsManager.useCredit()
      await incrementTasksUsed()
      setViewState('result')
    } catch (error) {
      console.error('Error generating responses:', error)
      toast.error('Failed to generate responses. Please try again.')
      setViewState('input')
    }
  }

  return (
    <Layout>
      <div>
        <BackButton />
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Negotiation Assistant</h1>
          <p className="text-lg text-turbo-black/60">
            Get expert advice on client negotiations and pricing strategies for your video projects.
          </p>
        </div>
        
        {viewState === 'loading' ? (
          <div className="relative min-h-[400px]">
            <LoadingOverlay />
          </div>
        ) : viewState === 'input' ? (
          <div className="space-y-6">
            {/* Upload Section */}
            <div className="bg-white rounded-xl border-2 border-turbo-black p-6 relative">
              <h2 className="text-xl font-semibold mb-4">Upload Email Screenshot</h2>
              <div 
                className={cn(
                  "flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 transition-colors",
                  isDragging ? "border-turbo-blue bg-turbo-blue/5" : "border-turbo-black/20",
                  screenshotPreview ? "border-solid" : ""
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {isProcessingScreenshot && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg z-10">
                    <div className="w-12 h-12 border-4 border-turbo-blue/20 border-t-turbo-blue rounded-full animate-spin"></div>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="hidden"
                  id="screenshot-upload"
                  disabled={isProcessingScreenshot}
                />
                <label
                  htmlFor="screenshot-upload"
                  className={cn(
                    "flex flex-col items-center gap-2",
                    isProcessingScreenshot ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                  )}
                >
                  <Upload className="w-8 h-8 text-turbo-black/40" />
                  <span className="text-sm font-medium text-turbo-black/60">
                    {isProcessingScreenshot 
                      ? "Processing screenshot..." 
                      : screenshotPreview 
                        ? "Change screenshot" 
                        : "Click to upload screenshot"}
                  </span>
                </label>
                {screenshotPreview && (
                  <img
                    src={screenshotPreview}
                    alt="Screenshot preview"
                    className="mt-4 max-h-48 rounded-lg"
                  />
                )}
              </div>
            </div>

            {/* Email Text Input */}
            <div className="bg-white rounded-xl border-2 border-turbo-black p-6">
              <h2 className="text-xl font-semibold mb-4">Paste Text from Negotiation</h2>
              <textarea
                value={emailText}
                onChange={(e) => setEmailText(e.target.value)}
                placeholder="Paste the email content here..."
                className="w-full h-32 p-3 rounded-lg border-2 border-turbo-black/10 focus:border-turbo-blue focus:outline-none resize-none"
                disabled={isProcessingScreenshot}
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!emailText && !screenshot}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors",
                emailText || screenshot
                  ? "bg-turbo-blue text-turbo-beige hover:bg-turbo-black"
                  : "bg-turbo-black/5 text-turbo-black/40 cursor-not-allowed"
              )}
            >
              Get Negotiation Advice
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {responses.map((response, index) => (
              <div key={index} className="bg-white rounded-xl border-2 border-turbo-black p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Option {index + 1}</h3>
                  <button
                    onClick={() => handleCopy(index)}
                    className="p-2 text-turbo-black/40 hover:text-turbo-blue transition-colors"
                  >
                    {copiedIndex === index ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <textarea
                  value={response}
                  onChange={(e) => {
                    const newResponses = [...responses]
                    newResponses[index] = e.target.value
                    setResponses(newResponses)
                  }}
                  placeholder={`Response option ${index + 1}...`}
                  className="w-full h-32 p-3 rounded-lg border-2 border-turbo-black/10 focus:border-turbo-blue focus:outline-none resize-none mb-4"
                />
                <div className="bg-turbo-black/5 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-turbo-black/60 mb-2">Why this works:</h4>
                  <p className="text-sm text-turbo-black/80">{rationales[index]}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
} 