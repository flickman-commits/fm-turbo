import { WeatherData } from '@/services/location'
import { FormDataValue } from '@/types/forms'
import { UserInfo as BaseUserInfo } from '@/config/prompts'

interface FormData {
  [key: string]: FormDataValue | WeatherData | undefined
  recipientName?: string
  company?: string
  role?: string
  familiarity?: string
  keyPoints?: string
  perplexityResearch?: string
  keyPointsToEmphasize?: string
}

interface OutreachPromptUserInfo {
  businessType: string
  companyName: string
  userName: string
  outreachType: 'getClients' | 'getJob' | 'getSpeakers'
  messageStyle: 'direct' | 'casual' | 'storytelling'
}

export const getOutreachSystemPrompt = (userInfo: OutreachPromptUserInfo): string => {
  // Get the purpose based on outreach type
  const purpose = {
    getClients: "looking to establish new client relationships",
    getJob: "seeking new career opportunities",
    getSpeakers: "looking to connect with potential speakers for an event"
  }[userInfo.outreachType]

  // Get the tone based on message style
  const tone = {
    direct: "Your tone should be professional, clear, and straight to the point. Focus on value and efficiency in communication.",
    casual: "Your tone should be friendly, conversational, and relatable, using a more personal touch.",
    storytelling: "Your tone should be engaging and narrative-focused. Weave in relevant anecdotes or examples while maintaining professionalism."
  }[userInfo.messageStyle]

  return `You are the best ${purpose === "seeking new career opportunities" ? "job seeker" : "outreach specialist"} at ${userInfo.companyName}. ${purpose}. ${tone}

You will take in a research report summary about the recipient and their company including: name, company, role, familiarity & key points.

You will respond with high-quality subject lines and emails that are likely to get them to open the emails and then respond.`
}

export const getOutreachUserPrompt = (formData: FormData): string => {
  const prompt = `Return ONLY a JSON object with no additional text, markdown formatting, or code block indicators. The response should start with { and end with } and be valid JSON.

The JSON object should have this exact structure:
{
  "templates": [
    {
      "id": "template-1",
      "subject": "Subject line for template 1",
      "body": "Email body for template 1"
    }
  ]
}

Use this information to generate the email templates:

Research Summary:
${formData.perplexityResearch || 'No additional research available.'}
Recipient: ${formData.recipientName}
Company: ${formData.company}
Role: ${formData.role}
Familiarity Level: ${formData.familiarity}
Key Points: ${formData.keyPoints}
Key Points to Emphasize: ${formData.keyPointsToEmphasize}
Deliverables: ${formData.deliverables}


I really liked those last emails you wrote. Continue to follow that pattern.

Write a concise, friendly, casual, and purposeful email that is just supposed to get the other party to respond -- not necessarily close a deal. Include a short, casual subject line. Do not include any or name at the end. Your email should follow these guidlines:

1. Try to make some sort of personal connection with the prospect - don't use any filler opening lines like "Hope you've been well" or "I hope you're doing great".
2. End the email with a question that is relevant to the work that you guys could do together
3. Your email body should be no longer than 150 words. And your email subject lines should be 7 words max (ideally 4-6)
4. Use the research summary to tailor the message to the recipient's background and company context but only explicitly mention something from the research summary if it's relevant to the work that you guys could do together.
5. Avoid clichés like "Your work is so inspiring" or "I love what you're doing"
6. Skip fluff greetings like "I hope you're well"
7. Don't include overly specific data from the research summary
8. Each template should have a different approach/angle
9. Generate exactly 5 templates
10. The response must be valid JSON only, with no additional text, markdown, or code block indicators`

  console.log('📧 OpenAI Email Generation Prompt:', {
    systemPrompt: getOutreachSystemPrompt({ 
      businessType: 'unknown', 
      companyName: 'unknown',
      userName: 'unknown',
      outreachType: 'getClients',
      messageStyle: 'direct'
    }),
    userPrompt: prompt,
    formData
  })

  return prompt
}
