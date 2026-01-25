import { PrismaClient } from '@prisma/client'
import { shopifyFetch } from '../utils/shopifyAuth.js'

const prisma = new PrismaClient()

// Artelo API configuration
const ARTELO_API_URL = 'https://www.artelo.io/api/open/orders/get'
const ARTELO_API_KEY = process.env.ARTELO_API_KEY

// Statuses that need design work
const ACTIONABLE_STATUSES = ['PendingFulfillmentAction', 'AwaitingPayment']

// --- Shopify parsing helpers ---

function parseRaceName(productTitle) {
  if (!productTitle) return null
  const suffixes = ['Personalized Race Print', 'Race Print', 'Print']
  let raceName = productTitle.trim()
  for (const suffix of suffixes) {
    if (raceName.toLowerCase().endsWith(suffix.toLowerCase())) {
      raceName = raceName.slice(0, -suffix.length).trim()
      break
    }
  }
  return raceName || null
}

function parseRunnerNameAndYear(rawValue) {
  if (!rawValue) return { runnerName: null, raceYear: null, needsAttention: true }
  const trimmed = rawValue.trim()
  const yearMatch = trimmed.match(/\s+(20\d{2})$/)
  if (yearMatch) {
    return {
      runnerName: trimmed.slice(0, -yearMatch[0].length).trim(),
      raceYear: parseInt(yearMatch[1], 10),
      needsAttention: false
    }
  }
  return { runnerName: trimmed, raceYear: null, needsAttention: true }
}

async function fetchShopifyOrderData(shopifyOrderId) {
  try {
    // Artelo's orderId for Shopify orders = Shopify's order.id
    const data = await shopifyFetch(`/orders/${shopifyOrderId}.json`)
    const order = data.order

    if (!order || !order.line_items?.length) {
      return null
    }

    const item = order.line_items[0]
    const runnerProp = item.properties?.find(p =>
      p.name.toLowerCase().includes('runner')
    )

    const raceName = parseRaceName(item.title)
    const parsed = parseRunnerNameAndYear(runnerProp?.value)

    // Fetch timeline comments (internal notes)
    const comments = await fetchShopifyComments(shopifyOrderId)

    return {
      raceName,
      runnerName: parsed.runnerName,
      raceYear: parsed.raceYear,
      needsAttention: parsed.needsAttention,
      notes: comments,
      shopifyOrderData: order
    }
  } catch (error) {
    console.error(`Failed to fetch Shopify data for order ${shopifyOrderId}:`, error.message)
    return null
  }
}

async function fetchShopifyComments(shopifyOrderId) {
  try {
    const data = await shopifyFetch(`/orders/${shopifyOrderId}/events.json`)
    const events = data.events || []

    // Filter for comments only
    const comments = events
      .filter(e => e.verb === 'comment' && e.body)
      .map(e => ({
        body: e.body,
        author: e.author,
        createdAt: e.created_at
      }))

    if (comments.length === 0) return null

    // Return as formatted string for simple storage, or could return array
    return comments.map(c => `[${c.author}]: ${c.body}`).join(' | ')
  } catch (error) {
    console.error(`Failed to fetch comments for order ${shopifyOrderId}:`, error.message)
    return null
  }
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 1. Fetch orders from Artelo
    console.log('Fetching orders from Artelo...')
    const params = new URLSearchParams({ limit: '100', allOrders: 'true' })

    const response = await fetch(`${ARTELO_API_URL}?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ARTELO_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Artelo API error: ${response.status}`)
    }

    const data = await response.json()
    const allOrders = Array.isArray(data) ? data : (data.orders || [])

    // Filter to actionable orders only
    const actionableOrders = allOrders.filter(order =>
      ACTIONABLE_STATUSES.includes(order.status)
    )

    console.log(`Found ${actionableOrders.length} actionable orders`)

    // 2. Save to database
    let imported = 0
    let skipped = 0
    let enriched = 0
    let needsAttention = 0

    for (const order of actionableOrders) {
      // Check if exists
      const existing = await prisma.order.findUnique({
        where: { orderNumber: order.orderId }
      })

      if (existing) {
        skipped++
        continue
      }

      // Parse basic info from Artelo
      const firstItem = order.orderItems?.[0]
      const rawSize = firstItem?.product?.size || 'Unknown'
      const productSize = rawSize.startsWith('x') ? rawSize.slice(1) : rawSize
      const isShopify = !order.channelName?.toLowerCase().includes('etsy')

      // Default values (from Artelo)
      let raceName = 'Unknown Race'
      let raceYear = new Date().getFullYear()
      let runnerName = order.customerAddress?.name || 'Unknown Runner'
      let status = 'pending'
      let shopifyOrderData = null
      let notes = null

      // For Shopify orders, fetch personalization data
      if (isShopify) {
        console.log(`Fetching Shopify data for order ${order.orderId}...`)
        const shopifyData = await fetchShopifyOrderData(order.orderId)

        if (shopifyData) {
          raceName = shopifyData.raceName || raceName
          runnerName = shopifyData.runnerName || runnerName
          raceYear = shopifyData.raceYear || raceYear
          shopifyOrderData = shopifyData.shopifyOrderData
          notes = shopifyData.notes

          if (shopifyData.needsAttention) {
            status = 'missing_year'
            needsAttention++
          }
          enriched++
        }
      }

      await prisma.order.create({
        data: {
          orderNumber: order.orderId,
          source: isShopify ? 'shopify' : 'etsy',
          arteloOrderData: order,
          shopifyOrderData,
          raceName,
          raceYear,
          runnerName,
          productSize,
          frameType: firstItem?.product?.frameColor || 'Unknown',
          notes,
          status
        }
      })

      imported++
    }

    // 3. Return result
    return res.status(200).json({
      success: true,
      imported,
      skipped,
      enriched,
      needsAttention,
      total: actionableOrders.length
    })

  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    })
  } finally {
    await prisma.$disconnect()
  }
}
