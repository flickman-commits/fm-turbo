/**
 * API endpoint to force-refresh weather for all cached races
 * Clears weatherFetchedAt so ResearchService will re-fetch using the updated method
 */
import { PrismaClient } from '@prisma/client'
import { researchService } from '../../server/services/ResearchService.js'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { raceId } = req.body

    if (raceId) {
      // Refresh a single race
      console.log(`[refresh-weather] Refreshing weather for race ${raceId}`)

      // Clear the cached weather so fetchWeatherForRace will re-fetch
      await prisma.race.update({
        where: { id: raceId },
        data: {
          weatherTemp: null,
          weatherCondition: null,
          weatherFetchedAt: null,
        }
      })

      const updated = await researchService.fetchWeatherForRace(raceId)

      return res.status(200).json({
        success: true,
        race: {
          id: updated.id,
          raceName: updated.raceName,
          year: updated.year,
          weatherTemp: updated.weatherTemp,
          weatherCondition: updated.weatherCondition,
          weatherFetchedAt: updated.weatherFetchedAt,
        }
      })
    }

    // Refresh ALL races that have weather cached
    console.log(`[refresh-weather] Refreshing weather for all cached races`)

    const races = await prisma.race.findMany({
      where: {
        weatherFetchedAt: { not: null },
        raceDate: { not: null },
        location: { not: null },
      }
    })

    console.log(`[refresh-weather] Found ${races.length} races to refresh`)

    // Clear all cached weather
    await prisma.race.updateMany({
      where: { weatherFetchedAt: { not: null } },
      data: {
        weatherTemp: null,
        weatherCondition: null,
        weatherFetchedAt: null,
      }
    })

    // Re-fetch each race
    const results = []
    for (const race of races) {
      try {
        const updated = await researchService.fetchWeatherForRace(race.id)
        results.push({
          id: updated.id,
          raceName: updated.raceName,
          year: updated.year,
          weatherTemp: updated.weatherTemp,
          weatherCondition: updated.weatherCondition,
        })
        console.log(`[refresh-weather] ✓ ${updated.raceName} ${updated.year}: ${updated.weatherTemp}, ${updated.weatherCondition}`)
      } catch (err) {
        console.error(`[refresh-weather] ✗ ${race.raceName} ${race.year}:`, err.message)
        results.push({ id: race.id, raceName: race.raceName, year: race.year, error: err.message })
      }
    }

    return res.status(200).json({ success: true, refreshed: results.length, results })

  } catch (error) {
    console.error('[refresh-weather] Error:', error)
    return res.status(500).json({ error: error.message })
  } finally {
    await prisma.$disconnect()
  }
}
