import { useState } from 'react'
import { TaskResult } from '@/types/tasks'
import { RainbowButton } from '@/components/ui/rainbow-button'
import { NotionButton } from '@/components/ui/notion-button'
import { toast } from '@/components/ui/rainbow-toast'

interface ResultDisplayProps {
  result: TaskResult
  onClose: () => void
}

export function ResultDisplay({ result, onClose }: ResultDisplayProps) {
  const [isCopied, setIsCopied] = useState(false)

  const cleanContent = (content: string) => {
    return content
      .replace(/```markdown\n/g, '') // Remove markdown code block start
      .replace(/```\n/g, '') // Remove markdown code block end
      .replace(/^#{1,6}\s/gm, '') // Remove heading markers
      .replace(/\*\*/g, '') // Remove bold markers
      .replace(/\[|\]/g, '') // Remove square brackets
      .trim()
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanContent(result.content))
      setIsCopied(true)
      toast.success('Content copied to clipboard!')
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy content')
    }
  }

  const handleEmailCompose = () => {
    try {
      const cleanedContent = cleanContent(result.content)
      const lines = cleanedContent.split('\n')
      const subjectLine = lines.find(line => line.startsWith('Subject:'))?.replace('Subject:', '').trim() || ''
      
      // Remove the subject line and any empty lines at the start
      const bodyContent = lines
        .slice(lines.findIndex(line => line.startsWith('Subject:')) + 1)
        .join('\n')
        .trim()

      // Construct mailto URL with subject and body
      const mailtoUrl = `mailto:?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(bodyContent)}`
      
      // Open default email client
      window.location.href = mailtoUrl
      toast.success('Opening email composer...')
    } catch (error) {
      console.error('Failed to compose email:', error)
      toast.error('Failed to open email composer')
    }
  }

  const handleNotionDuplicate = async () => {
    try {
      await navigator.clipboard.writeText(cleanContent(result.content))
      window.open('https://notion.new', '_blank')?.focus()
      toast.success('Content copied! Opening Notion... (Press Cmd/Ctrl+V to paste)')
    } catch (error) {
      console.error('Failed to prepare content for Notion:', error)
      toast.error('Failed to prepare content for Notion')
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="bg-white border rounded-lg shadow-lg w-[calc(100%-2rem)] max-w-2xl flex flex-col">
          <div className="flex justify-between items-center shrink-0 p-4 md:p-6 border-b">
            <h3 className="text-lg font-semibold text-foreground">
              {`Your ${result.taskType === 'runOfShow' ? 'Run of Show' : 
                result.taskType.charAt(0).toUpperCase() + result.taskType.slice(1)}`}
            </h3>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-gray-100"
            >
              Close
            </button>
          </div>
          <div className="p-4 md:p-6 overflow-y-auto max-h-[60vh] md:max-h-[70vh]">
            <div className="prose prose-sm max-w-none whitespace-pre-wrap break-words">
              {cleanContent(result.content)}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-2 p-4 md:p-6 border-t">
            {result.taskType === 'outreach' ? (
              <button
                onClick={handleEmailCompose}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium bg-white text-black border border-gray-200 hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center"
              >
                <span>Compose in</span>
                <img src="/gmail-icon.png" alt="Gmail" className="h-4 w-auto" />
              </button>
            ) : (
              <NotionButton
                onClick={handleNotionDuplicate}
                className="w-full sm:w-auto justify-center"
              >
                Duplicate to
              </NotionButton>
            )}
            <RainbowButton 
              onClick={handleCopy} 
              disabled={isCopied}
              className="w-full sm:w-auto justify-center"
            >
              {isCopied ? 'Copied!' : 'Copy to Clipboard'}
            </RainbowButton>
          </div>
        </div>
      </div>
    </div>
  )
} 