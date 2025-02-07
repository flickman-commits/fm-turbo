import { TaskType } from '@/types/tasks'
import { WeatherData } from '@/services/location'
import { Video, FormDataValue } from '@/types/forms'
import { getOutreachSystemPrompt, getOutreachUserPrompt } from './outreachPrompt'

// Type definitions
interface FormData {
  [key: string]: FormDataValue | WeatherData | undefined
  weather?: WeatherData
  googleMapsLink?: string
  location?: string
  address?: string
  shootDate?: string
  crewMembers?: string
  callTimes?: string
  schedule?: string
  discoveryTranscript?: string
  recipientName?: string
  company?: string
  role?: string
  familiarity?: string
  keyPoints?: string
  portfolioVideos?: Video[]
  requirements?: string
  perplexityResearch?: string
  timelineInfo?: string
  deliverables?: string
}

export interface UserInfo {
  companyName: string
  userName: string
  businessType: string
}

// Helper function to get user info from localStorage
export const getUserInfoFromLocalStorage = (): UserInfo | null => {
  const saved = localStorage.getItem('userInfo')
  return saved ? JSON.parse(saved) : null
}

// Helper function to get weather emoji for run of show
export const getWeatherEmoji = (condition: string): string => {
  const conditions = condition?.toLowerCase() || ''
  if (conditions.includes('snow')) return '🌨️'
  if (conditions.includes('rain')) return '🌧️'
  if (conditions.includes('cloud')) return '☁️'
  if (conditions.includes('clear')) return '☀️'
  if (conditions.includes('sun')) return '☀️'
  if (conditions.includes('thunder')) return '⛈️'
  if (conditions.includes('fog')) return '🌫️'
  if (conditions.includes('mist')) return '🌫️'
  return '🌤️' // default to partly cloudy
}

// System prompts for different task types
export const getSystemPrompts = (taskType: TaskType, userInfo: UserInfo): string => {
  const prompts: Record<TaskType, string> = {
    contractorBrief: `You are an expert production manager at ${userInfo.companyName}, responsible for creating clear and professional contractor brief emails for ${userInfo.companyName}`,

    outreach: getOutreachSystemPrompt(userInfo),

    proposal: `You are an expert salesman at ${userInfo.companyName}, a ${userInfo.businessType} company. Your role is to take in information from discovery calls, online research, and provided data about a potential client and then to create an effective content proposal to our potential clients.`,

    runOfShow: `You are a senior producer at ${userInfo.companyName} who's in charge of creating the run of show for an upcoming project. You are very thorough and detailed, you are also very concise.`,

    budget: `You are an expert assistant helping to generate professional content for ${userInfo.companyName}. Create a detailed production budget breakdown that includes all costs, labor rates, equipment fees, and calculates the total with the specified profit margin. Format your response in clean, well-structured markdown with appropriate headers and lists.`,

    timelineFromTranscript: `You are an expert assistant video editor at ${userInfo.companyName}, responsible for analyzing transcripts and creating time-coded editing timelines.`,

    trendingAudios: '' // No prompt needed for trending audios
  }

  return prompts[taskType] || ''
}

