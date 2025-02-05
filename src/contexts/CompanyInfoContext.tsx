import { createContext, useContext, ReactNode, Dispatch, SetStateAction, useState } from 'react'

interface CompanyInfoContextType {
  isInfoSaved: boolean;
  setIsInfoSaved: Dispatch<SetStateAction<boolean>>;
}

export const CompanyInfoContext = createContext<CompanyInfoContextType>({
  isInfoSaved: false,
  setIsInfoSaved: () => {},
})

export const useCompanyInfo = () => {
  const context = useContext(CompanyInfoContext)
  if (context === undefined) {
    throw new Error('useCompanyInfo must be used within a CompanyInfoProvider')
  }
  return context
}

interface CompanyInfoProviderProps {
  children: ReactNode
}

export function CompanyInfoProvider({ children }: CompanyInfoProviderProps) {
  // Initialize state from localStorage
  const [isInfoSaved, setIsInfoSaved] = useState(() => {
    const saved = localStorage.getItem('userInfo')
    if (!saved) return false
    const info = JSON.parse(saved)
    return !!(info.companyName && info.userName && info.businessType)
  })

  return (
    <CompanyInfoContext.Provider value={{ isInfoSaved, setIsInfoSaved }}>
      {children}
    </CompanyInfoContext.Provider>
  )
} 