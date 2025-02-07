import { useState, useEffect } from 'react'
import { TaskType, TaskResult, taskActionConfigs, TaskActionConfig } from '@/types/tasks'
import { taskConfigs, FormField } from '@/config/tasks'
import { getSystemPrompts, getUserPrompt, getUserInfoFromLocalStorage, UserInfo } from '@/config/prompts'
import { DottedDialog } from '@/components/ui/dotted-dialog-wrapper'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/rainbow-toast'
import { createChatCompletion } from '@/services/openai'
import { getGoogleMapsLink, getWeatherData } from '@/services/location'
import { NotionButton } from '@/components/ui/notion-button'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import OpenAI from 'openai'
import { FormDataWithWeather, Video } from '@/types/forms'
import { creditsManager } from '@/utils/credits'
import { useUser } from '@/contexts/UserContext'
import { PortfolioVideoSelector } from '@/components/PortfolioVideoSelector'
import { links } from '@/config/links'
import { queryPerplexity } from '@/services/perplexity'
import { getOutreachSystemPrompt } from '@/config/outreachPrompt'
import { useCompanyInfo } from '@/contexts/CompanyInfoContext'

type ViewState = 'input' | 'loading' | 'result'

const testData: Record<TaskType, FormDataWithWeather> = {
  contractorBrief: {
    contractorName: 'Nick',
    contractorEmail: 'nick@example.com',
    client: 'Evergreen Wealth',
    startDate: '2024-12-07',
    endDate: '2024-12-08',
    location: 'Miami, FL',
    pointOfContact: 'Matt Hickman',
    contactEmail: 'matt@flickmanmedia.com',
    contactPhone: '5039156104',
    schedule: `Saturday, December 7th (Shoot):
7:30 AM - Leave Crew Hotel & Uber to Studio
7:50 AM - Arrive at Studio
8:00 AM - We are let in to studio
9:30 AM-11 AM - First shot
11-1:30 PM - Film Tax Strategies
1:30 PM Lunch on location (PA to order on Uber Eats)
3:00 PM - 6:00 PM Shoot Miami cityscape location
7:00 PM Crew dinner. Make game plan for tomorrow — get some outdoor shots, more run and gun, delivering lines, run and gun

Sunday, December 8th - Miami, FL (Shoot):
6:56 AM - Sunrise
6:45 AM - Meet for Breakfast & Coffee
7:00 AM - Leave for Jack Daniel's HQ
7:30 AM - 9:30 AM Shoot for social on Day 2 — Shoot horizontal and cut vertical
1:30 PM Lunch on location or in Lynchburg
3:30 PM - 6:30 PM Shoot Miami cityscape location
7:00 PM Crew dinner
5:30 PM Sunset`,
    role: `Director of Photography (DP)`,
    deliverables: `- All raw footage must be handed off to our team at the end of the shoot`,
    dailyRate: '1500',
    numberOfDays: '2'
  },
  proposal: {
    projectType: 'US Creative Partner',
    clientName: 'Oanda',
    timelineInfo: 'Event filming on Jan 7th 2024, rough cut needed by Jan 21st, final deliverables by Feb 10th 2024',
    budget: '$50,000',
    discoveryTranscript: '/discovery-call-transcript.json',
    requirements: 'Full video production setup with localized content for US market, professional crew, and high-end equipment for corporate brand video. Focus on creating content that resonates with US traders while maintaining global brand standards.',
    portfolioVideos: [
      {
        id: '1042629726',
        title: '"Tax Optimization" | Evergreen Wealth',
        description: 'A professional corporate video showcasing financial expertise and complex topics in an engaging way.',
        url: 'https://vimeo.com/1042629726',
        thumbnail: null,
        views: 0,
        likes: 0,
        projectType: 'corporate'
      },
      {
        id: '1030922649',
        title: '"Join Us" | Regeneration.VC',
        description: 'Flickman Media filmed & edited an event recap of ReAssembly 2024 -- a 2-day climate week conference that brought together visionaries and changemakers in the climate world.',
        url: 'https://vimeo.com/1030922649',
        thumbnail: null,
        views: 0,
        likes: 0,
        projectType: 'corporate'
      },
      {
        id: '926038873',
        title: '"Celebrating 20 Years" | Lure Fishbar',
        description: 'A brand-focused video that effectively tells the story of an established business while maintaining professionalism and engagement.',
        url: 'https://vimeo.com/926038873',
        thumbnail: null,
        views: 0,
        likes: 0,
        projectType: 'brand'
      }
    ]
  },
  outreach: {
    recipientName: 'Linnea Schuessler',
    subject: 'Video Production Partnership for Huel',
    company: 'Huel',
    role: 'Creative Strategist',
    familiarity: 'neverMet',
    keyPointsToEmphasize: 'Experienced in brand storytelling, product launches, and social media content creation. Specialized in food & beverage industry video production.'
  },
  runOfShow: {
    location: 'The Malin',
    address: '387 Park Ave South, 5th Floor, New York, NY 10016',
    shootDate: '2023-12-16',
    crewMembers: `Flickman, Nick Brady, Natalia Ohanesian, Lilah Beldner, Holly & Brian`,
    callTimes: `7:45 AM (call) / 5:00 PM (wrap)`,
    schedule: `7:15 AM - Sunrise
7:45 AM - Arrive on site
8:00 - 9:00 AM - Go up to Malin, build out cameras, Nick to start setting up interview setup, Flickman to shoot b-roll on gimbal during this time
9:00 - 10:00 AM - Sana Labs is having real meeting in board room — we will shoot this on gimbal (can shoot on both cams if Nick is done setting up lighting equipment)
10:00 - 11:00 AM - Clean the Sana Labs office, set up decor, start getting office b-roll if it's clean, detail shots
11:00 AM - 12:00 PM - Real meeting in Sana Labs office (shoot this on gimbal)
12:00 - 1:00 PM - Choreographed / specialty shots in Sana Labs office
1:00 - 2:00 PM - Lunch break
2:00 - 3:30 PM - Shoot interviews
3:30 - 5:00 PM - Additional b-roll and breakdown gear
5:00 PM - Wrap shoot
4:30 PM - Sunset`
  },
  budget: {
    eventType: 'Corporate Brand Video',
    productionDays: '3',
    crewSize: '8',
    equipmentNeeds: 'RED Camera Package, Lighting Kit, Audio Package, Gimbal, Drone',
    editingHours: '40',
    profitMargin: '25',
    additionalCosts: 'Travel for crew, Equipment insurance, Location permits, Catering'
  },
  timelineFromTranscript: {
    clientName: 'The Malin',
    purpose: 'Build brand awareness for Sana Labs as an innovative AI company and highlight the synergy between Sana Labs and The Malin through their shared appreciation for design.',
    length: '2-3 minutes',
    tone: 'Inspiring',
    additionalNotes: `I'm going to give you a transcript from some interviews we recorded - we recorded 4 different employees who work at Sana Labs, which is a company that creates two main AI products -

The four employees names are Timmy (his interview starts at 0 seconds), Velm (his interview starts at 7:14), Lisa (her interview starts at 17:54) and Nick (his interview starts at 30:45)

Each of them has a different perspective on working at Sana labs

The purpose of this video is to highlight that Sana Labs is an exciting new company that is doing big things in the world of AI, we also want to highlight how design-forward Sana Labs is and tie their scandanavian roots and love of design with their decision to work at the Malin (because the Malin is very design forward as well)

The general structure of the video is going to be as follows:
- Explaining what Sana Labs is and what they do
- talk about the excitement in AI, what they are excited about
- talk about how Sana labs is a very design forward company
- talk about why Sana labs chose to work at the Malin (using the design forward approach of the malin and sana labs as the segway into that section)

We shouldn't cut between speakers too often, the minimum would be 10 seconds of a speaker before showing the next`
  },
  trendingAudios: {
    // This is a placeholder for the new task type
  }
}

