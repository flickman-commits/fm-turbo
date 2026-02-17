/**
 * Austin Marathon Results Scraper
 * Uses myChipTime results system at mychiptime.com
 * Calls searchResultGen.php directly via fetch (no Puppeteer needed)
 */
import { BaseScraper } from '../BaseScraper.js'
import * as cheerio from 'cheerio'

export class AustinMarathonScraper extends BaseScraper {
  constructor(year) {
    super('Austin Marathon', year)
    this.searchUrl = 'https://www.mychiptime.com/searchResultGen.php'
    // Event IDs for Austin Marathon
    this.eventIds = {
      2026: { marathon: '17035', halfMarathon: '17034' }
      // Add more years as they become available
    }
  }

  /**
   * Get race-level information for Austin Marathon
   * Scrapes the actual race date from the MyChipTime event page
   * @returns {Promise<Object>} Race info object
   */
  async getRaceInfo() {
    console.log(`[Austin Marathon ${this.year}] Fetching race info...`)

    const eventId = this.eventIds[this.year]?.marathon || '17035'
    const eventUrl = `https://www.mychiptime.com/searchevent.php?id=${eventId}`

    let raceDate = null

    try {
      const response = await fetch(eventUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      })

      if (response.ok) {
        const html = await response.text()
        raceDate = this.extractRaceDateFromHtml(html)
        if (raceDate) {
          console.log(`[Austin Marathon ${this.year}] Scraped actual race date: ${raceDate.toDateString()}`)
        }
      }
    } catch (error) {
      console.log(`[Austin Marathon ${this.year}] Failed to scrape race date:`, error.message)
    }

    // Fallback: calculate third Sunday of February
    if (!raceDate) {
      raceDate = this.calculateAustinMarathonDate(this.year)
      console.log(`[Austin Marathon ${this.year}] Using fallback calculated race date: ${raceDate.toDateString()}`)
    }

    return {
      raceDate,
      location: 'Austin, TX',
      eventTypes: ['Marathon', 'Half Marathon', '5K'],
      resultsUrl: eventUrl,
      resultsSiteType: 'mychiptime',
    }
  }

  /**
   * Extract the race date from the MyChipTime event page HTML
   * The page shows the date as MM/DD/YYYY in the header
   */
  extractRaceDateFromHtml(html) {
    const $ = cheerio.load(html)

    // MyChipTime shows the date as "MM/DD/YYYY" near the event title
    const pageText = $.text()

    // Match MM/DD/YYYY format
    const dateMatch = pageText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (dateMatch) {
      const [, month, day, year] = dateMatch
      const parsed = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      if (!isNaN(parsed.getTime())) {
        return parsed
      }
    }

    return null
  }

  /**
   * Fallback: Austin Marathon is typically the third Sunday of February
   */
  calculateAustinMarathonDate(year) {
    const feb1 = new Date(year, 1, 1)
    const dayOfWeek = feb1.getDay()
    const daysUntilFirstSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
    // Third Sunday = first Sunday + 14
    const thirdSunday = new Date(year, 1, 1 + daysUntilFirstSunday + 14)
    return thirdSunday
  }

  /**
   * Search for a runner in Austin Marathon results using direct API call
   * @param {string} runnerName - Full name to search for
   * @param {string} eventType - 'marathon' or 'halfMarathon' (optional)
   * @returns {Promise<Object>} Standardized result object
   */
  async searchRunner(runnerName, eventType = 'marathon') {
    console.log(`\n${'='.repeat(50)}`)
    console.log(`[Austin Marathon ${this.year}] Searching for: "${runnerName}"`)
    console.log(`${'='.repeat(50)}`)

    try {
      // Check if we have event IDs for this year
      if (!this.eventIds[this.year]) {
        console.log(`[Austin Marathon] No event IDs configured for year ${this.year}`)
        return this.notFoundResult(`No results available for ${this.year} yet`)
      }

      const eventId = this.eventIds[this.year][eventType]

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

      console.log(`[Austin Marathon] Searching for: "${firstName}" "${lastName}" in event ${eventId}`)

      // Call the search API directly - this is what the site's JS does internally
      const params = new URLSearchParams({
        eID: eventId,
        fname: firstName,
        lname: lastName,
      })

      const searchUrl = `${this.searchUrl}?${params.toString()}`
      console.log(`[Austin Marathon] Search URL: ${searchUrl}`)

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Referer': `https://www.mychiptime.com/searchevent.php?id=${eventId}`,
        }
      })

      console.log(`[Austin Marathon] Response status: ${response.status}`)

      if (!response.ok) {
        console.error(`[Austin Marathon] HTTP error: ${response.status}`)
        return this.notFoundResult(`HTTP error: ${response.status}`)
      }

      const html = await response.text()
      const results = this.parseResultsHtml(html)

      console.log(`[Austin Marathon] Found ${results.length} results`)

      if (results.length === 0) {
        console.log(`[Austin Marathon] No results found for: ${runnerName}`)
        return this.notFoundResult()
      }

      // Handle multiple results (ambiguous)
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

      return {
        found: true,
        bibNumber: result.bib,
        officialTime: result.chipTime,
        officialPace: result.pace, // Directly from results, e.g. "10:04/M"
        gunTime: result.gunTime,
        overallPlace: result.overallPlace,
        genPlace: result.genPlace,
        division: result.division,
        classPosition: result.classPosition,
        city: result.city,
        state: result.state,
        researchNotes: `Found via MyChipTime - ${result.firstName} ${result.lastName} from ${result.city}, ${result.state}`
      }

    } catch (error) {
      console.error(`[Austin Marathon] Error searching for runner:`, error)
      return this.notFoundResult(error.message)
    }
  }

  /**
   * Parse the HTML results table from MyChipTime
   * @param {string} html - HTML response from searchResultGen.php
   * @returns {Array} Array of result objects
   */
  parseResultsHtml(html) {
    const $ = cheerio.load(html)
    const results = []

    // MyChipTime results are in a table with class "table-striped" or similar
    $('table tr').each((_, row) => {
      const cells = $(row).find('td')
      if (cells.length < 14) return // Skip header rows or short rows

      // col[2] is bib number - skip if not numeric
      const bib = $(cells[2]).text().trim()
      if (!bib || isNaN(parseInt(bib))) return

      results.push({
        gunTime:       $(cells[0]).text().trim(),
        chipTime:      $(cells[1]).text().trim(),
        bib:           $(cells[2]).text().trim(),
        firstName:     $(cells[3]).text().trim(),
        lastName:      $(cells[4]).text().trim(),
        // cells[5] = Share, cells[6] = Race Photos (skip)
        city:          $(cells[7]).text().trim(),
        state:         $(cells[8]).text().trim(),
        division:      $(cells[11]).text().trim(),
        classPosition: $(cells[12]).text().trim(),
        overallPlace:  $(cells[13]).text().trim(),
        genPlace:      $(cells[16]).text().trim(),
        pace:          $(cells[17]).text().trim(), // "10:04/M" - directly from results
      })
    })

    return results
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
