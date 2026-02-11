/**
 * processOrders.js - Core order processing logic
 *
 * This is the shared function that handles:
 * 1. Fetching orders from Artelo API
 * 2. Enriching with Shopify personalization data
 * 3. Saving/updating orders in the database
 * 4. Optionally running research for supported races
 *
 * Can be called from:
 * - API endpoint (manual "Import Now" button)
 * - Scheduled cron job (future)
 * - CLI scripts for testing
 */

import { PrismaClient } from '@prisma/client'
import { shopifyFetch } from '../api/utils/shopifyAuth.js'
import { researchService } from './services/ResearchService.js'
import { hasScraperForRace } from './scrapers/index.js'

// Artelo API configuration
const ARTELO_API_URL = 'https://www.artelo.io/api/open/orders/get'
const ARTELO_API_KEY = process.env.ARTELO_API_KEY

// Statuses that need design work
const ACTIONABLE_STATUSES = ['PendingFulfillmentAction', 'AwaitingPayment']

/**
 * Determine if an order is from Shopify or Etsy
 * Logic:
 * - channelName = "Online Store" → Shopify
 * - channelName contains "etsy" → Etsy
 * - channelName missing + order ID 13+ digits → Shopify
 * - channelName missing + order ID shorter → Etsy
 */
function determineOrderSource(order) {
  const channelName = order.channelName?.toLowerCase() || ''
  const orderId = order.orderId || ''

  // Explicit channel indicators
  if (channelName === 'online store') {
    return 'shopify'
  }
  if (channelName.includes('etsy')) {
    return 'etsy'
  }

  // Fallback to order ID length
  // Shopify order IDs are 13+ digits, Etsy are typically 10 digits
  if (orderId.length >= 13 && /^\d+$/.test(orderId)) {
    return 'shopify'
  }

  // Default to Etsy for shorter/different format IDs
  return 'etsy'
}

/**
 * Parse race name from Shopify product title
 */
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
 * DEPRECATED: Old format parsing (kept for reference)
 * Parse runner name and year from combined string
 * OLD Format: "Runner Name 2024"
 */
