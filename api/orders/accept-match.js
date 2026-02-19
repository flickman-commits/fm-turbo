/**
 * API endpoint to accept a suggested match for an ambiguous research result.
 * Updates the runner research record with the selected match's data
 * without changing the runner name on the order (preserves print name).
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
    const { orderNumber, match } = req.body

    if (!orderNumber || !match) {
      return res.status(400).json({ error: 'orderNumber and match are required' })
    }

    console.log(`[API] Accept match for order: ${orderNumber}`)
    console.log(`[API] Match data:`, match)

    // Find the order
    const order = await prisma.order.findFirst({
      where: { orderNumber }
    })

    if (!order) {
      return res.status(404).json({ error: `Order not found: ${orderNumber}` })
    }

    // Find the existing research record
    const research = await prisma.runnerResearch.findFirst({
      where: { orderId: order.id },
      orderBy: { createdAt: 'desc' }
    })

    if (!research) {
      return res.status(404).json({ error: 'No research record found for this order' })
    }

    // Update the research record with the accepted match data
    const updatedResearch = await prisma.runnerResearch.update({
      where: { id: research.id },
      data: {
        bibNumber: match.bib || null,
        officialTime: match.time || null,
        officialPace: match.pace || null,
        eventType: match.eventType || research.eventType || null,
        resultsUrl: match.resultsUrl || research.resultsUrl || null,
        researchStatus: 'found',
        researchNotes: `Accepted match: "${match.name}" (original search: "${order.runnerName}")`
      }
    })

    // Update order status to ready
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'ready',
        researchedAt: new Date()
      }
    })

    console.log(`[API] Match accepted for order ${orderNumber}: ${match.name}`)

    return res.status(200).json({
      success: true,
      research: updatedResearch
    })

  } catch (error) {
    console.error('[API] Error accepting match:', error)
    return res.status(500).json({
      error: error.message
    })
  }
}
