import { Layout } from '@/components/Layout'
import { useCompanyInfo } from '@/contexts/CompanyInfoContext'

export default function History() {
  const { isInfoSaved } = useCompanyInfo()

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className={`text-4xl md:text-7xl font-bold mb-12 tracking-tight ${
          isInfoSaved ? 'text-turbo-black' : 'text-turbo-black/40'
        }`}>
          Your History
        </h1>
        
        <div className={`text-center py-12 ${
          isInfoSaved ? 'text-turbo-black/60' : 'text-turbo-black/40'
        }`}>
          History feature coming soon...
        </div>
      </div>
    </Layout>
  )
} 