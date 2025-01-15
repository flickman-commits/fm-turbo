export type TaskType = 'runOfShow' | 'contractorBrief' | 'outreach' | 'proposal' | 'budget'

export interface TaskResult {
  taskType: TaskType
  content: string
}

export type TaskAction = 'gmail' | 'notion' | 'copy'

export interface TaskActionConfig {
  type: TaskAction
  label: string
  icon?: string
  primary?: boolean
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
  ]
} 