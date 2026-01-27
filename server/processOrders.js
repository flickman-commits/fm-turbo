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
 * Parse runner name and year from Shopify personalization field
 * Format expected: "Runner Name 2024"
 */
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

        // If order exists but is missing Shopify data, update it
        if (existing) {
          if (isShopify && !existing.shopifyOrderData) {
            log(`[processOrders] Updating order ${order.orderId} with Shopify data...`)
            const shopifyData = await fetchShopifyOrderData(order.orderId)

            if (shopifyData) {
              const updateData = {
                raceName: shopifyData.raceName || existing.raceName,
                runnerName: shopifyData.runnerName || existing.runnerName,
                raceYear: shopifyData.raceYear || existing.raceYear,
                shopifyOrderData: shopifyData.shopifyOrderData,
                notes: shopifyData.notes || existing.notes
              }

              if (shopifyData.needsAttention && existing.status === 'pending') {
                updateData.status = 'missing_year'
                results.needsAttention++
              }

              await prisma.order.update({
                where: { orderNumber: order.orderId },
                data: updateData
              })

              results.updated++
              results.enriched++
              orderResult.action = 'updated'
              orderResult.raceName = updateData.raceName
              orderResult.runnerName = updateData.runnerName
            }
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

          if (isShopify) {
            log(`[processOrders] Fetching Shopify data for new order ${order.orderId}...`)
            const shopifyData = await fetchShopifyOrderData(order.orderId)

            if (shopifyData) {
              raceName = shopifyData.raceName || raceName
              runnerName = shopifyData.runnerName || runnerName
              raceYear = shopifyData.raceYear || raceYear
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
