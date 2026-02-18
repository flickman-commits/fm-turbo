/**
 * Philadelphia Marathon Results Scraper
 * Uses the MyChipTime results system at mychiptime.com
 *
 * Base event URL (from user):
 *   https://www.mychiptime.com/searchevent.php?id=16897
 *
 * NOTE:
 * - This implementation follows the same patterns as the Chicago scraper
 * - The exact query parameters / HTML structure for MyChipTime may change,
 *   so you should run this against the live site and tweak the selectors
 *   and search parameters as needed.
 */
import { BaseScraper } from '../BaseScraper.js'
import * as cheerio from 'cheerio'

export class PhiladelphiaMarathonScraper extends BaseScraper {
  constructor(year) {
    super('Philadelphia Marathon', year)
    // MyChipTime uses a single searchevent endpoint with an event id
    this.baseUrl = 'https://www.mychiptime.com/searchevent.php'
    // From user: id=16897 for Philadelphia Marathon
    this.eventId = '16897'
  }

  /**
   * Get race-level information for Philadelphia Marathon
   * @returns {Promise<Object>} Race info object
   */
  async getRaceInfo() {
    console.log(`[Philadelphia Marathon ${this.year}] Fetching race info...`)

    // Prefer the exact official race date from the MyChipTime event page.
    // ResearchService will cache this in the Race table so we only need
    // to scrape it once per race/year.
    let raceDate = null

    try {
      const eventUrl = `${this.baseUrl}?id=${this.eventId}`
      const response = await fetch(eventUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      })

      console.log(
        `[Philadelphia Marathon ${this.year}] Race info response status: ${response.status}`
      )

      if (response.ok) {
        const html = await response.text()
        raceDate = this.extractRaceDateFromHtml(html)
      }
    } catch (error) {
      console.log(
        `[Philadelphia Marathon ${this.year}] Failed to derive race date from HTML, will fall back:`,
        error.message
      )
    }

    // Fallback: approximate as third Sunday in November if we couldn't parse a date
    if (!raceDate) {
      raceDate = this.calculatePhiladelphiaMarathonDate(this.year)
      console.log(
        `[Philadelphia Marathon ${this.year}] Using fallback calculated race date: ${raceDate.toDateString()}`
      )
    } else {
      console.log(
        `[Philadelphia Marathon ${this.year}] Parsed official race date from HTML: ${raceDate.toDateString()}`
      )
    }

