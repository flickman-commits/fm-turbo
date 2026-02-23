/**
 * POST /api/orders/complete
 *
 * Mark an order as completed (fulfillment design work done)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
    const { orderNumber } = req.body

    if (!orderNumber) {
      return res.status(400).json({ error: 'orderNumber is required' })
    }

    // Update order status to completed
    const order = await prisma.order.update({
      where: { orderNumber },
      data: {
        status: 'completed',
        researchedAt: new Date()  // Mark when it was completed
      }
    })

    console.log(`[API /orders/complete] Order ${orderNumber} marked as completed`)

    return res.status(200).json({
      success: true,
      order
    })

  } catch (error) {
    console.error('[API /orders/complete] Error:', error)

    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found' })
    }

    return res.status(500).json({
      error: error.message
    })
  } finally {
    await prisma.$disconnect()
  }
}
