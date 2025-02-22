export * from './SegmentCard'
export * from './TimelineVisual'
export * from './TimelineDescription'

export interface TimelineSegment {
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

export interface TimelineData {
  overview: string
  segments: TimelineSegment[]
  totalRunTime: string
  editingNotes: string[]
} 