    return {
      raceDate: raceDate,
      location: 'Philadelphia, PA',
      eventTypes: ['Marathon'],
      resultsUrl: `${this.baseUrl}?id=${this.eventId}`,
      resultsSiteType: 'mychiptime'
    }
  }

  /**
   * Approximate date: third Sunday in November
   * (You can adjust this logic if you want the exact historical dates)
   */
  calculatePhiladelphiaMarathonDate(year) {
    const nov1 = new Date(year, 10, 1) // Month is 0-indexed, so 10 = November
    const dayOfWeek = nov1.getDay()
    // First Sunday
    const daysUntilFirstSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
    const firstSunday = new Date(year, 10, 1 + daysUntilFirstSunday)
    // Third Sunday = first Sunday + 14 days
    const thirdSunday = new Date(firstSunday)
    thirdSunday.setDate(firstSunday.getDate() + 14)
    return thirdSunday
  }

  /**
   * Attempt to extract the official race date from the event HTML.
   * We look for a date-like string such as "November 24, 2024" in
   * common header/intro elements.
   */
  extractRaceDateFromHtml(html) {
    const $ = cheerio.load(html)

    const candidates = []
    $('h1, h2, h3, .header, .headline, .content, .intro, #content').each((_, el) => {
      const text = $(el).text().trim()
      if (text) candidates.push(text)
    })

    if (candidates.length === 0) {
      candidates.push($.text())
    }

    const monthNames =
      'January|February|March|April|May|June|July|August|September|October|November|December'
    const dateRegex = new RegExp(`(${monthNames})\\s+\\d{1,2},\\s+${this.year}`, 'i')

    for (const text of candidates) {
      const match = text.match(dateRegex)
      if (match) {
        const parsed = new Date(match[0])
        if (!Number.isNaN(parsed.getTime())) {
          return parsed
        }
      }
    }

    return null
  }

  /**
   * Search for a runner in Philadelphia Marathon results
   * @param {string} runnerName - Full name to search for
   * @returns {Promise<Object>} Standardized result object
   */
  async searchRunner(runnerName) {
    console.log(`\n${'='.repeat(50)}`)
    console.log(`[Philadelphia Marathon ${this.year}] Searching for: "${runnerName}"`)
    console.log(`${'='.repeat(50)}`)

    try {
      // Split name into first/last for the search parameters
      const nameParts = runnerName.trim().split(/\s+/)
      let firstName = ''
      let lastName = ''

      if (nameParts.length === 1) {
        lastName = nameParts[0]
      } else if (nameParts.length >= 2) {
        firstName = nameParts[0]
        lastName = nameParts.slice(1).join(' ')
      }

      /**
       * MyChipTime typically supports searching by first/last name via query params.
       * Common patterns (you may need to tweak after inspecting the live HTML form):
       *   ?id=16897&lname=SMITH&fname=JOHN
       *   ?id=16897&lastname=SMITH&firstname=JOHN
       *
       * We'll start with &lname / &fname and fall back to &lastname / &firstname
       * if the first pattern yields no parsable results.
       */
      const searchUrls = []

      const lname = encodeURIComponent(lastName.toUpperCase())
      const fname = encodeURIComponent(firstName.toUpperCase())

      // Primary guess: lname / fname
      searchUrls.push(
        `${this.baseUrl}?id=${this.eventId}&lname=${lname}&fname=${fname}`
      )
      // Secondary guess: lastname / firstname
      searchUrls.push(
        `${this.baseUrl}?id=${this.eventId}&lastname=${lname}&firstname=${fname}`
      )

      let allResults = []
      let matchedUrl = searchUrls[0]

      for (const url of searchUrls) {
        console.log(`[Philadelphia Marathon] Search URL: ${url}`)

        const response = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        })

        console.log(`[Philadelphia Marathon] Response status: ${response.status}`)

        if (!response.ok) {
          console.error(`[Philadelphia Marathon] HTTP error: ${response.status}`)
          continue
        }

        const html = await response.text()
        const results = this.parseResultsHtml(html)
        console.log(
          `[Philadelphia Marathon] Parsed ${results.length} results from this search page`
        )

        allResults = allResults.concat(results)

        // If we found any results from this pattern, we can stop trying others
        if (results.length > 0) {
          matchedUrl = url
          break
        }
      }

      console.log(`[Philadelphia Marathon] Total collected results: ${allResults.length}`)

      if (!allResults.length) {
        console.log(`[Philadelphia Marathon] No results found for: ${runnerName}`)
        return this.notFoundResult()
      }

      // Log first few results
      console.log(`[Philadelphia Marathon] Results found:`)
      allResults.slice(0, 5).forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.name} - Bib: ${r.bib}, Time: ${r.finishTime}`)
      })

      // Filter for exact or close name matches using BaseScraper's name matching
      const matches = allResults.filter((r) => {
        return this.namesMatch(runnerName, r.name)
      })

      console.log(`[Philadelphia Marathon] Exact matches after filtering: ${matches.length}`)

      if (matches.length === 0) {
        console.log(`[Philadelphia Marathon] No exact match for: ${runnerName}`)
        if (allResults.length > 0) {
          console.log(`[Philadelphia Marathon] Closest results were:`)
          allResults.slice(0, 3).forEach((r) => {
            console.log(`  - ${r.name}`)
          })
        }
        return this.notFoundResult()
      }

      if (matches.length > 1) {
        console.log(`[Philadelphia Marathon] Multiple exact matches found:`)
        matches.forEach((m) => {
          console.log(`  - ${m.name}, Bib: ${m.bib}`)
        })
        return this.ambiguousResult(
          matches.map((m) => ({
            name: m.name,
            bib: m.bib,
            time: m.finishTime
          }))
        )
      }

      // Single match - extract standardized data
      const runner = matches[0]
      console.log(`\n[Philadelphia Marathon] FOUND RUNNER:`)
      console.log(`  Name: ${runner.name}`)
      console.log(`  Bib: ${runner.bib}`)
      console.log(`  Time: ${runner.finishTime}`)

      return { ...this.extractRunnerData(runner), resultsUrl: matchedUrl }
    } catch (error) {
      console.error(
        `[Philadelphia Marathon] Error searching for ${runnerName}:`,
        error.message
      )
      console.error(error.stack)
      return {
        ...this.notFoundResult(),
        researchNotes: `Error: ${error.message}`
      }
    }
  }

  /**
   * Parse the HTML results page to extract runner data
   * This is intentionally conservative and logs heavily so you can
   * tweak selectors easily once you inspect the live HTML.
   * @param {string} html - Raw HTML from results page
   * @returns {Array} Array of runner objects
   */
  parseResultsHtml(html) {
    const $ = cheerio.load(html)
    const runners = []

    // MyChipTime typically renders results in a table.
    // We will:
    //   - Look for the first non-header <table>
    //   - Treat each <tr> with <td> children as a result row
    //   - Attempt to infer columns (name, bib, time) by position
    //
    // You may want to update this selector to match the exact table id/class,
    // e.g. $('table#result_table tr') if present.

    const tables = $('table')
    if (!tables.length) {
      console.log('[Philadelphia Marathon] No tables found in HTML')
      return runners
    }

    const $table = tables.first()
    console.log(
      `[Philadelphia Marathon] Using first table for parsing; total tables found: ${tables.length}`
    )

    $table
      .find('tr')
      .slice(1) // skip header row
      .each((i, el) => {
        try {
          const $row = $(el)
          const cells = $row.find('td')

          // Skip non-data rows
          if (cells.length < 4) return

          // Heuristic:
          // - name is often in one of the early columns
          // - bib is often numeric
          // - finish time often looks like h:mm:ss or mm:ss
          const cellTexts = cells
            .map((_, c) => $(c).text().trim())
            .get()
            .filter(Boolean)

          if (!cellTexts.length) return

          // Try to identify name cell:
          // pick the first cell that contains a space (first + last)
          let name = cellTexts.find((t) => t.split(/\s+/).length >= 2) || cellTexts[0]

          // Identify bib: first 3–6 digit number-like cell
          let bib =
            cellTexts.find((t) => /^\d{2,6}$/.test(t)) ||
            cellTexts.find((t) => /^\d{1,6}$/.test(t)) ||
            ''

          // Identify finish time: look for pattern \d+:\d{2}(:\d{2})?
          let finishTime =
            cellTexts.find((t) => /\d+:\d{2}:\d{2}/.test(t)) ||
            cellTexts.find((t) => /\d+:\d{2}/.test(t)) ||
            ''

          if (name && (bib || finishTime)) {
            runners.push({
              name,
              bib,
              finishTime,
              rawCells: cellTexts
            })
          }
        } catch (err) {
          console.error(`[Philadelphia Marathon] Error parsing row:`, err.message)
        }
      })

    return runners
  }

  /**
   * Extract standardized data from parsed runner object
   */
  extractRunnerData(runner) {
    const rawTime = runner.finishTime || null
    const bib = runner.bib || null

    // Normalize and format time
    const normalizedTime = rawTime ? this.normalizeTime(rawTime) : null
    const time = this.formatTime(normalizedTime)

    // Calculate and format pace (marathon = 26.2 miles)
    const rawPace = normalizedTime ? this.calculatePace(normalizedTime, 26.2) : null
    const pace = this.formatPace(rawPace)

    return {
      found: true,
      bibNumber: bib ? String(bib) : null,
      officialTime: time,
      officialPace: pace,
      eventType: 'Marathon',
      yearFound: this.year,
      researchNotes: null,
      rawData: {
        name: runner.name,
        rawCells: runner.rawCells
      }
    }
  }
}

export default PhiladelphiaMarathonScraper

