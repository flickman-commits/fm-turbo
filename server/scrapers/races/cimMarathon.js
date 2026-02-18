/**
 * California International Marathon (CIM) Results Scraper
 * Uses MyRace.ai API
 * API Base: https://myrace.ai/api
 */
import { BaseScraper } from '../BaseScraper.js'

export class CIMMarathonScraper extends BaseScraper {
  constructor(year) {
    super('California International Marathon', year)
    this.baseUrl = 'https://myrace.ai/api'
    // Race ID format: cim_YYYY (e.g., cim_2025, cim_2024)
    this.raceId = `cim_${year}`
  }

  /**
   * Get race-level information for CIM
   * This is cached at the Race level - same for all runners
   * @returns {Promise<Object>} Race info object
   */
  async getRaceInfo() {
    console.log(`[CIM ${this.year}] Fetching race info...`)

    // CIM is always the first Sunday in December
    const raceDate = this.calculateCIMDate(this.year)
    console.log(`[CIM ${this.year}] Calculated race date: ${raceDate.toDateString()}`)

    return {
      raceDate: raceDate,
      location: 'Folsom to Sacramento, CA',
      eventTypes: ['Marathon'],
      resultsUrl: `https://myrace.ai/races/${this.raceId}/results`,
      resultsSiteType: 'myrace',
    }
  }

  /**
   * CIM is always the first Sunday of December
   */
  calculateCIMDate(year) {
    const dec1 = new Date(year, 11, 1) // Month is 0-indexed, December = 11
    const dayOfWeek = dec1.getDay()
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
    const firstSunday = new Date(year, 11, 1 + daysUntilSunday)
    return firstSunday
  }

