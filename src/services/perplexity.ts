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

  const prompt = `Research the following person and their company:
Name: ${recipientName}
Company: ${companyName}

CRITICAL: The LinkedIn profile URL must be EXACT and VERIFIED. This is the highest priority task.

URL FORMAT REQUIREMENTS:
- Must start with "https://www.linkedin.com/in/"
- Return empty string if you cannot find a URL matching this exact format

Please return the research results in the following JSON format EXACTLY:

{
  "title": "Current job title at the company",
  "companyInfo": [
    "First important company fact",
    "Second important company fact",
    "Third important company fact"
  ],
  "personInfo": [
    "First important person fact",
    "Second important person fact",
    "Third important person fact"
  ],
  "sources": [
    "REQUIRED - If found, the first source must be the LinkedIn URL in exact format https://www.linkedin.com/in/[profile-id]/",
    "URL2",
    "URL3"
  ]
}

Research Instructions:
1. MANDATORY - LinkedIn URL Verification Steps:
   a. Search "[name] [company] linkedin" on Google
   b. When you find a profile, VERIFY THE URL FORMAT FIRST:
      - Must match exactly: https://www.linkedin.com/in/[profile-id]/
      - No other formats are acceptable
      - If format is wrong or uncertain, do not include the URL in sources
   c. Then verify ALL of these match:
      - Full name matches exactly
      - Current company matches exactly
      - Current role/title at the company
   d. Double-check the profile belongs to the right person by:
      - Verifying current employment
      - Cross-referencing with other sources
      - Ensuring location and industry match
   e. If multiple profiles exist, verify each one against these criteria
   f. If a valid LinkedIn URL is found, it must be the first source in the sources array

2. Then gather the following information:
   - For title: The person's current job title at the company, if found. If not found, leave as empty string.
   - For companyInfo: Recent news, company updates, key metrics, or notable achievements
   - For personInfo: Educational background, work history, location, and relevant professional details
   - For sources: URLs to the source material used, with LinkedIn URL (if found and verified) as the first source

IMPORTANT: 
- The LinkedIn URL format must be exact - no exceptions
- Must start with https://www.linkedin.com/in/
- No @ symbols or other prefixes
- If format is wrong or uncertain, do not include the URL in sources
- Double-check the final URL before including it
- When in doubt, do not include the URL

Format the response as valid JSON only, with no additional text or markdown.`

  try {
    console.log('Sending request to Perplexity with the following info:', {
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: `You are a precise research assistant with strict URL validation capabilities.
For LinkedIn URLs:
- They must EXACTLY match the format: https://www.linkedin.com/in/[profile-id]/
- No @ symbols or other prefixes allowed
- Must be a direct profile URL
- Must be verified and exact
- Return empty string if format is incorrect or uncertain`
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
            content: `You are a precise research assistant with strict URL validation capabilities.
For LinkedIn URLs:
- They must EXACTLY match the format: https://www.linkedin.com/in/[profile-id]/
- No @ symbols or other prefixes allowed
- Must be a direct profile URL
- Must be verified and exact
- Return empty string if format is incorrect or uncertain`
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