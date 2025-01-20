import { useState } from 'react'
import { TaskResult, taskActionConfigs, TaskAction } from '@/types/tasks'
import { toast } from '@/components/ui/rainbow-toast'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import { DottedDialog } from '@/components/ui/dotted-dialog-wrapper'
import { NotionButton } from '@/components/ui/notion-button'

interface ResultModalProps {
  result: TaskResult
  onClose: () => void
  formData?: Record<string, string>
}

export function ResultModal({ result, onClose, formData }: ResultModalProps) {
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
        // Remove any potential subject line from the content for outreach messages
        .replace(/^Subject:.*\n/m, '')

      let subject = ''
      if (result.taskType === 'contractorBrief' && formData?.contractorEmail) {
        subject = `Project Brief - ${formData.client}`
      } else if (result.taskType === 'runOfShow') {
        subject = `Run of Show - ${formData?.eventName || ''}`
      } else if (result.taskType === 'proposal') {
        subject = `Video Content Proposal - ${formData?.clientName || ''}`
      } else if (result.taskType === 'budget') {
        subject = `Production Budget - ${formData?.eventType || ''}`
      } else if (result.taskType === 'outreach') {
        subject = formData?.subject || ''
      } else {
        subject = `${result.taskType.charAt(0).toUpperCase() + result.taskType.slice(1)}`
      }

      const mailtoUrl = result.taskType === 'contractorBrief' && formData?.contractorEmail
        ? `mailto:${formData.contractorEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(formattedContent)}`
        : `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(formattedContent)}`

      window.location.href = mailtoUrl
      toast.success('Opening email composer...')
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

  const markdownComponents: Components = {
    h1: (props) => <h1 className="text-2xl font-bold mb-4" {...props} />,
    h2: (props) => <h2 className="text-xl font-bold mb-3" {...props} />,
    p: ({ children, ...props }) => {
      if (typeof children === 'string') {
        // Handle weather conditions with emoji and temperature formatting
        if (children.includes('Weather Conditions:')) {
          const formattedContent = children
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\|(.*?)°F/g, '<span class="text-[#3D0C11]">|$1°F</span>');
          return <p className="mb-2" dangerouslySetInnerHTML={{ __html: formattedContent }} />;
        }
        // Handle other special formatting
        if (children.includes('**') || children.includes('Yellow') || children.includes('Green') || children.includes('Orange') || children.includes('Blue')) {
          const formattedContent = children
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/Yellow/g, '<span class="text-yellow-600">Yellow</span>')
            .replace(/Green/g, '<span class="text-green-600">Green</span>')
            .replace(/Orange/g, '<span class="text-orange-600">Orange</span>')
            .replace(/Blue/g, '<span class="text-blue-600">Blue</span>');
          return <p className="mb-2" dangerouslySetInnerHTML={{ __html: formattedContent }} />;
        }
      }
      return <p className="mb-2" {...props}>{children}</p>;
    },
    ul: (props) => <ul className="list-disc pl-6 mb-4" {...props} />,
    li: ({ children, ...props }) => {
      if (typeof children === 'string' && (children.includes('**') || children.includes('Yellow') || children.includes('Green') || children.includes('Orange') || children.includes('Blue'))) {
        const formattedContent = children
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/Yellow/g, '<span class="text-yellow-600">Yellow</span>')
          .replace(/Green/g, '<span class="text-green-600">Green</span>')
          .replace(/Orange/g, '<span class="text-orange-600">Orange</span>')
          .replace(/Blue/g, '<span class="text-blue-600">Blue</span>');
        return <li className="mb-1" dangerouslySetInnerHTML={{ __html: formattedContent }} />;
      }
      return <li className="mb-1" {...props}>{children}</li>;
    },
    strong: (props) => <strong className="font-bold text-[#3D0C11]" {...props} />,
    em: (props) => <em className="italic text-[#3D0C11]" {...props} />,
    code: (props) => <code className="font-mono text-[#3D0C11]" {...props} />,
    a: (props) => (
      <a
        className="text-[#3D0C11] underline hover:text-[#3D0C11]/80 transition-colors"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    ),
  };

  return (
    <DottedDialog 
      open={true} 
      onOpenChange={onClose}
      title={`Your ${result.taskType === 'runOfShow' ? 'Run of Show' : 
        result.taskType === 'contractorBrief' ? 'Contractor Brief' :
        result.taskType.charAt(0).toUpperCase() + result.taskType.slice(1)}`}
      description="View and share your generated content"
    >
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 md:p-6">
          <div className="prose prose-sm max-w-none bg-[#E0CFC0] text-[#3D0C11] prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-p:text-[#3D0C11] prose-p:mb-4 prose-ul:list-disc prose-ul:pl-6 prose-li:mb-1 prose-pre:bg-[#3D0C11]/5 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-code:text-[#3D0C11] prose-code:bg-transparent prose-strong:font-bold">
            {result.taskType === 'outreach' && formData?.subject ? (
              <>
                <div className="mb-6">
                  <strong>Subject Line:</strong> {formData.subject}
                </div>
                <div>
                  <strong>Body:</strong>
                  <div className="mt-2">
                    <ReactMarkdown components={markdownComponents}>
                      {result.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </>
            ) : (
              <ReactMarkdown components={markdownComponents}>
                {result.content}
              </ReactMarkdown>
            )}
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 flex flex-col sm:flex-row justify-end gap-3 sm:gap-2 p-4 md:p-6 border-t border-[#3D0C11]">
        {actions.map((action) => {
          switch (action.type) {
            case 'gmail':
              return (
                <button
                  key="gmail"
                  onClick={() => handleAction('gmail')}
                  className="inline-flex items-center justify-center h-[48px] px-8 py-2 text-base font-medium text-[#3D0C11] bg-[#E0CFC0] hover:bg-[#3D0C11]/10 border-2 border-[#3D0C11] rounded-full transition-colors"
                >
                  <span className="flex items-center gap-2">
                    Compose in <img src="/gmail-icon.png" alt="Gmail" className="h-4 w-auto relative top-[1px]" />
                  </span>
                </button>
              )
            case 'notion':
              return (
                <NotionButton
                  key="notion"
                  onClick={() => handleAction('notion')}
                  className="text-[#3D0C11] bg-[#E0CFC0] hover:bg-[#3D0C11]/10 border-2 border-[#3D0C11]"
                />
              )
            case 'copy':
              return (
                <button
                  key="copy"
                  onClick={() => handleAction('copy')}
                  disabled={isCopied}
                  className="inline-flex items-center justify-center h-[48px] px-8 py-2 text-base font-medium text-[#E0CFC0] bg-[#3D0C11] hover:bg-[#3D0C11]/90 rounded-full transition-colors disabled:opacity-50"
                >
                  {isCopied ? 'Copied!' : action.label}
                </button>
              )
            default:
              return null
          }
        })}
      </div>
    </DottedDialog>
  )
} 