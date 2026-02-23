/**
 * Marine Corps Marathon Results Scraper (MCM-2025)
 * Uses RTRT's tracker API at api.rtrt.me
 *
 * Flow:
 * - Use the /profiles endpoint to search by name and get basic runner profiles
 * - Select the best match using BaseScraper.namesMatch
 * - (Optional future work) call splits/leaderboard endpoints for detailed times
 */

import { BaseScraper } from '../BaseScraper.js'

export class MarineCorpsMarathonScraper extends BaseScraper {
  constructor(year) {
    super('Marine Corps Marathon', year)
    this.baseUrl = 'https://api.rtrt.me'
    this.eventId = 'MCM-2025'

    // These are public app identifiers observed from the web tracker.
    // If RTRT rotates them, we may need to refresh from DevTools.
    this.appId = '64f230702a503f51752733e3'
    this.token = '2A421DFAE46EE7F78E1B'
  }

  /**
   * Get race-level information for Marine Corps Marathon
   * NOTE: The RTRT conf endpoint does not expose a simple ISO date field,
   * so for now we approximate the race date as the last Sunday of October.
   * Once we have an authoritative date source, this can be tightened up.
   */
  async getRaceInfo() {
    console.log(`[MCM ${this.year}] Fetching race info...`)

    const raceDate = this.calculateApproxRaceDate(this.year)
    console.log(`[MCM ${this.year}] Using approximate race date: ${raceDate.toDateString()}`)

    return {
      raceDate,
      location: 'Arlington, VA',
      eventTypes: ['Marathon'],
      resultsUrl: 'https://track.rtrt.me/e/MCM-2025#/dashboard',
      resultsSiteType: 'rtrt'
    }
  }

  /**
   * Approximate Marine Corps Marathon date as the last Sunday in October.
   */
  calculateApproxRaceDate(year) {
    // Start from October 31 and move backwards to the previous Sunday
    const date = new Date(year, 9, 31) // October = month 9
    const day = date.getDay()
    const offset = day === 0 ? 0 : day // Sunday = 0
    date.setDate(31 - offset)
    return date
  }

  /**
   * Search for a runner in MCM results via RTRT /profiles endpoint
   * @param {string} runnerName - Full name to search for
   * @returns {Promise<Object>} Standardized result object
   */
  async searchRunner(runnerName) {
    console.log(`\n${'='.repeat(50)}`)
    console.log(`[MCM ${this.year}] Searching for: "${runnerName}"`)
    console.log(`${'='.repeat(50)}`)

    try {
      const searchResults = await this.searchProfiles(runnerName)

      if (!searchResults.length) {
        console.log(`[MCM] No profiles returned for search "${runnerName}"`)
        return this.notFoundResult()
      }

      console.log(`[MCM] Received ${searchResults.length} profiles from API`)
      searchResults.slice(0, 5).forEach((p, idx) => {
        console.log(
          `  ${idx + 1}. ${p.name || `${p.fname} ${p.lname}`} - Bib: ${p.bib || 'N/A'}`
        )
      })

      const matches = searchResults.filter((p) => {
        const fullName = p.name || `${p.fname || ''} ${p.lname || ''}`.trim()
        return this.namesMatch(runnerName, fullName)
      })

      console.log(`[MCM] Exact/close matches after filtering: ${matches.length}`)

      if (matches.length === 0) {
        console.log(`[MCM] No exact match for: ${runnerName}`)
        return this.notFoundResult()
      }

      if (matches.length > 1) {
        console.log(`[MCM] Multiple matches found:`)
        matches.forEach((m) => {
          const fullName = m.name || `${m.fname || ''} ${m.lname || ''}`.trim()
          console.log(`  - ${fullName}, Bib: ${m.bib || 'N/A'}`)
        })
        return this.ambiguousResult(
          matches.map((m) => ({
            name: m.name || `${m.fname || ''} ${m.lname || ''}`.trim(),
            bib: m.bib || null,
            time: null
          }))
        )
      }

      const profile = matches[0]
      const fullName = profile.name || `${profile.fname || ''} ${profile.lname || ''}`.trim()
      console.log(`\n[MCM] FOUND RUNNER:`)
      console.log(`  Name: ${fullName}`)
      console.log(`  Bib: ${profile.bib || 'N/A'}`)

      // RTRT profiles list does not always include finish time directly.
      // For now, we return bib & basic info; follow-up work can add a
      // secondary call to a splits/leaderboard endpoint to get official time.
      const rawTime = profile.finish_time || profile.time || null

      const normalizedTime = rawTime ? this.normalizeTime(rawTime) : null
      const time = this.formatTime(normalizedTime)
      const rawPace = normalizedTime ? this.calculatePace(normalizedTime, 26.2) : null
      const pace = this.formatPace(rawPace)

      return {
        found: true,
        bibNumber: profile.bib ? String(profile.bib) : null,
        officialTime: time,
        officialPace: pace,
        eventType: 'Marathon',
        yearFound: this.year,
        researchNotes: null,
        rawData: profile
      }
    } catch (error) {
      console.error(`[MCM] Error searching for ${runnerName}:`, error.message)
      return {
        ...this.notFoundResult(),
        researchNotes: `Error: ${error.message}`
      }
    }
  }

  /**
   * Low-level call to the RTRT /profiles endpoint.
   * @param {string} runnerName
   * @returns {Promise<Array>} Array of profile objects
   */
  async searchProfiles(runnerName) {
    const url = `${this.baseUrl}/events/${this.eventId}/profiles`

    const form = new URLSearchParams({
      max: '100',
      total: '1',
      failonmax: '1',
      appid: this.appId,
      token: this.token,
      search: runnerName,
      module: '0',
      source: 'webtracker'
    })

    console.log(`[MCM] POST ${url}`)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: form.toString()
    })

    console.log(`[MCM] Response status: ${response.status}`)

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`RTRT profiles error ${response.status}: ${text.slice(0, 300)}`)
    }

    const data = await response.json()
    const list = Array.isArray(data.list) ? data.list : []
    return list
  }
}

export default MarineCorpsMarathonScraper