  /**
   * Search for a runner by name using MyRace.ai search API
   * @param {string} runnerName - Full name to search for
   * @returns {Promise<Object>} Standardized result object
   */
  async searchRunner(runnerName) {
    console.log(`\n${'='.repeat(50)}`)
    console.log(`[CIM ${this.year}] Searching for: "${runnerName}"`)
    console.log(`${'='.repeat(50)}`)

    try {
      // Step 1: Search by name to get PID
      const searchUrl = `${this.baseUrl}/search-athletes?raceId=${this.raceId}&type=name&value=${encodeURIComponent(runnerName)}`
      console.log(`[CIM ${this.year}] Search URL: ${searchUrl}`)

      const searchResponse = await fetch(searchUrl)
      console.log(`[CIM ${this.year}] Search response status: ${searchResponse.status}`)

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text()
        console.error(`[CIM ${this.year}] Search API error: ${searchResponse.status}`)
        console.error(`[CIM ${this.year}] Error body: ${errorText.slice(0, 500)}`)
        return this.notFoundResult()
      }

      const searchData = await searchResponse.json()
      const results = searchData.results || []

      console.log(`[CIM ${this.year}] Found ${results.length} results (total: ${searchData.totalCount})`)

      if (results.length === 0) {
        console.log(`[CIM ${this.year}] No results found for: ${runnerName}`)
        return this.notFoundResult()
      }

      // Filter for exact or close name matches
      const matches = results.filter(r => this.namesMatch(runnerName, r.name))

      console.log(`[CIM ${this.year}] Exact matches after filtering: ${matches.length}`)

      if (matches.length === 0) {
        console.log(`[CIM ${this.year}] No exact match for: ${runnerName}`)
        console.log(`[CIM ${this.year}] Closest results were:`)
        results.slice(0, 3).forEach(r => {
          console.log(`  - ${r.name} (${r.finishChipTime})`)
        })
        return this.notFoundResult()
      }

      if (matches.length > 1) {
        console.log(`[CIM ${this.year}] Multiple exact matches found:`)
        matches.forEach(m => {
          console.log(`  - ${m.name}, Bib: ${m.bib}, Time: ${m.finishChipTime}`)
        })
        return this.ambiguousResult(matches.map(m => ({
          name: m.name,
          bib: m.bib,
          time: m.finishChipTime
        })))
      }

      // Single match found - get detailed data
      const match = matches[0]
      const pid = match.pid

      console.log(`[CIM ${this.year}] Found unique match: ${match.name} (PID: ${pid})`)

      // Step 2: Fetch detailed athlete data using PID
      const detailUrl = `${this.baseUrl}/athlete-analysis-official?raceId=${this.raceId}&pid=${pid}`
      console.log(`[CIM ${this.year}] Fetching details: ${detailUrl}`)

      const detailResponse = await fetch(detailUrl)

      const cimResultsUrl = `https://myrace.ai/races/${this.raceId}/results`

      if (!detailResponse.ok) {
        // If detail fetch fails, use search result data (less detailed but still useful)
        console.log(`[CIM ${this.year}] Detail fetch failed, using search result data`)
        return { ...this.extractSearchResultData(match), resultsUrl: cimResultsUrl }
      }

      const detailData = await detailResponse.json()

      if (!detailData.athlete) {
        // Fallback to search result data
        console.log(`[CIM ${this.year}] No detailed athlete data, using search result`)
        return { ...this.extractSearchResultData(match), resultsUrl: cimResultsUrl }
      }

      const athlete = detailData.athlete

      console.log(`\n[CIM ${this.year}] ✅ FOUND RUNNER:`)
      console.log(`  Name: ${athlete.firstName} ${athlete.lastName}`)
      console.log(`  Bib: ${athlete.bib}`)
      console.log(`  Chip Time: ${athlete.finishChipTime}`)
      console.log(`  Pace: ${athlete.paceTime}`)
      console.log(`  Overall Rank: ${athlete.overallRank}/${athlete.totalAthletes}`)

      return { ...this.extractRunnerData(athlete), resultsUrl: cimResultsUrl }

    } catch (error) {
      console.error(`[CIM ${this.year}] Error searching for ${runnerName}:`, error.message)
      console.error(error.stack)
      return {
        ...this.notFoundResult(),
        researchNotes: `Error: ${error.message}`
      }
    }
  }

  /**
   * Extract standardized data from search result (fallback when detailed data unavailable)
   */
  extractSearchResultData(result) {
    const time = this.formatTime(result.finishChipTime)
    const bib = result.bib || null

    // Calculate approximate pace from time (26.2 miles)
    let pace = null
    if (result.finishChipTime) {
      const timeParts = result.finishChipTime.split(':')
      if (timeParts.length === 3) {
        const totalSeconds = parseInt(timeParts[0]) * 3600 + parseInt(timeParts[1]) * 60 + parseInt(timeParts[2])
        const paceSeconds = totalSeconds / 26.2
        const paceMinutes = Math.floor(paceSeconds / 60)
        const paceRemainingSeconds = Math.floor(paceSeconds % 60)
        pace = `${paceMinutes}:${String(paceRemainingSeconds).padStart(2, '0')}`
      }
    }

    return {
      found: true,
      bibNumber: bib ? String(bib) : null,
      officialTime: time,
      officialPace: pace,
      eventType: 'Marathon',
      yearFound: this.year,
      researchNotes: null,
      rawData: {
        name: result.name,
        gender: result.gender,
        age: result.age,
        overallRank: result.overallRank,
        totalAthletes: result.totalAthletes,
        chipTime: result.finishChipTime
      }
    }
  }

  /**
   * Extract standardized data from MyRace.ai result object
   */
  extractRunnerData(athlete) {
    // MyRace.ai returns chip time and pace already formatted
    const chipTime = athlete.finishChipTime || null
    const bib = athlete.bib || null
    const pace = athlete.paceTime || null

    // Format time to remove leading zero if needed
    const time = this.formatTime(chipTime)

    // Pace is already in m:ss format, just needs to be cleaned
    const formattedPace = this.formatPace(pace)

    return {
      found: true,
      bibNumber: bib ? String(bib) : null,
      officialTime: time,
      officialPace: formattedPace,
      eventType: 'Marathon',
      yearFound: this.year,
      researchNotes: null,
      // Include extra data that might be useful
      rawData: {
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        gender: athlete.gender,
        age: athlete.age,
        city: athlete.city,
        state: athlete.state,
        country: athlete.country,
        overallRank: athlete.overallRank,
        genderRank: athlete.genderRank,
        ageGroupRank: athlete.ageGroupRank,
        ageGroup: athlete.ageGroupName,
        totalAthletes: athlete.totalAthletes,
        gunTime: athlete.finishGunTime,
        chipTime: athlete.finishChipTime,
        pace: athlete.paceTime
      }
    }
  }

  /**
   * Extract PID from MyRace.ai URL
   * URL format: https://myrace.ai/athletes/cim-2025/3022
   * @param {string} url - Full MyRace.ai URL
   * @returns {string|null} PID or null if not found
   */
  static extractPidFromUrl(url) {
    const match = url.match(/\/athletes\/cim[-_]?\d+\/(\d+)/i)
    return match ? match[1] : null
  }
}

export default CIMMarathonScraper
