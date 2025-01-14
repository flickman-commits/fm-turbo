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
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background border rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col p-6">
        <div className="flex justify-between items-center shrink-0">
          <h3 className="text-lg font-semibold">Generated Content</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>
        <div className="bg-muted/50 rounded-md p-4 mt-4 relative flex-grow overflow-auto prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{result.content}</ReactMarkdown>
        </div>
        <div className="flex justify-end mt-4 shrink-0 space-x-2">
          <NotionButton
            onClick={handleNotionDuplicate}
          >
            Duplicate to
          </NotionButton>
          <RainbowButton onClick={handleCopy} disabled={isCopied}>
            {isCopied ? 'Copied!' : 'Copy to Clipboard'}
          </RainbowButton>
        </div>
      </div>
    </div>
  )
} 