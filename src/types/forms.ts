import { WeatherData } from '@/services/location'

export type FormDataValue = string | string[] | Video[] | undefined

export interface Video {
  id: string
  title: string
  description: string | null
  url: string
  thumbnail: string | null
  views: number
  likes: number
  projectType: string
}

export interface FormDataWithWeather {
  [key: string]: FormDataValue | WeatherData | undefined
  weather?: WeatherData
  location?: string
  address?: string
  shootDate?: string
  crewMembers?: string
  callTimes?: string
  schedule?: string
  transcriptFile?: string
  portfolioVideos?: Video[]
  projectType?: string
  clientName?: string
  deliveryDate?: string
  budget?: string
  discoveryTranscript?: string
  requirements?: string
} 