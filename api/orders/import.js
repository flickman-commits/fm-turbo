import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Artelo API configuration
const ARTELO_API_URL = 'https://www.artelo.io/api/open/orders/get'
const ARTELO_API_KEY = process.env.ARTELO_API_KEY

// Statuses that need design work
const ACTIONABLE_STATUSES = ['PendingFulfillmentAction', 'AwaitingPayment']

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

    for (const order of actionableOrders) {
      // Check if exists
      const existing = await prisma.order.findUnique({
        where: { orderNumber: order.orderId }
      })

      if (existing) {
        skipped++
        continue
      }

      // Parse basic info
      const firstItem = order.orderItems?.[0]
      const rawSize = firstItem?.product?.size || 'Unknown'
      const productSize = rawSize.startsWith('x') ? rawSize.slice(1) : rawSize

      await prisma.order.create({
        data: {
          orderNumber: order.orderId,
          source: order.channelName?.toLowerCase().includes('etsy') ? 'etsy' : 'shopify',
          arteloOrderData: order,
          raceName: 'Unknown Race',
          raceYear: new Date().getFullYear(),
          runnerName: order.customerAddress?.name || 'Unknown Runner',
          productSize,
          frameType: firstItem?.product?.frameColor || 'Unknown',
          status: 'pending'
        }
      })

      imported++
    }

    // 3. Return result
    return res.status(200).json({
      success: true,
      imported,
      skipped,
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
