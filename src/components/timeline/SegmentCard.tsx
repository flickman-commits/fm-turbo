import React from 'react'
import type { TimelineSegment } from './types'

interface SegmentCardProps {
  segment: TimelineSegment
}

export const SegmentCard: React.FC<SegmentCardProps> = ({ segment }) => {
  // Format the speaker name to show "Unknown Speaker" instead of "Unknown"
  const displaySpeaker = segment.speaker === 'Unknown' ? 'Unknown Speaker' : segment.speaker

  // Calculate exact duration from source timecodes
  const calculateExactDuration = (start: string, end: string) => {
    const [startHours, startMinutes, startSeconds] = start.split(':').map(Number)
    const [endHours, endMinutes, endSeconds] = end.split(':').map(Number)
    
    const startTotalSeconds = (startHours * 3600) + (startMinutes * 60) + startSeconds
    const endTotalSeconds = (endHours * 3600) + (endMinutes * 60) + endSeconds
    
    return (endTotalSeconds - startTotalSeconds).toFixed(2)
  }

  const exactDuration = calculateExactDuration(segment.sourceStartTimecode, segment.sourceEndTimecode)

  return (
    <div className="bg-white rounded-lg border-2 border-turbo-black p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 grid grid-cols-3 items-center">
          <div className="text-sm text-turbo-black/60">
            <span className="block font-medium text-turbo-black">Source Timecode</span>
            {segment.sourceStartTimecode} - {segment.sourceEndTimecode}
          </div>
          <div className="text-sm text-turbo-black/60 text-center">
            <span className="block font-medium text-turbo-black">Final Timecode</span>
            {segment.startTimecode} - {segment.endTimecode}
          </div>
          <div className="text-sm text-turbo-black/60 text-right">
            <span className="block font-medium text-turbo-black">Clip Duration</span>
            {exactDuration}s
          </div>
        </div>
      </div>

      <div className="flex items-center mb-6">
        <h3 className="text-xl font-bold text-turbo-black flex items-center">
          <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: segment.speakerColor }}></span>
          {displaySpeaker}
        </h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-turbo-black mb-2">Content</h4>
          <p className="text-turbo-black/80 bg-turbo-black/5 rounded-lg p-4">
            "{segment.content}"
          </p>
        </div>
        
        <div>
          <h4 className="font-medium text-turbo-black mb-2">Rationale</h4>
          <p className="text-turbo-black/80 bg-turbo-black/5 rounded-lg p-4">
            {segment.rationale}
          </p>
        </div>
      </div>
    </div>
  )
} 