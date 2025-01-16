import { TaskType } from '@/types/tasks'

export interface FormField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'date' | 'number' | 'file'
  placeholder: string
}

export interface TaskConfig {
  title: string
  description: string
  fields: FormField[]
}

export const taskConfigs: Record<TaskType, TaskConfig> = {
  contractorBrief: {
    title: 'Create Contractor Brief Email',
    description: 'Generate a detailed contractor brief email with project details, schedule, and compensation information.',
    fields: [
      { id: 'contractorName', label: 'Contractor Name', type: 'text', placeholder: 'Enter contractor name' },
      { id: 'contractorEmail', label: 'Contractor Email', type: 'text', placeholder: 'Enter contractor email' },
      { id: 'client', label: 'Client', type: 'text', placeholder: 'Enter client name' },
      { id: 'startDate', label: 'Start Date', type: 'date', placeholder: 'Select start date' },
      { id: 'endDate', label: 'End Date', type: 'date', placeholder: 'Select end date' },
      { id: 'location', label: 'Location', type: 'text', placeholder: 'Enter location' },
      { id: 'pointOfContact', label: 'Point of Contact', type: 'text', placeholder: 'Enter point of contact name' },
      { id: 'contactEmail', label: 'Contact Email', type: 'text', placeholder: 'Enter contact email' },
      { id: 'contactPhone', label: 'Contact Phone', type: 'text', placeholder: 'Enter contact phone' },
      { id: 'schedule', label: 'Daily Schedule', type: 'textarea', placeholder: 'Enter detailed daily schedule' },
      { id: 'role', label: 'Contractor Role', type: 'textarea', placeholder: 'Enter detailed role description' },
      { id: 'dailyRate', label: 'Daily Rate', type: 'number', placeholder: 'Enter daily rate' },
      { id: 'numberOfDays', label: 'Number of Days', type: 'number', placeholder: 'Enter number of days' }
    ]
  },
  proposal: {
    title: 'Create Video Content Proposal',
    description: 'Generate a detailed video content proposal with timeline, requirements, and budget breakdown.',
    fields: [
      { id: 'projectType', label: 'Project Type', type: 'text', placeholder: 'Corporate Video, Brand Story, etc.' },
      { id: 'clientName', label: 'Client Name', type: 'text', placeholder: 'Enter client name' },
      { id: 'deliveryDate', label: 'Delivery Date', type: 'date', placeholder: 'Select delivery date' },
      { id: 'budget', label: 'Budget', type: 'text', placeholder: 'Enter budget range' },
      { id: 'requirements', label: 'Special Requirements', type: 'textarea', placeholder: 'Enter any special requirements or notes' }
    ]
  },
  outreach: {
    title: 'Create Outreach Message',
    description: 'Create a personalized outreach message for potential clients or partners.',
    fields: [
      { id: 'recipientName', label: 'Recipient Name', type: 'text', placeholder: 'Enter recipient name' },
      { id: 'subject', label: 'Subject', type: 'text', placeholder: 'Enter message subject' },
      { id: 'company', label: 'Company', type: 'text', placeholder: 'Enter company name' },
      { id: 'role', label: 'Recipient Role', type: 'text', placeholder: 'Enter recipient role' },
      { id: 'keyPoints', label: 'Key Points', type: 'textarea', placeholder: 'Enter key points to address' }
    ]
  },
  runOfShow: {
    title: 'Create Run of Show',
    description: 'Generate a detailed run of show timeline with setup, execution, and strike plans.',
    fields: [
      { id: 'eventName', label: 'Event Name', type: 'text', placeholder: 'Enter event name' },
      { id: 'eventDate', label: 'Event Date', type: 'date', placeholder: 'Select event date' },
      { id: 'venue', label: 'Venue', type: 'text', placeholder: 'Enter venue name and details' },
      { id: 'duration', label: 'Duration', type: 'text', placeholder: 'Enter event duration' },
      { id: 'keyMoments', label: 'Key Moments', type: 'textarea', placeholder: 'List key moments or milestones' }
    ]
  },
  budget: {
    title: 'Create Production Budget',
    description: 'Calculate production costs including crew, equipment, editing, and desired profit margin.',
    fields: [
      { id: 'eventType', label: 'Event Type', type: 'text', placeholder: 'Type of production' },
      { id: 'productionDays', label: 'Production Days', type: 'number', placeholder: 'Number of filming/production days' },
      { id: 'crewSize', label: 'Crew Size', type: 'number', placeholder: 'Number of crew members needed' },
      { id: 'equipmentNeeds', label: 'Equipment Needs', type: 'textarea', placeholder: 'List required equipment (cameras, lights, audio, etc.)' },
      { id: 'editingHours', label: 'Editing Hours', type: 'number', placeholder: 'Estimated post-production hours' },
      { id: 'profitMargin', label: 'Desired Profit Margin (%)', type: 'number', placeholder: 'Enter target profit percentage' },
      { id: 'additionalCosts', label: 'Additional Costs', type: 'textarea', placeholder: 'Travel, accommodation, rentals, etc.' }
    ]
  },
  timelineFromTranscript: {
    title: 'Your Timeline from Transcript',
    description: 'Create the most effective timeline based off your transcript and project goals.',
    fields: [
      { id: 'transcriptFile', label: 'Transcript File', type: 'file', placeholder: 'Upload your transcript file (txt)' },
      { id: 'clientName', label: 'Client Name', type: 'text', placeholder: 'Enter client name' },
      { id: 'purpose', label: 'Purpose of Video', type: 'textarea', placeholder: 'What is the main purpose or goal of this video?' },
      { id: 'length', label: 'Length of Video', type: 'text', placeholder: 'Desired final video length' },
      { id: 'tone', label: 'Tone of Video', type: 'text', placeholder: 'Desired tone or style of the video' },
      { id: 'additionalNotes', label: 'Additional Notes', type: 'textarea', placeholder: 'Please provide as much detail as possible about what you want to achieve with this video, including any specific moments or themes you want to highlight' }
    ]
  }
} 