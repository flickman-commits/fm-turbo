export type TaskType = 'runOfShow' | 'contractorBrief' | 'outreach' | 'proposal' | 'budget' | 'timelineFromTranscript' | 'trendingAudios'

export interface TaskResult {
  taskType: TaskType
  content: string
}

export type TaskAction = 'gmail' | 'notion' | 'copy' | 'download'

export interface TaskActionConfig {
  type: TaskAction
  label: string
  icon?: string
  primary?: boolean
  url?: string
}

export const taskActionConfigs: Record<TaskType, TaskActionConfig[]> = {
  runOfShow: [
    { type: 'notion', label: 'Duplicate to Notion', primary: true },
    { type: 'copy', label: 'Copy to Clipboard' }
  ],
  contractorBrief: [
    { type: 'gmail', label: 'Compose in Gmail', primary: true },
    { type: 'copy', label: 'Copy to Clipboard' }
  ],
  outreach: [
    { type: 'gmail', label: 'Compose in Gmail', primary: true },
    { type: 'copy', label: 'Copy to Clipboard' }
  ],
  proposal: [
    { type: 'notion', label: 'Duplicate to Notion', primary: true },
    { type: 'copy', label: 'Copy to Clipboard' }
  ],
  budget: [
    { type: 'notion', label: 'Duplicate to Notion', primary: true },
    { type: 'copy', label: 'Copy to Clipboard' }
  ],
  timelineFromTranscript: [
    { type: 'copy', label: 'Copy to Clipboard', primary: true },
    { type: 'copy', label: 'Copy Highlighted Transcript' }
  ],
  trendingAudios: [
    { type: 'download', label: 'Download Now', primary: true }
  ]
} 