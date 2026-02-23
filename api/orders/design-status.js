/**
 * POST /api/orders/design-status
 *
 * Update the design status of a custom order.
 * Valid statuses: "not_started", "concepts_done", "in_revision", "approved_by_customer", "sent_to_production", "sent_to_customer"
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const VALID_DESIGN_STATUSES = ['not_started', 'concepts_done', 'in_revision', 'approved_by_customer', 'sent_to_production']

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
    const { orderNumber, designStatus } = req.body

    if (!orderNumber) {
      return res.status(400).json({ error: 'orderNumber is required' })
    }

    if (!designStatus || !VALID_DESIGN_STATUSES.includes(designStatus)) {
      return res.status(400).json({
        error: `Invalid designStatus. Must be one of: ${VALID_DESIGN_STATUSES.join(', ')}`
      })
    }

    // Verify the order exists and is a custom order
    const existing = await prisma.order.findFirst({
      where: { orderNumber }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Order not found' })
    }

    if (existing.trackstarOrderType !== 'custom') {
      return res.status(400).json({ error: 'Design status can only be updated for custom orders' })
    }

    // Update design status (use id for unique lookup)
    const updateData = { designStatus }

    // If marking as "sent_to_production", also mark the overall order status as completed
    if (designStatus === 'sent_to_production') {
      updateData.status = 'completed'
      updateData.researchedAt = new Date()
    }

    // If moving back from "sent_to_production", revert the overall order status to pending
    if (existing.designStatus === 'sent_to_production' && designStatus !== 'sent_to_production') {
      updateData.status = 'pending'
      updateData.researchedAt = null
    }

    const order = await prisma.order.update({
      where: { id: existing.id },
      data: updateData
    })

    console.log(`[API /orders/design-status] Order ${orderNumber} design status → ${designStatus}`)

    return res.status(200).json({
      success: true,
      order
    })

  } catch (error) {
    console.error('[API /orders/design-status] Error:', error)

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
