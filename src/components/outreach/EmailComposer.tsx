import { EmailTemplate, Prospect } from '@/types/outreach'
import { ArrowLeft, Command } from 'lucide-react'

interface EmailComposerProps {
  isGeneratingEmails: boolean;
  emailTemplates: EmailTemplate[];
  currentTemplateIndex: number;
  setEmailTemplates: (templates: EmailTemplate[]) => void;
  goToPreviousTemplate: () => void;
  goToNextTemplate: () => void;
  currentProspect: Prospect | null;
  prospectStatuses: Record<string, string>;
  queuedEmails: Array<{
    prospectId: string;
    prospectName: string;
    prospectEmail: string;
    subject: string;
    body: string;
    templateIndex: number;
  }>;
  onQueueEmail: () => void;
  onRemoveFromQueue: () => void;
}

export function EmailComposer({
  isGeneratingEmails,
  emailTemplates,
  currentTemplateIndex,
  setEmailTemplates,
  goToPreviousTemplate,
  goToNextTemplate,
  currentProspect,
  prospectStatuses,
  queuedEmails,
  onQueueEmail,
  onRemoveFromQueue
}: EmailComposerProps) {
  const isQueued = queuedEmails.some(
    email => email.prospectId === currentProspect?.id && email.templateIndex === currentTemplateIndex
  );

  return (
    <div className="flex-1 rounded-lg border-2 border-turbo-black/10 p-6 overflow-hidden flex flex-col bg-white">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-turbo-black">
          What You're Going to Send <span className="text-turbo-black/60">(editable)</span>
        </h3>
        {!isGeneratingEmails && emailTemplates.length > 0 && (
          <button
            onClick={isQueued ? onRemoveFromQueue : onQueueEmail}
            className="px-4 py-2 bg-turbo-blue text-white rounded-lg hover:bg-turbo-blue/90 transition-colors flex items-center gap-2"
          >
            {isQueued ? 'Remove from Queue' : 'Add to Queue'}
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-white/30 bg-white/10 px-1.5 font-mono text-[10px] font-medium">
              <Command className="h-3 w-3" />
              <span className="text-xs">Enter</span>
            </kbd>
          </button>
        )}
      </div>

      <div className="flex-1 relative">
        {isGeneratingEmails || (emailTemplates.length === 0 && (prospectStatuses[currentProspect?.id || ''] === 'researching' || prospectStatuses[currentProspect?.id || ''] === 'generating_emails')) ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-turbo-blue border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-turbo-black/60">Writing email starters...</p>
          </div>
        ) : emailTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-turbo-black/40">
            <p>No email templates available yet</p>
          </div>
        ) : (
          <div 
            className="absolute inset-0 transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(${-currentTemplateIndex * 100}%)` }}
          >
            {emailTemplates.map((template, index) => (
              <div 
                key={index}
                className="absolute inset-0 w-full transition-opacity duration-300 flex flex-col"
                style={{ 
                  transform: `translateX(${index * 100}%)`,
                  opacity: currentTemplateIndex === index ? 1 : 0,
                  pointerEvents: currentTemplateIndex === index ? 'auto' : 'none'
                }}
              >
                {queuedEmails.some(
                  email => email.prospectId === currentProspect?.id && email.templateIndex === index
                ) && (
                  <div className="absolute top-0 right-0 bg-turbo-black/5 text-turbo-black/60 px-3 py-1 rounded-bl-lg text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Queued
                  </div>
                )}
                <div className="relative group mb-4">
                  <div className="flex items-center mb-4">
                    <span className="font-bold text-turbo-black mr-2">Subject:</span>
                    <input
                      type="text"
                      value={template?.subject || ''}
                      onChange={(e) => {
                        const newTemplates = [...emailTemplates];
                        newTemplates[index] = {
                          ...template,
                          subject: e.target.value
                        };
                        setEmailTemplates(newTemplates);
                      }}
                      className="flex-1 p-2 border-b-2 border-transparent hover:border-turbo-black/10 focus:border-turbo-blue focus:outline-none transition-colors rounded-lg"
                      placeholder="Subject line..."
                    />
                  </div>
                </div>
                <div className="relative group flex-1">
                  <textarea
                    value={template?.body || ''}
                    onChange={(e) => {
                      const newTemplates = [...emailTemplates];
                      newTemplates[index] = {
                        ...template,
                        body: e.target.value
                      };
                      setEmailTemplates(newTemplates);
                    }}
                    className="w-full h-full p-4 text-turbo-black whitespace-pre-wrap resize-none border-2 border-transparent hover:border-turbo-black/10 focus:border-turbo-blue focus:outline-none transition-colors rounded-lg bg-[#FAF9F6]"
                    placeholder="Email body content will go here..."
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between mt-6 px-4">
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-turbo-black/40 whitespace-nowrap mb-2">
            Browse through email starters
          </span>
          <div className="flex gap-8 items-center">
            <div className="flex flex-col items-center">
              <button 
                onClick={goToPreviousTemplate}
                disabled={currentTemplateIndex === 0 || isGeneratingEmails}
                className="p-2 text-turbo-black/40 hover:text-turbo-blue transition-colors disabled:opacity-30 disabled:hover:text-turbo-black/40"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex flex-col items-center gap-1">
                <kbd className="inline-flex h-5 items-center gap-1 rounded border border-turbo-black/30 bg-turbo-black/5 px-1.5 font-mono text-[10px] font-medium text-turbo-black/60">
                  J
                </kbd>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <button 
                onClick={goToNextTemplate}
                disabled={currentTemplateIndex === emailTemplates.length - 1 || isGeneratingEmails}
                className="p-2 text-turbo-black/40 hover:text-turbo-blue transition-colors disabled:opacity-30 disabled:hover:text-turbo-black/40"
              >
                <ArrowLeft className="w-6 h-6 rotate-180" />
              </button>
              <div className="flex flex-col items-center gap-1">
                <kbd className="inline-flex h-5 items-center gap-1 rounded border border-turbo-black/30 bg-turbo-black/5 px-1.5 font-mono text-[10px] font-medium text-turbo-black/60">
                  L
                </kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 