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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Delete all pending orders (they'll be re-imported with correct filtering)
    const deleted = await prisma.order.deleteMany({
      where: { status: 'pending' }
    })

    console.log(`Cleanup: Deleted ${deleted.count} pending orders`)
    return res.status(200).json({
      success: true,
      deleted: deleted.count
    })
  } catch (error) {
    console.error('Error during cleanup:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to cleanup orders' })
  }
}
