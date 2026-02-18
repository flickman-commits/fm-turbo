/**
 * Chicago Marathon Results Scraper
 * Uses the Mika Timing results system at results.chicagomarathon.com
 */
import { BaseScraper } from '../BaseScraper.js'
import * as cheerio from 'cheerio'

export class ChicagoMarathonScraper extends BaseScraper {
  constructor(year) {
    super('Chicago Marathon', year)
    this.baseUrl = `https://results.chicagomarathon.com/${year}`
  }

  /**
   * Get race-level information for Chicago Marathon
   * @returns {Promise<Object>} Race info object
   */
  async getRaceInfo() {
    console.log(`[Chicago Marathon ${this.year}] Fetching race info...`)

    // We prefer the exact official race date from the results site.
    // ResearchService will cache this in the Race table so this only
    // needs to be discovered once per race/year.
    let raceDate = null

    try {
      const resultsUrl = `${this.baseUrl}/?pid=list`
      const response = await fetch(resultsUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      })

      console.log(`[Chicago Marathon ${this.year}] Race info response status: ${response.status}`)

      if (response.ok) {
        const html = await response.text()
        raceDate = this.extractRaceDateFromHtml(html)
      }
    } catch (error) {
      console.log(
        `[Chicago Marathon ${this.year}] Failed to derive race date from HTML, will fall back:`,
        error.message
      )
    }

    // Fallback: approximate as second Sunday of October if we couldn't parse a date
    if (!raceDate) {
      raceDate = this.calculateChicagoMarathonDate(this.year)
      console.log(
        `[Chicago Marathon ${this.year}] Using fallback calculated race date: ${raceDate.toDateString()}`
      )
    } else {
      console.log(
        `[Chicago Marathon ${this.year}] Parsed official race date from HTML: ${raceDate.toDateString()}`
      )
    }

