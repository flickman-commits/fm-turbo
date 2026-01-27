/**
 * ResearchService - Two-Tier Caching for Race Data
 *
 * Tier 1: Race-level data (cached once per race/year)
 *   - Race date, location, weather, event types
 *   - Stored in Race table
 *
 * Tier 2: Runner-level data (cached per runner)
 *   - Bib number, finish time, pace
 *   - Stored in RunnerResearch table
 */
import { PrismaClient } from '@prisma/client'
import { getScraperForRace, hasScraperForRace } from '../scrapers/index.js'

const prisma = new PrismaClient()

export class ResearchService {

  /**
   * Main entry point - research an order
   * Handles both race-level and runner-level data fetching with caching
   * @param {string} orderNumber
   * @returns {Promise<Object>} Combined race and runner research results
   */
  async researchOrder(orderNumber) {
    const order = await prisma.order.findUnique({
      where: { orderNumber }
    })

    if (!order) {
      throw new Error(`Order not found: ${orderNumber}`)
    }

    if (!hasScraperForRace(order.raceName)) {
      throw new Error(`No scraper available for race: ${order.raceName}`)
    }

    if (!order.runnerName) {
      throw new Error('Order is missing runner name')
    }

    if (!order.raceYear) {
      throw new Error('Order is missing race year')
    }

    console.log(`[ResearchService] Starting research for order ${orderNumber}`)
    console.log(`[ResearchService] Race: ${order.raceName} ${order.raceYear}, Runner: ${order.runnerName}`)

    // TIER 1: Get or fetch race-level data
    const race = await this.getOrFetchRaceData(order.raceName, order.raceYear)

    // TIER 2: Get or fetch runner-level data
    const runnerResearch = await this.getOrFetchRunnerData(order, race)

    return {
      race,
      runnerResearch,
      order
    }
  }

  /**
   * TIER 1: Get race-level data from cache or fetch from scraper
   * @param {string} raceName
   * @param {number} year
   * @returns {Promise<Object>} Race record
   */
  async getOrFetchRaceData(raceName, year) {
    // Check cache first
    let race = await prisma.race.findUnique({
      where: {
        raceName_year: { raceName, year }
      }
    })

    // If we have complete race data, return it
    if (race && race.raceDate && race.location) {
      console.log(`[ResearchService] Race data found in cache: ${raceName} ${year}`)
      return race
    }

    // Fetch from scraper
    console.log(`[ResearchService] Fetching race data for: ${raceName} ${year}`)
    const scraper = getScraperForRace(raceName, year)
    const raceInfo = await scraper.getRaceInfo()

    // Prepare race data
    const raceData = {
      raceName,
      year,
      raceDate: raceInfo.raceDate || new Date(`${year}-01-01`),
      location: raceInfo.location || null,
      eventTypes: raceInfo.eventTypes || ['Marathon'],
      resultsUrl: raceInfo.resultsUrl || null,
      resultsSiteType: raceInfo.resultsSiteType || null,
    }

    if (race) {
      // Update existing race with new data
      race = await prisma.race.update({
        where: { id: race.id },
        data: raceData
      })
      console.log(`[ResearchService] Updated race record: ${race.id}`)
    } else {
      // Create new race record
      race = await prisma.race.create({
        data: raceData
      })
      console.log(`[ResearchService] Created race record: ${race.id}`)
    }

    return race
  }

  /**
   * Fetch weather data for a race (if not already fetched)
   * Uses historical weather API based on race date and location
   * @param {number} raceId
   * @returns {Promise<Object>} Updated race with weather
   */
  async fetchWeatherForRace(raceId) {
    const race = await prisma.race.findUnique({
      where: { id: raceId }
    })

    if (!race) {
      throw new Error(`Race not found: ${raceId}`)
    }

    // Skip if weather already fetched
    if (race.weatherFetchedAt) {
      console.log(`[ResearchService] Weather already cached for race ${raceId}`)
      return race
    }

    // Skip if we don't have date/location
    if (!race.raceDate || !race.location) {
      console.log(`[ResearchService] Cannot fetch weather - missing date or location`)
      return race
    }

    console.log(`[ResearchService] Fetching weather for ${race.raceName} ${race.year}`)

    try {
      const weather = await this.getHistoricalWeather(race.raceDate, race.location)

      return await prisma.race.update({
        where: { id: raceId },
        data: {
          weatherTemp: weather.temp,
          weatherCondition: weather.condition,
          weatherFetchedAt: new Date()
        }
      })
    } catch (error) {
      console.error(`[ResearchService] Weather fetch failed:`, error.message)
      return race
    }
  }

