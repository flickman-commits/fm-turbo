import { TaskType } from '@/types/tasks'
import { WeatherData } from '@/services/location'
import { Video, FormDataValue } from '@/types/forms'

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
}

// System prompts for different task types
export const systemPrompts: Record<TaskType, string> = {
  contractorBrief: `You are an expert production manager at Flickman Media, responsible for creating clear and professional contractor brief emails. Create a well-structured email following this exact format:

Hey [Name],

Excited to have you on board for this project! Here's everything you need to know:

Client: [Client Name] - [Company]

Dates: [Start Date] to [End Date]

Location: [Location]

Point of Contact: [Name] ([Email] - [Phone])

Schedule:
[Detailed daily schedule with times and activities]

Your Role:
[Role Title]: [Detailed role description]

Deliverables:
[List of deliverables]

Compensation:
Rate: $[Daily Rate]/day x [Number of Days] days = $[Total] total

Next Steps:
- Confirm your availability by replying to this email
- Send over a W9 just so we have it for tax purposes
Let me know if you have any questions. Looking forward to working with you!`,
  
  outreach: `You are the best salesman at a video production company (Flickman Media) based in NYC reaching out to prospects. Your tone should be likable, warm and intriguing. People like to answer your emails because you have intrigued them with your words. Adjust your tone and approach based on your familiarity with the recipient:

- For "Never Met": Be professional yet intriguing, focus on creating curiosity and establishing credibility without being too formal.
- For "Just Met": Reference that it was nice meeting them recently, be warmer and more familiar while maintaining professionalism.
- For "I Know Them": Be friendly and casual, leverage your existing relationship while still being professional.`,
  
  proposal: `You are an expoert salesman at a Flickman Media, a video production company. Your role is to take in information from discovery calls, online research, and provided data about a potential client and then to create an effective content proposal to our potential clients.`,
  
  runOfShow: `You are a senior producer at Flickman Media who's in charge of creating the run of show for an upcoming video shoot. You are very thorough and detailed, you are also very concise.`,
  
  budget: `You are an expert event production assistant helping to generate professional content for Flickman Media. Create a detailed production budget breakdown that includes all costs, labor rates, equipment fees, and calculates the total with the specified profit margin. Format your response in clean, well-structured markdown with appropriate headers and lists.`,
  
  timelineFromTranscript: `You are an expert video editor at Flickman Media, responsible for analyzing transcripts and creating time-coded editing timelines. Your task is to:
1. Analyze the provided transcript
2. Identify the most impactful and relevant segments based on the video's purpose and tone
3. Create a detailed timeline showing which parts of the transcript should be used
4. Highlight the specific sections of the transcript that should be included
5. Format your response in clean, well-structured markdown with clear timecodes and explanations for each segment selection`,
  
  trendingAudios: '' // No prompt needed for trending audios
}

