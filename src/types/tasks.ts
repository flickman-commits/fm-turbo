import { ComponentType } from 'react'

export type TaskType = 'runOfShow' | 'contractorBrief' | 'outreach' | 'proposal' | 'budget' | 'timelineFromTranscript' | 'negotiation'

export interface FormField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'file'
  placeholder?: string
  options?: string[]
  showIf?: string
  optional?: string
  contentKey?: string
}

export interface TaskConfig {
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
  fields: FormField[]
}

export interface TaskResult {
  content: string
  actions: TaskActionConfig[]
}

export type TaskAction = 'gmail' | 'notion' | 'copy' | 'download'

export interface TaskActionConfig {
  type: 'gmail' | 'copy' | 'notion'
  label: string
  primary?: boolean
}

export const taskActionConfigs: Record<TaskType, TaskActionConfig[]> = {
  runOfShow: [
    { type: 'notion', label: 'Save to Notion', primary: true },
    { type: 'copy', label: 'Copy to Clipboard' }
  ],
  contractorBrief: [
    { type: 'notion', label: 'Save to Notion', primary: true },
    { type: 'copy', label: 'Copy to Clipboard' }
  ],
  outreach: [
    { type: 'gmail', label: 'Compose in Gmail', primary: true },
    { type: 'copy', label: 'Copy to Clipboard' }
  ],
  proposal: [
    { type: 'notion', label: 'Save to Notion', primary: true },
    { type: 'copy', label: 'Copy to Clipboard' }
  ],
  budget: [
    { type: 'notion', label: 'Save to Notion', primary: true },
    { type: 'copy', label: 'Copy to Clipboard' }
  ],
  timelineFromTranscript: [
    { type: 'notion', label: 'Save to Notion', primary: true },
    { type: 'copy', label: 'Copy to Clipboard' }
  ],
  negotiation: [
    { type: 'gmail', label: 'Compose in Gmail', primary: true },
    { type: 'copy', label: 'Copy to Clipboard' }
  ]
} 