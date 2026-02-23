import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function BackButton() {
  return (
    <Link
      to="/biz-dev"
      className="inline-flex items-center gap-2 text-turbo-black/60 hover:text-turbo-blue transition-colors mb-6"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Back</span>
    </Link>
  )
}