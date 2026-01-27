import { PrismaClient } from '@prisma/client'
import { hasScraperForRace } from '../../server/scrapers/index.js'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Fetch orders with their research data and race info
    const orders = await prisma.order.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: {
        runnerResearch: {
          include: {
            race: true  // Include race data (date, weather, etc.)
          }
        }
      }
    })

    // Transform orders to include flattened research data
    const transformedOrders = orders.map(order => {
      const research = order.runnerResearch?.[0]  // Get first research result
      const race = research?.race

      return {
        ...order,
        // Runner research data (Tier 2)
        bibNumber: research?.bibNumber || null,
        officialTime: research?.officialTime || null,
        officialPace: research?.officialPace || null,
        eventType: research?.eventType || null,
        researchStatus: research?.researchStatus || null,
        researchNotes: research?.researchNotes || null,
        // Race data (Tier 1)
        raceDate: race?.raceDate || null,
        raceLocation: race?.location || null,
        weatherTemp: race?.weatherTemp || null,
        weatherCondition: race?.weatherCondition || null,
        // Scraper availability
        hasScraperAvailable: hasScraperForRace(order.raceName),
        // Clean up - don't send nested objects to frontend
        runnerResearch: undefined
      }
    })

    return res.status(200).json({ orders: transformedOrders })
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: error.message })
  } finally {
    await prisma.$disconnect()
  }
}
