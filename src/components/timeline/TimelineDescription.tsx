import React from 'react'

interface TimelineDescriptionProps {
  overview: string
  editingNotes: string[]
  showOverviewOnly?: boolean
  showEditingNotesOnly?: boolean
}

export const TimelineDescription: React.FC<TimelineDescriptionProps> = ({
  overview,
  editingNotes,
  showOverviewOnly = false,
  showEditingNotesOnly = false,
}) => {
  if (showOverviewOnly) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-turbo-black mb-4">Timeline Overview</h2>
        <div className="bg-white rounded-lg border-2 border-turbo-black p-6">
          <p className="text-turbo-black/80">{overview}</p>
        </div>
      </div>
    )
  }

  if (showEditingNotesOnly) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-turbo-black mb-4">Editing Notes & Recommendations</h2>
        <div className="bg-white rounded-lg border-2 border-turbo-black p-6">
          <ul className="space-y-3">
            {editingNotes.map((note, index) => (
              <li key={index} className="flex items-start">
                <span className="inline-block w-6 h-6 rounded-full bg-turbo-black text-white flex-shrink-0 flex items-center justify-center mr-3 mt-0.5">
                  {index + 1}
                </span>
                <span className="text-turbo-black/80">{note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Overview section */}
      <div>
        <h2 className="text-2xl font-bold text-turbo-black mb-4">Timeline Overview</h2>
        <div className="bg-white rounded-lg border-2 border-turbo-black p-6">
          <p className="text-turbo-black/80">{overview}</p>
        </div>
      </div>

      {/* Editing notes section */}
      <div>
        <h2 className="text-2xl font-bold text-turbo-black mb-4">Editing Notes & Recommendations</h2>
        <div className="bg-white rounded-lg border-2 border-turbo-black p-6">
          <ul className="space-y-3">
            {editingNotes.map((note, index) => (
              <li key={index} className="flex items-start">
                <span className="inline-block w-6 h-6 rounded-full bg-turbo-black text-white flex-shrink-0 flex items-center justify-center mr-3 mt-0.5">
                  {index + 1}
                </span>
                <span className="text-turbo-black/80">{note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
} 