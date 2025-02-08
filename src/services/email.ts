import { EmailTemplate, Prospect, UserInfo, ProspectResearch } from '@/types/outreach'
import { getOutreachSystemPrompt, getOutreachUserPrompt } from '@/config/outreachPrompt'
import { generateEmailTemplates as openaiGenerateTemplates } from '@/services/openai'

export async function generateEmailTemplates(
  prospect: Prospect,
  research: ProspectResearch,
  userInfo: UserInfo
): Promise<EmailTemplate[]> {
  const formData = {
    recipientName: prospect.name,
    company: prospect.company,
    role: prospect.title,
    familiarity: 'Never Met', // This could be made dynamic later
    perplexityResearch: research.rawResponse,
    keyPoints: research.companyInfo.concat(research.personInfo).join('\n'),
    keyPointsToEmphasize: research.companyInfo.join('\n'),
    deliverables: userInfo.outreachContext
  }

  // Map our UserInfo to the format expected by the prompt functions
  const promptUserInfo = {
    companyName: userInfo.companyName,
    userName: userInfo.name,
    businessType: userInfo.businessType
  }

  const systemPrompt = getOutreachSystemPrompt(promptUserInfo)
  const userPrompt = getOutreachUserPrompt(formData)

  // Make the actual OpenAI call
  return await openaiGenerateTemplates(userPrompt, systemPrompt)
} 