import { useState, useMemo, useEffect, useCallback } from 'react'
import { Search, Upload, Copy, Loader2, FlaskConical, Pencil, Check, X } from 'lucide-react'

// API calls now go to /api/* serverless functions (same origin)

interface Order {
  id: string
  orderNumber: string        // Unique ID for this line item (parentOrderNumber-lineItemIndex)
  parentOrderNumber: string  // Original Shopify/Etsy order number
  lineItemIndex: number      // Which line item this is (0, 1, 2, etc.)
  displayOrderNumber: string // Friendly display number (Shopify order.name like "2585")
  source: 'shopify' | 'etsy'
  raceName: string
  raceYear: number | null
  raceDate?: string
  raceLocation?: string
  eventType?: string
  runnerName: string
  productSize: string
  notes?: string
  hadNoTime?: boolean         // Flag: customer entered "no time"
  status: 'pending' | 'ready' | 'flagged' | 'completed' | 'missing_year'
  flagReason?: string
  completedAt?: string
  createdAt: string
  // Runner research data
  bibNumber?: string
  officialTime?: string
  officialPace?: string
  researchStatus?: 'found' | 'not_found' | 'ambiguous' | null
  researchNotes?: string
  // Weather data
  weatherTemp?: string
  weatherCondition?: string
  // Scraper availability
  hasScraperAvailable?: boolean
  // Override fields
  yearOverride?: number | null
  raceNameOverride?: string | null
  runnerNameOverride?: string | null
  // Effective values (computed by API)
  effectiveRaceYear?: number | null
  effectiveRaceName?: string
  effectiveRunnerName?: string
  hasOverrides?: boolean
}

// Toast notification component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-600 text-white' :
      type === 'error' ? 'bg-red-600 text-white' :
      'bg-blue-600 text-white'
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

