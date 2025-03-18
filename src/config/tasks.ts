import { TaskType, TaskConfig, FormField } from '@/types/tasks'
import { FileText, Send, Clock, Calendar, LayoutDashboard, Scale } from 'lucide-react'

export const taskConfigs: Record<TaskType, TaskConfig> = {
  runOfShow: {
    title: 'Run of Show',
    description: 'Create a detailed timeline for your event or production',
    icon: Clock,
    fields: [
      {
        id: 'eventName',
        label: 'Event Name',
        type: 'text',
        placeholder: 'Enter the name of your event'
      },
      {
        id: 'eventType',
        label: 'Event Type',
        type: 'select',
        options: ['Wedding', 'Corporate Event', 'Music Video', 'Commercial', 'Other']
      },
      {
        id: 'eventDate',
        label: 'Event Date',
        type: 'text',
        placeholder: 'When is the event?'
      },
      {
        id: 'eventLocation',
        label: 'Event Location',
        type: 'text',
        placeholder: 'Where is the event taking place?'
      },
      {
        id: 'eventDescription',
        label: 'Event Description',
        type: 'textarea',
        placeholder: 'Describe the event and any specific requirements'
      }
    ]
  },
  contractorBrief: {
    title: 'Contractor Brief',
    description: 'Generate comprehensive briefs for your contractors',
    icon: FileText,
    fields: [
      {
        id: 'projectName',
        label: 'Project Name',
        type: 'text',
        placeholder: 'Enter the name of your project'
      },
      {
        id: 'contractorRole',
        label: 'Contractor Role',
        type: 'select',
        options: ['Videographer', 'Editor', 'Sound Engineer', 'Production Assistant', 'Other']
      },
      {
        id: 'projectDescription',
        label: 'Project Description',
        type: 'textarea',
        placeholder: 'Describe the project and its requirements'
      }
    ]
  },
  outreach: {
    title: 'Outreach',
    description: 'Generate personalized outreach messages',
    icon: Send,
    fields: [
      {
        id: 'recipientName',
        label: 'Recipient Name',
        type: 'text',
        placeholder: 'Who are you reaching out to?'
      },
      {
        id: 'company',
        label: 'Company',
        type: 'text',
        placeholder: 'What company do they work for?'
      }
    ]
  },
  proposal: {
    title: 'Proposal',
    description: 'Generate professional proposals',
    icon: FileText,
    fields: [
      {
        id: 'clientName',
        label: 'Client Name',
        type: 'text',
        placeholder: 'Enter the client name'
      },
      {
        id: 'projectType',
        label: 'Project Type',
        type: 'select',
        options: ['Wedding', 'Corporate Video', 'Music Video', 'Commercial', 'Other']
      },
      {
        id: 'projectDescription',
        label: 'Project Description',
        type: 'textarea',
        placeholder: 'Describe the project requirements'
      }
    ]
  },
  budget: {
    title: 'Budget',
    description: 'Create detailed project budgets',
    icon: Calendar,
    fields: [
      {
        id: 'projectName',
        label: 'Project Name',
        type: 'text',
        placeholder: 'Enter the project name'
      },
      {
        id: 'projectType',
        label: 'Project Type',
        type: 'select',
        options: ['Wedding', 'Corporate Video', 'Music Video', 'Commercial', 'Other']
      },
      {
        id: 'projectDescription',
        label: 'Project Description',
        type: 'textarea',
        placeholder: 'Describe the project scope and requirements'
      }
    ]
  },
  timelineFromTranscript: {
    title: 'Timeline from Transcript',
    description: 'Generate a timeline from interview transcripts',
    icon: LayoutDashboard,
    fields: [
      {
        id: 'transcript',
        label: 'Interview Transcript',
        type: 'textarea',
        placeholder: 'Paste your interview transcript here'
      }
    ]
  },
  negotiation: {
    title: 'Negotiation',
    description: 'Get AI-powered advice for negotiating with clients',
    icon: Scale,
    fields: [
      {
        id: 'emailText',
        label: 'Email Content',
        type: 'textarea',
        placeholder: 'Paste the negotiation email content here...'
      }
    ]
  }
} 