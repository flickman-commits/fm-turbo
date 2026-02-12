/**
 * Kiawah Island Marathon Results Scraper
 * Uses RunSignUp platform
 * Results URL: https://runsignup.com/Race/Results/139050
 */
import { BaseScraper } from '../BaseScraper.js'
import puppeteer from 'puppeteer'

export class KiawahIslandMarathonScraper extends BaseScraper {
  constructor(year) {
    super('Kiawah Island Marathon', year)
    this.baseUrl = 'https://runsignup.com'
    this.raceId = 68851 // Kiawah Island Marathon race ID

    // Map years to result set IDs for FULL MARATHON only
    // These can be found in the race results page HTML
    this.resultSetMap = {
      2025: 615623, // Marathon Overall - Kiawah Island Marathon, High Performance Corral Full
      2024: 516051, // Kiawah Island Marathon, High Performance Corral Full
      2023: 429213, // Kiawah Island Marathon Overall Results
      2022: 360433, // Kiawah Island Marathon Overall Results
      2021: 294549  // Marathon Overall - Kiawah Island Marathon, High Performance Corral Full
    }
  }

  /**
   * Get race-level information for Kiawah Island Marathon
   * This is cached at the Race level - same for all runners
   * @returns {Promise<Object>} Race info object
   */
  async getRaceInfo() {
    console.log(`[Kiawah ${this.year}] Fetching race info...`)

    // Kiawah Island Marathon is typically held in mid-December
    // 2025: December 13
    // 2024: December 14
    // Pattern: Second Saturday of December
    const raceDate = this.calculateKiawahDate(this.year)
    console.log(`[Kiawah ${this.year}] Calculated race date: ${raceDate.toDateString()}`)

    return {
      raceDate: raceDate,
      location: 'Kiawah Island, SC',
      eventTypes: ['Marathon', 'Half Marathon'],
      resultsUrl: `https://runsignup.com/Race/Results/${this.raceId}`,
      resultsSiteType: 'runsignup',
    }
  }

  /**
   * Kiawah Island Marathon is typically the second Saturday of December
   */
  calculateKiawahDate(year) {
    const dec1 = new Date(year, 11, 1) // Month is 0-indexed, December = 11
    const dayOfWeek = dec1.getDay()

    // Find first Saturday
    const daysUntilSaturday = dayOfWeek === 6 ? 0 : (6 - dayOfWeek + 7) % 7
    const firstSaturday = 1 + daysUntilSaturday

    // Second Saturday is 7 days later
    const secondSaturday = new Date(year, 11, firstSaturday + 7)
    return secondSaturday
  }

  /**
   * Search for a runner by name using RunSignUp results page
   * @param {string} runnerName - Full name to search for
   * @returns {Promise<Object>} Standardized result object
   */
  async searchRunner(runnerName) {
    console.log(`\n${'='.repeat(50)}`)
    console.log(`[Kiawah ${this.year}] Searching for: "${runnerName}"`)
    console.log(`${'='.repeat(50)}`)

    const resultSetId = this.resultSetMap[this.year]
    if (!resultSetId) {
      console.log(`[Kiawah ${this.year}] No result set ID found for year ${this.year}`)
      return {
        ...this.notFoundResult(),
        researchNotes: `Results not available for ${this.year}`
      }
    }

    let browser = null

    try {
      // Launch browser
      console.log(`[Kiawah ${this.year}] Launching browser...`)
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })

      const page = await browser.newPage()

      // Navigate to results page with specific result set
      const resultsUrl = `${this.baseUrl}/Race/Results/${this.raceId}/${resultSetId}#resultSetId-${resultSetId}`
      console.log(`[Kiawah ${this.year}] Loading results: ${resultsUrl}`)

