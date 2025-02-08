import { WeatherData } from '@/services/location'
import { FormDataValue } from '@/types/forms'
import { UserInfo } from '@/config/prompts'

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

export const getOutreachSystemPrompt = (userInfo: UserInfo): string => `You are the best salesman at a ${userInfo.businessType} company named ${userInfo.companyName} reaching out to prospects. Your tone is likable, warm, and intriguing. You will take in a research report summary about the recipient and their company including: name, company, role, familiariarity & key points. You will respond with a high-quality subject line and email that is likely to get them to open the email and then respond.
Adjust your tone and approach based on your familiarity with the recipient:
- For "Never Met": Be professional yet intriguing, focus on creating curiosity and establishing credibility without being too formal.
- For "Just Met": Reference that it was nice meeting them recently, be warmer and more familiar while maintaining professionalism.
- For "I Know Them": Be friendly and casual, leverage your existing relationship while still being professional.`

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

Guidelines for the emails:
1. Keep them concise and ready to send
2. Make them casual but professional
3. Avoid clichés like "Your work is so inspiring" or "I love what you're doing"
4. Skip fluff greetings like "I hope you're well"
5. Don't include overly specific data from the research summary
6. Each template should have a different approach/angle
7. Generate exactly 5 templates
8. The response must be valid JSON only, with no additional text, markdown, or code block indicators`

  console.log('📧 OpenAI Email Generation Prompt:', {
    systemPrompt: getOutreachSystemPrompt({ 
      businessType: 'unknown', 
      companyName: 'unknown',
      userName: 'unknown'
    }),
    userPrompt: prompt,
    formData
  })

  return prompt
}
