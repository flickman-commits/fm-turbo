export interface UserInfo {
  // Personal/Company Info
  name: string
  company: string
  companyName: string  // This should be the same as company, we should consolidate these
  businessType: string // The type of business/industry (e.g., "Video Production")
  role: string
  email: string
  messageStyle: 'direct' | 'casual' | 'storytelling' | 'professional' | 'friendly'
  
  // Outreach Context
  outreachType: 'getClients' | 'getJob' | 'getSpeakers' | 'getHotelStay' | 'getSponsors'
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
  firstName: string
  lastName: string
  name: string
  email: string
  company: string
  title: string
  industry?: string
  size?: string
  research?: ProspectResearch
  emailTemplates?: EmailTemplate[]
} 