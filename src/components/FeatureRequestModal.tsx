import { useState, useEffect } from 'react'
import { DottedDialog } from '@/components/ui/dotted-dialog-wrapper'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/rainbow-toast'

interface FeatureRequestModalProps {
  onClose: () => void;
}

type RequestType = 'bug' | 'feature';

export function FeatureRequestModal({ onClose }: FeatureRequestModalProps) {
  const [requestType, setRequestType] = useState<RequestType>('bug')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isFormValid = () => {
    return requestType && description.trim().length > 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!requestType || !description) {
      toast.error('Please fill out all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('https://fm-turbo-production.up.railway.app/api/feature-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          type: requestType,
          description
        }),
      })

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Server response:', errorData);
        throw new Error('Failed to submit request')
      }

      toast.success('Request submitted successfully!')
      onClose()
    } catch (error) {
      console.error('Error submitting request:', error)
      toast.error('Failed to submit request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (isFormValid() && !isSubmitting) {
          const form = document.querySelector('form')
          if (form) {
            e.preventDefault()
            form.requestSubmit()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFormValid, isSubmitting])

  return (
    <DottedDialog
      open={true}
      onOpenChange={onClose}
      title="Submit Request"
      description="Help us improve Turbo by submitting a feature request or bug report."
    >
      <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-turbo-black">
                Request Type <span className="text-turbo-blue">*</span>
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRequestType('bug')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    requestType === 'bug'
                      ? 'bg-turbo-blue text-turbo-beige'
                      : 'bg-turbo-black/5 text-turbo-black hover:bg-turbo-black/10'
                  }`}
                >
                  🐛 Bug Report
                </button>
                <button
                  type="button"
                  onClick={() => setRequestType('feature')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    requestType === 'feature'
                      ? 'bg-turbo-blue text-turbo-beige'
                      : 'bg-turbo-black/5 text-turbo-black hover:bg-turbo-black/10'
                  }`}
                >
                  ✨ Feature Request
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-turbo-black">
                Description <span className="text-turbo-blue">*</span>
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={requestType === 'bug' 
                  ? "Please describe the bug and steps to reproduce it..."
                  : "Please describe the feature you'd like to see..."}
                className="min-h-[120px]"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-turbo-black bg-turbo-beige p-4 md:p-6">
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-turbo-black hover:text-turbo-white bg-turbo-beige border-2 border-turbo-black rounded-full hover:bg-turbo-blue transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-turbo-beige bg-turbo-black hover:bg-turbo-blue rounded-full transition-colors disabled:opacity-80 disabled:bg-turbo-black/40 disabled:cursor-not-allowed disabled:text-turbo-beige group relative"
              disabled={isSubmitting || !isFormValid()}
            >
              <span className="flex items-center justify-center gap-2">
                {isSubmitting ? 'Submitting...' : (
                  <>
                    Submit Request
                    <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-turbo-beige/30 bg-turbo-beige/10 px-1.5 font-mono text-[10px] font-medium text-turbo-beige opacity-50 group-hover:opacity-75">
                      <span className="text-xs">⌘</span>
                      <span className="text-xs">↵</span>
                    </kbd>
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </form>
    </DottedDialog>
  )
} 