    return {
      raceDate,
      location: 'Chicago, IL',
      eventTypes: ['Marathon'],
      resultsUrl: `${this.baseUrl}/?pid=list`,
      resultsSiteType: 'mika',
    }
  }

  /**
   * Chicago Marathon is the second Sunday of October
   */
  calculateChicagoMarathonDate(year) {
    const oct1 = new Date(year, 9, 1) // Month is 0-indexed, so 9 = October
    const dayOfWeek = oct1.getDay()
    // First Sunday
    const daysUntilFirstSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
    // Second Sunday = first Sunday + 7
    const secondSunday = new Date(year, 9, 1 + daysUntilFirstSunday + 7)
    return secondSunday
  }

  /**
   * Attempt to extract the official race date from the results HTML.
   * This is intentionally heuristic: we look for a date-like string
   * (e.g. "October 13, 2024") in common header/intro elements.
   */
  extractRaceDateFromHtml(html) {
    const $ = cheerio.load(html)

    // Look in likely containers first (titles, headers, intro text)
    const candidates = []
    $('h1, h2, h3, .header, .headline, .content, .intro, #content').each((_, el) => {
      const text = $(el).text().trim()
      if (text) candidates.push(text)
    })

    // Fallback to full page text if nothing obvious
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
   * Search for a runner in Chicago Marathon results
   * @param {string} runnerName - Full name to search for
   * @returns {Promise<Object>} Standardized result object
   */
  async searchRunner(runnerName) {
    console.log(`\n${'='.repeat(50)}`)
    console.log(`[Chicago Marathon ${this.year}] Searching for: "${runnerName}"`)
    console.log(`${'='.repeat(50)}`)

    try {
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

      // Build the search URL
      const searchParams = new URLSearchParams({
        pid: 'list',
        'search[name]': lastName,
        'search[firstname]': firstName,
        event: 'MAR',
        num_results: '50',
        search_sort: 'name'
      })

      const searchUrl = `${this.baseUrl}/?${searchParams.toString()}`
      console.log(`[Chicago Marathon] Search URL: ${searchUrl}`)

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      })

      console.log(`[Chicago Marathon] Response status: ${response.status}`)

      if (!response.ok) {
        console.error(`[Chicago Marathon] HTTP error: ${response.status}`)
        return this.notFoundResult()
      }

      const html = await response.text()
      const results = this.parseResultsHtml(html)

      console.log(`[Chicago Marathon] Found ${results.length} results in HTML`)

      if (!results.length) {
        console.log(`[Chicago Marathon] No results found for: ${runnerName}`)
        return this.notFoundResult()
      }

      // Log found results
      console.log(`[Chicago Marathon] Results found:`)
      results.slice(0, 5).forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.name} - Bib: ${r.bib}, Time: ${r.finishTime}`)
      })

      // Filter for exact or close name matches
      const matches = results.filter(r => {
        return this.namesMatch(runnerName, r.name)
      })

      console.log(`[Chicago Marathon] Exact matches after filtering: ${matches.length}`)

      if (matches.length === 0) {
        console.log(`[Chicago Marathon] No exact match for: ${runnerName}`)
        if (results.length > 0) {
          console.log(`[Chicago Marathon] Closest results were:`)
          results.slice(0, 3).forEach(r => {
            console.log(`  - ${r.name}`)
          })
        }
        return this.notFoundResult()
      }

      if (matches.length > 1) {
        console.log(`[Chicago Marathon] Multiple exact matches found:`)
        matches.forEach(m => {
          console.log(`  - ${m.name}, Bib: ${m.bib}`)
        })
        return this.ambiguousResult(matches.map(m => ({
          name: m.name,
          bib: m.bib,
          time: m.finishTime
        })))
      }

      // Single match - extract data
      const runner = matches[0]
      console.log(`\n[Chicago Marathon] FOUND RUNNER:`)
      console.log(`  Name: ${runner.name}`)
      console.log(`  Bib: ${runner.bib}`)
      console.log(`  Time: ${runner.finishTime}`)

      return { ...this.extractRunnerData(runner), resultsUrl: searchUrl }

    } catch (error) {
      console.error(`[Chicago Marathon] Error searching for ${runnerName}:`, error.message)
      console.error(error.stack)
      return {
        ...this.notFoundResult(),
        researchNotes: `Error: ${error.message}`
      }
    }
  }

  /**
   * Parse the HTML results page to extract runner data
   * @param {string} html - Raw HTML from results page
   * @returns {Array} Array of runner objects
   */
  parseResultsHtml(html) {
    const $ = cheerio.load(html)
    const runners = []

    // Each result row is an <li> with class "list-group-item row"
    // Skip header rows (they have "list-group-header")
    $('li.list-group-item.row').not('.list-group-header').each((i, el) => {
      try {
        const $row = $(el)

        // Skip rows with "no results" message
        if ($row.find('.alert').length > 0) return

        // Extract name from h4.type-fullname a (format: "LastName, FirstName (COUNTRY)")
        const nameLink = $row.find('h4.type-fullname a, .type-fullname a')
        let fullName = nameLink.text().trim()

        if (!fullName) return

        // Remove country code in parentheses (e.g., "(USA)")
        fullName = fullName.replace(/\s*\([A-Z]{2,3}\)\s*$/, '').trim()

        // Convert "LastName, FirstName" to "FirstName LastName"
        if (fullName.includes(',')) {
          const [last, first] = fullName.split(',').map(s => s.trim())
          fullName = `${first} ${last}`
        }

        // Extract places
        const overallPlace = $row.find('.type-place.place-secondary').first().text().trim()
        const genderPlace = $row.find('.type-place.place-primary').first().text().trim()

        // Extract BIB - it's in .type-field after the BIB label
        let bib = ''
        $row.find('.type-field').each((j, field) => {
          const text = $(field).text().trim()
          // BIB field contains "BIB" label followed by the number
          if (text.includes('BIB')) {
            bib = text.replace(/BIB/gi, '').trim()
          } else if (/^\d{4,6}$/.test(text)) {
            // Or just a 4-6 digit number
            bib = text
          }
        })

        // Extract division from .type-age_class
        const divisionText = $row.find('.type-age_class').text().trim()
        const division = divisionText.replace(/Division/gi, '').trim()

        // Extract times from .type-time fields
        let halfTime = ''
        let finishTime = ''
        $row.find('.type-time').each((j, field) => {
          const $field = $(field)
          const label = $field.find('.list-label').text().trim()
          const timeMatch = $field.text().match(/(\d{2}:\d{2}:\d{2})/)
          const time = timeMatch ? timeMatch[1] : ''

          if (label === 'HALF' || $field.text().includes('HALF')) {
            halfTime = time
          } else if (label === 'Finish' || $field.text().includes('Finish')) {
            finishTime = time
          }
        })

        if (fullName && (bib || finishTime)) {
          runners.push({
            name: fullName,
            bib: bib,
            finishTime: finishTime,
            halfTime: halfTime,
            overallPlace: overallPlace,
            genderPlace: genderPlace,
            division: division
          })
        }
      } catch (err) {
        console.error(`[Chicago Marathon] Error parsing row:`, err.message)
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

    // Format time (remove leading zero: 04:14:45 -> 4:14:45)
    const time = this.formatTime(rawTime)

    // Calculate and format pace (marathon = 26.2 miles)
    const rawPace = rawTime ? this.calculatePace(rawTime, 26.2) : null
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
        halfTime: runner.halfTime,
        overallPlace: runner.overallPlace,
        genderPlace: runner.genderPlace,
        division: runner.division
      }
    }
  }
}

export default ChicagoMarathonScraper
