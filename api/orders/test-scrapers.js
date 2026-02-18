/**
 * API endpoint to test all scrapers and return their status.
 * GET  → returns list of supported races (for UI init)
 * POST → tests each scraper by calling getRaceInfo() and returns pass/fail per race
 */
import { getSupportedRaces, getScraperForRace } from '../../server/scrapers/index.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const races = getSupportedRaces()

  // GET → just return the list of supported races
  if (req.method === 'GET') {
    return res.status(200).json({ races })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // POST → test each scraper
  const currentYear = new Date().getFullYear()
  const results = []

  for (const raceName of races) {
    const startTime = Date.now()
    try {
      const scraper = getScraperForRace(raceName, currentYear)
      const raceInfo = await scraper.getRaceInfo()
      results.push({
        raceName,
        status: 'pass',
        durationMs: Date.now() - startTime,
        raceDate: raceInfo.raceDate,
        location: raceInfo.location,
      })
    } catch (error) {
      results.push({
        raceName,
        status: 'fail',
        durationMs: Date.now() - startTime,
        error: error.message,
      })
    }
  }

  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length

  return res.status(200).json({ success: true, tested: results.length, passed, failed, results })
}
