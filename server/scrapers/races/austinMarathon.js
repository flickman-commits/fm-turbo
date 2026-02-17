/**
 * Austin Marathon Results Scraper
 * Uses myChipTime results system at mychiptime.com
 */
import { BaseScraper } from '../BaseScraper.js'
import puppeteer from 'puppeteer'

export class AustinMarathonScraper extends BaseScraper {
  constructor(year) {
    super('Austin Marathon', year)
    this.baseUrl = 'https://www.mychiptime.com/searchevent.php'
    // Event IDs for Austin Marathon
    this.eventIds = {
      2026: { marathon: '17035', halfMarathon: '17034' }
      // Add more years as they become available
    }
  }

  /**
   * Get race-level information for Austin Marathon
   * @returns {Promise<Object>} Race info object
   */
  async getRaceInfo() {
    console.log(`[Austin Marathon ${this.year}] Fetching race info...`)

    // Austin Marathon is typically mid-February
    const raceDate = this.calculateAustinMarathonDate(this.year)

    console.log(
      `[Austin Marathon ${this.year}] Using calculated race date: ${raceDate.toDateString()}`
    )

    return {
      raceDate,
      location: 'Austin, TX',
      eventTypes: ['Marathon', 'Half Marathon', '5K'],
      resultsUrl: this.baseUrl,
      resultsSiteType: 'mychiptime',
    }
  }

  /**
   * Austin Marathon is typically mid-February
   * This is an approximation - actual date varies
   */
  calculateAustinMarathonDate(year) {
    // Austin Marathon 2026 is on February 15, 2026
    // Typically it's the third Sunday in February
    const feb1 = new Date(year, 1, 1) // Month is 0-indexed, so 1 = February
    const dayOfWeek = feb1.getDay()
    // First Sunday
    const daysUntilFirstSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
    // Third Sunday = first Sunday + 14
    const thirdSunday = new Date(year, 1, 1 + daysUntilFirstSunday + 14)
    return thirdSunday
  }

  /**
   * Search for a runner in Austin Marathon results
   * @param {string} runnerName - Full name to search for
   * @param {string} eventType - 'marathon' or 'halfMarathon' (optional)
   * @returns {Promise<Object>} Standardized result object
   */
  async searchRunner(runnerName, eventType = 'marathon') {
    console.log(`\n${'='.repeat(50)}`)
    console.log(`[Austin Marathon ${this.year}] Searching for: "${runnerName}"`)
    console.log(`${'='.repeat(50)}`)

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    try {
      // Check if we have event IDs for this year
      if (!this.eventIds[this.year]) {
        console.log(`[Austin Marathon] No event IDs configured for year ${this.year}`)
        await browser.close()
        return this.notFoundResult(`No results available for ${this.year} yet`)
      }

      const eventId = this.eventIds[this.year][eventType]
      const url = `${this.baseUrl}?id=${eventId}`

      // Parse the name into first and last
      const nameParts = runnerName.trim().split(/\s+/)
      let firstName, lastName

      if (nameParts.length === 1) {
        lastName = nameParts[0]
        firstName = ''
      } else {
        firstName = nameParts[0]
        lastName = nameParts.slice(1).join(' ')
      }

      console.log(`[Austin Marathon] Searching for: ${firstName} ${lastName}`)
      console.log(`[Austin Marathon] URL: ${url}`)

      const page = await browser.newPage()
      await page.goto(url, { waitUntil: 'networkidle2' })

      // Fill in the search form
      await page.type('input[name="firstname"]', firstName)
      await page.type('input[name="lastname"]', lastName)

      // Click search button and wait for results
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        page.click('input[type="submit"][value="Search"]')
      ])

