/**
 * POST /api/orders/refresh-shopify-data
 *
 * Re-fetches Shopify data for all existing orders in the database
 * Useful for updating orders when extraction logic changes
 */

import { PrismaClient } from '@prisma/client'
import fetch from 'node-fetch'

const prisma = new PrismaClient()

// Shopify OAuth configuration
const SHOPIFY_SHOP_URL = process.env.SHOPIFY_SHOP_URL
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN

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
    console.log('[API /orders/refresh-shopify-data] Starting refresh...')

    // Get all orders from database
    const orders = await prisma.order.findMany({
      where: {
        source: 'shopify'
      },
      select: {
        orderNumber: true
      }
    })

    console.log(`[Refresh] Found ${orders.length} Shopify orders to refresh`)

    const results = {
      total: orders.length,
      updated: 0,
      failed: 0,
      errors: []
    }

    // Re-fetch Shopify data for each order
    for (const order of orders) {
      try {
        const orderNumber = order.orderNumber

        // Fetch from Shopify
        const shopifyUrl = `https://${SHOPIFY_SHOP_URL}/admin/api/2024-01/orders/${orderNumber}.json`
        const response = await fetch(shopifyUrl, {
          headers: {
            'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          console.log(`[Refresh] Order ${orderNumber}: Shopify API error ${response.status}`)
          results.failed++
          results.errors.push({ orderNumber, error: `Shopify API ${response.status}` })
          continue
        }

        const data = await response.json()
        const shopifyOrder = data.order

        if (!shopifyOrder) {
          results.failed++
          results.errors.push({ orderNumber, error: 'No order data returned' })
          continue
        }

        // Extract Shopify personalization data
        const parsed = extractShopifyData(shopifyOrder.line_items || [])

        // Update database
        await prisma.order.update({
          where: { orderNumber: String(orderNumber) },
          data: {
            raceName: parsed.raceName,
            runnerName: parsed.runnerName,
            raceYear: parsed.raceYear,
            shopifyOrderData: shopifyOrder,
            hadNoTime: parsed.hadNoTime,
            status: parsed.needsAttention ? 'missing_year' : 'pending'
          }
        })

        results.updated++
        console.log(`[Refresh] Updated order ${orderNumber}: ${parsed.runnerName} - ${parsed.raceName} (${parsed.raceYear})`)

      } catch (error) {
        console.error(`[Refresh] Error processing order ${order.orderNumber}:`, error.message)
        results.failed++
        results.errors.push({ orderNumber: order.orderNumber, error: error.message })
      }
    }

    console.log(`[Refresh] Complete: ${results.updated} updated, ${results.failed} failed`)

    return res.status(200).json({
      success: true,
      ...results
    })

  } catch (error) {
    console.error('[API /orders/refresh-shopify-data] Error:', error)
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * Extract personalization data from Shopify line items
 */
function extractShopifyData(lineItems) {
  const result = {
    raceName: null,
    runnerName: null,
    raceYear: null,
    needsAttention: false,
    hadNoTime: false,
    rawProductTitle: null,
    rawRunnerName: null,
    rawRaceYear: null,
    rawRaceName: null
  }

  if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
    return result
  }

  // Get product title (fallback for race name)
  if (lineItems[0]?.title) {
    result.rawProductTitle = lineItems[0].title
    result.raceName = lineItems[0].title
  }

  // Extract from line item properties
  for (const item of lineItems) {
    const properties = item.properties || []

    for (const prop of properties) {
      const name = prop.name
      const value = prop.value

      // Runner name
      if (name === 'Runner Name (First & Last)' ||
          name === 'Runner Name' ||
          name === 'runner name' ||
          name === 'runner_name') {
        result.rawRunnerName = value
        const cleaned = cleanRunnerName(value)
        result.runnerName = cleaned.cleaned
        result.hadNoTime = cleaned.hadNoTime
      }
      // Race year
      else if (name === 'Race Year' || name === 'race year' || name === 'race_year') {
        result.rawRaceYear = value
        const yearInt = parseInt(value, 10)
        result.raceYear = isNaN(yearInt) ? null : yearInt
      }
      // Race name (override product title if provided)
      else if (name === 'Race Name' || name === 'race name' || name === 'race_name') {
        result.rawRaceName = value
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
 * Clean runner name - remove "no time" variations
 */
function cleanRunnerName(rawName) {
  if (!rawName) {
    return { cleaned: null, hadNoTime: false }
  }

  const trimmed = rawName.trim()

  // Check for "no time" variations (case insensitive)
  const noTimePattern = /\bno\s*time\b/i
  const hadNoTime = noTimePattern.test(trimmed)

  // Remove "no time" and extra whitespace
  const cleaned = trimmed
    .replace(noTimePattern, '')
    .replace(/\s+/g, ' ')
    .trim()

  return {
    cleaned: cleaned || null,
    hadNoTime
  }
}
