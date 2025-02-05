import { WeatherData } from '@/services/location'
import { Video, FormDataValue } from '@/types/forms'

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

export const getOutreachSystemPrompt = `You are the best salesman at a video production company (Flickman Media) based in NYC reaching out to prospects. Your tone should be likable, warm and intriguing. You will take in a research report summary about the recipient and details about the recipient including: name, company, role, familiar level & key points. You will respond with a high-quality subject line and email that is likely to get them to open the email and then respond.
Adjust your tone and approach based on your familiarity with the recipient:
- For "Never Met": Be professional yet intriguing, focus on creating curiosity and establishing credibility without being too formal.
- For "Just Met": Reference that it was nice meeting them recently, be warmer and more familiar while maintaining professionalism.
- For "I Know Them": Be friendly and casual, leverage your existing relationship while still being professional.`

export const getOutreachUserPrompt = (formData: FormData): string => {
  return `
    Here is the information to use for the next outreach email. Ensure it is short and uses patterns from the earlier outreach email you wrote.

    Research Summary:
    ${formData.perplexityResearch || 'No additional research available.'}
    Recipient: ${formData.recipientName}
    Company: ${formData.company}
    Role: ${formData.role}
    Familiarity Level: ${formData.familiarity}
    Key Points: ${formData.keyPoints}
    Key Points to Emphasize: ${formData.keyPointsToEmphasize}
    Deliverables: ${formData.deliverables}

    Please write 3 versions of the next email and make sure they are concise and ready to send, the email we wrote earlier was perfect, it was short and casual and didn't include any super specific data from the research summary. Don't use cliches like "Your work is so inspiring" or "I love what you're doing" or any sort of fluff greetings like "I hoep you're well".
  `
}
