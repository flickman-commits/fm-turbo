import OpenAI from 'openai'
import { EmailTemplate } from '@/types/outreach'

const apiKey = import.meta.env.VITE_OPENAI_API_KEY

if (!apiKey) {
  throw new Error('OpenAI API key is not set in environment variables')
}

export const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true // Note: Only use this in development. For production, proxy requests through your backend
})

// Helper function for chat completions
export async function createChatCompletion(messages: OpenAI.Chat.ChatCompletionMessageParam[]) {
  try {
    const completion = await openai.chat.completions.create({
      messages,
      // model: "gpt-4-turbo-preview",
      model: "gpt-4o",
      temperature: 0.7,
    })

    return completion.choices[0].message
  } catch (error) {
    console.error('Error creating chat completion:', error)
    throw error
  }
}

interface EmailTemplateResponse {
  templates: {
    id: string;
    subject: string;
    body: string;
  }[];
}

export async function generateEmailCopy(
  userPrompt: string,
  systemPrompt: string = 'You are a professional email writer. You MUST return responses in clean JSON format only, with no markdown formatting, no code block indicators, and no additional text. Your response should start with { and end with }.'
): Promise<EmailTemplate[]> {
  if (!apiKey) {
    throw new Error('OpenAI API key not found in environment variables')
  }

  try {
    console.log('Sending request to OpenAI with prompts:', {
      systemPrompt,
      userPrompt
    })

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    console.log('📬 OpenAI Raw Response:', {
      fullResponse: data,
      content: content,
      usage: data.usage,
      model: data.model
    })

    try {
      // Parse the JSON response
      const parsedResponse: EmailTemplateResponse = JSON.parse(content)
      
      console.log('✉️ Parsed Email Templates:', {
        templates: parsedResponse.templates.map(t => ({
          id: t.id,
          subject: t.subject,
          bodyPreview: t.body.substring(0, 100) + '...' // Log just the start of each email body
        }))
      })
      
      // Map the templates to our EmailTemplate type
      return parsedResponse.templates.map(template => ({
        id: template.id,
        subject: template.subject,
        body: template.body
      }))
    } catch (parseError) {
      console.error('Error parsing OpenAI response as JSON:', parseError)
      console.log('Raw response:', content)
      throw new Error('Failed to parse email templates from response')
    }
  } catch (error) {
    console.error('Error generating email templates:', error)
    throw error
  }
} 