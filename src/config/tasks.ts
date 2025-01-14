import { TaskType } from '@/types/tasks'

export interface FormField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'date' | 'number'
  placeholder: string
}

export interface TaskConfig {
  title: string
  description: string
  fields: FormField[]
}

export const taskConfigs: Record<TaskType, TaskConfig> = {
  proposal: {
    title: 'Create Event Proposal',
    description: 'Generate a detailed event proposal with timeline, requirements, and budget breakdown.',
    fields: [
      { id: 'eventType', label: 'Event Type', type: 'text', placeholder: 'Corporate Conference, Wedding, etc.' },
      { id: 'clientName', label: 'Client Name', type: 'text', placeholder: 'Enter client name' },
      { id: 'eventDate', label: 'Event Date', type: 'date', placeholder: 'Select event date' },
      { id: 'attendees', label: 'Expected Attendees', type: 'number', placeholder: 'Enter number of attendees' },
      { id: 'budget', label: 'Budget', type: 'text', placeholder: 'Enter budget range' },
      { id: 'requirements', label: 'Special Requirements', type: 'textarea', placeholder: 'Enter any special requirements or notes' }
    ]
  },
  outreach: {
    title: 'Generate Outreach Message',
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
    title: 'Production Budget',
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
  }
} 