const BUSINESS_QUOTES = [
  "If you have < $10,000 saved up, don't buy crypto. Invest in the ability to make money. Then, you can restart the game as many times as you want.",
  "If you can't sit still, ignore notifications, and focus on one task for eight hours straight, never expect to build something great.",
  "If you can't explain why you believe what you believe, it's not your belief, it's someone else's.",
  "The only thing crazier than chasing your goals is expecting other people to understand them.",
  "The person who asks the most times gets the most. The problem is, people don't like being asked. So you have to give value consistently so you can earn the right to keep asking. Winners win because they take more shots on goal. But they only get those shots on goal because they know how to get into scoring position.",
  "If you want better clients, stop selling cheap stuff",
  "The best way to hit next year's goals is to not wait until next year to work on them.",
  "The best marketing is the kind that works.",
  "The reason it's taking so long is because you're in a rush.",
  "The cost of settling is higher than the price of ambition. You just pay it later."
]

const LoadingOverlay = () => {
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * BUSINESS_QUOTES.length))

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex(current => (current + 1) % BUSINESS_QUOTES.length)
    }, 7000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute inset-0 bg-turbo-beige flex flex-col items-center justify-center z-50 p-8">
      <div className="w-12 h-12 border-4 border-turbo-black/20 border-t-turbo-black rounded-full animate-spin mb-4"></div>
      <p className="text-turbo-black text-lg font-medium text-center mb-12">
        Hold tight... Turbo is doing tedious work for you...
      </p>
      <div className="max-w-2xl w-full bg-turbo-black/5 border-2 border-turbo-black rounded-lg p-6">
        <p className="text-2xl font-bold text-turbo-black mb-3 text-left">💭 Words of Wisdom</p>
        <p className="text-lg text-turbo-black leading-relaxed">
          "{BUSINESS_QUOTES[quoteIndex]}"
        </p>
      </div>
    </div>
  )
}

