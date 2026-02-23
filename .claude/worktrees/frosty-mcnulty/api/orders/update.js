/**
 * POST /api/orders/update
 *
 * Update order override fields (manual corrections)
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
    const { orderNumber, yearOverride, raceNameOverride, runnerNameOverride } = req.body

    if (!orderNumber) {
      return res.status(400).json({ error: 'orderNumber is required' })
    }

    // Build update object - only include fields that were provided
    const updateData = {}

    // Allow setting to null (to clear override) or a new value
    if (yearOverride !== undefined) {
      updateData.yearOverride = yearOverride === null || yearOverride === '' ? null : parseInt(yearOverride, 10)
    }

    if (raceNameOverride !== undefined) {
      updateData.raceNameOverride = raceNameOverride === '' ? null : raceNameOverride
    }

    if (runnerNameOverride !== undefined) {
      updateData.runnerNameOverride = runnerNameOverride === '' ? null : runnerNameOverride
    }

    // If year was missing and we now have an override, update status
    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber }
    })

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // If order was missing_year and we're setting a year override, change status to pending
    if (existingOrder.status === 'missing_year' && updateData.yearOverride) {
      updateData.status = 'pending'
    }

    // Update the order
    const order = await prisma.order.update({
      where: { orderNumber },
      data: updateData
    })

    console.log(`[API /orders/update] Order ${orderNumber} updated with overrides:`, updateData)

    return res.status(200).json({
      success: true,
      order
    })

  } catch (error) {
    console.error('[API /orders/update] Error:', error)

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
