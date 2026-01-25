import { useState, useMemo, useEffect, useCallback } from 'react'
import { Search, ChevronDown, ChevronRight, Upload, Copy, Loader2 } from 'lucide-react'

// API calls now go to /api/* serverless functions (same origin)

interface Order {
  id: string
  orderNumber: string        // Internal ID for reconciliation (Shopify order.id)
  displayOrderNumber: string // Friendly display number (Shopify order.name like "2585")
  source: 'shopify' | 'etsy'
  raceName: string
  raceYear: number | null
  raceDate?: string
  eventType?: string
  runnerName: string
  productSize: string
  notes?: string
  status: 'pending' | 'ready' | 'flagged' | 'completed' | 'missing_year'
  flagReason?: string
  completedAt?: string
  createdAt: string
  // Runner research data (only for ready/completed orders)
  bibNumber?: string
  officialTime?: string
  officialPace?: string
  // Weather data
  weather?: {
    condition: 'sunny' | 'cloudy' | 'rainy'
    temp: string
  }
}

// Toast notification component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
    }`}>
      {message}
    </div>
  )
}

// Copyable field component
function CopyableField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex justify-between items-center">
      <span className="text-body-sm text-off-black/60">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-body-sm font-medium text-off-black">{value}</span>
        <button
          onClick={handleCopy}
          className="p-1.5 hover:bg-off-black/10 rounded-sm transition-colors"
          title="Copy to clipboard"
        >
          {copied ? (
            <span className="text-success-green text-xs font-medium">✓</span>
          ) : (
            <Copy className="w-3.5 h-3.5 text-off-black/40 hover:text-off-black/70" />
          )}
        </button>
      </div>
    </div>
  )
}

// Static field without copy button
function StaticField({ label, value, flag }: { label: string; value: string; flag?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-body-sm text-off-black/60">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-body-sm font-medium text-off-black">{value}</span>
        {flag && <span className="text-warning-amber" title="Year Missing">🚩</span>}
      </div>
    </div>
  )
}

// Pending field for data not yet available
function PendingField({ label }: { label: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-body-sm text-off-black/60">{label}</span>
      <span className="text-body-sm text-off-black/30 italic">Pending research</span>
    </div>
  )
}

function getGreeting(): string {
  const now = new Date()
  const costaRicaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Costa_Rica' }))
  const hour = costaRicaTime.getHours()

  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function formatLastUpdated(date: Date): string {
  return date.toLocaleString('en-US', {
    timeZone: 'America/Costa_Rica',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Fetch orders from database
  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch(`/api/orders`)
      if (!response.ok) throw new Error('Failed to fetch orders')
      const data = await response.json()

      // Transform database orders to match our Order interface
      const transformedOrders: Order[] = (data.orders || []).map((order: Record<string, unknown>) => {
        // Extract display order number from shopifyOrderData if available
        const shopifyData = order.shopifyOrderData as Record<string, unknown> | null
        const displayNum = shopifyData?.name as string | undefined

        return {
          id: order.id as string,
          orderNumber: order.orderNumber as string,
          displayOrderNumber: displayNum || (order.orderNumber as string),
          source: order.source as 'shopify' | 'etsy',
          raceName: order.raceName as string,
          raceYear: order.raceYear as number | null,
          runnerName: order.runnerName as string,
          productSize: order.productSize as string,
          notes: order.notes as string | undefined,
          status: order.status as 'pending' | 'ready' | 'flagged' | 'completed' | 'missing_year',
          createdAt: order.createdAt as string,
          completedAt: order.researchedAt as string | undefined
        }
      })

      setOrders(transformedOrders)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching orders:', error)
      setToast({ message: 'Failed to fetch orders', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Import new orders from Artelo
  const importOrders = async () => {
    setIsImporting(true)
    try {
      const response = await fetch(`/api/orders/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Import failed (${response.status}): ${errorData}`)
      }

      const data = await response.json()
      const parts = []
      if (data.imported > 0) parts.push(`${data.imported} imported`)
      if (data.updated > 0) parts.push(`${data.updated} updated`)
      if (data.skipped > 0) parts.push(`${data.skipped} skipped`)
      if (data.needsAttention > 0) parts.push(`${data.needsAttention} missing year`)
      setToast({
        message: parts.length > 0 ? parts.join(', ') : 'No changes',
        type: 'success'
      })

      // Refresh the orders list
      await fetchOrders()
    } catch (error) {
      console.error('Error importing orders:', error)
      const message = error instanceof Error ? error.message : 'Failed to import orders from Artelo'
      setToast({ message, type: 'error' })
    } finally {
      setIsImporting(false)
    }
  }

  // Fetch orders on mount
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Orders to fulfill: pending + flagged + ready + missing_year, sorted with flagged first, then missing_year, then pending, then ready
  const ordersToFulfill = useMemo(() => {
    const fulfillOrders = orders.filter(o =>
      o.status === 'flagged' || o.status === 'ready' || o.status === 'pending' || o.status === 'missing_year'
    )
    const statusOrder: Record<string, number> = { flagged: 0, missing_year: 1, pending: 2, ready: 3, completed: 4 }
    return fulfillOrders.sort((a, b) => {
      return (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5)
    })
  }, [orders])

  const completedOrders = useMemo(() =>
    orders.filter(o => o.status === 'completed'), [orders])

  const filteredOrders = useMemo(() => {
    if (!searchQuery) return ordersToFulfill
    const query = searchQuery.toLowerCase()
    return ordersToFulfill.filter(o =>
      o.orderNumber.toLowerCase().includes(query) ||
      o.raceName.toLowerCase().includes(query) ||
      o.runnerName.toLowerCase().includes(query)
    )
  }, [ordersToFulfill, searchQuery])

  const handleCopyEmail = (order: Order) => {
    const emailText = `Hi,

