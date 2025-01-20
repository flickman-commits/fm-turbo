import { TaskType } from '@/types/tasks'
import { WeatherData } from '@/services/location'

interface FormData {
  [key: string]: string | WeatherData | undefined;
  weather?: WeatherData;
  googleMapsLink?: string;
  location?: string;
  address?: string;
  shootDate?: string;
  crewMembers?: string;
  callTimes?: string;
  schedule?: string;
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
  
  outreach: `You are the owner of a video production company based in NYC reaching out to a new potential client of Flickman Media. You write emails to potential new clients that you've never met all the time and are very good at it. Your tone is likable, warm and intriguing. People like to answer your emails because you have intrigued them with your words.`,
  
  proposal: `You are an expert video production assistant helping to generate professional content for Flickman Media. Create a detailed video content proposal that includes clear sections for project overview, production approach, technical requirements, timeline, and budget breakdown. Format your response in clean, well-structured markdown with appropriate headers and lists.`,
  
  runOfShow: `You are a senior producer at Flickman Media who's in charge of creating the run of show for an upcoming video shoot. You are very thorough and detailed, you are also very concise.`,
  
  budget: `You are an expert event production assistant helping to generate professional content for Flickman Media. Create a detailed production budget breakdown that includes all costs, labor rates, equipment fees, and calculates the total with the specified profit margin. Format your response in clean, well-structured markdown with appropriate headers and lists.`,
  
  timelineFromTranscript: `You are an expert video editor at Flickman Media, responsible for analyzing transcripts and creating time-coded editing timelines. Your task is to:
1. Analyze the provided transcript
2. Identify the most impactful and relevant segments based on the video's purpose and tone
3. Create a detailed timeline showing which parts of the transcript should be used
4. Highlight the specific sections of the transcript that should be included
5. Format your response in clean, well-structured markdown with clear timecodes and explanations for each segment selection`
}

// User prompts for different task types
export const getUserPrompt = (taskType: TaskType, formData: FormData): string => {
  switch (taskType) {
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
      return `Write a concise, friendly, casual, and purposeful email that is just supposed to get the other party to respond -- not necessarily close a deal. Do not include a subject line in the email body. Do not include any signature, sign-off, or name at the end - the email should end with your final message sentence.

Your email should use the following details:

Recipient: ${formData.recipientName}
Subject: ${formData.subject}
Company: ${formData.company}
Role: ${formData.role}
Key Points: ${formData.keyPoints}

Don't write anything too salesy - we are just looking to start a conversation. Talk like you to an old friend, keep it casual.

The structure should be like this:

"Hey ***first name***"
<insert reason for reaching out - this should mention>
<Get into our value proposition - what we can do for them>
<close with some sort of question intended to get them to answer the email -- things like "curious if you are doing anything on paid social. how are you approaching that?>

The email should be no more than 100 words. Keep it short and sweet. In each email please mis spell 2 words, but only slightly. Also, don't make the formatting perfect, let some things that are capitalized normally not be capitalized, however don't make any grammatical or capitalization errors with our company name "Flickman Media" or their company name. Do not include any signature, name, or sign-off at the end - the email should end with your final message sentence. Use markdown for basic structure but keep the formatting clean and minimal.

Here are 3 good outreach messages for you to emulate -- specifically notice how they use some sort of personal anecdote to start the message and how they all end with a question -- mimic these when you're writing your outreach message:

Hey ____,

I walk by your guys Madison Ave location almost every day — it's always packed in there. Every time I'm walking by I always think about the creative we could do for you guys.

My name is Matt, I run a video production company here in New York and I've got a couple ideas I'd love to send your way. Are you the right person to send to?

Thanks,
Matt

Hey ___,

I've been getting targeting with your guys ads for a week, and as a creative, I felt I needed to share my 2 cents. I love the concept behind them but think we can execute differently to really make them come alive. I've got 3 ideas specifically, that I can share in a Loom video. Are you the right person to send to?

Thanks,
Matt

Hey ____,

My girlfriend won't stop talking about your brand — I gave her my word that I'd try to pitch you guys… so here I am.

I've got 14 ideas on what we'd do to help with your creative. Any chance I can tell you my favorite 3 over coffee or a Zoom?

Thanks,
Matt`

    case 'proposal':
      return `Please create a detailed video content proposal with the following details:

Project Type: ${formData.projectType}
Client: ${formData.clientName}
Delivery Date: ${formData.deliveryDate}
Budget Range: ${formData.budget}
Special Requirements: ${formData.requirements}

Include sections for project overview, production approach, technical requirements, timeline, and budget breakdown. Format the response in clear markdown with appropriate sections and bullet points.`

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
- List each crew member with their call and wrap times

4. SCHEDULE
| Time | Activity |
|-----------------|----------------------------------|
| ${formData.weather?.sunrise || 'N/A'} | **Orange:** Sunrise |
[Schedule details here]
| ${formData.weather?.sunset || 'N/A'} | **Blue:** Sunset |

Format the schedule as a table with two columns (Time and Activity). Include sunrise and sunset times in the schedule marked with their respective colors. Color code activities based on the color key above.`

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