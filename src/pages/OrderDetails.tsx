import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Calendar, MapPin, Clock, Flag, ExternalLink } from 'lucide-react'

interface OrderDetailsData {
  id: string
  runnerName: string
  raceName: string
  raceDate: string
  status: 'pending' | 'processing' | 'completed' | 'flagged'
  createdAt: string
  runnerData?: {
    bibNumber?: string
    finishTime?: string
    pace?: string
    overallPlace?: number
    ageGroupPlace?: number
    splits?: Array<{ distance: string; time: string }>
    photoUrls?: string[]
  }
  raceInfo?: {
    location: string
    distance: string
    resultsUrl?: string
    photoVendor?: string
  }
  flags?: string[]
}

const mockOrderDetails: OrderDetailsData = {
  id: '1',
  runnerName: 'John Smith',
  raceName: 'Boston Marathon 2024',
  raceDate: '2024-04-15',
  status: 'processing',
  createdAt: '2024-01-20',
  runnerData: {
    bibNumber: '12345',
    finishTime: '3:45:22',
    pace: '8:35/mi',
    overallPlace: 5432,
    ageGroupPlace: 234,
    splits: [
      { distance: '5K', time: '26:15' },
      { distance: '10K', time: '52:30' },
      { distance: 'Half', time: '1:51:45' },
      { distance: '30K', time: '2:38:20' },
      { distance: 'Finish', time: '3:45:22' }
    ]
  },
  raceInfo: {
    location: 'Boston, MA',
    distance: '26.2 miles',
    resultsUrl: 'https://results.baa.org',
    photoVendor: 'MarathonFoto'
  }
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  flagged: { label: 'Flagged', color: 'bg-red-100 text-red-800' }
}

export default function OrderDetails() {
  const { orderId } = useParams()
  const navigate = useNavigate()

  // TODO: Fetch actual order data based on orderId
  console.log('Loading order:', orderId)
  const order = mockOrderDetails

  const status = statusConfig[order.status]

  return (
    <div className="min-h-screen bg-turbo-beige p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back Button & Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-turbo-black/5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-turbo-black" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-turbo-black">{order.runnerName}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                {status.label}
              </span>
            </div>
            <p className="text-turbo-black/60">{order.raceName}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Runner Results */}
            {order.runnerData && (
              <div className="bg-white border border-turbo-black rounded-lg p-6">
                <h2 className="text-lg font-semibold text-turbo-black mb-4">Runner Results</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-turbo-black/60">Bib Number</p>
                    <p className="text-lg font-medium text-turbo-black">{order.runnerData.bibNumber || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-turbo-black/60">Finish Time</p>
                    <p className="text-lg font-medium text-turbo-black">{order.runnerData.finishTime || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-turbo-black/60">Pace</p>
                    <p className="text-lg font-medium text-turbo-black">{order.runnerData.pace || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-turbo-black/60">Overall Place</p>
                    <p className="text-lg font-medium text-turbo-black">{order.runnerData.overallPlace?.toLocaleString() || '-'}</p>
                  </div>
                </div>

                {/* Splits */}
                {order.runnerData.splits && order.runnerData.splits.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-turbo-black/60 mb-2">Splits</h3>
                    <div className="flex flex-wrap gap-2">
                      {order.runnerData.splits.map((split, index) => (
                        <div
                          key={index}
                          className="bg-turbo-black/5 px-3 py-2 rounded-lg"
                        >
                          <p className="text-xs text-turbo-black/60">{split.distance}</p>
                          <p className="text-sm font-medium text-turbo-black">{split.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Photos Section */}
            <div className="bg-white border border-turbo-black rounded-lg p-6">
              <h2 className="text-lg font-semibold text-turbo-black mb-4">Photos</h2>
              {order.runnerData?.photoUrls && order.runnerData.photoUrls.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {order.runnerData.photoUrls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Race photo ${index + 1}`}
                      className="rounded-lg border border-turbo-black/10"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-turbo-black/60">
                  No photos found yet
                </div>
              )}
            </div>

            {/* Flags */}
            {order.flags && order.flags.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Flag className="w-5 h-5 text-red-600" />
                  <h2 className="text-lg font-semibold text-red-800">Issues</h2>
                </div>
                <ul className="space-y-2">
                  {order.flags.map((flag, index) => (
                    <li key={index} className="text-sm text-red-700">
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Info */}
            <div className="bg-white border border-turbo-black rounded-lg p-6">
              <h2 className="text-lg font-semibold text-turbo-black mb-4">Order Info</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-turbo-black/40" />
                  <div>
                    <p className="text-xs text-turbo-black/60">Runner Name</p>
                    <p className="text-sm font-medium text-turbo-black">{order.runnerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-turbo-black/40" />
                  <div>
                    <p className="text-xs text-turbo-black/60">Race Date</p>
                    <p className="text-sm font-medium text-turbo-black">{order.raceDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-turbo-black/40" />
                  <div>
                    <p className="text-xs text-turbo-black/60">Order Created</p>
                    <p className="text-sm font-medium text-turbo-black">{order.createdAt}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Race Info */}
            {order.raceInfo && (
              <div className="bg-white border border-turbo-black rounded-lg p-6">
                <h2 className="text-lg font-semibold text-turbo-black mb-4">Race Info</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-turbo-black/40" />
                    <div>
                      <p className="text-xs text-turbo-black/60">Location</p>
                      <p className="text-sm font-medium text-turbo-black">{order.raceInfo.location}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-turbo-black/60">Distance</p>
                    <p className="text-sm font-medium text-turbo-black">{order.raceInfo.distance}</p>
                  </div>
                  {order.raceInfo.photoVendor && (
                    <div>
                      <p className="text-xs text-turbo-black/60">Photo Vendor</p>
                      <p className="text-sm font-medium text-turbo-black">{order.raceInfo.photoVendor}</p>
                    </div>
                  )}
                  {order.raceInfo.resultsUrl && (
                    <a
                      href={order.raceInfo.resultsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-turbo-blue hover:underline"
                    >
                      View Official Results
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white border border-turbo-black rounded-lg p-6">
              <h2 className="text-lg font-semibold text-turbo-black mb-4">Actions</h2>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-turbo-blue text-white rounded-lg hover:bg-turbo-blue/90 transition-colors">
                  Mark as Complete
                </button>
                <button className="w-full px-4 py-2 bg-white border border-turbo-black text-turbo-black rounded-lg hover:bg-turbo-black/5 transition-colors">
                  Flag for Review
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
