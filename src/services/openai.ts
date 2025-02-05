import OpenAI from 'openai'

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