// Not available field (no scraper for this race)
function NotAvailableField({ label }: { label: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-body-sm text-off-black/60">{label}</span>
      <span className="text-body-sm text-off-black/30 italic">Manual entry needed</span>
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

// Date and pace are now pre-formatted by the API for direct copy to Illustrator
// Date: MM.DD.YY (e.g., "11.02.25")
// Pace: X:XX / mi (e.g., "7:15 / mi")

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [isResearching, setIsResearching] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

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
          parentOrderNumber: order.parentOrderNumber as string,
          lineItemIndex: order.lineItemIndex as number,
          displayOrderNumber: displayNum || (order.parentOrderNumber as string),
          source: order.source as 'shopify' | 'etsy',
          raceName: order.raceName as string,
          raceYear: order.raceYear as number | null,
          raceDate: order.raceDate as string | undefined,
          raceLocation: order.raceLocation as string | undefined,
          runnerName: order.runnerName as string,
          productSize: order.productSize as string,
          notes: order.notes as string | undefined,
          status: order.status as 'pending' | 'ready' | 'flagged' | 'completed' | 'missing_year',
          createdAt: order.createdAt as string,
          completedAt: order.researchedAt as string | undefined,
          // Research data
          bibNumber: order.bibNumber as string | undefined,
          officialTime: order.officialTime as string | undefined,
          officialPace: order.officialPace as string | undefined,
          eventType: order.eventType as string | undefined,
          researchStatus: order.researchStatus as 'found' | 'not_found' | 'ambiguous' | null,
          researchNotes: order.researchNotes as string | undefined,
          // Weather
          weatherTemp: order.weatherTemp as string | undefined,
          weatherCondition: order.weatherCondition as string | undefined,
          // Scraper
          hasScraperAvailable: order.hasScraperAvailable as boolean | undefined,
          // Override fields
          yearOverride: order.yearOverride as number | null | undefined,
          raceNameOverride: order.raceNameOverride as string | null | undefined,
          runnerNameOverride: order.runnerNameOverride as string | null | undefined,
          // Effective values
          effectiveRaceYear: order.effectiveRaceYear as number | null | undefined,
          effectiveRaceName: order.effectiveRaceName as string | undefined,
          effectiveRunnerName: order.effectiveRunnerName as string | undefined,
          hasOverrides: order.hasOverrides as boolean | undefined
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

  // Research a single order
  const researchOrder = async (orderNumber: string) => {
    setIsResearching(true)
    try {
      setToast({ message: 'Researching runner...', type: 'info' })

      const response = await fetch(`/api/orders/research-runner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Research failed')
      }

      const data = await response.json()

      if (data.found) {
        setToast({
          message: `Found! Bib: ${data.results.bibNumber}, Time: ${data.results.officialTime}`,
          type: 'success'
        })
      } else if (data.ambiguous) {
        setToast({
          message: 'Multiple runners found with that name',
          type: 'error'
        })
      } else {
        setToast({
          message: 'Runner not found in race results',
          type: 'error'
        })
      }

      // Fetch fresh data and update both orders list and selected order
      const freshResponse = await fetch(`/api/orders`)
      if (freshResponse.ok) {
        const freshData = await freshResponse.json()
        const freshOrders: Order[] = (freshData.orders || []).map((order: Record<string, unknown>) => {
          const shopifyData = order.shopifyOrderData as Record<string, unknown> | null
          const displayNum = shopifyData?.name as string | undefined
          return {
            id: order.id as string,
            orderNumber: order.orderNumber as string,
            displayOrderNumber: displayNum || (order.orderNumber as string),
            source: order.source as 'shopify' | 'etsy',
            raceName: order.raceName as string,
            raceYear: order.raceYear as number | null,
            raceDate: order.raceDate as string | undefined,
            raceLocation: order.raceLocation as string | undefined,
            runnerName: order.runnerName as string,
            productSize: order.productSize as string,
            notes: order.notes as string | undefined,
            status: order.status as 'pending' | 'ready' | 'flagged' | 'completed' | 'missing_year',
            createdAt: order.createdAt as string,
            completedAt: order.researchedAt as string | undefined,
            bibNumber: order.bibNumber as string | undefined,
            officialTime: order.officialTime as string | undefined,
            officialPace: order.officialPace as string | undefined,
            eventType: order.eventType as string | undefined,
            researchStatus: order.researchStatus as 'found' | 'not_found' | 'ambiguous' | null,
            researchNotes: order.researchNotes as string | undefined,
            weatherTemp: order.weatherTemp as string | undefined,
            weatherCondition: order.weatherCondition as string | undefined,
            hasScraperAvailable: order.hasScraperAvailable as boolean | undefined,
            yearOverride: order.yearOverride as number | null | undefined,
            raceNameOverride: order.raceNameOverride as string | null | undefined,
            runnerNameOverride: order.runnerNameOverride as string | null | undefined,
            effectiveRaceYear: order.effectiveRaceYear as number | null | undefined,
            effectiveRaceName: order.effectiveRaceName as string | undefined,
            effectiveRunnerName: order.effectiveRunnerName as string | undefined,
            hasOverrides: order.hasOverrides as boolean | undefined
          }
        })

        // Update orders list
        setOrders(freshOrders)
        setLastUpdated(new Date())

        // Update selected order with fresh data
        const updatedOrder = freshOrders.find(o => o.orderNumber === orderNumber)
        console.log('[Research] Looking for order:', orderNumber)
        console.log('[Research] Updated order found:', updatedOrder?.orderNumber, 'researchStatus:', updatedOrder?.researchStatus, 'status:', updatedOrder?.status)
        if (updatedOrder) {
          setSelectedOrder(updatedOrder)
        }
      }
    } catch (error) {
      console.error('Error researching order:', error)
      const message = error instanceof Error ? error.message : 'Research failed'
      setToast({ message, type: 'error' })
    } finally {
      setIsResearching(false)
    }
  }

  // Mark order as completed
  const markAsCompleted = async (orderNumber: string) => {
    try {
      const response = await fetch(`/api/orders/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber })
      })

      if (!response.ok) throw new Error('Failed to mark as completed')

      setToast({ message: 'Order marked as completed!', type: 'success' })
      setSelectedOrder(null)
      await fetchOrders()
    } catch (error) {
      console.error('Error completing order:', error)
      setToast({ message: 'Failed to complete order', type: 'error' })
    }
  }

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editValues, setEditValues] = useState<{
    yearOverride: string
    raceNameOverride: string
    runnerNameOverride: string
  }>({ yearOverride: '', raceNameOverride: '', runnerNameOverride: '' })
  const [isSaving, setIsSaving] = useState(false)

  // Start editing mode
  const startEditing = (order: Order) => {
    setEditValues({
      yearOverride: order.yearOverride?.toString() || order.raceYear?.toString() || '',
      raceNameOverride: order.raceNameOverride || order.raceName || '',
      runnerNameOverride: order.runnerNameOverride || order.runnerName || ''
    })
    setIsEditing(true)
  }

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false)
    setEditValues({ yearOverride: '', raceNameOverride: '', runnerNameOverride: '' })
  }

  // Save overrides
  const saveOverrides = async (orderNumber: string, originalOrder: Order) => {
    setIsSaving(true)
    try {
      // Determine what changed (only send overrides if different from original)
      const updates: Record<string, string | number | null> = {}

      const newYear = editValues.yearOverride ? parseInt(editValues.yearOverride, 10) : null
      if (newYear !== originalOrder.raceYear) {
        updates.yearOverride = newYear
      } else if (originalOrder.yearOverride !== null) {
        updates.yearOverride = null // Clear override if matches original
      }

      if (editValues.raceNameOverride !== originalOrder.raceName) {
        updates.raceNameOverride = editValues.raceNameOverride || null
      } else if (originalOrder.raceNameOverride !== null) {
        updates.raceNameOverride = null
      }

      if (editValues.runnerNameOverride !== originalOrder.runnerName) {
        updates.runnerNameOverride = editValues.runnerNameOverride || null
      } else if (originalOrder.runnerNameOverride !== null) {
        updates.runnerNameOverride = null
      }

      const response = await fetch(`/api/orders/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, ...updates })
      })

      if (!response.ok) throw new Error('Failed to save changes')

      setToast({ message: 'Changes saved!', type: 'success' })
      setIsEditing(false)
      await fetchOrders()

      // Update selected order with new data
      const updatedOrders = await fetch(`/api/orders`).then(r => r.json())
      const updated = updatedOrders.orders?.find((o: { orderNumber: string }) => o.orderNumber === orderNumber)
      if (updated) {
        const shopifyData = updated.shopifyOrderData as Record<string, unknown> | null
        setSelectedOrder({
          ...selectedOrder!,
          ...updated,
          displayOrderNumber: (shopifyData?.name as string) || updated.orderNumber
        })
      }
    } catch (error) {
      console.error('Error saving overrides:', error)
      setToast({ message: 'Failed to save changes', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  // Close modal and reset edit state
  const closeModal = () => {
    setSelectedOrder(null)
    setIsEditing(false)
    setEditValues({ yearOverride: '', raceNameOverride: '', runnerNameOverride: '' })
  }

  // Fetch orders on mount
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Designs to be personalized: pending + flagged + ready + missing_year, sorted by order number descending
  const ordersToFulfill = useMemo(() => {
    const fulfillOrders = orders.filter(o =>
      o.status === 'flagged' || o.status === 'ready' || o.status === 'pending' || o.status === 'missing_year'
    )
    // Sort by displayOrderNumber descending (highest order number first)
    return fulfillOrders.sort((a, b) => {
      const numA = parseInt(a.displayOrderNumber) || parseInt(a.orderNumber) || 0
      const numB = parseInt(b.displayOrderNumber) || parseInt(b.orderNumber) || 0
      return numB - numA
    })
  }, [orders])

  const completedOrders = useMemo(() =>
    orders.filter(o => o.status === 'completed'), [orders])

  const filteredOrders = useMemo(() => {
    if (!searchQuery) return ordersToFulfill
    const query = searchQuery.toLowerCase()
    return ordersToFulfill.filter(o =>
      o.orderNumber.toLowerCase().includes(query) ||
      o.displayOrderNumber.toLowerCase().includes(query) ||
      o.parentOrderNumber.toLowerCase().includes(query) ||
      o.raceName.toLowerCase().includes(query) ||
      o.runnerName.toLowerCase().includes(query)
    )
  }, [ordersToFulfill, searchQuery])

  // Helper to check if an order has multiple items
  const getOrderItemCount = useCallback((parentOrderNumber: string) => {
    return orders.filter(o => o.parentOrderNumber === parentOrderNumber).length
  }, [orders])

  const handleCopyEmail = (order: Order) => {
    const emailText = `Hi,

I'm reaching out regarding order ${order.orderNumber} for ${order.runnerName}'s ${order.raceName} ${order.raceYear} print.

${order.flagReason}

Could you please verify the runner's name and race details?

Thank you!`
    navigator.clipboard.writeText(emailText)
  }

  // Get status icon and color for table
  const getStatusDisplay = (order: Order) => {
    if (order.status === 'flagged') return { icon: '⚠️', label: 'Flagged' }
    if (order.status === 'missing_year') return { icon: '📅', label: 'Missing Year' }
    if (order.status === 'ready') return { icon: '✅', label: 'Ready' }
    if (order.researchStatus === 'found') return { icon: '✅', label: 'Researched' }
    if (order.hasScraperAvailable) return { icon: '🔍', label: 'Can Research' }
    return { icon: '⏳', label: 'Pending' }
  }

  // Generate race shorthand for filename
  const getRaceShorthand = (raceName: string): string => {
    if (!raceName) return 'Race'

    // Common race name mappings
    const shorthandMap: { [key: string]: string } = {
      'Surf City Marathon': 'Surf City',
      'Mesa Marathon': 'Mesa',
      'Berlin Marathon': 'Berlin',
      'Denver Colfax Marathon': 'Colfax',
      'Miami Marathon': 'Miami',
      'Buffalo Marathon': 'Buffalo',
      'Twin Cities Marathon': 'Twin Cities',
      'Louisiana Marathon': 'Louisiana',
      'Army Ten Miler': 'ATM',
      'Detroit Marathon': 'Detroit',
      'Columbus Marathon': 'Columbus',
      'Pittsburgh Marathon': 'Pittsburgh',
      'Grandma\'s Marathon': 'Grandma\'s',
      'Houston Marathon': 'Houston',
      'Dallas Marathon': 'Dallas',
      'California International Marathon': 'CIM',
      'Palm Beaches Marathon': 'Palm Beaches',
      'New York City Marathon': 'NYC',
      'Baltimore Marathon': 'Baltimore',
      'Philadelphia Marathon': 'Philly',
      'San Antonio Marathon': 'San Antonio',
      'Kiawah Island Marathon': 'Kiawah',
      'Honolulu Marathon': 'Honolulu',
      'Marine Corps Marathon': 'MCM',
      'Chicago Marathon': 'Chicago',
      'Air Force Marathon': 'Air Force',
      'San Francisco Marathon': 'SF',
      'Jackson Hole Marathon': 'Jackson Hole',
      // Alternate name formats
      'TCS New York City Marathon': 'NYC',
      'Bank of America Chicago Marathon': 'Chicago',
      'Marine Corps': 'MCM',
    }

    // Check for exact match
    if (shorthandMap[raceName]) {
      return shorthandMap[raceName]
    }

    // Generate acronym from race name
    // Remove common words and take initials
    const words = raceName
      .replace(/Marathon|Half Marathon|10K|5K|Race|Ultra|Trail/gi, '')
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0)

    if (words.length === 0) {
      // If no words left, just use first 3 letters of original name
      return raceName.slice(0, 3).toUpperCase()
    }

    // Take first letter of each word (up to 4 letters for acronym)
    return words
      .slice(0, 4)
      .map(word => word[0].toUpperCase())
      .join('')
  }

  // Generate filename for order
  const generateFilename = (order: Order): string => {
    const displayOrderNumber = order.displayOrderNumber || order.orderNumber
    const raceName = order.effectiveRaceName || order.raceName
    const runnerName = order.effectiveRunnerName || order.runnerName

    // Get race shorthand
    const raceShort = getRaceShorthand(raceName)

    // Get last name from runner name
    const nameParts = runnerName.trim().split(/\s+/)
    const lastName = nameParts[nameParts.length - 1]

    return `${displayOrderNumber}_${raceShort}_${lastName}.pdf`
  }

  return (
    <div className="h-screen overflow-hidden bg-[#f3f3f3] flex flex-col">
      <div className="max-w-5xl mx-auto px-6 md:px-8 lg:px-12 w-full flex flex-col h-full">
        {/* Header - Left-aligned with compact vertical space */}
        <div className="pt-6 md:pt-8 lg:pt-10 pb-4 md:pb-6 flex items-end justify-between gap-6 flex-shrink-0">
          {/* Left side: logo, greeting, and summary */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <img
                src="/trackstar-logo.png"
                alt="Trackstar"
                className="h-10 md:h-11"
              />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-[40px] font-bold text-off-black mb-1">
                {getGreeting()}, Elí
              </h1>
              <p className="text-sm md:text-base text-off-black/60">
                Last updated {formatLastUpdated(lastUpdated)}
              </p>
            </div>
          </div>

          {/* Right side: primary actions, right-aligned */}
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={importOrders}
              disabled={isImporting}
              className="inline-flex items-center gap-2 px-3 md:px-6 py-2.5 bg-off-black text-white rounded-md hover:opacity-90 transition-opacity font-medium text-xs md:text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isImporting ? 'Importing…' : 'Import New Orders'}
            </button>
            <div className="hidden md:flex flex-col items-end gap-1">
              <a
                href="https://www.artelo.io/app/orders?tab=ACTION_REQUIRED"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-off-black/40 hover:text-off-black/70 transition-colors"
              >
                Go to Artelo Orders &rarr;
              </a>
              <a
                href="https://admin.shopify.com/store/flickman-3247/orders"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-off-black/40 hover:text-off-black/70 transition-colors"
              >
                Go to Shopify Orders &rarr;
              </a>
            </div>
          </div>
        </div>

        {/* Orders to Personalize Section */}
        {!isLoading && (
        <section className="flex-1 flex flex-col min-h-0 pb-4">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-off-black uppercase tracking-tight">Designs to be Personalized</h2>
              <span className="px-2.5 py-1 bg-off-black/10 text-off-black/60 text-sm font-medium rounded">
                {ordersToFulfill.length}
              </span>
            </div>
          </div>

          {/* Content Card */}
          <div className="bg-white border border-border-gray rounded-lg shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
            {/* Search inside card */}
            <div className="p-4 border-b border-border-gray flex-shrink-0">
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

            {/* Scrollable Table Container */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <table className="w-full">
                <thead className="bg-subtle-gray border-b border-border-gray sticky top-0 z-10">
                  <tr>
                    <th className="text-center pl-6 pr-2 py-4 text-xs font-semibold text-off-black/60 uppercase tracking-wider w-12">Src</th>
                    <th className="text-left px-3 py-4 text-xs font-semibold text-off-black/60 uppercase tracking-wider">Order #</th>
                    <th className="text-center px-3 py-4 text-xs font-semibold text-off-black/60 uppercase tracking-wider w-20">Status</th>
                    <th className="text-left px-3 py-4 text-xs font-semibold text-off-black/60 uppercase tracking-wider">Runner</th>
                    <th className="text-left px-3 pr-6 py-4 text-xs font-semibold text-off-black/60 uppercase tracking-wider hidden md:table-cell">Race</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-gray">
                  {filteredOrders.map((order, index) => {
                    const statusDisplay = getStatusDisplay(order)
                    const itemCount = getOrderItemCount(order.parentOrderNumber)
                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`hover:bg-subtle-gray cursor-pointer transition-colors ${index % 2 === 1 ? 'bg-subtle-gray/30' : ''}`}
                      >
                        <td className="pl-6 pr-2 py-5 text-center">
                          <img
                            src={order.source === 'shopify' ? '/shopify-icon.png' : '/etsy-icon.png'}
                            alt={order.source === 'shopify' ? 'Shopify' : 'Etsy'}
                            title={order.source === 'shopify' ? 'Shopify' : 'Etsy'}
                            className="w-5 h-5 inline-block"
                          />
                        </td>
                        <td className="px-3 py-5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-off-black">{order.displayOrderNumber}</span>
                            {itemCount > 1 && (
                              <span className="px-1.5 py-0.5 bg-off-black/5 text-off-black/60 text-[10px] font-medium rounded whitespace-nowrap">
                                Item {order.lineItemIndex + 1} of {itemCount}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-5 text-center">
                          <span className="text-lg" title={statusDisplay.label}>
                            {statusDisplay.icon}
                          </span>
                        </td>
                        <td className="px-3 py-5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-off-black">{order.effectiveRunnerName || order.runnerName || 'Unknown Runner'}</span>
                            {order.hasOverrides && (
                              <span className="px-1 py-0.5 bg-blue-100 text-blue-600 text-[9px] rounded">edited</span>
                            )}
                          </div>
                          {order.status === 'flagged' && order.flagReason && (
                            <p className="text-xs text-warning-amber mt-1 leading-tight">{order.flagReason}</p>
                          )}
                          {order.status === 'missing_year' && !order.yearOverride && (
                            <p className="text-xs text-warning-amber mt-1 leading-tight">Year Missing</p>
                          )}
                          {order.status === 'ready' && order.bibNumber && (
                            <p className="text-xs text-green-600 mt-1 leading-tight">Bib: {order.bibNumber} • {order.officialTime}</p>
                          )}
                          {order.status === 'pending' && order.hasScraperAvailable && (order.effectiveRaceYear || order.raceYear) && (
                            <p className="text-xs text-blue-600 mt-1 leading-tight">Ready to research</p>
                          )}
                          {order.status === 'pending' && !order.hasScraperAvailable && (
                            <p className="text-xs text-off-black/40 mt-1 leading-tight">Manual research needed</p>
                          )}
                        </td>
                        <td className="px-3 pr-6 py-5 text-sm text-off-black/60 hidden md:table-cell">
                          {order.effectiveRaceName || order.raceName} {order.effectiveRaceYear || order.raceYear}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {filteredOrders.length === 0 && (
                <div className="text-center py-16 text-off-black/40 text-sm">
                  {searchQuery ? 'No matching orders found' : 'No orders to personalize'}
                </div>
              )}
            </div>
          </div>
        </section>
        )}

        {/* Completed Orders Toggle */}
        {!isLoading && completedOrders.length > 0 && (
          <div className="flex-shrink-0 py-4 mt-2 mb-8 border-t border-border-gray/50">
            <div className="flex justify-center">
              <button
                onClick={() => setShowCompleted(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-border-gray rounded-full shadow-sm text-sm text-off-black/70 hover:bg-subtle-gray transition-colors"
              >
                <span>{showCompleted ? 'Close Completed Orders' : 'View Completed Orders'}</span>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-off-black/5 text-off-black/60">
                  {completedOrders.length}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Completed Orders Section (Modal-style) */}
        {showCompleted && (
          <div
            className="fixed inset-0 bg-off-black/60 flex items-center justify-center p-4 z-40"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowCompleted(false)
              }
            }}
          >
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-border-gray">
                <h2 className="text-lg font-semibold text-off-black">Completed Orders</h2>
                <button
                  onClick={() => setShowCompleted(false)}
                  className="text-off-black/40 hover:text-off-black text-2xl leading-none transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="overflow-y-auto flex-1">
                <table className="w-full">
                  <thead className="bg-subtle-gray border-b border-border-gray sticky top-0">
                    <tr>
                      <th className="text-center pl-6 pr-2 py-4 text-xs font-semibold text-off-black/60 uppercase tracking-wider w-12">Src</th>
                      <th className="text-left px-3 py-4 text-xs font-semibold text-off-black/60 uppercase tracking-wider">Order #</th>
                      <th className="text-center px-3 py-4 text-xs font-semibold text-off-black/60 uppercase tracking-wider w-20">Status</th>
                      <th className="text-left px-3 py-4 text-xs font-semibold text-off-black/60 uppercase tracking-wider">Runner</th>
                      <th className="text-left px-3 pr-6 py-4 text-xs font-semibold text-off-black/60 uppercase tracking-wider hidden md:table-cell">Race</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-gray">
                    {completedOrders.map((order, index) => (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`hover:bg-subtle-gray cursor-pointer transition-colors ${index % 2 === 1 ? 'bg-subtle-gray/30' : ''}`}
                      >
                        <td className="pl-6 pr-2 py-5 text-center">
                          <img
                            src={order.source === 'shopify' ? '/shopify-icon.png' : '/etsy-icon.png'}
                            alt={order.source === 'shopify' ? 'Shopify' : 'Etsy'}
                            title={order.source === 'shopify' ? 'Shopify' : 'Etsy'}
                            className="w-5 h-5 inline-block"
                          />
                        </td>
                        <td className="px-3 py-5">
                          <span className="text-sm font-medium text-off-black">{order.displayOrderNumber}</span>
                        </td>
                        <td className="px-3 py-5 text-center">
                          <span className="text-lg">✅</span>
                        </td>
                        <td className="px-3 py-5 text-sm text-off-black">
                          {order.runnerName}
                        </td>
                        <td className="px-3 pr-6 py-5 text-sm text-off-black/60 hidden md:table-cell">
                          {order.raceName} {order.raceYear}
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
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-off-black/40" />
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div
            className="fixed inset-0 bg-off-black/60 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              // Close modal when clicking on backdrop (not modal content)
              if (e.target === e.currentTarget && !isEditing) {
                closeModal()
              }
            }}
          >
            <div className="bg-white rounded-md max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {selectedOrder.status === 'flagged' ? '⚠️' :
                       selectedOrder.status === 'completed' ? '✅' :
                       selectedOrder.status === 'missing_year' ? '📅' :
                       selectedOrder.status === 'ready' ? '✅' :
                       selectedOrder.researchStatus === 'found' ? '✅' : '⏳'}
                    </span>
                    <h3 className="text-heading-md text-off-black">
                      Order {selectedOrder.displayOrderNumber}
                    </h3>
                    {selectedOrder.hasOverrides && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        edited
                      </span>
                    )}
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-off-black/40 hover:text-off-black text-2xl leading-none transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-5">
                  {/* Product Info */}
                  <div>
                    <h4 className="text-xs font-semibold text-off-black/50 uppercase tracking-tight mb-2">Product Info</h4>
                    <div className="bg-subtle-gray border border-border-gray rounded-md p-4 space-y-3">
                      <StaticField label="Size" value={selectedOrder.productSize} />
                      <CopyableField label="Filename" value={generateFilename(selectedOrder)} />
                    </div>
                  </div>

                  {/* Editable Order Info */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-off-black/50 uppercase tracking-tight">Order Details</h4>
                      {!isEditing && selectedOrder.status !== 'completed' && (
                        <button
                          onClick={() => startEditing(selectedOrder)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                      )}
                      {isEditing && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveOverrides(selectedOrder.orderNumber, selectedOrder)}
                            disabled={isSaving}
                            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
                          >
                            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="flex items-center gap-1 text-xs text-off-black/50 hover:text-off-black/70 transition-colors"
                          >
                            <X className="w-3 h-3" />
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="bg-subtle-gray border border-border-gray rounded-md p-4 space-y-3">
                      {/* Runner Name - Editable */}
                      {isEditing ? (
                        <div className="flex justify-between items-center">
                          <span className="text-body-sm text-off-black/60">Runner</span>
                          <input
                            type="text"
                            value={editValues.runnerNameOverride}
                            onChange={(e) => setEditValues({ ...editValues, runnerNameOverride: e.target.value })}
                            className="text-body-sm font-medium text-off-black bg-white border border-border-gray rounded px-2 py-1 w-48 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span className="text-body-sm text-off-black/60">Runner</span>
                          <div className="flex items-center gap-2">
                            <span className="text-body-sm font-medium text-off-black">
                              {selectedOrder.effectiveRunnerName || selectedOrder.runnerName}
                            </span>
                            {selectedOrder.runnerNameOverride && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] rounded">edited</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Race Name - Editable */}
                      {isEditing ? (
                        <div className="flex justify-between items-center">
                          <span className="text-body-sm text-off-black/60">Race</span>
                          <input
                            type="text"
                            value={editValues.raceNameOverride}
                            onChange={(e) => setEditValues({ ...editValues, raceNameOverride: e.target.value })}
                            className="text-body-sm font-medium text-off-black bg-white border border-border-gray rounded px-2 py-1 w-48 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span className="text-body-sm text-off-black/60">Race</span>
                          <div className="flex items-center gap-2">
                            <span className="text-body-sm font-medium text-off-black">
                              {selectedOrder.effectiveRaceName || selectedOrder.raceName}
                            </span>
                            {selectedOrder.raceNameOverride && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] rounded">edited</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Year - Editable */}
                      {isEditing ? (
                        <div className="flex justify-between items-center">
                          <span className="text-body-sm text-off-black/60">Year</span>
                          <input
                            type="number"
                            value={editValues.yearOverride}
                            onChange={(e) => setEditValues({ ...editValues, yearOverride: e.target.value })}
                            className="text-body-sm font-medium text-off-black bg-white border border-border-gray rounded px-2 py-1 w-24 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="2000"
                            max="2030"
                          />
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span className="text-body-sm text-off-black/60">Year</span>
                          <div className="flex items-center gap-2">
                            {(selectedOrder.effectiveRaceYear || selectedOrder.raceYear) ? (
                              <span className="text-body-sm font-medium text-off-black">
                                {selectedOrder.effectiveRaceYear || selectedOrder.raceYear}
                              </span>
                            ) : (
                              <span className="text-body-sm text-warning-amber font-medium">Missing</span>
                            )}
                            {selectedOrder.yearOverride && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] rounded">edited</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Race Info (non-editable research data) */}
                  <div>
                    <h4 className="text-xs font-semibold text-off-black/50 uppercase tracking-tight mb-2">Race Data</h4>
                    <div className="bg-subtle-gray border border-border-gray rounded-md p-4 space-y-3">
                      {selectedOrder.eventType ? (
                        <StaticField label="Event" value={selectedOrder.eventType} />
                      ) : selectedOrder.hasScraperAvailable ? (
                        <PendingField label="Event" />
                      ) : (
                        <NotAvailableField label="Event" />
                      )}
                      {selectedOrder.raceDate ? (
                        <CopyableField label="Date" value={selectedOrder.raceDate} />
                      ) : selectedOrder.hasScraperAvailable ? (
                        <PendingField label="Date" />
                      ) : (
                        <NotAvailableField label="Date" />
                      )}
                      {selectedOrder.weatherCondition ? (
                        <CopyableField label="Weather" value={selectedOrder.weatherCondition} />
                      ) : (
                        <PendingField label="Weather" />
                      )}
                      {selectedOrder.weatherTemp ? (
                        <CopyableField label="Temp" value={selectedOrder.weatherTemp} />
                      ) : (
                        <PendingField label="Temp" />
                      )}
                    </div>
                  </div>

                  {/* Runner Research Results */}
                  <div>
                    <h4 className="text-xs font-semibold text-off-black/50 uppercase tracking-tight mb-2">Research Results</h4>
                    <div className="bg-subtle-gray border border-border-gray rounded-md p-4 space-y-3">
                      {(selectedOrder.effectiveRunnerName || selectedOrder.runnerName) ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <CopyableField label="Name" value={selectedOrder.effectiveRunnerName || selectedOrder.runnerName} />
                          </div>
                          {selectedOrder.hadNoTime && (
                            <span className="text-xs px-2 py-1 bg-warning-yellow/10 text-warning-yellow border border-warning-yellow/20 rounded" title='Customer entered "no time"'>
                              ⚠️ No Time
                            </span>
                          )}
                        </div>
                      ) : (
                        <PendingField label="Name" />
                      )}
                      {selectedOrder.bibNumber ? (
                        <CopyableField label="Bib" value={selectedOrder.bibNumber} />
                      ) : selectedOrder.hasScraperAvailable ? (
                        <PendingField label="Bib" />
                      ) : (
                        <NotAvailableField label="Bib" />
                      )}
                      {selectedOrder.officialTime ? (
                        <CopyableField label="Time" value={selectedOrder.officialTime} />
                      ) : selectedOrder.hasScraperAvailable ? (
                        <PendingField label="Time" />
                      ) : (
                        <NotAvailableField label="Time" />
                      )}
                      {selectedOrder.officialPace ? (
                        <CopyableField label="Pace" value={selectedOrder.officialPace} />
                      ) : selectedOrder.hasScraperAvailable ? (
                        <PendingField label="Pace" />
                      ) : (
                        <NotAvailableField label="Pace" />
                      )}
                    </div>
                  </div>

                  {/* Research Status */}
                  {selectedOrder.researchStatus && selectedOrder.researchStatus !== 'found' && (
                    <div>
                      <h4 className="text-xs font-semibold text-warning-amber uppercase tracking-tight mb-2">Research Status</h4>
                      <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                        <p className="text-body-sm text-amber-800">
                          {selectedOrder.researchStatus === 'not_found' && 'Runner not found in race results. Please verify the name and year.'}
                          {selectedOrder.researchStatus === 'ambiguous' && 'Multiple runners found with this name. Manual verification needed.'}
                        </p>
                        {selectedOrder.researchNotes && (
                          <p className="text-body-sm text-amber-700 mt-2">{selectedOrder.researchNotes}</p>
                        )}
                      </div>
                    </div>
                  )}

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

                  {/* Scraper Not Available Warning */}
                  {!selectedOrder.hasScraperAvailable && selectedOrder.status !== 'completed' && (
                    <div>
                      <h4 className="text-xs font-semibold text-off-black/50 uppercase tracking-tight mb-2">Manual Research Required</h4>
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                        <p className="text-body-sm text-gray-600">
                          Auto-research is not yet available for {selectedOrder.effectiveRaceName || selectedOrder.raceName}.
                          Please manually look up the runner's bib number, time, and pace.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-3">
                    {/* Research button - show if scraper available and not already researched */}
                    {selectedOrder.hasScraperAvailable &&
                     (selectedOrder.effectiveRaceYear || selectedOrder.raceYear) &&
                     selectedOrder.researchStatus !== 'found' &&
                     selectedOrder.status !== 'completed' &&
                     !isEditing && (
                      <button
                        onClick={() => researchOrder(selectedOrder.orderNumber)}
                        disabled={isResearching}
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isResearching ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FlaskConical className="w-4 h-4" />
                        )}
                        {isResearching ? 'Researching...' : 'Research Runner'}
                      </button>
                    )}
                    {(selectedOrder.status === 'ready' || selectedOrder.researchStatus === 'found') &&
                     selectedOrder.status !== 'completed' &&
                     !isEditing && (
                      <button
                        onClick={() => markAsCompleted(selectedOrder.orderNumber)}
                        className="flex-1 px-5 py-3 bg-off-black text-white rounded-md hover:opacity-90 transition-opacity font-medium"
                      >
                        Mark as Completed
                      </button>
                    )}
                    {selectedOrder.status === 'flagged' && !isEditing && (
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
                    {!isEditing && (
                      <button
                        onClick={closeModal}
                        className="px-5 py-3 bg-white border border-border-gray text-off-black rounded-md hover:bg-subtle-gray transition-colors"
                      >
                        Close
                      </button>
                    )}
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
