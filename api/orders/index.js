import { PrismaClient } from '@prisma/client'
import { hasScraperForRace } from '../../server/scrapers/index.js'

const prisma = new PrismaClient()

// MyChipTime event IDs by race + year - used to build runner-specific search URLs
const MYCHIPTIME_EVENT_IDS = {
  'austin_2026_marathon': '17035',
  'austin_2026_halfmarathon': '17034',
}

// Build a runner-specific results URL using the exact same search the scraper does.
// Falls back to the generic event page if no runner name available.
function getResultsUrl(race, effectiveRaceName, effectiveRaceYear, runnerName) {
  if (race?.resultsUrl) return race.resultsUrl

  const nameLower = (effectiveRaceName || '').toLowerCase()

  if (nameLower.includes('austin') && nameLower.includes('marathon')) {
    const eventId = MYCHIPTIME_EVENT_IDS[`austin_${effectiveRaceYear}_marathon`]
    if (eventId) {
      if (runnerName) {
        const parts = runnerName.trim().split(/\s+/)
        const fname = encodeURIComponent(parts[0] || '')
        const lname = encodeURIComponent(parts.slice(1).join(' ') || '')
        return `https://www.mychiptime.com/searchResultGen.php?eID=${eventId}&fname=${fname}&lname=${lname}`
      }
      return `https://www.mychiptime.com/searchevent.php?id=${eventId}`
    }
  }

  return null
}

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

/**
 * Format time - removes leading zero from hours (04:14:45 -> 4:14:45)
 */
function formatTime(time) {
  if (!time) return null
  return time.replace(/^0(\d):/, '$1:')
}

/**
 * Format pace - removes leading zero and any suffix (09:43 / mi -> 9:43)
 */
function formatPace(pace) {
  if (!pace) return null
  // Remove " / mi" suffix if present (e.g. "9:43 / mi" -> "9:43")
  let cleaned = pace.replace(/\s*\/\s*mi$/i, '')
  // Remove "/M" suffix from MyChipTime (e.g. "10:04/M" -> "10:04")
  cleaned = cleaned.replace(/\/M$/i, '')
  // Remove leading zero if present (09:43 -> 9:43)
  cleaned = cleaned.replace(/^0/, '').trim()
  return cleaned
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
          },
          orderBy: { createdAt: 'desc' }  // Get most recent first
        }
      }
    })

    // Transform orders to include flattened research data
    const transformedOrders = orders.map(order => {
      // Get the best research record: prefer 'found', then most recent
      const foundResearch = order.runnerResearch?.find(r => r.researchStatus === 'found')
      const research = foundResearch || order.runnerResearch?.[0]
      const race = research?.race

      // Compute effective values (override if present, else original)
      const effectiveRaceYear = order.yearOverride ?? order.raceYear
      const effectiveRaceName = order.raceNameOverride ?? order.raceName
      const effectiveRunnerName = order.runnerNameOverride ?? order.runnerName

      // Check if any overrides are present
      const hasOverrides = order.yearOverride !== null ||
                          order.raceNameOverride !== null ||
                          order.runnerNameOverride !== null

      return {
        ...order,
        // Effective values (what to display and use for research)
        effectiveRaceYear,
        effectiveRaceName,
        effectiveRunnerName,
        hasOverrides,
        // Runner research data (Tier 2) - formatted for display
        bibNumber: research?.bibNumber || null,
        officialTime: formatTime(research?.officialTime),
        officialPace: formatPace(research?.officialPace),
        eventType: research?.eventType || null,
        researchStatus: research?.researchStatus || null,
        researchNotes: research?.researchNotes || null,
        // Race data (Tier 1) - formatted for direct copy to Illustrator
        raceDate: formatRaceDate(race?.raceDate),
        raceLocation: race?.location || null,
        resultsUrl: getResultsUrl(race, effectiveRaceName, effectiveRaceYear, research?.runnerName || effectiveRunnerName),
        weatherTemp: formatTemp(race?.weatherTemp),
        weatherCondition: race?.weatherCondition ?
          race.weatherCondition.charAt(0).toUpperCase() + race.weatherCondition.slice(1) : null,
        // Scraper availability - use effective race name
        hasScraperAvailable: hasScraperForRace(effectiveRaceName),
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