// User prompts for different task types
export const getUserPrompt = (taskType: TaskType, formData: FormData): string => {
  switch (taskType) {
    case 'trendingAudios':
      return '' // No prompt needed for trending audios
    case 'contractorBrief':
      return `Create a contractor brief email following this exact format and style:

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
All footage must be handed off to the Flickman Media team before you leave.

**Compensation:**
Rate: $${formData.dailyRate}/day x ${formData.numberOfDays} days = $${Number(formData.dailyRate) * Number(formData.numberOfDays)} total

**Next Steps:**
- Confirm your availability by replying to this email
- Send over a W9 just so we have it for tax purposes
Let me know if you have any questions. Looking forward to working with you!`

    case 'outreach':
      return `Write a concise, friendly, casual, and purposeful email that is just supposed to get the other party to respond -- not necessarily close a deal. Do not include a subject line in the email body. Do not include any signature, sign-off, or name at the end - the email should end with your final message sentence. Your email should
      follow this general format:

      1. Immediately reference the research summary to start off with something that is relevant to the recipient. Don't use any filler opening lines like "Hope you've been well" or "I hope you're doing great".
      2. Subtly bring up that we've done work with similar companies to the one that we're reaching out to.
      3. End the email with a question that is relevant to the work that you guys could do together (example: "I'm curious how you guys are apporaching your content creation given all the new traction you've found?")

Your email should use the following details:

Recipient: ${formData.recipientName}
Company: ${formData.company}
Role: ${formData.role}
Familiarity Level: ${formData.familiarity}
Key Points: ${formData.keyPoints}

Research Summary:
${formData.perplexityResearch || 'No additional research available.'}

Use the research summary to tailor the message to the recipient's background and company context.

Your email should be no longer than 150 words, and you should use something from the research summary to start off with something that is relevant to the recipient. Your message should end with a question that is relevant to the work that you guys coudl do together (example: "I'm curious how you guys are apporaching your content creation given all the new traction you've found?")

${formData.familiarity === 'justMet' ? 'Make sure to reference your recent meeting/interaction in a natural way.' : ''}
${formData.familiarity === 'knowThem' ? 'Use a more casual, friendly tone that reflects your existing relationship.' : ''}`

    case 'proposal':
      const portfolioSection = formData.portfolioVideos?.length
        ? `\nRelevant Portfolio Examples:
${formData.portfolioVideos.map(video => `- ${video.title}
  URL: ${video.url}
  Description: ${video.description || 'Not available'}
  Project Type: ${video.projectType}`).join('\n')}`
        : '';

      return `Create a detailed video content proposal based on the following discovery call transcript, project detials, and array of portfolio videos. Make sure that it includes clear sections for the objectives of the project, our content strategy & approach, deliverables involved with the projcet, timeline of the project, visual references, investment (which means how much the client will have to invest in the project), and terms. Make sure to incorporate our portfolio examples to demonstrate our expertise and capabilities in the visual references section.

For the visual refernces section, choose the best 3 videos from the provided array of portfolio videos. 

The portfolio examples should be carefully selected based on:
- Project type matching (corporate, brand, product videos)
- Similar technical requirements
- Comparable scope and scale
- Relevant industry experience

When portfolio videos are provided, you MUST incorporate them into the proposal in a dedicated "Visual References" section. For each video:
1. Use the video's title as a heading (and make that title clickable to the video URL for easy reference)
2. Explain how this specific project demonstrates our expertise in areas relevant to the client's needs
3. Use the video's description to highlight our role (e.g., "Produced, filmed, and edited by Flickman Media")
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
- Delivery Date: ${formData.deliveryDate || ''}
- Budget: ${formData.budget || ''}
- Special Requirements: ${formData.requirements || ''}${portfolioSection}

Portfolio Videos:
${formData.portfolioVideos?.map(video => `- ${video.title}
  URL: ${video.url}
  Description: ${video.description || 'Not available'}
  Project Type: ${video.projectType}`).join('\n') || ''}

Format your response in clean, well-structured markdown with appropriate headers and lists.`

    case 'runOfShow':
      const getWeatherEmoji = (condition: string) => {
        const conditions = condition?.toLowerCase() || '';
        if (conditions.includes('snow')) return '🌨️';
        if (conditions.includes('rain')) return '🌧️';
        if (conditions.includes('cloud')) return '☁️';
        if (conditions.includes('clear')) return '☀️';
        if (conditions.includes('sun')) return '☀️';
        if (conditions.includes('thunder')) return '⛈️';
        if (conditions.includes('fog')) return '🌫️';
        if (conditions.includes('mist')) return '🌫️';
        return '🌤️'; // default to partly cloudy
      };

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
  const [time, ...rest] = line.split('-').map(s => s.trim());
  const activity = rest.join('-').trim();
  if (!time || !activity) return '';
  if (activity.toLowerCase().includes('shoot') || activity.toLowerCase().includes('film')) {
    return `| ${time} | **Green:** ${activity} |`;
  }
  return `| ${time} | **Yellow:** ${activity} |`;
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
      return `Please analyze this transcript and create a detailed editing timeline with the following parameters:

Client: ${formData.clientName}
Purpose: ${formData.purpose}
Target Length: ${formData.length}
Desired Tone: ${formData.tone}
Additional Context: ${formData.additionalNotes}

Transcript Content:
${formData.transcriptFile}

Please provide:
1. A time-coded timeline of recommended segments to use
2. Brief explanations for why each segment was chosen
3. A version of the transcript with recommended segments clearly highlighted
4. Any additional editing notes or recommendations

Format the response in clear markdown with appropriate sections and timecodes.`

    default:
      return ''
  }
} 