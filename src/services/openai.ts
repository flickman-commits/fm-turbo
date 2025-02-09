import OpenAI from 'openai'
import { EmailTemplate, UserInfo } from '@/types/outreach'
import { getOutreachUserPrompt } from '@/config/outreachPrompt'
import { getOutreachSystemPrompt } from '@/config/outreachPrompt'

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
            content: `Research Summary:
  
  Here's a concise bullet-pointed list of information about Adrien De oliveira and Timeleft:
  * Adrien De oliveira is the Co-Founder and Head of Growth at Timeleft17
  * He holds a Master's degree in Marketing and digital media from Novancia Business School Paris1
  * Adrien is based in the Greater Paris Metropolitan Region7
  * Timeleft is a social platform that organizes dinners for strangers to combat urban loneliness8
  * The company uses an algorithm to match compatible individuals for these dinners8
  * Timeleft was founded in September 20207
  * As of February 2025, Timeleft connects 15,000 strangers over dinner every month in 50 cities7
  * The company is fully remote, with team members working from Lisbon, Los Angeles, Paris, and Oaxaca7
  * Timeleft expanded to Los Angeles in May 2024, making it their second-largest market in the United States5
  * For the 2024 holiday season, Timeleft hosted special community dinners on December 25th in several cities, including New York City, Los Angeles, Chicago, Houston, Montreal, Mexico City, Bogota, Buenos Aires, Paris, Barcelona, and Madrid2
  * As of December 2024, Timeleft was bringing together 16,000 strangers weekly in 65 countries and 285 cities2
  Sources
  * https://theorg.com/org/timeleft/org-chart/adrien-de-oliveira
  * https://timeleft.com/blog/2024/12/03/our-holiday-table-isnt-complete-without-you/
  * https://timeleft.com/pl/story/
  * https://www.latimes.com/lifestyle/story/2024-12-17/timeleft-app-dinner-strangers-holidays-los-angeles
  * https://fr.linkedin.com/in/adrien-de-oliveira-63b62173
  * https://timeleft.com/gr/category/news/
  
  Recipient: Adrien De oliveira
  Company: Timeleft
  Role: Head of Marketing & Co-Founder
  Familiarity Level: Never met
  Key Points: talk about how I'm personally impacted by the problem they are solving`
          },
          {
            role: "assistant",
            content: "Subject: NYC big city loneliness gone\n\nHey Adrien,\n\nLove what you guys are doing with Timeleft -- I resonate with the product as I recently moved to NYC and had to fight that big city loneliness for the first year.\n\nI have some video ideas that I think could help you guys push more into the US market -- let me know if you're up for a chat."
          },
          {
            role: "user",
            content:`
  Here's a concise bullet-pointed list of information about Mitchell Nover and Four Seasons:
  Mitchell Nover is the Director of Public Relations and Communications at Four Seasons Resort Nevis15
  He is based in Miami, Florida15
  Nover holds a Master's degree in International Administration from the University of Miami2
  He also has a Bachelor's degree in Spanish Language & Literature from the University of Michigan2
  Four Seasons is expanding its portfolio with new hotels and resorts opening in 2025 and beyond36
  The company recently reopened the Four Seasons Hotel New York at the end of 202436
  Four Seasons is planning to debut a 95-suite, yacht-like cruise ship in 20261
  The company is accelerating its growth strategy across hotels, resorts, residences, and experiential journeys3
  Four Seasons will conclude management of The Beverly Wilshire hotel in December 202510
  2025 marks the 25th anniversary of partnership with the company's longtime shareholders3
  Sources
  https://press.fourseasons.com/nevis/hotel-press-contacts/
  https://www.linkedin.com/in/mitchell-nover-5872a423
  https://press.fourseasons.com/news-releases/2025/strategic-growth-and-expansion/
  https://press.fourseasons.com/news-releases/2024/new-openings-and-renovations/
  https://press.fourseasons.com/news-releases/2025/portfolio-update/
  
  Recipient: Mitchell Nover
  Company: Four Seasons
  Role: Director of Public Relations and Communications
  Familiarity Level: Just met
  Key Points: talk about how we met in Miami last week and then talk about how I have some video ideas on how we could push his hotel forward into new markets, ask to hop on a call but make it sound casual`
          },
          {
            role: "assistant",
            content:"Subject: Miami follow up + video ideas\n\nHey Mitchell,\n\nGreat meeting last week. I can never get enough Miami time. Wanted to follow up on that convo we were having regarding content ideas for pushing Four Seasons into new markets this year. Do you have time to connect later this week?"
          },
          {
            role: "user",
            content:`
  Here's a concise bullet-pointed list of information about Jason Kuperberg and OthersideAI:
  Jason Kuperberg is the co-founder of OthersideAI, an applied AI company building tools powered by artificial intelligence14
  He was named to the 2024 Forbes 30 Under 30 list for consumer technology4
  OthersideAI's flagship product is HyperWrite, an AI writing and research assistant with over 2 million users45
  Education:
  Syracuse University (2014-2018)3
  Study abroad program at UNSW Australia (2016)3
  Location: New York, New York, United States1
  Previous experience:
  Teaching Fellow at Stanford University (2019-2020)1
  Innovation Specialist and Springboard Fellow at Hillel International (2018-2020)1
  Director of Operations at Hillel at Syracuse University (2017-2018)1
  Company news:
  OthersideAI raised $2.8 million in funding in March 20235
  The company raised $2.6 million in seed funding in November 202028
  OthersideAI was on track to generate $1 million in revenue in 20237
  Kuperberg's Hillel journey began during his sophomore year of college in 20166
  He is a volunteer entrepreneur in residence at the Blackstone LaunchPad and mentors student startups7
  Sources
  https://www.linkedin.com/in/jasonkuperberg
  https://www.businesswire.com/news/home/20201112005064/en/OthersideAI-Announces-Funding-of-2.6-Million-to-Bring-Magic-to-Your-Inbox
  https://theorg.com/org/othersideai/org-chart/jason-kuperberg
  https://jasonkuperberg.com
  https://www.globenewswire.com/news-release/2023/03/09/2624023/0/en/OthersideAI-Raises-2-8M-to-Make-Writing-Faster-and-Easier-with-Personalized-AI.html
  https://www.hillel.org/update/hillel-shaped-startup-founders-life-now-hes-paying-it-forward/
  https://www.hunterwatson.org/hunter-blog/30-under-30
  https://www.vcnewsdaily.com/OthersideAI/venture-funding.php
  
  Recipient: Jason Kuperberg
  Company: OthersideAI
  Role: Co-Founder
  Familiarity Level: I know them
  Key Points To Emphasize: Talk about how it's probbaly time for us to do another project with them because I saw that they are pushing out some big product updates`
          },
          {
            role: "assistant",
            content:"Subject: new projects\n\nWhat's up man,\n\n Saw you guys are about to push out some major  updates. Do you already have the created sorted out? Would love to collab, per usual -- just let me know."
          },
          {
            role: 'user',
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