I'm reaching out regarding order ${order.orderNumber} for ${order.runnerName}'s ${order.raceName} ${order.raceYear} print.

${order.flagReason}

Could you please verify the runner's name and race details?

Thank you!`
    navigator.clipboard.writeText(emailText)
  }

  return (
    <div className="min-h-screen bg-off-white">
      <div className="max-w-4xl mx-auto px-6 md:px-8 lg:px-12">
        {/* Header - Centered with lots of space */}
        <div className="pt-20 md:pt-28 lg:pt-32 pb-12 md:pb-16 text-center">
          {/* Logo */}
          <div className="mb-6">
            <img
              src="/trackstar-logo.png"
              alt="Trackstar"
              className="h-10 md:h-12 mx-auto"
            />
          </div>

          {/* Greeting */}
          <h1 className="text-3xl md:text-4xl lg:text-[40px] font-bold text-off-black mb-3">
            {getGreeting()}, Elí
          </h1>

          {/* Subtitle with order count and last updated */}
          <p className="text-body text-off-black/50">
            {ordersToFulfill.length} orders to fulfill • Last updated {formatLastUpdated(lastUpdated)}
          </p>

          {/* Import button - centered below */}
          <div className="mt-8">
            <button
              onClick={importOrders}
              disabled={isImporting}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-off-black text-white rounded-md hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isImporting ? 'Importing...' : 'Import New Orders'}
            </button>
          </div>
        </div>

        {/* Orders to Fulfill Section */}
        {!isLoading && (
        <section className="pb-16">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-off-black uppercase tracking-tight">Orders to Fulfill</h2>
              <span className="px-2.5 py-1 bg-off-black/10 text-off-black/60 text-sm font-medium rounded">
                {ordersToFulfill.length}
              </span>
            </div>
          </div>

          {/* Content Card */}
          <div className="bg-white border border-border-gray rounded-lg shadow-sm overflow-hidden">
            {/* Search inside card */}
            <div className="p-6 border-b border-border-gray">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-off-black/40" />
                <input
                  type="text"
                  placeholder="Search by order #, race, or runner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-subtle-gray border border-border-gray rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-off-black/10 focus:border-off-black/30 transition-colors"
                />
              </div>
            </div>

            {/* Table */}
            <table className="w-full">
              <thead className="bg-subtle-gray border-b border-border-gray">
                <tr>
                  <th className="text-left pl-6 pr-3 py-4 text-xs font-semibold text-off-black/60 uppercase tracking-wider">Order #</th>
                  <th className="text-center px-3 py-4 text-xs font-semibold text-off-black/60 uppercase tracking-wider w-20">Status</th>
                  <th className="text-left px-3 py-4 text-xs font-semibold text-off-black/60 uppercase tracking-wider">Runner</th>
                  <th className="text-left px-3 py-4 text-xs font-semibold text-off-black/60 uppercase tracking-wider hidden md:table-cell">Race</th>
                  <th className="text-left px-3 pr-6 py-4 text-xs font-semibold text-off-black/60 uppercase tracking-wider hidden md:table-cell w-20">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray">
                {filteredOrders.map((order, index) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`hover:bg-subtle-gray cursor-pointer transition-colors ${index % 2 === 1 ? 'bg-subtle-gray/30' : ''}`}
                  >
                    <td className="pl-6 pr-3 py-5">
                      <span className="text-sm font-medium text-off-black">{order.displayOrderNumber}</span>
                    </td>
                    <td className="px-3 py-5 text-center">
                      <span className="text-lg">
                        {order.status === 'flagged' ? '⚠️' :
                         order.status === 'missing_year' ? '📅' :
                         order.status === 'pending' ? '⏳' : '📦'}
                      </span>
                    </td>
                    <td className="px-3 py-5">
                      <span className="text-sm text-off-black">{order.runnerName || 'Unknown Runner'}</span>
                      {order.status === 'flagged' && order.flagReason && (
                        <p className="text-xs text-warning-amber mt-1 leading-tight">{order.flagReason}</p>
                      )}
                      {order.status === 'missing_year' && (
                        <p className="text-xs text-warning-amber mt-1 leading-tight">Year Missing</p>
                      )}
                      {order.status === 'pending' && (
                        <p className="text-xs text-off-black/40 mt-1 leading-tight">Pending Research</p>
                      )}
                    </td>
                    <td className="px-3 py-5 text-sm text-off-black/60 hidden md:table-cell">
                      {order.raceName} {order.raceYear}
                    </td>
                    <td className="px-3 pr-6 py-5 text-sm text-off-black/60 hidden md:table-cell">
                      {order.productSize}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredOrders.length === 0 && (
              <div className="text-center py-16 text-off-black/40 text-sm">
                {searchQuery ? 'No matching orders found' : 'No orders to fulfill'}
              </div>
            )}
          </div>
        </section>
        )}

        {/* Completed Orders Section */}
        {!isLoading && (
        <section className="pb-20">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-3 mb-6 group"
          >
            {showCompleted ? (
              <ChevronDown className="w-5 h-5 text-off-black/40" />
            ) : (
              <ChevronRight className="w-5 h-5 text-off-black/40" />
            )}
            <span className="text-base">✅</span>
            <h2 className="text-lg font-semibold text-off-black uppercase tracking-tight group-hover:opacity-70 transition-opacity">
              Completed Orders
            </h2>
            <span className="px-2.5 py-1 bg-off-black/10 text-off-black/60 text-sm font-medium rounded">
              {completedOrders.length}
            </span>
          </button>

          {showCompleted && (
            <div className="bg-white border border-border-gray rounded-lg overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-subtle-gray border-b border-border-gray">
                  <tr>
                    <th className="text-left pl-6 pr-3 py-4 text-xs font-semibold text-off-black/60 uppercase tracking-wider">Order #</th>
                    <th className="text-center px-3 py-4 text-xs font-semibold text-off-black/60 uppercase tracking-wider w-20">Status</th>
                    <th className="text-left px-3 py-4 text-xs font-semibold text-off-black/60 uppercase tracking-wider">Runner</th>
                    <th className="text-left px-3 py-4 text-xs font-semibold text-off-black/60 uppercase tracking-wider hidden md:table-cell">Race</th>
                    <th className="text-left px-3 pr-6 py-4 text-xs font-semibold text-off-black/60 uppercase tracking-wider hidden md:table-cell w-28">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-gray">
                  {completedOrders.map((order, index) => (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`hover:bg-subtle-gray cursor-pointer transition-colors ${index % 2 === 1 ? 'bg-subtle-gray/30' : ''}`}
                    >
                      <td className="pl-6 pr-3 py-5">
                        <span className="text-sm font-medium text-off-black">{order.displayOrderNumber}</span>
                      </td>
                      <td className="px-3 py-5 text-center">
                        <span className="text-lg">✅</span>
                      </td>
                      <td className="px-3 py-5 text-sm text-off-black">
                        {order.runnerName}
                      </td>
                      <td className="px-3 py-5 text-sm text-off-black/60 hidden md:table-cell">
                        {order.raceName} {order.raceYear}
                      </td>
                      <td className="px-3 pr-6 py-5 text-sm text-off-black/60 hidden md:table-cell">
                        {order.completedAt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {completedOrders.length === 0 && (
                <div className="text-center py-16 text-off-black/40 text-sm">
                  No completed orders yet
                </div>
              )}
            </div>
          )}
        </section>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-off-black/40" />
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-off-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-md max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {selectedOrder.status === 'flagged' ? '⚠️' :
                       selectedOrder.status === 'completed' ? '✅' :
                       selectedOrder.status === 'missing_year' ? '📅' :
                       selectedOrder.status === 'pending' ? '⏳' : '📦'}
                    </span>
                    <h3 className="text-heading-md text-off-black">
                      Order {selectedOrder.displayOrderNumber}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-off-black/40 hover:text-off-black text-2xl leading-none transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-5">
                  {/* Product Info */}
                  <div>
                    <h4 className="text-xs font-semibold text-off-black/50 uppercase tracking-tight mb-2">Product Info</h4>
                    <div className="bg-subtle-gray border border-border-gray rounded-md p-4">
                      <StaticField label="Size" value={selectedOrder.productSize} />
                    </div>
                  </div>

                  {/* Race Info */}
                  <div>
                    <h4 className="text-xs font-semibold text-off-black/50 uppercase tracking-tight mb-2">Race Info</h4>
                    <div className="bg-subtle-gray border border-border-gray rounded-md p-4 space-y-3">
                      <StaticField label="Race" value={selectedOrder.raceName} />
                      {selectedOrder.raceYear ? (
                        <StaticField label="Year" value={String(selectedOrder.raceYear)} />
                      ) : (
                        <StaticField label="Year" value="Missing" flag={true} />
                      )}
                      {selectedOrder.eventType ? (
                        <StaticField label="Event" value={selectedOrder.eventType} />
                      ) : (
                        <PendingField label="Event" />
                      )}
                      {selectedOrder.raceDate ? (
                        <CopyableField label="Date" value={selectedOrder.raceDate} />
                      ) : (
                        <PendingField label="Date" />
                      )}
                      {selectedOrder.weather ? (
                        <>
                          <CopyableField
                            label="Weather"
                            value={selectedOrder.weather.condition.charAt(0).toUpperCase() + selectedOrder.weather.condition.slice(1)}
                          />
                          <CopyableField label="Temp" value={selectedOrder.weather.temp} />
                        </>
                      ) : (
                        <>
                          <PendingField label="Weather" />
                          <PendingField label="Temp" />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Runner Info */}
                  <div>
                    <h4 className="text-xs font-semibold text-off-black/50 uppercase tracking-tight mb-2">Runner Info</h4>
                    <div className="bg-subtle-gray border border-border-gray rounded-md p-4 space-y-3">
                      {selectedOrder.runnerName ? (
                        <CopyableField label="Name" value={selectedOrder.runnerName} />
                      ) : (
                        <PendingField label="Name" />
                      )}
                      {selectedOrder.bibNumber ? (
                        <CopyableField label="Bib" value={selectedOrder.bibNumber} />
                      ) : (
                        <PendingField label="Bib" />
                      )}
                      {selectedOrder.officialTime ? (
                        <CopyableField label="Time" value={selectedOrder.officialTime} />
                      ) : (
                        <PendingField label="Time" />
                      )}
                      {selectedOrder.officialPace ? (
                        <CopyableField label="Pace" value={selectedOrder.officialPace} />
                      ) : (
                        <PendingField label="Pace" />
                      )}
                    </div>
                  </div>

                  {/* Notes - only show if there are notes */}
                  {selectedOrder.notes && (
                    <div>
                      <h4 className="text-xs font-semibold text-off-black/50 uppercase tracking-tight mb-2">Notes</h4>
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <p className="text-body-sm text-blue-800 whitespace-pre-wrap">{selectedOrder.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Flag Reason - only for flagged orders */}
                  {selectedOrder.status === 'flagged' && selectedOrder.flagReason && (
                    <div>
                      <h4 className="text-xs font-semibold text-warning-amber uppercase tracking-tight mb-2">Flag Reason</h4>
                      <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                        <p className="text-body-sm text-amber-800">{selectedOrder.flagReason}</p>
                      </div>
                    </div>
                  )}

                  {/* Missing Year Warning */}
                  {selectedOrder.status === 'missing_year' && (
                    <div>
                      <h4 className="text-xs font-semibold text-warning-amber uppercase tracking-tight mb-2">Action Required</h4>
                      <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                        <p className="text-body-sm text-amber-800">This order is missing the race year. Please contact the customer to confirm which year they ran the race.</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-3">
                    {selectedOrder.status === 'ready' && (
                      <button className="flex-1 px-5 py-3 bg-off-black text-white rounded-md hover:opacity-90 transition-opacity font-medium">
                        Mark as Completed
                      </button>
                    )}
                    {selectedOrder.status === 'flagged' && (
                      <>
                        <button className="flex-1 px-5 py-3 bg-off-black text-white rounded-md hover:opacity-90 transition-opacity font-medium">
                          Resolve Flag
                        </button>
                        <button
                          onClick={() => handleCopyEmail(selectedOrder)}
                          className="flex items-center gap-2 px-5 py-3 bg-white border border-border-gray text-off-black rounded-md hover:bg-subtle-gray transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          Copy Email
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="px-5 py-3 bg-white border border-border-gray text-off-black rounded-md hover:bg-subtle-gray transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  )
}
