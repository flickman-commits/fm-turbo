import { EmailTemplate, Prospect, UserInfo, ProspectResearch } from '@/types/outreach'
import { getOutreachSystemPrompt, getOutreachUserPrompt } from '@/config/outreachPrompt'
import { generateEmailCopy } from '@/services/openai'

export async function createEmailTemplates(
  prospect: Prospect,
  research: ProspectResearch,
  userInfo: UserInfo
): Promise<EmailTemplate[]> {
  const prospectData = {
    recipientName: prospect.name,
    company: prospect.company,
    role: prospect.title,
    familiarity: 'Never Met', // This could be made dynamic later
    perplexityResearch: research.rawResponse,
    keyPoints: research.companyInfo.concat(research.personInfo).join('\n'),
    keyPointsToEmphasize: research.companyInfo.join('\n')
  }

  // Map our UserInfo to the format expected by the prompt functions
  const promptUserInfo = {
    companyName: userInfo.companyName,
    name: userInfo.name,
    businessType: userInfo.businessType,
    outreachType: userInfo.outreachType,
    messageStyle: userInfo.messageStyle,
    company: userInfo.company,
    role: userInfo.role,
    email: userInfo.email
  }

  const systemPrompt = getOutreachSystemPrompt(promptUserInfo)
  const userPrompt = getOutreachUserPrompt(prospectData)

  // Make the actual OpenAI call
  const templates = await generateEmailCopy(userPrompt, systemPrompt)
  return templates
} 