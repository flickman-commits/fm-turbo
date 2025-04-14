import { Prospect } from '@/types/outreach'

interface ProspectInfoProps {
  prospect: Prospect | null;
  isResearching: boolean;
}

export function ProspectInfo({ prospect, isResearching }: ProspectInfoProps) {
  if (isResearching) {
    return (
      <div className="rounded-lg border-2 border-turbo-black/10 p-4 bg-white">
        <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
          <div className="w-8 h-8 border-4 border-turbo-blue border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-turbo-black/60">Researching this lovely person...</p>
          <p className="text-sm text-turbo-black/40 mt-2">Finding all the good stuff about them</p>
        </div>
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="rounded-lg border-2 border-turbo-black/10 p-4 bg-white">
        <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
          <p className="text-turbo-black/40">No personal or company insights yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border-2 border-turbo-black/10 p-4 bg-white h-[calc(100vh-200px)] sticky top-4 overflow-y-auto">
      <div className="mb-6">
        <div>
          <h2 className="text-2xl font-bold text-turbo-black">{prospect.name}</h2>
          <p className="text-lg text-turbo-black/60">
            {prospect.title} 
            {prospect.title && prospect.company && ' at '}
            {prospect.company}
          </p>
          {prospect.research?.sources[0]?.startsWith('https://www.linkedin.com/in/') && (
            <a
              href={prospect.research.sources[0]}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm text-turbo-blue hover:underline"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
              View LinkedIn Profile
            </a>
          )}
        </div>
      </div>

      {/* Personal Insights */}
      {prospect.research?.personInfo && prospect.research.personInfo.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-turbo-black mb-2">Personal Insights</p>
          <div className="space-y-2">
            {prospect.research.personInfo.map((info, index) => (
              <div 
                key={index}
                className="text-sm text-turbo-black/60 pl-4 relative"
              >
                <div className="absolute left-0 top-[0.5em] w-1.5 h-1.5 rounded-full bg-turbo-blue" />
                {info}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Company Insights */}
      {prospect.research?.companyInfo && prospect.research.companyInfo.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-turbo-black mb-2">Company Insights</p>
          <div className="space-y-2">
            {prospect.research.companyInfo.map((info, index) => (
              <div 
                key={index}
                className="text-sm text-turbo-black/60 pl-4 relative"
              >
                <div className="absolute left-0 top-[0.5em] w-1.5 h-1.5 rounded-full bg-turbo-blue" />
                {info}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 