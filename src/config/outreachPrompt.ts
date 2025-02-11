import { WeatherData } from '@/services/location'
import { FormDataValue } from '@/types/forms'
import { UserInfo } from '@/types/outreach'

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

export const getOutreachSystemPrompt = (userInfo: UserInfo): string => {
  // Get the purpose based on outreach type
  const purpose = userInfo.outreachType ? {
    getClients: "looking to establish new client relationships",
    getJob: "seeking new career opportunities",
    getSpeakers: "looking to connect with potential speakers for an event"
  }[userInfo.outreachType] : "looking to establish new business relationships"

  // Get the tone based on message style
  const tone = userInfo.messageStyle ? {
    direct: "Your tone should be professional, clear, and straight to the point. Focus on value and efficiency in communication.",
    casual: "Your tone should be friendly, conversational, and relatable, using a more personal touch.",
    storytelling: "Your tone should be engaging and narrative-focused. Weave in relevant anecdotes or examples while maintaining professionalism."
  }[userInfo.messageStyle] : "Your tone should be professional, clear, and straight to the point. Focus on value and efficiency in communication."

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

Write a concise, friendly, casual, and purposeful email that is just supposed to get the other party to respond -- not necessarily close a deal. Include a short, casual subject line. Do not include any name at the end. Your email should follow these guidlines:


1. For sales messages, write a very simple message with a clear value prop and offer. Add 1 line of context explaining why you are reaching out and what value you have to offer.
2. For sales messages, always add value first by offering to do something for free or giving some actionable advice without worrying about or charging for it.
3. Gain trust and show the recipient that you really can provide some great value before you try to sell.
4. Try to make some sort of personal connection with the prospect - don't use any filler opening lines like "Hope you've been well" or "I hope you're doing great".
5. End the email with a question that is relevant to the work that you guys could do together
6. Your email body should be no longer than 150 words. And your email subject lines should be 7 words max (ideally 4-6)
7. Use the research summary to tailor the message to the recipient's background and company context but only explicitly mention something from the research summary if it's relevant to the work that you guys could do together.
8. Avoid clichés like "Your work is so inspiring" or "I love what you're doing"
9. Skip fluff greetings like "I hope you're well"
10. Don't include overly specific data from the research summary
11. Each template should have a different approach/angle
12. Generate exactly 5 templates
13. The response must be valid JSON only, with no additional text, markdown, or code block indicators`

  console.log('📧 OpenAI Email Generation Prompt:', {
    systemPrompt: getOutreachSystemPrompt({ 
      name: 'unknown',
      company: 'unknown',
      companyName: 'unknown',
      businessType: 'unknown',
      role: 'unknown',
      email: '',
      conversationalStyle: 'friendly',
      outreachType: 'getClients',
      messageStyle: 'direct',
      outreachContext: 'discussing business opportunities'
    }),
    userPrompt: prompt,
    formData
  })

  return prompt
}
