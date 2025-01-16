import { TaskType } from '@/types/tasks'

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
  
  outreach: `You are the owner of a video production company reaching out to new potential clients of Flickman Media. Create a professional outreach email that follows our standard markdown formatting. The email should be clean, casual, and business-appropriate. Do not include a subject line in the email body. Do not include any signature, sign-off, or name at the end - the email should end with your final message sentence.`,
  
  proposal: `You are an expert video production assistant helping to generate professional content for Flickman Media. Create a detailed video content proposal that includes clear sections for project overview, production approach, technical requirements, timeline, and budget breakdown. Format your response in clean, well-structured markdown with appropriate headers and lists.`,
  
  runOfShow: `You are an expert event production assistant helping to generate professional content for Flickman Media. Create a comprehensive run of show document that includes detailed timing, technical cues, and production notes. Format your response in clean, well-structured markdown with appropriate headers and lists.`,
  
  budget: `You are an expert event production assistant helping to generate professional content for Flickman Media. Create a detailed production budget breakdown that includes all costs, labor rates, equipment fees, and calculates the total with the specified profit margin. Format your response in clean, well-structured markdown with appropriate headers and lists.`,
  
  timelineFromTranscript: `You are an expert video editor at Flickman Media, responsible for analyzing transcripts and creating time-coded editing timelines. Your task is to:
1. Analyze the provided transcript
2. Identify the most impactful and relevant segments based on the video's purpose and tone
3. Create a detailed timeline showing which parts of the transcript should be used
4. Highlight the specific sections of the transcript that should be included
5. Format your response in clean, well-structured markdown with clear timecodes and explanations for each segment selection`
}

// User prompts for different task types
export const getUserPrompt = (taskType: TaskType, formData: Record<string, string>): string => {
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
      return `Please create an outreach email with the following details:
              
Recipient: ${formData.recipientName}
Subject Line Context: ${formData.subject}
Company: ${formData.company}
Role: ${formData.role}
Key Points: ${formData.keyPoints}

Remember to not be too salesy - we are just looking to start a conversation. Talk like you would when you talk to an old friend, keep it casual.

Format the email starting with "We haven't met yet but I wanted to introduce myself." Then get into our value proposition, and a clear call to action that should either ask them to hop on a call or ask if there's any interest in discussing further. The email should be no more than 2 paragraphs. Keep it short and sweet. Do not include any signature, name, or sign-off at the end - the email should end with your final message sentence. Use markdown for basic structure but keep the formatting clean and minimal.`

    case 'proposal':
      return `Please create a detailed video content proposal with the following details:

Project Type: ${formData.projectType}
Client: ${formData.clientName}
Delivery Date: ${formData.deliveryDate}
Budget Range: ${formData.budget}
Special Requirements: ${formData.requirements}

Include sections for project overview, production approach, technical requirements, timeline, and budget breakdown. Format the response in clear markdown with appropriate sections and bullet points.`

    case 'runOfShow':
      return `Please create a detailed run of show document with the following details:

Event Name: ${formData.eventName}
Event Date: ${formData.eventDate}
Venue: ${formData.venue}
Duration: ${formData.duration}
Key Moments: ${formData.keyMoments}

Create a minute-by-minute timeline that includes all technical cues, stage movements, and production notes. Format in clear markdown with appropriate sections and timing details.`

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