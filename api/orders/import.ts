import type { VercelRequest, VercelResponse } from '@vercel/node'
import { PrismaClient } from '@prisma/client'
import {
  fetchShopifyOrder,
  parseRaceName,
  parsePersonalization,
  extractPersonalizationFromLineItems
} from '../lib/helpers'

const prisma = new PrismaClient()

// Artelo API configuration
const ARTELO_API_URL = 'https://www.artelo.io/api/open/orders/get'
const ARTELO_API_KEY = process.env.ARTELO_API_KEY

// Artelo statuses that need design work
const ACTIONABLE_STATUSES = ['PendingFulfillmentAction', 'AwaitingPayment']

interface ArteloOrder {
  orderId: string
  status: string
  channelName?: string
  createdAt?: string
  customerAddress?: {
    name?: string
  }
  orderItems?: Array<{
    product?: {
      size?: string
      frameColor?: string
    }
  }>
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Fetching orders from Artelo...')

    // Build query parameters
    const params = new URLSearchParams()
    params.append('limit', '100')
    params.append('allOrders', 'true')

    const response = await fetch(`${ARTELO_API_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ARTELO_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Artelo API error:', response.status, errorText)
      throw new Error(`Artelo API error: ${response.status}`)
    }

    const data = await response.json()

    // API returns array directly, not { orders: [...] }
    const allOrders: ArteloOrder[] = Array.isArray(data) ? data : (data.orders || [])
    console.log(`Received ${allOrders.length} total orders from Artelo`)

    // Filter to only actionable orders (need design work)
    const actionableOrders = allOrders.filter(order =>
      ACTIONABLE_STATUSES.includes(order.status)
    )
    console.log(`Found ${actionableOrders.length} orders needing fulfillment`)

    // Get order IDs that are currently actionable in Artelo
    const actionableOrderIds = actionableOrders.map(o => o.orderId)

    // Cleanup: Remove orders from our database that are no longer actionable in Artelo
    const existingOrders = await prisma.order.findMany({
      where: { status: 'pending' },
      select: { orderNumber: true }
    })

    const ordersToRemove = existingOrders.filter(
      existing => !actionableOrderIds.includes(existing.orderNumber)
    )

    let removed = 0
    if (ordersToRemove.length > 0) {
      const arteloOrderMap = new Map(allOrders.map(o => [o.orderId, o.status]))

      for (const order of ordersToRemove) {
        const arteloStatus = arteloOrderMap.get(order.orderNumber)
        if (arteloStatus && !ACTIONABLE_STATUSES.includes(arteloStatus)) {
          await prisma.order.delete({
            where: { orderNumber: order.orderNumber }
          })
          console.log(`Removed order ${order.orderNumber} (status: ${arteloStatus})`)
          removed++
        }
      }
    }

    let imported = 0
    let skipped = 0

    for (const order of actionableOrders) {
      try {
        // Check if order already exists
        const existingOrder = await prisma.order.findUnique({
          where: { orderNumber: order.orderId }
        })

        if (existingOrder) {
          skipped++
          continue
        }

        // Determine source from channelName
        const channelName = order.channelName || ''
        let source = 'shopify'
        if (channelName.toLowerCase().includes('etsy')) {
          source = 'etsy'
        }

        // Parse product details from first order item
        const firstItem = order.orderItems?.[0]
        const rawSize = firstItem?.product?.size || 'Unknown'
        const productSize = rawSize.startsWith('x') ? rawSize.slice(1) : rawSize
        const frameType = firstItem?.product?.frameColor || 'Unknown'

        // Default values
        let runnerName = order.customerAddress?.name || 'Unknown Runner'
        let raceName = 'Unknown Race'
        let raceYear = new Date().getFullYear()
        let shopifyOrderData = null

        // Fetch Shopify data for enrichment (only for Shopify orders)
        if (source === 'shopify') {
          console.log(`Fetching Shopify data for order ${order.orderId}...`)
          const shopifyOrder = await fetchShopifyOrder(order.orderId)

          if (shopifyOrder) {
            shopifyOrderData = shopifyOrder

            const personalization = extractPersonalizationFromLineItems(shopifyOrder.line_items)

            if (personalization) {
              raceName = parseRaceName(personalization.productTitle || null)

              if (personalization.personalizationString) {
                const parsed = parsePersonalization(personalization.personalizationString)
                runnerName = parsed.runnerName
                raceYear = parsed.raceYear
              }

              console.log(`  Parsed: Race="${raceName}", Runner="${runnerName}", Year=${raceYear}`)
            }
          }
        }

        // Create the order
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await prisma.order.create({
          data: {
            orderNumber: order.orderId,
            source,
            arteloOrderData: order as any,
            shopifyOrderData: shopifyOrderData as any,
            raceName,
            raceYear,
            runnerName,
            productSize,
            frameType,
            status: 'pending',
            createdAt: order.createdAt ? new Date(order.createdAt) : new Date()
          }
        })

        imported++
      } catch (orderError) {
        console.error(`Error importing order ${order.orderId}:`, orderError)
      }
    }

    console.log(`Import complete: ${imported} imported, ${skipped} already existed, ${removed} removed`)
    return res.status(200).json({
      success: true,
      imported,
      skipped,
      removed,
      total: actionableOrders.length
    })

  } catch (error) {
    console.error('Error importing orders:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to import orders' })
  } finally {
    await prisma.$disconnect()
  }
}