  /**
   * Get historical weather for a date and location
   * TODO: Integrate with weather API (Open-Meteo, Visual Crossing, etc.)
   * @param {Date} date
   * @param {string} location
   * @returns {Promise<Object>} { temp, condition }
   */
  async getHistoricalWeather(date, location) {
    // Placeholder - implement with real weather API
    // For now, return null values so we know weather needs manual entry
    console.log(`[ResearchService] Weather API not yet implemented`)
    return {
      temp: null,
      condition: null
    }
  }

  /**
   * TIER 2: Get runner data from cache or fetch from scraper
   * @param {Object} order - Order with runnerName, raceName, raceYear
   * @param {Object} race - Race record
   * @returns {Promise<Object>} RunnerResearch record
   */
  async getOrFetchRunnerData(order, race) {
    // Check cache first
    let existingResearch = await prisma.runnerResearch.findFirst({
      where: {
        orderNumber: order.orderNumber,
        raceId: race.id
      }
    })

    // If we already found the runner, return cached data
    if (existingResearch && existingResearch.researchStatus === 'found') {
      console.log(`[ResearchService] Runner data found in cache for order ${order.orderNumber}`)
      return existingResearch
    }

    // Fetch from scraper
    console.log(`[ResearchService] Searching for runner: ${order.runnerName}`)
    const scraper = getScraperForRace(order.raceName, order.raceYear)
    const results = await scraper.searchRunner(order.runnerName)

    // Prepare research data
    const researchData = {
      orderNumber: order.orderNumber,
      raceId: race.id,
      runnerName: order.runnerName,
      bibNumber: results.bibNumber,
      officialTime: results.officialTime,
      officialPace: results.officialPace,
      eventType: results.eventType,
      yearFound: results.yearFound,
      researchStatus: results.found ? 'found' : (results.ambiguous ? 'ambiguous' : 'not_found'),
      researchNotes: results.researchNotes
    }

    let research
    if (existingResearch) {
      // Update existing research
      research = await prisma.runnerResearch.update({
        where: { id: existingResearch.id },
        data: researchData
      })
      console.log(`[ResearchService] Updated runner research: ${research.id}`)
    } else {
      // Create new research record
      research = await prisma.runnerResearch.create({
        data: researchData
      })
      console.log(`[ResearchService] Created runner research: ${research.id}`)
    }

    // Update order status if found
    if (results.found) {
      await prisma.order.update({
        where: { orderNumber: order.orderNumber },
        data: {
          status: 'ready',
          researchedAt: new Date()
        }
      })
    }

    return {
      ...research,
      found: results.found,
      ambiguous: results.ambiguous || false,
      rawData: results.rawData
    }
  }

  /**
   * Batch research multiple orders for the same race
   * Efficient because race data is fetched only once
   * @param {string[]} orderNumbers
   * @returns {Promise<Object[]>} Results for each order
   */
  async researchBatch(orderNumbers) {
    const results = []
    const raceCache = new Map() // raceName_year -> race record

    for (const orderNumber of orderNumbers) {
      try {
        const order = await prisma.order.findUnique({
          where: { orderNumber }
        })

        if (!order) {
          results.push({ orderNumber, error: 'Order not found' })
          continue
        }

        const cacheKey = `${order.raceName}_${order.raceYear}`

        // Get race from cache or fetch
        let race = raceCache.get(cacheKey)
        if (!race) {
          race = await this.getOrFetchRaceData(order.raceName, order.raceYear)
          raceCache.set(cacheKey, race)
        }

        // Get runner data
        const runnerResearch = await this.getOrFetchRunnerData(order, race)

        results.push({
          orderNumber,
          success: true,
          race,
          runnerResearch
        })

      } catch (error) {
        results.push({
          orderNumber,
          error: error.message
        })
      }
    }

    return results
  }

  /**
   * Check if race data is cached
   */
  async hasRaceData(raceName, year) {
    const race = await prisma.race.findUnique({
      where: {
        raceName_year: { raceName, year }
      }
    })
    return race && race.raceDate && race.location
  }

  /**
   * Check if runner data is cached
   */
  async hasRunnerData(orderNumber, raceId) {
    const research = await prisma.runnerResearch.findFirst({
      where: { orderNumber, raceId, researchStatus: 'found' }
    })
    return !!research
  }

  /**
   * Cleanup - disconnect from database
   */
  async disconnect() {
    await prisma.$disconnect()
  }
}

// Export singleton instance
export const researchService = new ResearchService()

export default ResearchService
