/**
 * Clear race-level cached data (date, location, resultsUrl) so it gets
 * re-fetched from the scraper on the next research run.
 * Does NOT clear weather or runner research.
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
    // Clear resultsUrl and location so ResearchService re-fetches on next research.
    // raceDate is required (non-nullable) so we reset it to a placeholder rather than null.
    // The scraper will overwrite it with the correct value on next research.
    const { count } = await prisma.race.updateMany({
      data: {
        resultsUrl: null,
        resultsSiteType: null,
        location: null,
      }
    })

    console.log(`[clear-race-cache] Cleared race info cache for ${count} races`)
    return res.status(200).json({ success: true, cleared: count })

  } catch (error) {
    console.error('[clear-race-cache] Error:', error)
    return res.status(500).json({ error: error.message })
  } finally {
    await prisma.$disconnect()
  }
}
