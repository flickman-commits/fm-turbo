import type { VercelRequest, VercelResponse } from '@vercel/node'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

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
  } finally {
    await prisma.$disconnect()
  }
}