// User prompts for different task types
export const getUserPrompt = (taskType: TaskType, formData: FormData, userInfo: UserInfo): string => {
  switch (taskType) {
    case 'trendingAudios':
      return '' // No prompt needed for trending audios

    case 'contractorBrief':
      return `Create a contractor brief email following this exact format and style:
      Create a well-structured email following this exact format:

      Hey ${formData.contractorName},

      Excited to have you on board for this project! Here's everything you need to know:

      **Client:** ${formData.client}

      **Dates:** ${formData.startDate} to ${formData.endDate}

      **Location:** ${formData.location}

      **Point of Contact:** ${formData.pointOfContact} (${formData.contactEmail} - ${formData.contactPhone})

      **Schedule:**
      ${formData.schedule}

      **Your Role:**
      ${formData.role}

      **Deliverables:**
      ${formData.deliverables}

      **Compensation:**
      Rate: $${formData.dailyRate}/day x ${formData.numberOfDays} days = $${Number(formData.dailyRate) * Number(formData.numberOfDays)} total

      **Next Steps:**
      - Confirm your availability by replying to this email
      - Send over a W9 just so we have it for tax purposes
      Let me know if you have any questions. Looking forward to working with you!`

    case 'outreach':
      return getOutreachUserPrompt(formData)

    case 'proposal': {
      // Format portfolio videos section if available
      const portfolioSection = formData.portfolioVideos?.length
        ? `\nRelevant Portfolio Examples:
${formData.portfolioVideos.map(video => `- ${video.title}
  URL: ${video.url}
  Description: ${video.description || 'Not available'}
  Project Type: ${video.projectType}`).join('\n')}`
        : ''

      return `Create a detailed video content proposal based on the following discovery call transcript, project details, and array of portfolio videos. Make sure that it includes clear sections for the objectives of the project, our content strategy & approach, deliverables involved with the project, timeline of the project, visual references, investment (which means how much the client will have to invest in the project), and terms. Make sure to incorporate our portfolio examples to demonstrate our expertise and capabilities in the visual references section.

For the visual references section, choose the best 3 videos from the provided array of portfolio videos. 

The portfolio examples should be carefully selected based on:
- Project type matching (corporate, brand, product videos)
- Similar technical requirements
- Comparable scope and scale
- Relevant industry experience

When portfolio videos are provided, you MUST incorporate them into the proposal in a dedicated "Visual References" section. For each video:
1. Use the video's title as a heading (and make that title clickable to the video URL for easy reference)
2. Explain how this specific project demonstrates our expertise in areas relevant to the client's needs
3. Use the video's description to highlight our role (example: "Produced, filmed, and edited by ${userInfo.companyName}")
4. Connect specific aspects of the video to the client's requirements from their discovery call

Make sure to reference these examples throughout the proposal where relevant, not just in the portfolio section. For example:
- In the production approach, reference similar techniques used in portfolio examples
- In the technical requirements, mention equipment and setups proven successful in similar projects
- When discussing timeline and deliverables, refer to comparable projects we've completed

Format all video references consistently using markdown links: [Video Title](URL)

Discovery Call Transcript:
${formData.discoveryTranscript || ''}

Project Details:
- Type: ${formData.projectType || ''}
- Client: ${formData.clientName || ''}
- Timeline: ${formData.timelineInfo || ''}
- Budget: ${formData.budget || ''}
- Special Requirements: ${formData.requirements || ''}${portfolioSection}

Portfolio Videos:
${formData.portfolioVideos?.map(video => `- ${video.title}
  URL: ${video.url}
  Description: ${video.description || 'Not available'}
  Project Type: ${video.projectType}`).join('\n') || ''}

Format your response in clean, well-structured markdown with appropriate headers and lists.`
    }

    case 'runOfShow':
      return `Create a detailed run of show document for a video shoot with the following information:

Location: ${formData.location}
Address: ${formData.address}
Date: ${formData.shootDate}
Weather: ${formData.weather ? `${getWeatherEmoji(formData.weather.conditions)} **${formData.weather.high}°F** | ${formData.weather.low}°F` : 'N/A'}
Sunrise: ${formData.weather?.sunrise || 'N/A'}
Sunset: ${formData.weather?.sunset || 'N/A'}
Crew: ${formData.crewMembers}
Call Times: ${formData.callTimes}
Schedule: ${formData.schedule}

Please format the run of show with these sections:

1. LOCATIONS
**Location:** ${formData.location}
**Address:** ${formData.address}
[View in Google Maps](${formData.googleMapsLink || ''})
**Weather Conditions:** ${formData.weather ? `${getWeatherEmoji(formData.weather.conditions)} **${formData.weather.high}°F** | ${formData.weather.low}°F` : 'N/A'}

2. COLOR KEY
- **Yellow:** Prepping to film
- **Green:** Filming
- **Orange:** Sunrise time (${formData.weather?.sunrise || 'N/A'})
- **Blue:** Sunset time (${formData.weather?.sunset || 'N/A'})

3. CALL/WRAP TIMES
${formData.crewMembers?.split(',').map(member => `- **${member.trim()}:** ${formData.callTimes}`).join('\n')}

4. SCHEDULE

Date

| Time | Activity |
|------|----------|
| ${formData.weather?.sunrise || 'N/A'} | **Orange:** Sunrise |
${formData.schedule?.split('\n').map(line => {
  const [time, ...rest] = line.split('-').map(s => s.trim())
  const activity = rest.join('-').trim()
  if (!time || !activity) return ''
  if (activity.toLowerCase().includes('shoot') || activity.toLowerCase().includes('film')) {
    return `| ${time} | **Green:** ${activity} |`
  }
  return `| ${time} | **Yellow:** ${activity} |`
}).join('\n')}
| ${formData.weather?.sunset || 'N/A'} | **Blue:** Sunset |

Format all activities according to the color key above.`

    case 'budget':
      return `Please create a detailed production budget with the following details:

Event Type: ${formData.eventType}
Production Days: ${formData.productionDays}
Crew Size: ${formData.crewSize}
Equipment Needs: ${formData.equipmentNeeds}
Editing Hours: ${formData.editingHours}
Profit Margin: ${formData.profitMargin}%
Additional Costs: ${formData.additionalCosts}

Break down all costs including labor, equipment, post-production, and additional expenses. Calculate subtotals and apply the specified profit margin. Format in clear markdown with appropriate sections and calculations.`

    case 'timelineFromTranscript':
      return `Your task is to

1. Take in the provided transcript, video purpose, target length, desired tone, and additional context

Transcript Content:${formData.transcriptFile}
Client: ${formData.clientName}
Purpose: ${formData.purpose}
Target Length: ${formData.length}
Desired Tone: ${formData.tone}
Additional Context: ${formData.additionalNotes}

2. Identify the most impactful and relevant segments based on the video's purpose, tone, and additional context. Make sure to read the entire transcript. You can move the order of the segments if it helps tell a better story.
3. Create a detailed write up that includes the follwoing
  A. An overview of the selected segments in a section called "Overview of The Segments We Chose"
  B. A timeline for a finished video that is the same length as the target length, showing which parts of the provided transcript should be used, their content, speaker name, and ratinoale for using them as it relates to the purpose of the video "Your Timeline"
  C. Total Run Time of New Video in a section called "Total Run Time"
  D. Any additional editing notes or recommendations
3. Format your response in clean, well-structured markdown`

    default:
      return ''
  }
} 