      // Extract results from the page
      const results = await page.evaluate(() => {
        const resultsTable = document.querySelector('table.table-striped')

        if (!resultsTable) {
          return null
        }

        const rows = Array.from(resultsTable.querySelectorAll('tbody tr'))

        if (rows.length === 0) {
          return null
        }

        // Get all matching results
        return rows.map(row => {
          const cells = row.querySelectorAll('td')

          if (cells.length < 9) {
            return null
          }

          return {
            overallPlace: cells[0]?.textContent?.trim() || '',
            gunTime: cells[1]?.textContent?.trim() || '',
            chipTime: cells[2]?.textContent?.trim() || '',
            bib: cells[3]?.textContent?.trim() || '',
            firstName: cells[4]?.textContent?.trim() || '',
            lastName: cells[5]?.textContent?.trim() || '',
            city: cells[6]?.textContent?.trim() || '',
            state: cells[7]?.textContent?.trim() || '',
            division: cells[8]?.textContent?.trim() || '',
            classPosition: cells[9]?.textContent?.trim() || ''
          }
        }).filter(result => result !== null)
      })

      await browser.close()

      if (!results || results.length === 0) {
        console.log(`[Austin Marathon] No results found for: ${runnerName}`)
        return this.notFoundResult()
      }

      // Handle multiple results (array)
      if (results.length > 1) {
        console.log(`[Austin Marathon] Found ${results.length} results - ambiguous match`)
        return {
          found: false,
          ambiguous: true,
          researchNotes: `Found ${results.length} runners with name "${runnerName}". Please specify more details.`,
          possibleMatches: results.map(r => ({
            name: `${r.firstName} ${r.lastName}`,
            bib: r.bib,
            time: r.chipTime,
            city: r.city,
            state: r.state
          }))
        }
      }

      // Single result found
      const result = results[0]
      console.log(`[Austin Marathon] Found result:`)
      console.log(`  Bib: ${result.bib}`)
      console.log(`  Chip Time: ${result.chipTime}`)
      console.log(`  Gun Time: ${result.gunTime}`)
      console.log(`  Overall Place: ${result.overallPlace}`)
      console.log(`  Division: ${result.division}`)
      console.log(`  Location: ${result.city}, ${result.state}`)

      // Calculate pace from chip time
      const pace = this.calculatePaceFromTime(result.chipTime)

      return {
        found: true,
        bibNumber: result.bib,
        officialTime: result.chipTime,
        officialPace: pace,
        gunTime: result.gunTime,
        overallPlace: result.overallPlace,
        division: result.division,
        classPosition: result.classPosition,
        city: result.city,
        state: result.state,
        researchNotes: `Found via MyChipTime - ${result.firstName} ${result.lastName} from ${result.city}, ${result.state}`
      }

    } catch (error) {
      console.error(`[Austin Marathon] Error searching for runner:`, error)
      await browser.close()
      return this.notFoundResult(error.message)
    }
  }

  /**
   * Calculate pace from finish time (assumes marathon distance of 26.2 miles)
   * @param {string} timeString - Time in format "h:mm:ss"
   * @returns {string} Pace in format "m:ss /mi"
   */
  calculatePaceFromTime(timeString) {
    if (!timeString) return null

    try {
      // Parse time string (e.g., "3:42:15" or "4:14:45")
      const parts = timeString.split(':')
      if (parts.length !== 3) return null

      const hours = parseInt(parts[0])
      const minutes = parseInt(parts[1])
      const seconds = parseInt(parts[2])

      // Calculate total minutes
      const totalMinutes = (hours * 60) + minutes + (seconds / 60)

      // Marathon is 26.2 miles
      const paceMinutes = totalMinutes / 26.2

      // Format as "m:ss /mi"
      const paceMin = Math.floor(paceMinutes)
      const paceSec = Math.round((paceMinutes - paceMin) * 60)

      return `${paceMin}:${String(paceSec).padStart(2, '0')} /mi`
    } catch (error) {
      console.error('[Austin Marathon] Error calculating pace:', error)
      return null
    }
  }

  /**
   * Return a standardized "not found" result
   */
  notFoundResult(notes = null) {
    return {
      found: false,
      ambiguous: false,
      researchNotes: notes || 'Runner not found in results'
    }
  }
}

export default AustinMarathonScraper
