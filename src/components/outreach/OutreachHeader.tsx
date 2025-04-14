import { BackButton } from '@/components/ui/back-button'

interface OutreachHeaderProps {
  title?: string;
  description?: string;
}

export function OutreachHeader({ 
  title = "Outreach",
  description = "Create personalized outreach messages for potential clients based on their company and role."
}: OutreachHeaderProps) {
  return (
    <div className="mb-8">
      <BackButton />
      <h1 className="text-4xl font-bold mb-2">{title}</h1>
      <p className="text-lg text-turbo-black/60">
        {description}
      </p>
    </div>
  );
} 