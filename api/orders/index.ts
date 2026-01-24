import type { VercelRequest, VercelResponse } from '@vercel/node'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const orders = await prisma.order.findMany({
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' }
      ]
    })
    return res.status(200).json({ orders })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch orders',
      details: error instanceof Error ? error.stack : undefined
    })
  } finally {
    await prisma.$disconnect()
  }
}