const defaultWeather = {
  sunrise: '7:15 AM',
  sunset: '4:30 PM',
  temperature: 45,
  conditions: 'partly cloudy',
  high: 50,
  low: 40
}

export function TaskModal({
  taskType,
  onClose,
}: {
  taskType: TaskType
  onClose: () => void
}) {
  const { user } = useUser()
  const { isInfoSaved } = useCompanyInfo()
  const [formData, setFormData] = useState<FormDataWithWeather>({})
  const [viewState, setViewState] = useState<ViewState>('input')
  const [result, setResult] = useState<TaskResult | null>(null)
  const [selectedFileName, setSelectedFileName] = useState('')
  const [copiedButtons, setCopiedButtons] = useState<Record<string, boolean>>({})

  if (!taskType) return null
  const config = taskConfigs[taskType]
  const isLoading = viewState === 'loading'

  const isFormValid = () => {
    return config.fields.every(field => {
      // Skip validation for hidden fields
      if (field.showIf) {
        const [dependentField, value] = field.showIf.split('=')
        if (formData[dependentField] !== value) {
          return true
        }
      }

      // Skip validation for optional fields when condition is met
      if (field.optional) {
        const [dependentField, value] = field.optional.split('=')
        if (formData[dependentField] === value) {
          return true
        }
      }

      const value = formData[field.id]
      return typeof value === 'string' && value.trim().length > 0
    })
  }

  const shouldShowField = (field: FormField) => {
    if (!field.showIf) return true
    const [dependentField, value] = field.showIf.split('=')
    return formData[dependentField] === value
  }

  const isFieldRequired = (field: FormField) => {
    if (field.optional) {
      const [dependentField, value] = field.optional.split('=')
      return formData[dependentField] !== value
    }
    return true
  }

  const handleFillTestData = async () => {
    if (taskType === 'timelineFromTranscript') {
      try {
        const response = await fetch('/sana-labs-transcript.txt')
        if (!response.ok) {
          throw new Error('Failed to fetch transcript file')
        }
        const transcriptContent = await response.text()
        
        // Create a File object from the content
        const file = new File(
          [transcriptContent],
          'sana-labs-transcript.txt',
          { type: 'text/plain' }
        )
        
        // Create a DataTransfer object to simulate a file input
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        
        // Find the file input element and set its files
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
        if (fileInput) {
          fileInput.files = dataTransfer.files
        }

        setFormData({
          ...testData[taskType],
          transcriptFile: transcriptContent
        })
        setSelectedFileName('sana-labs-transcript.txt')
      } catch (error) {
        console.error('Failed to load transcript file:', error)
        toast.error('Failed to load transcript file')
      }
    } else if (taskType === 'proposal') {
      try {
        const response = await fetch('/discovery-call-transcript.json')
        if (!response.ok) {
          throw new Error('Failed to fetch discovery call transcript')
        }
        const transcriptContent = await response.text()
        
        // Create a File object from the content
        const file = new File(
          [transcriptContent],
          'discovery-call-transcript.json',
          { type: 'application/json' }
        )
        
        // Create a DataTransfer object to simulate a file input
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        
        // Find the file input element and set its files
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
        if (fileInput) {
          fileInput.files = dataTransfer.files
        }

        setFormData({
          ...testData[taskType],
          discoveryTranscript: transcriptContent
        })
        setSelectedFileName('discovery-call-transcript.json')
      } catch (error) {
        console.error('Failed to load discovery call transcript:', error)
        toast.error('Failed to load discovery call transcript')
      }
    } else {
      setFormData({
        ...testData[taskType],
        familiarity: 'neverMet',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isInfoSaved) {
      toast.error('Please complete your company information before using tasks')
      return
    }

    console.log('Submit initiated for task type:', taskType)

    if (creditsManager.getCredits() <= 0) {
      toast.error('No credits remaining. Please upgrade your plan.')
      return
    }

    setViewState('loading')

    try {
      const updatedFormData: FormDataWithWeather = { ...formData }
      
      if (taskType === 'outreach' && typeof formData.recipientName === 'string' && typeof formData.company === 'string') {
        console.log('Initiating Perplexity API call for:', formData.recipientName, formData.company)
        try {
          const research = await queryPerplexity(formData.recipientName, formData.company)
          updatedFormData.perplexityResearch = String(research)
          console.log('Perplexity research result:', research)
        } catch (error) {
          console.error('Perplexity research error:', error)
          updatedFormData.perplexityResearch = "Couldn't find any relevant data"
        }
      }

      console.log('Preparing to send request to OpenAI with updated form data:', updatedFormData)

      const userInfo: UserInfo | null = getUserInfoFromLocalStorage();
      if (!userInfo) {
        toast.error('User information is required. Please complete your profile.')
        setViewState('input')
        return
      }

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = taskType === 'outreach' ? [
        {
          role: "system",
          content: getOutreachSystemPrompt
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
          role: "user",
          content: getUserPrompt(taskType, updatedFormData, userInfo)
        }
      ] : [
        {
          role: "system",
          content: getSystemPrompts(taskType, userInfo)
        },
        {
          role: "user",
          content: getUserPrompt(taskType, updatedFormData, userInfo)
        }
      ]

      console.log('OpenAI API system prompt:', getSystemPrompts(taskType, userInfo));
      console.log('OpenAI API user prompt:', getUserPrompt(taskType, updatedFormData, userInfo));

      const response = await createChatCompletion(messages)
      
      if (!response) {
        throw new Error('Failed to generate content')
      }

      console.log('Received response from OpenAI:', response)

      creditsManager.useCredit()

      const newResult = {
        content: response.content || '',
        taskType,
        research: String(updatedFormData.perplexityResearch)
      }
      
      setResult(newResult)
      setViewState('result')
    } catch (error) {
      console.error('Error generating content:', error)
      toast.error('Failed to generate content. Please try again.')
      setViewState('input')
    }
  }

  const handleAction = async (action: TaskActionConfig) => {
    if (action.type === 'download') {
      window.open(links.trendingAudios, '_blank', 'noopener,noreferrer')
      return
    }
    switch (action.type) {
      case 'gmail':
        handleGmailCompose()
        break
      case 'notion':
        handleNotionDuplicate()
        break
      case 'copy':
        handleCopy(action.label)
        break
    }
  }

  const handleCopy = async (buttonLabel: string) => {
    try {
      if (!result) return
      await navigator.clipboard.writeText(result.content)
      setCopiedButtons(prev => ({ ...prev, [buttonLabel]: true }))
      toast.success('Content copied to clipboard!')
      setTimeout(() => {
        setCopiedButtons(prev => ({ ...prev, [buttonLabel]: false }))
      }, 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy content')
    }
  }

  const handleGmailCompose = () => {
    try {
      if (!result) return
      // Format content for email using clean plain text
      const formattedContent = result.content
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/^# (.*?)$/gm, '\n$1\n')
        .replace(/^## (.*?)$/gm, '\n$1\n')
        .replace(/^### (.*?)$/gm, '\n$1\n')
        .replace(/^- (.*?)$/gm, '  • $1')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/^Subject:.*\n/m, '')

      let subject = ''
      const getValue = (key: string) => {
        const value = formData[key]
        return typeof value === 'string' ? value : ''
      }

      if (taskType === 'contractorBrief' && getValue('contractorEmail')) {
        subject = `Project Brief - ${getValue('client')}`
      } else if (taskType === 'runOfShow') {
        subject = `Run of Show - ${getValue('eventName')}`
      } else if (taskType === 'proposal') {
        subject = `Video Content Proposal - ${getValue('clientName')}`
      } else if (taskType === 'budget') {
        subject = `Production Budget - ${getValue('eventType')}`
      } else if (taskType === 'outreach') {
        subject = getValue('subject')
      } else {
        subject = `${taskType.charAt(0).toUpperCase() + taskType.slice(1)}`
      }

      const mailtoUrl = taskType === 'contractorBrief' && getValue('contractorEmail')
        ? `mailto:${getValue('contractorEmail')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(formattedContent)}`
        : `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(formattedContent)}`

      window.location.href = mailtoUrl
      toast.success('Opening email composer...')
    } catch (error) {
      console.error('Failed to prepare email:', error)
      toast.error('Failed to prepare email')
    }
  }

  const handleNotionDuplicate = async () => {
    try {
      if (!result) return
      await navigator.clipboard.writeText(result.content)
      window.location.href = 'notion://www.notion.so/new'
      toast.success('Opening Notion... Content copied to clipboard for pasting')
    } catch (error) {
      console.error('Failed to open Notion:', error)
      toast.error('Failed to open Notion')
    }
  }

  const handleFieldChange = (fieldId: string, value: string | Video[]) => {
    if (Array.isArray(value)) {
      // Handle Video[] type
      setFormData(prev => ({
        ...prev,
        [fieldId]: value as Video[]
      }))
    } else {
      // Handle string type
      setFormData(prev => ({
        ...prev,
        [fieldId]: value
      }))
    }
  }

  const markdownComponents: Components = {
    h1: (props) => <h1 className="text-2xl font-bold mb-4 text-turbo-black" {...props} />,
    h2: (props) => <h2 className="text-xl font-bold mb-3 text-turbo-black" {...props} />,
    p: ({ children, ...props }) => {
      if (typeof children === 'string') {
        if (children.includes('Weather Conditions:')) {
          const formattedContent = children
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\|(.*?)°F/g, '<span class="text-turbo-black">|$1°F</span>')
          return <p className="mb-2" dangerouslySetInnerHTML={{ __html: formattedContent }} />
        }
        if (children.includes('**') || children.includes('Yellow') || children.includes('Green') || children.includes('Orange') || children.includes('Blue')) {
          const formattedContent = children
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/Yellow/g, '<span class="text-turbo-blue">Yellow</span>')
            .replace(/Green/g, '<span class="text-turbo-green">Green</span>')
            .replace(/Orange/g, '<span class="text-turbo-blue">Orange</span>')
            .replace(/Blue/g, '<span class="text-turbo-blue">Blue</span>')
          return <p className="mb-2" dangerouslySetInnerHTML={{ __html: formattedContent }} />
        }
      }
      return <p className="mb-2 text-turbo-black" {...props}>{children}</p>
    },
    ul: (props) => <ul className="list-disc pl-6 mb-4 text-turbo-black" {...props} />,
    li: ({ children, ...props }) => {
      if (typeof children === 'string' && (children.includes('**') || children.includes('Yellow') || children.includes('Green') || children.includes('Orange') || children.includes('Blue'))) {
        const formattedContent = children
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/Yellow/g, '<span class="text-turbo-blue">Yellow</span>')
          .replace(/Green/g, '<span class="text-turbo-green">Green</span>')
          .replace(/Orange/g, '<span class="text-turbo-blue">Orange</span>')
          .replace(/Blue/g, '<span class="text-turbo-blue">Blue</span>')
        return <li className="mb-1" dangerouslySetInnerHTML={{ __html: formattedContent }} />
      }
      return <li className="mb-1 text-turbo-black" {...props}>{children}</li>
    },
    strong: (props) => <strong className="font-bold text-turbo-black" {...props} />,
    em: (props) => <em className="italic text-turbo-black" {...props} />,
    code: (props) => <code className="font-mono text-turbo-black" {...props} />,
    a: (props) => (
      <a
        className="text-turbo-black underline hover:text-turbo-blue transition-colors"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    )
  }

  const getTaskTitle = () => {
    switch (taskType) {
      case 'proposal':
        return 'Content Proposal'
      case 'outreach':
        return 'Outreach Message'
      case 'runOfShow':
        return 'Run of Show'
      case 'budget':
        return 'Production Budget'
      case 'contractorBrief':
        return 'Contractor Brief'
      case 'timelineFromTranscript':
        return 'Timeline from Transcript'
      case 'trendingAudios':
        return 'Trending Audios'
      default:
        return ''
    }
  }

  const renderContent = () => {
    if (taskType === 'trendingAudios') {
      return (
        <div className="p-6">
          <p className="text-turbo-black/60 mb-6">
            Every week we update this link with the 10 most trending audios on social media, ready for download.
          </p>
          <div className="flex justify-end">
            <button
              onClick={() => handleAction(taskActionConfigs.trendingAudios[0])}
              className="px-6 py-2 text-sm font-medium text-turbo-beige bg-turbo-black hover:bg-turbo-blue rounded-full transition-colors"
            >
              Download Now
            </button>
          </div>
        </div>
      )
    }

    switch (viewState) {
      case 'loading':
        return <LoadingOverlay />
      case 'result':
        if (!result) return null
        const formattedResearch = result.research || 'No research data available.'
        const formattedMessage = result.content.replace(/(https?:\/\/\S+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
        return (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 md:p-6">
                <div className="prose prose-sm max-w-none bg-turbo-beige text-turbo-black prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-p:text-turbo-black prose-p:mb-4 prose-ul:list-disc prose-ul:pl-6 prose-li:mb-1 prose-pre:bg-turbo-black/5 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-code:text-turbo-black prose-code:bg-transparent prose-strong:font-bold">
                  {(taskConfigs[result.taskType].resultSections?.length ?? 0) > 0 ? (
                    taskConfigs[result.taskType].resultSections?.map((section, index) => {
                      const content = section.contentKey === 'research' ? formattedResearch : formattedMessage;
                      return (
                        <div key={`${section.id}-${index}`}>
                          <ReactMarkdown components={markdownComponents}>
                            {content}
                          </ReactMarkdown>
                        </div>
                      );
                    })
                  ) : (
                    <ReactMarkdown components={markdownComponents}>
                      {formattedMessage}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 flex flex-col sm:flex-row justify-between gap-3 sm:gap-2 p-4 md:p-6 border-t border-turbo-black">
              <button
                onClick={async () => {
                  if (creditsManager.getCredits() <= 0) {
                    toast.error('No credits remaining. Please upgrade your plan.')
                    return
                  }
                  
                  setViewState('loading');
                  try {
                    const updatedFormData: FormDataWithWeather = { ...formData };
                    
                    if (taskType === 'runOfShow' && typeof formData.address === 'string' && typeof formData.shootDate === 'string') {
                      try {
                        const googleMapsLink = await getGoogleMapsLink(formData.address);
                        updatedFormData.googleMapsLink = googleMapsLink;
                        
                        try {
                          const weatherData = await getWeatherData(formData.address, formData.shootDate);
                          updatedFormData.weather = weatherData;
                        } catch (weatherError) {
                          console.error('Weather data error:', weatherError);
                          toast.error('Using default sunrise/sunset times');
                          updatedFormData.weather = defaultWeather;
                        }
                      } catch (error) {
                        console.error('Error with location services:', error);
                        updatedFormData.googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.address)}`;
                      }
                    }
                    
                    const userInfo = getUserInfoFromLocalStorage();
                    if (!userInfo) {
                      toast.error('User information is required. Please complete your profile.')
                      setViewState('result')
                      return
                    }
                    
                    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
                      {
                        role: "system",
                        content: getSystemPrompts(taskType, userInfo)
                      },
                      {
                        role: "user",
                        content: getUserPrompt(taskType, updatedFormData, userInfo)
                      }
                    ];
                    
                    const response = await createChatCompletion(messages);
                    
                    if (!response) {
                      throw new Error('Failed to generate content');
                    }
                    
                    creditsManager.useCredit();
                    
                    const newResult = {
                      content: response.content || '',
                      taskType,
                    };
                    
                    setResult(newResult);
                    setViewState('result');
                  } catch (error) {
                    console.error('Error generating content:', error);
                    toast.error('Failed to generate content. Please try again.');
                    setViewState('result');
                  }
                }}
                className="inline-flex items-center justify-center h-[48px] px-6 py-2 text-base font-medium text-turbo-beige bg-turbo-black hover:bg-turbo-blue hover:text-turbo-beige border-2 border-turbo-black rounded-full transition-colors min-w-[100px]"
              >
                Regenerate
              </button>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                {taskActionConfigs[result.taskType]?.map((action) => {
                  switch (action.type) {
                    case 'gmail':
                      return (
                        <button
                          key="gmail"
                          onClick={() => handleAction(action)}
                          className="inline-flex items-center justify-center h-[48px] px-8 py-2 text-sm font-medium text-turbo-black bg-turbo-beige hover:bg-turbo-blue hover:text-turbo-white border-2 border-turbo-black rounded-full transition-colors min-w-[180px]"
                        >
                          <span className="flex items-center gap-2 whitespace-nowrap">
                            Compose in <img src="/gmail-icon.png" alt="Gmail" className="h-4 w-auto relative top-[1px]" />
                          </span>
                        </button>
                      )
                    case 'notion':
                      return (
                        <NotionButton
                          key="notion"
                          onClick={() => handleAction(action)}
                          className="text-turbo-black bg-turbo-beige hover:bg-turbo-blue hover:text-turbo-white border-2 border-turbo-black min-w-[180px] text-sm whitespace-nowrap"
                        />
                      )
                    case 'copy':
                      return (
                        <button
                          key="copy"
                          onClick={() => handleAction(action)}
                          disabled={copiedButtons[action.label]}
                          className="inline-flex items-center justify-center h-[48px] px-8 py-2 text-sm font-medium text-turbo-beige bg-turbo-black hover:bg-turbo-blue rounded-full transition-colors disabled:opacity-50 min-w-[180px] whitespace-nowrap"
                        >
                          {copiedButtons[action.label] ? 'Copied!' : action.label}
                        </button>
                      )
                    default:
                      return null
                  }
                })}
              </div>
            </div>
          </div>
        )
      case 'input':
        return (
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 md:p-6">
                <div className="space-y-4">
                  {config.fields.map((field) => (
                    shouldShowField(field) && (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id} className="text-sm font-medium text-turbo-black">
                          {field.label}
                          {isFieldRequired(field) && <span className="text-[#E94E1B] ml-1">*</span>}
                          {field.helpLink && (
                            <a
                              href={field.helpLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-turbo-blue hover:text-turbo-blue/80 text-sm font-medium transition-colors"
                            >
                              ({field.helpText})
                            </a>
                          )}
                        </Label>
                        {field.type === 'portfolioSelector' ? (
                          <div className="space-y-2">
                            <Label htmlFor={field.id}>{field.label}</Label>
                            {user ? (
                              <PortfolioVideoSelector
                                projectType={formData.projectType as string || ''}
                                userId={user.id}
                                onSelect={(videos) => handleFieldChange(field.id, videos)}
                              />
                            ) : (
                              <div className="text-center py-6 text-turbo-black/60">
                                Please sign in to include portfolio videos in your proposal
                              </div>
                            )}
                          </div>
                        ) : field.type === 'textarea' ? (
                          <textarea
                            id={field.id}
                            className="flex min-h-[100px] w-full rounded-md border border-turbo-black bg-turbo-beige px-3 py-2 text-sm text-turbo-black placeholder:text-turbo-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-turbo-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder={field.placeholder}
                            value={typeof formData[field.id] === 'string' ? formData[field.id] as string : ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            required={isFieldRequired(field)}
                          />
                        ) : field.type === 'file' ? (
                          <div className="space-y-2">
                            <div className="relative flex items-center">
                              <input
                                type="file"
                                id={field.id}
                                accept={field.accept}
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    const reader = new FileReader()
                                    reader.onload = (e) => {
                                      handleFieldChange(field.id, typeof e.target?.result === 'string' ? e.target.result : '')
                                    }
                                    setSelectedFileName(file.name)
                                    reader.readAsText(file)
                                  }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                required={isFieldRequired(field)}
                              />
                              <div className="flex h-10 w-full rounded-md border border-turbo-black bg-turbo-beige text-sm text-turbo-black">
                                <div className="flex items-center px-3 border-r border-turbo-black">
                                  Choose File
                                </div>
                                <div className="flex items-center px-3 flex-1">
                                  {selectedFileName || 'No file chosen'}
                                </div>
                              </div>
                            </div>
                            {taskType === 'proposal' && field.id === 'discoveryTranscript' && (
                              <p className="text-sm text-turbo-black/50">
                                Please upload a JSON file containing the discovery call transcript. The file should include participant information, conversation details, and key points.
                              </p>
                            )}
                          </div>
                        ) : field.type === 'buttonSelect' ? (
                          <div className="flex items-center gap-2 p-1 bg-turbo-beige/50 rounded-full border-2 border-turbo-black">
                            {field.options?.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                  formData[field.id] === option.value || (!formData[field.id] && option.default)
                                    ? 'bg-turbo-black text-turbo-beige'
                                    : 'text-turbo-black hover:bg-turbo-blue hover:text-turbo-beige'
                                }`}
                                onClick={() => handleFieldChange(field.id, option.value)}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        ) : field.type === 'select' ? (
                          <select
                            id={field.id}
                            className="flex h-10 w-full rounded-md border border-turbo-black bg-turbo-beige px-3 py-2 text-sm text-turbo-black placeholder:text-turbo-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-turbo-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={typeof formData[field.id] === 'string' ? formData[field.id] as string : field.options?.find(opt => opt.default)?.value || ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            required={isFieldRequired(field)}
                          >
                            {field.options?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            id={field.id}
                            type={field.type}
                            className="flex h-10 w-full rounded-md border border-turbo-black bg-turbo-beige px-3 py-2 text-sm text-turbo-black placeholder:text-turbo-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-turbo-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder={field.placeholder}
                            value={typeof formData[field.id] === 'string' ? formData[field.id] as string : ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            required={isFieldRequired(field)}
                          />
                        )}
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 border-t border-turbo-black bg-turbo-beige p-4 md:p-6 mt-auto">
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-turbo-black hover:text-turbo-white bg-turbo-beige border-2 border-turbo-black rounded-full hover:bg-turbo-blue transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-turbo-beige bg-turbo-black hover:bg-turbo-blue rounded-full transition-colors disabled:opacity-80 disabled:bg-turbo-black/40 disabled:cursor-not-allowed disabled:text-turbo-beige"
                  disabled={isLoading || !isFormValid() || !isInfoSaved}
                >
                  {!isInfoSaved ? 'Complete Company Info First' : isLoading ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
          </form>
        )
    }
  }

  return (
    <DottedDialog
      open={true}
      onOpenChange={onClose}
      title={viewState === 'result' && result ? `Your ${getTaskTitle()}` : config.title}
      description={viewState === 'result' ? 'View and share your generated content' : config.description}
      headerLeftAction={viewState === 'result' ? (
        <button
          onClick={() => setViewState('input')}
          className="text-sm text-turbo-black/60 hover:text-turbo-black hover:bg-turbo-blue/10 px-3 py-1 rounded-md transition-colors"
        >
          Back to Form
        </button>
      ) : undefined}
      headerRightAction={viewState === 'input' ? (
        <button
          type="button"
          onClick={handleFillTestData}
          className="text-sm text-turbo-black/80 hover:text-turbo-black hover:bg-turbo-blue/10 px-3 py-1 rounded-md transition-colors"
        >
          Fill Test Data
        </button>
      ) : undefined}
    >
      <div className="flex flex-col h-full overflow-hidden relative bg-turbo-beige">
        {renderContent()}
      </div>
    </DottedDialog>
  )
} 