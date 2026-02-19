/**
 * API endpoint to research a runner's race results
 * Also handles accepting a suggested match (action: 'accept-match')
 *
 * Uses two-tier caching:
 *   1. Race-level data (date, location, weather) - cached once per race/year
 *   2. Runner-level data (bib, time, pace) - cached per order
 */
import { PrismaClient } from '@prisma/client'
import { researchService } from '../../server/services/ResearchService.js'
import { hasScraperForRace, getSupportedRaces } from '../../server/scrapers/index.js'

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
    const { action, orderNumber, orderNumbers, match } = req.body

    // Accept match mode — populate data from a suggested match
    if (action === 'accept-match') {
      if (!orderNumber || !match) {
        return res.status(400).json({ error: 'orderNumber and match are required' })
      }

      console.log(`[API] Accept match for order: ${orderNumber}`)
      console.log(`[API] Match data:`, match)

      const order = await prisma.order.findFirst({ where: { orderNumber } })
      if (!order) {
        return res.status(404).json({ error: `Order not found: ${orderNumber}` })
      }

      const research = await prisma.runnerResearch.findFirst({
        where: { orderId: order.id },
        orderBy: { createdAt: 'desc' }
      })
      if (!research) {
        return res.status(404).json({ error: 'No research record found for this order' })
      }

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

      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'ready', researchedAt: new Date() }
      })

      console.log(`[API] Match accepted for order ${orderNumber}: ${match.name}`)
      return res.status(200).json({ success: true, research: updatedResearch })
    }

    // Batch mode - research multiple orders
    if (orderNumbers && Array.isArray(orderNumbers)) {
      console.log(`[API] Batch research for ${orderNumbers.length} orders`)
      const results = await researchService.researchBatch(orderNumbers)
      return res.status(200).json({
        success: true,
        batchResults: results
      })
    }

    // Single order mode
    if (!orderNumber) {
      return res.status(400).json({ error: 'orderNumber is required' })
    }

    console.log(`[API] Research request for order: ${orderNumber}`)

    const { race, runnerResearch, order } = await researchService.researchOrder(orderNumber)

    // Also try to fetch weather if not already done
    const raceWithWeather = await researchService.fetchWeatherForRace(race.id)

    return res.status(200).json({
      success: true,
      found: runnerResearch.researchStatus === 'found',
      ambiguous: runnerResearch.researchStatus === 'ambiguous',
      // Race-level data (Tier 1)
      race: {
        id: raceWithWeather.id,
        raceName: raceWithWeather.raceName,
        year: raceWithWeather.year,
        raceDate: raceWithWeather.raceDate,
        location: raceWithWeather.location,
        weatherTemp: raceWithWeather.weatherTemp,
        weatherCondition: raceWithWeather.weatherCondition,
        eventTypes: raceWithWeather.eventTypes
      },
      // Runner-level data (Tier 2)
      results: {
        bibNumber: runnerResearch.bibNumber,
        officialTime: runnerResearch.officialTime,
        officialPace: runnerResearch.officialPace,
        eventType: runnerResearch.eventType,
        researchStatus: runnerResearch.researchStatus,
        researchNotes: runnerResearch.researchNotes
      },
      research: runnerResearch,
      possibleMatches: runnerResearch.possibleMatches || null
    })

  } catch (error) {
    console.error('[API] Error researching runner:', error)

    // Provide helpful error messages
    if (error.message.includes('No scraper available')) {
      return res.status(400).json({
        error: error.message,
        supportedRaces: getSupportedRaces()
      })
    }

    return res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}
