import { useState } from 'react'
import { TaskResult, taskActionConfigs, TaskAction } from '@/types/tasks'
import { RainbowButton } from '@/components/ui/rainbow-button'
import { GmailButton } from '@/components/ui/gmail-button'
import { NotionButton } from '@/components/ui/notion-button'
import { toast } from '@/components/ui/rainbow-toast'
import ReactMarkdown from 'react-markdown'

interface ResultDisplayProps {
  result: TaskResult
  onClose: () => void
  formData?: Record<string, string>
}

export function ResultDisplay({ result, onClose, formData }: ResultDisplayProps) {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async () => {
    try {
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
      // Format content for email using clean plain text
      const formattedContent = result.content
        // Remove markdown bold markers but keep the text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        // Remove markdown italic markers but keep the text
        .replace(/\*(.*?)\*/g, '$1')
        // Format headers with spacing and underlines
        .replace(/^# (.*?)$/gm, '\n$1\n')
        .replace(/^## (.*?)$/gm, '\n$1\n')
        .replace(/^### (.*?)$/gm, '\n$1\n')
        // Format bullet points with proper indentation
        .replace(/^- (.*?)$/gm, '  • $1')
        // Ensure consistent line breaks
        .replace(/\n{3,}/g, '\n\n')

      if (result.taskType === 'contractorBrief' && formData?.contractorEmail) {
        const subject = `Project Brief - ${formData.client}`
        const mailtoUrl = `mailto:${formData.contractorEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(formattedContent)}`
        window.location.href = mailtoUrl
        toast.success('Opening email composer...')
      } else {
        const subject = `${result.taskType.charAt(0).toUpperCase() + result.taskType.slice(1)}`
        const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(formattedContent)}`
        window.location.href = mailtoUrl
        toast.success('Opening email composer...')
      }
    } catch (error) {
      console.error('Failed to prepare email:', error)
      toast.error('Failed to prepare email')
    }
  }

  const handleNotionDuplicate = async () => {
    try {
      // First copy content to clipboard and wait for it to complete
      await navigator.clipboard.writeText(result.content)
      
      // Then open Notion desktop app with a new page
      window.location.href = 'notion://www.notion.so/new'
      toast.success('Opening Notion... Content copied to clipboard for pasting')
    } catch (error) {
      console.error('Failed to open Notion:', error)
      toast.error('Failed to open Notion')
    }
  }

  const handleAction = (action: TaskAction) => {
    switch (action) {
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

  const actions = taskActionConfigs[result.taskType] || []

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="bg-white border rounded-lg shadow-lg w-[calc(100%-2rem)] max-w-2xl flex flex-col">
          <div className="flex justify-between items-center shrink-0 p-4 md:p-6 border-b">
            <h3 className="text-lg font-semibold text-foreground">
              {`Your ${result.taskType === 'runOfShow' ? 'Run of Show' : 
                result.taskType === 'contractorBrief' ? 'Contractor Brief' :
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
            <div className="prose prose-sm max-w-none bg-white text-foreground prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-p:text-foreground prose-p:mb-4 prose-ul:list-disc prose-ul:pl-6 prose-li:mb-1 prose-pre:bg-gray-50 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-code:text-foreground prose-code:bg-transparent prose-strong:font-bold">
              <ReactMarkdown>
                {result.content}
              </ReactMarkdown>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-2 p-4 md:p-6 border-t">
            {actions.map((action) => {
              switch (action.type) {
                case 'gmail':
                  return (
                    <GmailButton 
                      key="gmail"
                      onClick={() => handleAction('gmail')} 
                    />
                  )
                case 'notion':
                  return (
                    <NotionButton
                      key="notion"
                      onClick={() => handleAction('notion')}
                    >
                      {action.label}
                    </NotionButton>
                  )
                case 'copy':
                  return (
                    <RainbowButton
                      key="copy"
                      onClick={() => handleAction('copy')}
                      disabled={isCopied}
                      className="w-full sm:w-auto justify-center"
                    >
                      {isCopied ? 'Copied!' : action.label}
                    </RainbowButton>
                  )
                default:
                  return null
              }
            })}
          </div>
        </div>
      </div>
    </div>
  )
} 