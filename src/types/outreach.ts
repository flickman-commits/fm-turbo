export interface UserInfo {
  // Personal/Company Info
  name: string
  company: string
  companyName: string  // This should be the same as company, we should consolidate these
  businessType: string // The type of business/industry (e.g., "Video Production")
  role: string
  email?: string
  conversationalStyle?: string
  
  // Outreach Context
  outreachType?: 'getClients' | 'getJob' | 'getSpeakers' | null // Type of outreach campaign
  outreachContext: string // The context message used in emails
}

export interface EmailTemplate {
  id: string
  subject: string
  body: string
}

export interface ProspectResearch {
  companyInfo: string[]
  personInfo: string[]
  sources: string[]
  rawResponse: string
}

export interface Prospect {
  id: string
  name: string
  title: string
  email: string
  company: string
  industry?: string
  size?: string
  research?: ProspectResearch
  emailTemplates?: EmailTemplate[]
  [key: string]: string | undefined | ProspectResearch | EmailTemplate[] // Allow for flexible CSV columns
} 