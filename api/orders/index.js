import { PrismaClient } from '@prisma/client'
import { hasScraperForRace } from '../../server/scrapers/index.js'

const prisma = new PrismaClient()

/**
 * Format date as MM.DD.YY (e.g., "12.02.18")
 */
function formatRaceDate(date) {
  if (!date) return null
  const d = new Date(date)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const year = String(d.getFullYear()).slice(-2)
  return `${month}.${day}.${year}`
}

/**
 * Format temperature with degree symbol (e.g., "39°")
 */
function formatTemp(temp) {
  if (!temp) return null
  // If already has degree symbol, return as is
  if (temp.includes('°')) return temp
  // Add degree symbol
  return `${temp}°`
}

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
        // Race data (Tier 1) - formatted for direct copy to Illustrator
        raceDate: formatRaceDate(race?.raceDate),
        raceLocation: race?.location || null,
        weatherTemp: formatTemp(race?.weatherTemp),
        weatherCondition: race?.weatherCondition ?
          race.weatherCondition.charAt(0).toUpperCase() + race.weatherCondition.slice(1) : null,
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
