/**
 * Clear all runner research records, forcing re-research on next lookup.
 * Useful after scraper fixes where cached data may be stale/wrong.
 * Optionally scope to a specific race name.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    let body = {}
    if (req.body) {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    }
    const { raceName } = body

    if (raceName) {
      // Clear research for a specific race only
      const race = await prisma.race.findFirst({ where: { raceName } })
      if (!race) return res.status(404).json({ error: `Race not found: ${raceName}` })

      const { count } = await prisma.runnerResearch.deleteMany({
        where: { raceId: race.id }
      })

      // Also reset order statuses back to pending for affected orders
      const researchOrderIds = await prisma.runnerResearch.findMany({
        where: { raceId: race.id },
        select: { orderId: true }
      })
      // (already deleted above, so reset by raceName on orders)
      await prisma.order.updateMany({
        where: {
          status: { in: ['ready', 'flagged'] },
          raceName: { contains: raceName, mode: 'insensitive' }
        },
        data: { status: 'pending' }
      })

      console.log(`[clear-research] Deleted ${count} research records for ${raceName}`)
      return res.status(200).json({ success: true, deleted: count, raceName })
    }

    // Clear ALL runner research
    const { count } = await prisma.runnerResearch.deleteMany({})

    // Reset all non-completed orders back to pending
    await prisma.order.updateMany({
      where: { status: { in: ['ready', 'flagged'] } },
      data: { status: 'pending' }
    })

    console.log(`[clear-research] Deleted ${count} research records (all races)`)
    return res.status(200).json({ success: true, deleted: count })

  } catch (error) {
    console.error('[clear-research] Error:', error)
    return res.status(500).json({ error: error.message })
  } finally {
    await prisma.$disconnect()
  }
}
