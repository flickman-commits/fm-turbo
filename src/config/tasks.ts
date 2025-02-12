import { TaskType } from '@/types/tasks'

export interface FormField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'date' | 'number' | 'file' | 'select' | 'buttonSelect' | 'portfolioSelector'
  placeholder: string
  accept?: string
  options?: { value: string; label: string; default?: boolean }[]
  helpLink?: string
  helpText?: string
  showIf?: string
  optional?: string
}

export interface TaskConfig {
  title: string
  description: string
  fields: FormField[]
  resultSections?: {
    id: string
    title: string
    contentKey?: string // if not provided, will use main content
  }[]
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
      { id: 'deliverables', label: 'Deliverables', type: 'textarea', placeholder: 'Enter project deliverables' },
      { id: 'dailyRate', label: 'Daily Rate', type: 'number', placeholder: 'Enter daily rate' },
      { id: 'numberOfDays', label: 'Number of Days', type: 'number', placeholder: 'Enter number of days' }
    ],
    resultSections: [
      {
        id: 'content',
        title: 'Contractor Brief'
      }
    ]
  },
  proposal: {
    title: 'Create Video Content Proposal',
    description: 'Let us generate a proposal from a client discovery call transcript. If you don\'t have a transcript, just enter the details and we can take care of the rest.',
    fields: [
      { 
        id: 'discoveryTranscript', 
        label: 'Discovery Call Transcript (Optional)', 
        type: 'file', 
        placeholder: 'Upload your discovery call transcript',
        accept: '.json,application/json',
        optional: 'true'
      },
      { 
        id: 'projectType', 
        label: 'Project Type', 
        type: 'text', 
        placeholder: 'Corporate Video, Brand Story, etc.'
      },
      { 
        id: 'clientName', 
        label: 'Client Name', 
        type: 'text', 
        placeholder: 'Enter client name'
      },
      { 
        id: 'timelineInfo', 
        label: 'Timeline Info (Optional)', 
        type: 'text', 
        placeholder: 'Enter any info regarding timeline (ex: event takes place Jan 7th, final deliverables needed by Feb 10th, etc.)',
        optional: 'true'
      },
      { 
        id: 'budget', 
        label: 'Budget (Optional)', 
        type: 'text', 
        placeholder: 'Enter budget range',
        optional: 'true'
      },
      { 
        id: 'additionalNotes', 
        label: 'Additional Notes (Optional)', 
        type: 'textarea', 
        placeholder: 'Enter any specific requirements or additional information about the project',
        optional: 'true'
      }
    ],
    resultSections: [
      {
        id: 'content',
        title: 'Content Proposal'
      }
    ]
  },
  outreach: {
    title: 'Create Outreach Message',
    description: 'Create a personalized outreach message for potential clients or partners.',
    fields: [
      { id: 'recipientName', label: 'Recipient Name', type: 'text', placeholder: 'Enter recipient name' },
      { id: 'familiarity', label: 'Familiarity', type: 'buttonSelect', placeholder: 'Select familiarity level', options: [
        { value: 'neverMet', label: '🤝 Never Met', default: true },
        { value: 'justMet', label: '👋 Just Met' },
        { value: 'knowThem', label: '🤗 I Know Them' }
      ]},
      { id: 'company', label: 'Company', type: 'text', placeholder: 'Enter company name' },
      { id: 'keyPointsToEmphasize', label: 'Key Points to Emphasize', type: 'textarea', placeholder: 'Enter key points to address' }
    ],
    resultSections: [
      {
        id: 'research',
        title: 'Research Summary',
        contentKey: 'research'
      },
      {
        id: 'message',
        title: 'Outreach Message',
        contentKey: 'content'
      }
    ]
  },
  runOfShow: {
    title: 'Create Run of Show',
    description: 'Generate a detailed run of show timeline for a video production shoot with location details, crew call times, and color-coded schedule.',
    fields: [
      { id: 'location', label: 'Location Name', type: 'text', placeholder: 'e.g. The Malin' },
      { id: 'address', label: 'Full Address', type: 'text', placeholder: 'Enter complete address for Google Maps link' },
      { id: 'shootDate', label: 'Shoot Date', type: 'date', placeholder: 'Select shoot date' },
      { id: 'crewMembers', label: 'Crew Members', type: 'textarea', placeholder: 'List all crew members and their roles' },
      { id: 'callTimes', label: 'Call Times', type: 'textarea', placeholder: 'Enter call/wrap times for each crew member' },
      { id: 'schedule', label: 'Detailed Schedule', type: 'textarea', placeholder: 'Enter detailed schedule including setup, scenes to shoot, and wrap' }
    ],
    resultSections: [
      {
        id: 'content',
        title: 'Run of Show'
      }
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
    ],
    resultSections: [
      {
        id: 'content',
        title: 'Production Budget'
      }
    ]
  },
  timelineFromTranscript: {
    title: 'Your Timeline from Transcript',
    description: 'This task will help you cut down minutes or hours of interview footage into the bits that you need to create a compelling video. Simply upload a transcript of your timeline, tell us what you\'re looking for, and we will do the rest.',
    fields: [
      { 
        id: 'transcriptFile', 
        label: 'Transcript File', 
        type: 'file', 
        placeholder: 'Upload your transcript file',
        accept: '.txt,text/plain',
        helpLink: 'https://www.youtube.com/watch?v=fwHZYS0tduE',
        helpText: 'teach me how to get this file'
      },
      { id: 'clientName', label: 'Client Name', type: 'text', placeholder: 'Enter client name' },
      { id: 'purpose', label: 'Purpose of Video', type: 'textarea', placeholder: 'What is the main purpose or goal of this video?' },
      { id: 'length', label: 'Length of Video', type: 'text', placeholder: 'Desired final video length' },
      { id: 'tone', label: 'Tone of Video', type: 'text', placeholder: 'Desired tone or style of the video' },
      { id: 'additionalNotes', label: 'Additional Notes', type: 'textarea', placeholder: 'Please provide as much detail as possible about what you want to achieve with this video, including any specific moments or themes you want to highlight' }
    ],
    resultSections: [
      {
        id: 'content',
        title: 'Timeline'
      }
    ]
  },
  trendingAudios: {
    title: 'Trending Audios',
    description: 'Download the latest trending audio tracks for your content.',
    fields: [],
    resultSections: [
      {
        id: 'content',
        title: 'Trending Audios'
      }
    ]
  }
} 