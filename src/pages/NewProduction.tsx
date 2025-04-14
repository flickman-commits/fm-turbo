import { Layout } from '@/components/Layout'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Production, ProductionStatus, ProductionType } from '@/types/productions'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

export default function NewProduction() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Partial<Production>>({
    name: '',
    client_name: null,
    status: 'pre_production',
    type: 'commercial',
    start_date: null,
    end_date: null,
    budget: null,
    description: null,
    location: null,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.id) return

    try {
      setIsSubmitting(true)
      const { data, error } = await supabase
        .from('productions')
        .insert([
          {
            ...formData,
            user_id: session.user.id,
          },
        ])
        .select()
        .single()

      if (error) throw error
      toast.success('Production created successfully')
      navigate(`/productions/${data.id}`)
    } catch (error) {
      console.error('Error creating production:', error)
      toast.error('Failed to create production')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value || null,
    }))
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">New Production</h1>
          <p className="text-lg text-turbo-black/60">
            Create a new production and start managing your project
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-turbo-black mb-1">
              Production Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border-2 border-turbo-black rounded-lg focus:outline-none focus:border-turbo-blue"
            />
          </div>

          <div>
            <label htmlFor="client_name" className="block text-sm font-medium text-turbo-black mb-1">
              Client Name
            </label>
            <input
              type="text"
              id="client_name"
              name="client_name"
              value={formData.client_name || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border-2 border-turbo-black rounded-lg focus:outline-none focus:border-turbo-blue"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-turbo-black mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status || 'pre_production'}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border-2 border-turbo-black rounded-lg focus:outline-none focus:border-turbo-blue"
              >
                <option value="pre_production">Pre-Production</option>
                <option value="production">Production</option>
                <option value="post_production">Post-Production</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-turbo-black mb-1">
                Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type || 'commercial'}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border-2 border-turbo-black rounded-lg focus:outline-none focus:border-turbo-blue"
              >
                <option value="commercial">Commercial</option>
                <option value="corporate">Corporate</option>
                <option value="documentary">Documentary</option>
                <option value="event">Event</option>
                <option value="music_video">Music Video</option>
                <option value="short_film">Short Film</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-turbo-black mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-turbo-black rounded-lg focus:outline-none focus:border-turbo-blue"
              />
            </div>

            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-turbo-black mb-1">
                End Date
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={formData.end_date || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-turbo-black rounded-lg focus:outline-none focus:border-turbo-blue"
              />
            </div>
          </div>

          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-turbo-black mb-1">
              Budget
            </label>
            <input
              type="text"
              id="budget"
              name="budget"
              value={formData.budget || ''}
              onChange={handleChange}
              placeholder="e.g. $10,000"
              className="w-full px-4 py-2 border-2 border-turbo-black rounded-lg focus:outline-none focus:border-turbo-blue"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-turbo-black mb-1">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location || ''}
              onChange={handleChange}
              placeholder="e.g. Los Angeles, CA"
              className="w-full px-4 py-2 border-2 border-turbo-black rounded-lg focus:outline-none focus:border-turbo-blue"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-turbo-black mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border-2 border-turbo-black rounded-lg focus:outline-none focus:border-turbo-blue"
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/productions')}
              className="px-6 py-3 border-2 border-turbo-black rounded-lg hover:bg-turbo-black/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-turbo-blue text-white rounded-lg hover:bg-turbo-blue/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Production'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
} 