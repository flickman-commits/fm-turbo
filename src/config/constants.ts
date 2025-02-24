import { UserInfo } from '@/types/outreach'

export const DEFAULT_USER_INFO: UserInfo = {
  name: '',
  company: '',
  companyName: '',
  businessType: '',
  role: '',
  email: '',
  messageStyle: 'professional',
  outreachType: 'getClients'
} as const 