import { WeatherData } from '@/services/location'

type FormDataValue = string | WeatherData | undefined;

interface FormDataBase {
  [key: string]: FormDataValue;
  location?: string;
  address?: string;
  shootDate?: string;
  crewMembers?: string;
  callTimes?: string;
  schedule?: string;
  googleMapsLink?: string;
  weather?: WeatherData;
  contractorName?: string;
  contractorEmail?: string;
  client?: string;
  startDate?: string;
  endDate?: string;
  pointOfContact?: string;
  contactEmail?: string;
  contactPhone?: string;
  role?: string;
  dailyRate?: string;
  numberOfDays?: string;
  projectType?: string;
  clientName?: string;
  deliveryDate?: string;
  budget?: string;
  requirements?: string;
  recipientName?: string;
  subject?: string;
  company?: string;
  keyPoints?: string;
  eventType?: string;
  productionDays?: string;
  crewSize?: string;
  equipmentNeeds?: string;
  editingHours?: string;
  profitMargin?: string;
  additionalCosts?: string;
  purpose?: string;
  length?: string;
  tone?: string;
  additionalNotes?: string;
  transcriptFile?: string;
}

export interface FormDataWithWeather extends FormDataBase {
  weather?: WeatherData;
} 