function parseRunnerNameAndYear_DEPRECATED(rawValue) {
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

/**
 * Extract personalization data from Shopify line items
 * NEW FORMAT (as of 2025): Separate properties for each field
 */
function extractShopifyPersonalization(lineItems) {
  const result = {
    raceName: null,
    runnerName: null,
    raceYear: null,
    hadNoTime: false,  // Flag to indicate "no time" was present
    needsAttention: false
  }

  if (!lineItems || lineItems.length === 0) {
    result.needsAttention = true
    return result
  }

  const item = lineItems[0]

  // Parse race name from product title
  result.raceName = parseRaceName(item.title)

  // Extract from properties
  if (item.properties && Array.isArray(item.properties)) {
    for (const prop of item.properties) {
      const name = (prop.name || '').trim()
      const value = (prop.value || '').trim()

      // Standardized property name: "Runner Name" (works for both normal and custom orders)
      // Matches: "Runner Name (First & Last)", "Runner Name", "runner name", "runner_name"
      if (name === 'Runner Name (First & Last)' ||
          name === 'Runner Name' ||
          name === 'runner name' ||
          name === 'runner_name') {
        // Clean the runner name (remove "no time" if present)
        const cleaned = cleanRunnerName(value)
        result.runnerName = cleaned.cleaned
        result.hadNoTime = cleaned.hadNoTime
      }
      // Race year
      else if (name === 'Race Year' || name === 'race year' || name === 'race_year') {
        const yearInt = parseInt(value, 10)
        result.raceYear = isNaN(yearInt) ? null : yearInt
      }
      // Race name (override product title if provided)
      else if (name === 'Race Name' || name === 'race name' || name === 'race_name') {
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
 * Fetch Shopify order data including personalization
 */
async function fetchShopifyOrderData(shopifyOrderId) {
  try {
    const data = await shopifyFetch(`/orders/${shopifyOrderId}.json`)
    const order = data.order

    if (!order || !order.line_items?.length) {
      return null
    }

    // Extract personalization using new format
    const extracted = extractShopifyPersonalization(order.line_items)

    // Fetch timeline comments (internal notes)
    const comments = await fetchShopifyComments(shopifyOrderId)

    return {
      raceName: extracted.raceName,
      runnerName: extracted.runnerName,
      raceYear: extracted.raceYear,
      needsAttention: extracted.needsAttention,
      notes: comments,
      shopifyOrderData: order
    }
  } catch (error) {
    console.error(`[processOrders] Failed to fetch Shopify data for order ${shopifyOrderId}:`, error.message)
    return null
  }
}

/**
 * Fetch Shopify order comments/notes
 */
async function fetchShopifyComments(shopifyOrderId) {
  try {
    const data = await shopifyFetch(`/orders/${shopifyOrderId}/events.json`)
    const events = data.events || []

    const comments = events
      .filter(e => e.verb === 'comment' && e.body)
      .map(e => ({
        body: e.body,
        author: e.author,
        createdAt: e.created_at
      }))

    if (comments.length === 0) return null

    return comments.map(c => c.body).join(' | ')
  } catch (error) {
    console.error(`[processOrders] Failed to fetch comments for order ${shopifyOrderId}:`, error.message)
    return null
  }
}

/**
 * Main order processing function
 *
 * @param {Object} options - Processing options
 * @param {boolean} options.runResearch - Whether to run research for supported races (default: false)
 * @param {boolean} options.verbose - Whether to log detailed output (default: true)
 * @param {PrismaClient} options.prisma - Optional existing Prisma client
 * @returns {Promise<Object>} Processing results
 */
export async function processOrders(options = {}) {
  const {
    runResearch = false,
    verbose = true,
    prisma: externalPrisma = null
  } = options

  const prisma = externalPrisma || new PrismaClient()
  const shouldDisconnect = !externalPrisma

  const log = verbose ? console.log.bind(console) : () => {}

  const results = {
    success: true,
    imported: 0,
    updated: 0,
    skipped: 0,
    enriched: 0,
    needsAttention: 0,
    researched: 0,
    researchFailed: 0,
    total: 0,
    errors: [],
    orders: []  // Details of processed orders
  }

  try {
    // 1. Fetch orders from Artelo
    log('\n[processOrders] Fetching orders from Artelo...')

    if (!ARTELO_API_KEY) {
      throw new Error('ARTELO_API_KEY not configured')
    }

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

    results.total = actionableOrders.length
    log(`[processOrders] Found ${actionableOrders.length} actionable orders`)

    // 2. Process each order
    for (const order of actionableOrders) {
      const orderResult = {
        orderNumber: order.orderId,
        action: null,
        raceName: null,
        runnerName: null,
        researchStatus: null
      }

      try {
        // Check if exists
        const existing = await prisma.order.findUnique({
          where: { orderNumber: order.orderId }
        })

        const orderSource = determineOrderSource(order)
        const isShopify = orderSource === 'shopify'

        // If order exists, check for updates
        if (existing) {
          let needsUpdate = false
          const updateData = {}

          // Check if order has been fulfilled (status changed from actionable to non-actionable)
          const wasActionable = existing.status !== 'completed'
          const isNowFulfilled = !ACTIONABLE_STATUSES.includes(order.status)

          if (wasActionable && isNowFulfilled) {
            updateData.status = 'completed'
            updateData.researchedAt = new Date()
            needsUpdate = true
            log(`[processOrders] Marking order ${order.orderId} as completed (fulfilled in Artelo)`)
          }

          // If missing Shopify data, fetch and update
          if (isShopify && !existing.shopifyOrderData) {
            log(`[processOrders] Updating order ${order.orderId} with Shopify data...`)
            const shopifyData = await fetchShopifyOrderData(order.orderId)

            if (shopifyData) {
              updateData.raceName = shopifyData.raceName || existing.raceName
              updateData.runnerName = shopifyData.runnerName || existing.runnerName
              updateData.raceYear = shopifyData.raceYear || existing.raceYear
              updateData.hadNoTime = shopifyData.hadNoTime || false
              updateData.shopifyOrderData = shopifyData.shopifyOrderData
              updateData.notes = shopifyData.notes || existing.notes

              if (shopifyData.needsAttention && existing.status === 'pending') {
                updateData.status = 'missing_year'
                results.needsAttention++
              }

              needsUpdate = true
              results.enriched++
            }
          }

          if (needsUpdate) {
            await prisma.order.update({
              where: { orderNumber: order.orderId },
              data: updateData
            })

            results.updated++
            orderResult.action = 'updated'
            orderResult.raceName = updateData.raceName || existing.raceName
            orderResult.runnerName = updateData.runnerName || existing.runnerName
          } else {
            results.skipped++
            orderResult.action = 'skipped'
            orderResult.raceName = existing.raceName
            orderResult.runnerName = existing.runnerName
          }
        } else {
          // Create new order
          const firstItem = order.orderItems?.[0]
          const rawSize = firstItem?.product?.size || 'Unknown'
          const productSize = rawSize.startsWith('x') ? rawSize.slice(1) : rawSize

          let raceName = 'Unknown Race'
          let raceYear = new Date().getFullYear()
          let runnerName = order.customerAddress?.name || 'Unknown Runner'
          let status = 'pending'
          let shopifyOrderData = null
          let notes = null
          let hadNoTime = false

          if (isShopify) {
            log(`[processOrders] Fetching Shopify data for new order ${order.orderId}...`)
            const shopifyData = await fetchShopifyOrderData(order.orderId)

            if (shopifyData) {
              raceName = shopifyData.raceName || raceName
              runnerName = shopifyData.runnerName || runnerName
              raceYear = shopifyData.raceYear || raceYear
              hadNoTime = shopifyData.hadNoTime || false
              shopifyOrderData = shopifyData.shopifyOrderData
              notes = shopifyData.notes

              if (shopifyData.needsAttention) {
                status = 'missing_year'
                results.needsAttention++
              }
              results.enriched++
            }
          }

          await prisma.order.create({
            data: {
              orderNumber: order.orderId,
              source: orderSource,
              arteloOrderData: order,
              shopifyOrderData,
              raceName,
              raceYear,
              runnerName,
              hadNoTime,  // Include "no time" flag
              productSize,
              frameType: firstItem?.product?.frameColor || 'Unknown',
              notes,
              status
            }
          })

          results.imported++
          orderResult.action = 'imported'
          orderResult.raceName = raceName
          orderResult.runnerName = runnerName

          log(`[processOrders] ✅ Imported: ${order.orderId} (${orderSource}) - ${raceName} - ${runnerName}`)
        }

        // 3. Run research if enabled and we have a scraper for this race
        if (runResearch && orderResult.action !== 'skipped') {
          const dbOrder = await prisma.order.findUnique({
            where: { orderNumber: order.orderId }
          })

          if (dbOrder && hasScraperForRace(dbOrder.raceName)) {
            log(`[processOrders] Running research for ${order.orderId}...`)
            try {
              const research = await researchService.researchOrder(order.orderId)
              if (research.runnerResearch.researchStatus === 'found') {
                results.researched++
                orderResult.researchStatus = 'found'
                log(`[processOrders] ✅ Research found: ${research.runnerResearch.bibNumber}`)
              } else {
                orderResult.researchStatus = research.runnerResearch.researchStatus
              }
            } catch (researchError) {
              results.researchFailed++
              orderResult.researchStatus = 'error'
              log(`[processOrders] ❌ Research failed: ${researchError.message}`)
            }
          }
        }

        results.orders.push(orderResult)

      } catch (orderError) {
        results.errors.push({
          orderNumber: order.orderId,
          error: orderError.message
        })
        log(`[processOrders] ❌ Error processing ${order.orderId}: ${orderError.message}`)
      }
    }

    // 4. Summary
    log('\n[processOrders] === SUMMARY ===')
    log(`  Total orders: ${results.total}`)
    log(`  Imported: ${results.imported}`)
    log(`  Updated: ${results.updated}`)
    log(`  Skipped: ${results.skipped}`)
    log(`  Enriched with Shopify: ${results.enriched}`)
    log(`  Needs attention: ${results.needsAttention}`)
    if (runResearch) {
      log(`  Researched: ${results.researched}`)
      log(`  Research failed: ${results.researchFailed}`)
    }
    if (results.errors.length > 0) {
      log(`  Errors: ${results.errors.length}`)
    }

    return results

  } catch (error) {
    results.success = false
    results.errors.push({ error: error.message })
    console.error('[processOrders] Fatal error:', error)
    throw error
  } finally {
    if (shouldDisconnect) {
      await prisma.$disconnect()
    }
    // Also disconnect research service if we used it
    if (runResearch) {
      await researchService.disconnect()
    }
  }
}

export default processOrders
