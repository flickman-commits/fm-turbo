export interface UserProfile {
  id: string
  email: string | null
  name: string | null
  company_name: string | null
  business_type: string | null
  message_style: string | null
  role: string | null
  outreach_type: string | null
  tasks_used: number
  avatar_url: string | null
  created_at: string
  updated_at: string
} 