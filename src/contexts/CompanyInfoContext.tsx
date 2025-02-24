import { createContext, useContext, useState } from 'react'
import { useAuth } from './AuthContext'

interface CompanyInfoContextType {
  isInfoSaved: boolean
  setIsInfoSaved: (value: boolean) => void
}

const CompanyInfoContext = createContext<CompanyInfoContextType | undefined>(undefined)

export function useCompanyInfo() {
  const context = useContext(CompanyInfoContext)
  if (context === undefined) {
    throw new Error('useCompanyInfo must be used within a CompanyInfoProvider')
  }
  return context
}

interface CompanyInfoProviderProps {
  children: React.ReactNode
}

export function CompanyInfoProvider({ children }: CompanyInfoProviderProps) {
  const { profile } = useAuth()
  
  // Initialize state from profile
  const [isInfoSaved, setIsInfoSaved] = useState(() => {
    console.log('🔄 Checking company info from profile...')
    if (!profile) {
      console.log('ℹ️ No profile found, company info not saved')
      return false
    }
    const hasRequiredInfo = !!(profile.company_name && profile.name && profile.business_type)
    console.log('✅ Company info status:', hasRequiredInfo ? 'saved' : 'not saved')
    return hasRequiredInfo
  })

  return (
    <CompanyInfoContext.Provider value={{ isInfoSaved, setIsInfoSaved }}>
      {children}
    </CompanyInfoContext.Provider>
  )
} 