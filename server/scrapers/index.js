/**
 * Scraper Factory
 * Routes race name to the appropriate scraper class
 */
import NYCMarathonScraper from './races/nycMarathon.js'

/**
 * Map of race names to scraper classes
 * Add new races here as we implement them
 */
const SCRAPER_MAP = {
  // NYC Marathon - various name formats
  'NYC Marathon': NYCMarathonScraper,
  'New York City Marathon': NYCMarathonScraper,
  'New York Marathon': NYCMarathonScraper,
  'TCS New York City Marathon': NYCMarathonScraper,
  'NYRR NYC Marathon': NYCMarathonScraper,

  // Add more races here as we implement them:
  // 'Chicago Marathon': ChicagoMarathonScraper,
  // 'Boston Marathon': BostonMarathonScraper,
  // 'Philadelphia Marathon': PhillyMarathonScraper,
}

/**
 * Get the appropriate scraper for a race
 * @param {string} raceName - Name of the race
 * @param {number} year - Year of the race
 * @returns {BaseScraper} Scraper instance
 * @throws {Error} If no scraper is available for the race
 */
export function getScraperForRace(raceName, year) {
  // Try exact match first
  let ScraperClass = SCRAPER_MAP[raceName]

  // If no exact match, try case-insensitive and partial matching
  if (!ScraperClass) {
    const normalizedName = raceName.toLowerCase().trim()

    for (const [key, value] of Object.entries(SCRAPER_MAP)) {
      if (key.toLowerCase() === normalizedName) {
        ScraperClass = value
        break
      }
      // Check if the race name contains key words
      if (normalizedName.includes('new york') || normalizedName.includes('nyc')) {
        if (normalizedName.includes('marathon')) {
          ScraperClass = NYCMarathonScraper
          break
        }
      }
    }
  }

  if (!ScraperClass) {
    throw new Error(`No scraper available for race: ${raceName}`)
  }

  return new ScraperClass(year)
}

/**
 * Check if we have a scraper for a given race
 * @param {string} raceName - Name of the race
 * @returns {boolean}
 */
export function hasScraperForRace(raceName) {
  try {
    getScraperForRace(raceName, 2024) // Year doesn't matter for this check
    return true
  } catch {
    return false
  }
}

/**
 * Get list of supported races
 * @returns {string[]} List of race names we can scrape
 */
export function getSupportedRaces() {
  // Return unique race names (remove duplicates from aliases)
  const uniqueRaces = new Set()
  uniqueRaces.add('NYC Marathon')
  // Add more as we implement them
  return Array.from(uniqueRaces)
}

export default {
  getScraperForRace,
  hasScraperForRace,
  getSupportedRaces
}
