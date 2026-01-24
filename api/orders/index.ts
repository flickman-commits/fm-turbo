import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../lib/prisma'
import { corsHeaders } from '../lib/helpers'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader('Access-Control-Allow-Origin', '*').end()
  }

  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value)
  })

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
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch orders' })
  }
}
