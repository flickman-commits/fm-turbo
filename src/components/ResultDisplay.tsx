import { useState } from 'react'
import { TaskResult } from '@/types/tasks'
import { RainbowButton } from '@/components/ui/rainbow-button'
import { NotionButton } from '@/components/ui/notion-button'
import { toast } from '@/components/ui/rainbow-toast'
import ReactMarkdown from 'react-markdown'

interface ResultDisplayProps {
  result: TaskResult
  onClose: () => void
}

export function ResultDisplay({ result, onClose }: ResultDisplayProps) {
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

  const handleNotionDuplicate = async () => {
    try {
      // Convert markdown to Notion-compatible format
      // Notion accepts markdown but we ensure proper formatting
      const formattedContent = result.content
        // Remove markdown header symbols as Notion will handle the formatting
        .replace(/^#{1,6}\s/gm, '')
        // Ensure list items have space after bullet
        .replace(/^([*-])([^ ])/gm, '$1 $2')
        // Add extra newline before lists for better spacing
        .replace(/\n([*-] )/g, '\n\n$1')
        // Ensure proper spacing for code blocks
        .replace(/```(\w+)?\n/g, '\n```$1\n')

      // Copy the formatted content
      await navigator.clipboard.writeText(formattedContent)
      
      // Open Notion in a new tab
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
            <div className="prose prose-sm max-w-none bg-white text-foreground prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-p:text-foreground prose-p:mb-4 prose-ul:list-disc prose-ul:pl-6 prose-li:mb-1 prose-pre:bg-gray-50 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-code:text-foreground prose-code:bg-transparent">
              <ReactMarkdown>
                {result.content}
              </ReactMarkdown>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-2 p-4 md:p-6 border-t">
            <NotionButton
              onClick={handleNotionDuplicate}
              className="w-full sm:w-auto justify-center"
            >
              Duplicate to
            </NotionButton>
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