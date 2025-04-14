import { TaskType } from './tasks'

export type ProductionStatus = 'pre_production' | 'production' | 'post_production' | 'completed' | 'archived'
export type ProductionType = 'commercial' | 'documentary' | 'event' | 'corporate' | 'music_video' | 'other'

export interface Production {
  id: string
  user_id: string
  name: string
  client_name: string | null
  status: ProductionStatus
  type: ProductionType
  start_date: string | null
  end_date: string | null
  budget: number | null
  description: string | null
  location: string | null
  created_at: string
  updated_at: string
}

export interface ProductionTask {
  id: string
  production_id: string
  task_type: TaskType
  title: string
  content: string
  status: 'draft' | 'in_progress' | 'completed' | 'archived'
  assigned_to: string | null
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface ProductionAsset {
  id: string
  production_id: string
  name: string
  type: 'image' | 'video' | 'document' | 'other'
  url: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ProductionTeamMember {
  id: string
  production_id: string
  user_id: string
  role: string
  permissions: string[]
  created_at: string
  updated_at: string
} 