      await page.goto(resultsUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      })

      // Wait a bit for the page to fully render
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Wait for search input to be available
      await page.waitForSelector('input#resultsSearch', { timeout: 15000 })
      console.log(`[Kiawah ${this.year}] Search box loaded`)

      // Type the runner name in search box
      await page.type('input#resultsSearch', runnerName)
      console.log(`[Kiawah ${this.year}] Typed search query: ${runnerName}`)

      // Wait a moment for client-side filtering to complete
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Extract visible results from the table
      const results = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr'))

        return rows
          .filter(row => {
            // Filter out hidden rows (display: none)
            const style = window.getComputedStyle(row)
            return style.display !== 'none'
          })
          .map(row => {
            const cells = Array.from(row.querySelectorAll('td'))
            if (cells.length < 9) return null

            // RunSignUp table structure:
            // 0: Place, 1: Pace, 2: Bib, 3: Name, 4: Gender,
            // 5: City, 6: State, 7: Country, 8: Clock Time, 9: Age
            return {
              placeOverall: cells[0]?.innerText?.trim(),
              pace: cells[1]?.innerText?.trim(),
              bib: cells[2]?.innerText?.trim(),
              name: cells[3]?.innerText?.trim().replace(/\n/g, ' '),
              gender: cells[4]?.innerText?.trim(),
              city: cells[5]?.innerText?.trim(),
              state: cells[6]?.innerText?.trim(),
              chipTime: cells[8]?.innerText?.trim(),
              age: cells[9]?.innerText?.trim()
            }
          })
          .filter(r => r !== null)
      })

      console.log(`[Kiawah ${this.year}] Found ${results.length} visible results after filtering`)

      if (results.length === 0) {
        console.log(`[Kiawah ${this.year}] No results found for: ${runnerName}`)
        await browser.close()
        return this.notFoundResult()
      }

      // Filter for exact name matches
      const matches = results.filter(r => this.namesMatch(runnerName, r.name))

      console.log(`[Kiawah ${this.year}] Exact matches after name filtering: ${matches.length}`)

      if (matches.length === 0) {
        console.log(`[Kiawah ${this.year}] No exact match for: ${runnerName}`)
        console.log(`[Kiawah ${this.year}] Closest results were:`)
        results.slice(0, 3).forEach(r => {
          console.log(`  - ${r.name} (${r.chipTime})`)
        })
        await browser.close()
        return this.notFoundResult()
      }

      if (matches.length > 1) {
        console.log(`[Kiawah ${this.year}] Multiple exact matches found:`)
        matches.forEach(m => {
          console.log(`  - ${m.name}, Bib: ${m.bib}, Time: ${m.chipTime}`)
        })
        await browser.close()
        return this.ambiguousResult(matches.map(m => ({
          name: m.name,
          bib: m.bib,
          time: m.chipTime
        })))
      }

      // Single match found
      const match = matches[0]

      console.log(`\n[Kiawah ${this.year}] ✅ FOUND RUNNER:`)
      console.log(`  Name: ${match.name}`)
      console.log(`  Bib: ${match.bib}`)
      console.log(`  Chip Time: ${match.chipTime}`)
      console.log(`  Pace: ${match.pace}`)
      console.log(`  Place: ${match.placeOverall}`)

      await browser.close()
      return this.extractRunnerData(match)

    } catch (error) {
      console.error(`[Kiawah ${this.year}] Error searching for ${runnerName}:`, error.message)
      console.error(error.stack)

      if (browser) {
        await browser.close()
      }

      return {
        ...this.notFoundResult(),
        researchNotes: `Error: ${error.message}`
      }
    }
  }

  /**
   * Extract standardized data from RunSignUp result object
   */
  extractRunnerData(result) {
    const time = this.formatTime(result.chipTime)
    const bib = result.bib || null
    const pace = this.formatPace(result.pace)

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
        city: result.city,
        state: result.state,
        placeOverall: result.placeOverall,
        chipTime: result.chipTime,
        pace: result.pace
      }
    }
  }

  /**
   * Extract result set ID from RunSignUp URL
   * URL format: https://runsignup.com/Race/Results/139050/615623
   * @param {string} url - Full RunSignUp URL
   * @returns {string|null} Result set ID or null if not found
   */
  static extractResultSetIdFromUrl(url) {
    const match = url.match(/\/Results\/\d+\/(\d+)/)
    return match ? match[1] : null
  }
}

export default KiawahIslandMarathonScraper
