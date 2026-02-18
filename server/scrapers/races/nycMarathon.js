/**
 * NYC Marathon Results Scraper
 * Uses NYRR (New York Road Runners) Production API
 * API Base: https://rmsprodapi.nyrr.org/api/v2
 */
import { BaseScraper } from '../BaseScraper.js'

export class NYCMarathonScraper extends BaseScraper {
  constructor(year) {
    super('NYC Marathon', year)
    // The REAL API endpoint (discovered via Puppeteer network inspection)
    this.baseUrl = 'https://rmsprodapi.nyrr.org/api/v2'
    // Event codes: M2024 for 2024 Marathon, M2023 for 2023, etc.
    this.eventCode = `M${year}`
  }

  /**
   * Get race-level information for NYC Marathon
   * This is cached at the Race level - same for all runners
   * @returns {Promise<Object>} Race info object
   */
  async getRaceInfo() {
    console.log(`[NYC Marathon ${this.year}] Fetching race info...`)

    // Prefer the official event date returned by NYRR's API.
    // ResearchService will cache this in the Race table so we only need
    // to discover it once per year; subsequent calls will read from the DB.
    try {
      // Fetch event details from API
      const response = await fetch(`${this.baseUrl}/events/details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventCode: this.eventCode
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`[NYC Marathon ${this.year}] Got event details from API`)

        if (data.eventDetails) {
          const apiDate = data.eventDetails.eventDate
            ? new Date(data.eventDetails.eventDate)
            : null

          return {
            // Use exact date from API when available
            raceDate: apiDate ?? this.calculateNYCMarathonDate(this.year),
            location: 'New York, NY',
            eventTypes: ['Marathon'],
            resultsUrl: `https://results.nyrr.org/event/${this.eventCode}/finishers`,
            resultsSiteType: 'nyrr',
          }
        }
      }
    } catch (error) {
      console.log(`[NYC Marathon ${this.year}] API failed, using calculated date:`, error.message)
    }

    // Fallback to calculated date
    const raceDate = this.calculateNYCMarathonDate(this.year)
    console.log(`[NYC Marathon ${this.year}] Using calculated race date: ${raceDate.toDateString()}`)

    return {
      raceDate: raceDate,
      location: 'New York, NY',
      eventTypes: ['Marathon'],
      resultsUrl: `https://results.nyrr.org/event/${this.eventCode}/finishers`,
      resultsSiteType: 'nyrr',
    }
  }

  /**
   * NYC Marathon is always the first Sunday of November
   */
  calculateNYCMarathonDate(year) {
    const nov1 = new Date(year, 10, 1) // Month is 0-indexed
    const dayOfWeek = nov1.getDay()
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
    const firstSunday = new Date(year, 10, 1 + daysUntilSunday)
    return firstSunday
  }

  /**
   * Search for a runner in NYC Marathon results
   * @param {string} runnerName - Full name to search for
   * @returns {Promise<Object>} Standardized result object
   */
  async searchRunner(runnerName) {
    console.log(`\n${'='.repeat(50)}`)
    console.log(`[NYC Marathon ${this.year}] Searching for: "${runnerName}"`)
    console.log(`${'='.repeat(50)}`)

    try {
      // Use the finishers-filter endpoint with searchString
      const requestBody = {
        eventCode: this.eventCode,
        searchString: runnerName,
        handicap: null,
        sortColumn: 'overallTime',
        sortDescending: false,
        pageIndex: 1,
        pageSize: 50
      }

      console.log(`[NYC Marathon] API URL: ${this.baseUrl}/runners/finishers-filter`)
      console.log(`[NYC Marathon] Request body:`, JSON.stringify(requestBody, null, 2))

      const response = await fetch(`${this.baseUrl}/runners/finishers-filter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      console.log(`[NYC Marathon] Response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[NYC Marathon] API error: ${response.status}`)
        console.error(`[NYC Marathon] Error body: ${errorText.slice(0, 500)}`)
        return this.notFoundResult()
      }

      const data = await response.json()
      console.log(`[NYC Marathon] Total results: ${data.totalItems}`)

      const results = data.items || []

      if (!results.length) {
        console.log(`[NYC Marathon] No results found for: ${runnerName}`)
        return this.notFoundResult()
      }

      console.log(`[NYC Marathon] Found ${results.length} potential matches:`)
      results.slice(0, 5).forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.firstName} ${r.lastName} - Bib: ${r.bib}, Time: ${r.overallTime}`)
      })

      // Filter for exact or close name matches
      const matches = results.filter(r => {
        const fullName = `${r.firstName} ${r.lastName}`
        return this.namesMatch(runnerName, fullName)
      })

      console.log(`[NYC Marathon] Exact matches after filtering: ${matches.length}`)

      if (matches.length === 0) {
        console.log(`[NYC Marathon] No exact match for: ${runnerName}`)
        // Return the closest matches for debugging
        if (results.length > 0) {
          console.log(`[NYC Marathon] Closest results were:`)
          results.slice(0, 3).forEach(r => {
            console.log(`  - ${r.firstName} ${r.lastName}`)
          })
        }
        return this.notFoundResult()
      }

      if (matches.length > 1) {
        console.log(`[NYC Marathon] Multiple exact matches found:`)
        matches.forEach(m => {
          console.log(`  - ${m.firstName} ${m.lastName}, Bib: ${m.bib}`)
        })
        return this.ambiguousResult(matches.map(m => ({
          name: `${m.firstName} ${m.lastName}`,
          bib: m.bib,
          time: m.overallTime
        })))
      }

      // Single match - extract data
      const runner = matches[0]
      console.log(`\n[NYC Marathon] ✅ FOUND RUNNER:`)
      console.log(`  Name: ${runner.firstName} ${runner.lastName}`)
      console.log(`  Bib: ${runner.bib}`)
      console.log(`  Time: ${runner.overallTime}`)
      console.log(`  Pace: ${runner.pace}`)

      const resultsUrl = `https://results.nyrr.org/event/${this.eventCode}/finishers`
      return { ...this.extractRunnerData(runner), resultsUrl }

    } catch (error) {
      console.error(`[NYC Marathon] Error searching for ${runnerName}:`, error.message)
      console.error(error.stack)
      return {
        ...this.notFoundResult(),
        researchNotes: `Error: ${error.message}`
      }
    }
  }

  /**
   * Extract standardized data from NYRR result object
   */
  extractRunnerData(runner) {
    // The API returns pace already formatted and time in h:mm:ss
    const rawTime = runner.overallTime || null
    const bib = runner.bib || null

    // Format time (remove leading zero: 04:14:45 -> 4:14:45)
    const time = this.formatTime(rawTime)

    // Format pace (NYRR API already returns pace, just add " / mi")
    const pace = this.formatPace(runner.pace)

    return {
      found: true,
      bibNumber: bib ? String(bib) : null,
      officialTime: time,
      officialPace: pace,
      eventType: 'Marathon',
      yearFound: this.year,
      researchNotes: null,
      // Include extra data that might be useful
      rawData: {
        firstName: runner.firstName,
        lastName: runner.lastName,
        gender: runner.gender,
        age: runner.age,
        city: runner.city,
        stateProvince: runner.stateProvince,
        countryCode: runner.countryCode,
        overallPlace: runner.overallPlace,
        genderPlace: runner.genderPlace,
        ageGradePercent: runner.ageGradePercent
      }
    }
  }

  /**
   * Search multiple years if runner not found in specified year
   * Useful when customer doesn't remember exact year
   */
  async searchMultipleYears(runnerName, yearsToSearch = 5) {
    const currentYear = new Date().getFullYear()
    const results = []

    for (let i = 0; i < yearsToSearch; i++) {
      const year = currentYear - i
      console.log(`\n[NYC Marathon] Searching year ${year}...`)
      const scraper = new NYCMarathonScraper(year)
      const result = await scraper.searchRunner(runnerName)

      if (result.found) {
        results.push({ year, ...result })
      }
    }

    return results
  }
}

export default NYCMarathonScraper
