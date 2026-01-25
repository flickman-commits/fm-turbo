import { PrismaClient } from '@prisma/client'
import { shopifyFetch } from '../utils/shopifyAuth.js'

const prisma = new PrismaClient()

/**
 * Fetch personalization data from Shopify for a given order
 * Extracts:
 *   - Product title → race name
 *   - "Runner Name" line item property → runner name
 */
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
    const { shopifyOrderId } = req.body

    if (!shopifyOrderId) {
      return res.status(400).json({
        error: 'shopifyOrderId is required (this is the Artelo orderId for Shopify orders)'
      })
    }

    // Fetch order from Shopify by order.id (same as Artelo's orderId)
    const data = await shopifyFetch(`/orders/${shopifyOrderId}.json`)
    const shopifyOrder = data.order

    if (!shopifyOrder) {
      return res.status(404).json({ error: 'Order not found in Shopify' })
    }

    // Extract and parse the Shopify data
    const parsed = extractShopifyData(shopifyOrder.line_items)

    // Fetch timeline comments (internal notes)
    const notes = await fetchShopifyComments(shopifyOrderId)

    // Update our database if we have this order (keyed by Artelo orderId = Shopify order.id)
    const existing = await prisma.order.findUnique({
      where: { orderNumber: String(shopifyOrderId) }
    })

    if (existing) {
      await prisma.order.update({
        where: { orderNumber: String(shopifyOrderId) },
        data: {
          raceName: parsed.raceName || existing.raceName,
          runnerName: parsed.runnerName || existing.runnerName,
          raceYear: parsed.raceYear || existing.raceYear,
          notes: notes || existing.notes,
          shopifyOrderData: shopifyOrder,
          // Flag order if missing year
          status: parsed.needsAttention ? 'missing_year' : existing.status
        }
      })
    }

    return res.status(200).json({
      success: true,
      shopifyOrderId: shopifyOrder.id,
      orderName: shopifyOrder.name,
      raceName: parsed.raceName,
      runnerName: parsed.runnerName,
      raceYear: parsed.raceYear,
      notes,
      needsAttention: parsed.needsAttention,
      raw: {
        productTitle: parsed.rawProductTitle,
        runnerName: parsed.rawRunnerName
      }
    })

  } catch (error) {
    console.error('Error fetching Shopify data:', error)
    return res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Extract and parse Shopify line item data
 * - Product title → race name (strip "Personalized Race Print")
 * - "Runner Name" property → runner name + optional year
 */
function extractShopifyData(lineItems) {
  const result = {
    raceName: null,
    runnerName: null,
    raceYear: null,
    needsAttention: false,
    rawProductTitle: null,
    rawRunnerName: null
  }

  if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
    return result
  }

  // Get product title from first line item and parse race name
  const firstItem = lineItems[0]
  result.rawProductTitle = firstItem.title || null
  result.raceName = parseRaceName(result.rawProductTitle)

  // Find "Runner Name" in line item properties
  for (const item of lineItems) {
    if (!item.properties || !Array.isArray(item.properties)) {
      continue
    }

    for (const prop of item.properties) {
      const name = (prop.name || '').toLowerCase().trim()
      if (name === 'runner name' || name === 'runner_name') {
        result.rawRunnerName = (prop.value || '').trim()
        break
      }
    }

    if (result.rawRunnerName) break
  }

  // Parse runner name and year from the raw value
  if (result.rawRunnerName) {
    const parsed = parseRunnerNameAndYear(result.rawRunnerName)
    result.runnerName = parsed.runnerName
    result.raceYear = parsed.raceYear
    result.needsAttention = parsed.needsAttention
  }

  return result
}

/**
 * Parse race name from product title
 * e.g., "New York City Marathon Personalized Race Print" → "New York City Marathon"
 */
function parseRaceName(productTitle) {
  if (!productTitle) return null

  // Remove common suffixes
  const suffixes = [
    'Personalized Race Print',
    'Race Print',
    'Print'
  ]

  let raceName = productTitle.trim()
  for (const suffix of suffixes) {
    if (raceName.toLowerCase().endsWith(suffix.toLowerCase())) {
      raceName = raceName.slice(0, -suffix.length).trim()
      break
    }
  }

  return raceName || null
}

/**
 * Parse runner name and year from the "Runner Name" property
 * e.g., "Jennifer Samp 2023" → { runnerName: "Jennifer Samp", raceYear: 2023 }
 * e.g., "Mallory Girvin" → { runnerName: "Mallory Girvin", raceYear: null, needsAttention: true }
 */
function parseRunnerNameAndYear(rawValue) {
  const result = {
    runnerName: null,
    raceYear: null,
    needsAttention: false
  }

  if (!rawValue) {
    result.needsAttention = true
    return result
  }

  const trimmed = rawValue.trim()

  // Look for a 4-digit year at the end (2000-2099)
  const yearMatch = trimmed.match(/\s+(20\d{2})$/)

  if (yearMatch) {
    result.raceYear = parseInt(yearMatch[1], 10)
    result.runnerName = trimmed.slice(0, -yearMatch[0].length).trim()
  } else {
    // No year found - flag for attention
    result.runnerName = trimmed
    result.needsAttention = true
  }

  return result
}

/**
 * Fetch timeline comments (internal notes) from Shopify order events
 */
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

    // Return just the messages, separated by |
    return comments.map(c => c.body).join(' | ')
  } catch (error) {
    console.error(`Failed to fetch comments for order ${shopifyOrderId}:`, error.message)
    return null
  }
}
