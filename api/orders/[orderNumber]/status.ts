import type { VercelRequest, VercelResponse } from '@vercel/node'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { orderNumber } = req.query
    const { status } = req.body

    if (typeof orderNumber !== 'string') {
      return res.status(400).json({ error: 'Invalid order number' })
    }

    const validStatuses = ['pending', 'ready', 'flagged', 'completed']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const order = await prisma.order.update({
      where: { orderNumber },
      data: {
        status,
        ...(status === 'completed' ? { researchedAt: new Date() } : {})
      }
    })

    return res.status(200).json({ success: true, order })
  } catch (error) {
    console.error('Error updating order:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update order' })
  } finally {
    await prisma.$disconnect()
  }
}
