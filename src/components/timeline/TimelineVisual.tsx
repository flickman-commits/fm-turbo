import React from 'react'

interface TimelineSegment {
  startTimecode: string
  endTimecode: string
  sourceStartTimecode: string
  sourceEndTimecode: string
  speaker: string
  speakerColor: string
  content: string
  duration: number
  rationale: string
}

interface TimelineVisualProps {
  segments: TimelineSegment[]
  totalDuration: number
  selectedSegmentIndex: number
  onSegmentClick: (index: number) => void
}

export const TimelineVisual: React.FC<TimelineVisualProps> = ({
  segments,
  totalDuration,
  selectedSegmentIndex,
  onSegmentClick,
}) => {
  // Calculate positions for duration labels
  const getSegmentEndTime = (index: number) => {
    let totalTime = 0
    for (let i = 0; i <= index; i++) {
      totalTime += segments[i].duration
    }
    return totalTime
  }

  return (
    <div className="mb-12">
      {/* Timeline bar */}
      <div className="relative h-8">
        <div className="absolute inset-0 flex rounded-full overflow-hidden border-2 border-turbo-black">
          {segments.map((segment, index) => {
            // Calculate segment width based on duration
            const width = (segment.duration / totalDuration) * 100

            return (
              <button
                key={index}
                onClick={() => onSegmentClick(index)}
                className={`h-full relative group transition-all duration-200 ${
                  index !== segments.length - 1 ? 'border-r border-turbo-black/20' : ''
                }`}
                style={{
                  width: `${width}%`,
                  backgroundColor: segment.speakerColor,
                  opacity: selectedSegmentIndex === index ? 1 : 0.4,
                }}
              >
                {/* Segment tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-turbo-black text-white text-sm rounded-lg py-1 px-2 whitespace-nowrap">
                    {segment.speaker}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Duration labels */}
        <div className="absolute -bottom-8 left-0 right-0">
          <div className="relative h-8">
            {segments.map((segment, index) => {
              const position = (getSegmentEndTime(index - 1) || 0) / totalDuration * 100
              const isFirst = index === 0
              
              return (
                <div
                  key={index}
                  className="absolute transform -translate-x-1/2"
                  style={{ left: `${isFirst ? 0 : position}%`, transform: isFirst ? 'none' : 'translateX(-50%)' }}
                >
                  <span className="text-sm font-medium text-turbo-black whitespace-nowrap">
                    {isFirst ? '00:00' : segment.startTimecode}
                  </span>
                </div>
              )
            })}
            
            {/* Final duration label */}
            <div className="absolute right-0 transform translate-x-0">
              <span className="text-sm font-medium text-turbo-black whitespace-nowrap">
                {segments[segments.length - 1].endTimecode}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 