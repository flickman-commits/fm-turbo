import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const orders = await prisma.order.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }]
    })

    return res.status(200).json({ orders })
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: error.message })
  } finally {
    await prisma.$disconnect()
  }
}
