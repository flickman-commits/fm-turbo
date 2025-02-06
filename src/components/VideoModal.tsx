import { DottedDialog } from '@/components/ui/dotted-dialog-wrapper'

interface VideoModalProps {
  onClose: () => void
}

export function VideoModal({ onClose }: VideoModalProps) {
  return (
    <DottedDialog
      open={true}
      onOpenChange={onClose}
      title="How to Use Turbo"
      description="Watch how Turbo transforms your creative workflow in seconds"
    >
      <div className="bg-turbo-beige/10 rounded-xl p-8 backdrop-blur-sm">
        <div style={{ position: 'relative', paddingBottom: '64.90384615384616%', height: 0 }}>
          <iframe 
            src="https://www.loom.com/embed/926952eeaa9e401ebf107fc35038bc44?sid=07b2b81e-a7a8-4d06-a554-304cc35f7de4" 
            frameBorder="0" 
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          />
        </div>
      </div>
    </DottedDialog>
  )
} 