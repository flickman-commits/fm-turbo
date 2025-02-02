import { useState } from 'react'
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
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!requestType || !description) {
      toast.error('Please fill out all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const apiUrl = import.meta.env.PROD 
        ? 'https://fm-turbo-production.up.railway.app/api/feature-request'  // Railway Production URL
        : 'http://localhost:3001/api/feature-request';                      // Development URL

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: requestType,
          description,
          feedback
        }),
      })

      if (!response.ok) {
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

  return (
    <DottedDialog
      open={true}
      onOpenChange={onClose}
      title="Submit Request"
      description="Help us improve Turbo by submitting a feature request or bug report."
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-black">
              Request Type <span className="text-[#E94E1B]">*</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRequestType('bug')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  requestType === 'bug'
                    ? 'bg-black text-[#F5F0E8]'
                    : 'bg-black/5 text-black hover:bg-black/10'
                }`}
              >
                🐛 Bug Report
              </button>
              <button
                type="button"
                onClick={() => setRequestType('feature')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  requestType === 'feature'
                    ? 'bg-black text-[#F5F0E8]'
                    : 'bg-black/5 text-black hover:bg-black/10'
                }`}
              >
                ✨ Feature Request
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-black">
              Description <span className="text-[#E94E1B]">*</span>
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

          <div className="space-y-2">
            <label className="block text-sm font-medium text-black">
              What has been the most useful part of Turbo for you so far? <span className="text-black/60">(optional)</span>
            </label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your experience with us..."
              className="min-h-[80px]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 md:p-6 border-t border-black">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-black hover:text-black/70 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !requestType || !description}
            className="px-6 py-2 text-sm font-medium text-[#F5F0E8] bg-black rounded-full hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </DottedDialog>
  )
} 