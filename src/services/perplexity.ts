const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions'

interface PerplexityResponse {
  choices: {
    message: {
      content: string
    }
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function queryPerplexity(recipientName: string, companyName: string): Promise<string> {
  if (!PERPLEXITY_API_KEY) {
    throw new Error('Perplexity API key not found in environment variables')
  }

  const prompt = `Research the following person and their company: \nName: ${recipientName} \nCompany: ${companyName} \n
  Provide a concise bullet-pointed list of informatoin including any news announcements about the company, educational background of our prospect, location of our prospect, and other relevant details for us to create our outreach message with. After the bulleted list, create a section called "Sources" and place the urls to the source links underneath that. If no relevant data is found, return 'Couldn't find any relevant data.'`

  try {
    console.log('Sending request to Perplexity with payload:', {
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: 'Be precise and concise.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'Be precise and concise.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`)
    }

    const data: PerplexityResponse = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error('Error querying Perplexity:', error)
    throw error
  }
}

// Helper function to check if we should use Perplexity for a given task
export function shouldUsePerplexity(task: string): boolean {
  const researchTasks = [
    'research',
    'find information',
    'look up',
    'search',
    'investigate',
    'analyze'
  ]
  
  return researchTasks.some(keyword => task.toLowerCase().includes(keyword))
} 