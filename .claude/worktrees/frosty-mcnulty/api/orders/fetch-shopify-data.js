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

    // Update all line items for this order (keyed by Artelo orderId = Shopify order.id)
    const existingOrders = await prisma.order.findMany({
      where: { parentOrderNumber: String(shopifyOrderId) }
    })

    // Update each line item with its specific personalization
    for (const existing of existingOrders) {
      const lineItemIndex = existing.lineItemIndex
      const lineItem = shopifyOrder.line_items?.[lineItemIndex]

      if (lineItem) {
        // Extract personalization for this specific line item
        const lineItemData = extractShopifyData([lineItem])

        await prisma.order.update({
          where: { id: existing.id },
          data: {
            raceName: lineItemData.raceName || existing.raceName,
            runnerName: lineItemData.runnerName || existing.runnerName,
            raceYear: lineItemData.raceYear || existing.raceYear,
            hadNoTime: lineItemData.hadNoTime || false,
            notes: notes || existing.notes,
            shopifyOrderData: shopifyOrder,
            // Flag order if missing year
            status: lineItemData.needsAttention ? 'missing_year' : existing.status
          }
        })
      }
    }

    return res.status(200).json({
      success: true,
      shopifyOrderId: shopifyOrder.id,
      orderName: shopifyOrder.name,
      raceName: parsed.raceName,
      runnerName: parsed.runnerName,
      raceYear: parsed.raceYear,
      hadNoTime: parsed.hadNoTime,  // Flag indicating "no time" was present
      notes,
      needsAttention: parsed.needsAttention,
      raw: {
        productTitle: parsed.rawProductTitle,
        raceName: parsed.rawRaceName,
        runnerName: parsed.rawRunnerName,
        raceYear: parsed.rawRaceYear
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
 * NEW FORMAT (as of 2025):
 * - Product title → race name (strip "Personalized Race Print")
 * - "Runner Name (First & Last)" property → runner name
 * - "Race Year" property → year (separate field now!)
 * - "Race Name" property → can override product title race name
 */
function extractShopifyData(lineItems) {
  const result = {
    raceName: null,
    runnerName: null,
    raceYear: null,
    needsAttention: false,
    hadNoTime: false,  // Flag to indicate "no time" was present
    rawProductTitle: null,
    rawRunnerName: null,
    rawRaceYear: null,
    rawRaceName: null
  }

  if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
    return result
  }

  // Get product title from first line item and parse race name
  const firstItem = lineItems[0]
  result.rawProductTitle = firstItem.title || null
  result.raceName = parseRaceName(result.rawProductTitle)

  // Extract properties from line items
  for (const item of lineItems) {
    if (!item.properties || !Array.isArray(item.properties)) {
      continue
    }

    for (const prop of item.properties) {
      const name = (prop.name || '').trim()
      const value = (prop.value || '').trim()

      // Standardized property name: "Runner Name" (works for both normal and custom orders)
      // Matches: "Runner Name (First & Last)", "runner name", "runner_name", "Runner Name"
      if (name === 'Runner Name (First & Last)' ||
          name === 'Runner Name' ||
          name === 'runner name' ||
          name === 'runner_name') {
        result.rawRunnerName = value
        // Clean the runner name (remove "no time" if present)
        const cleaned = cleanRunnerName(value)
        result.runnerName = cleaned.cleaned
        result.hadNoTime = cleaned.hadNoTime
      }
      else if (name === 'Race Year' || name === 'race year' || name === 'race_year') {
        result.rawRaceYear = value
        // Parse year as integer
        const yearInt = parseInt(value, 10)
        result.raceYear = isNaN(yearInt) ? null : yearInt
      }
      else if (name === 'Race Name' || name === 'race name' || name === 'race_name') {
        result.rawRaceName = value
        // Override product title race name if provided
        if (value) {
          result.raceName = value
        }
      }
    }
  }

  // Flag if missing critical data
  if (!result.runnerName || !result.raceYear) {
    result.needsAttention = true
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
 * Clean runner name by removing invalid entries like "no time"
 * Returns { cleaned, hadNoTime }
 * e.g., "Jennifer Samp no time" → { cleaned: "Jennifer Samp", hadNoTime: true }
 * e.g., "no time" → { cleaned: null, hadNoTime: true }
 * e.g., "Jennifer Samp" → { cleaned: "Jennifer Samp", hadNoTime: false }
 */
function cleanRunnerName(runnerName) {
  if (!runnerName) return { cleaned: null, hadNoTime: false }

  let cleaned = runnerName.trim()

  // Check if "no time" is present (case-insensitive)
  const hadNoTime = /\bno\s+time\b/i.test(cleaned)

  // Remove "no time" (case-insensitive)
  cleaned = cleaned.replace(/\bno\s+time\b/gi, '')

  // Clean up multiple spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim()

  // If nothing left after cleaning, return null
  if (!cleaned || cleaned.length === 0) {
    return { cleaned: null, hadNoTime }
  }

  return { cleaned, hadNoTime }
}

/**
 * DEPRECATED: No longer needed with new Shopify format
 * Keeping for reference in case old orders need reprocessing
 *
 * OLD FORMAT: Parse runner name and year from combined string
 * e.g., "Jennifer Samp 2023" → { runnerName: "Jennifer Samp", raceYear: 2023 }
 */
function parseRunnerNameAndYear_DEPRECATED(rawValue) {
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
  const yearMatch = trimmed.match(/\s+(20\d{2})$/)

  if (yearMatch) {
    result.raceYear = parseInt(yearMatch[1], 10)
    result.runnerName = trimmed.slice(0, -yearMatch[0].length).trim()
  } else {
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
