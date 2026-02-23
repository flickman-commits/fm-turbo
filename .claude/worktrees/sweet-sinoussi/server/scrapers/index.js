/**
 * Scraper Factory
 * Routes race name to the appropriate scraper class
 */
import NYCMarathonScraper from './races/nycMarathon.js'
import ChicagoMarathonScraper from './races/chicagoMarathon.js'
import PhiladelphiaMarathonScraper from './races/philadelphiaMarathon.js'
import MarineCorpsMarathonScraper from './races/marineCorpsMarathon.js'
import CIMMarathonScraper from './races/cimMarathon.js'
import KiawahIslandMarathonScraper from './races/kiawahIslandMarathon.js'
import LouisianaMarathonScraper from './races/louisianaMarathon.js'
import AustinMarathonScraper from './races/austinMarathon.js'

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

  // Chicago Marathon - various name formats
  'Chicago Marathon': ChicagoMarathonScraper,
  'Bank of America Chicago Marathon': ChicagoMarathonScraper,
  'BOA Chicago Marathon': ChicagoMarathonScraper,

  // Philadelphia Marathon - various name formats
  'Philadelphia Marathon': PhiladelphiaMarathonScraper,
  'Philadelphia Marathon (Full)': PhiladelphiaMarathonScraper,
  'Philly Marathon': PhiladelphiaMarathonScraper,

  // Marine Corps Marathon - various name formats
  'Marine Corps Marathon': MarineCorpsMarathonScraper,
  'MCM Marathon': MarineCorpsMarathonScraper,
  'MCM': MarineCorpsMarathonScraper,

  // California International Marathon - various name formats
  'California International Marathon': CIMMarathonScraper,
  'CIM Marathon': CIMMarathonScraper,
  'CIM': CIMMarathonScraper,

  // Kiawah Island Marathon - various name formats
  'Kiawah Island Marathon': KiawahIslandMarathonScraper,
  'Kiawah Marathon': KiawahIslandMarathonScraper,
  'Kiawah': KiawahIslandMarathonScraper,

  // Louisiana Marathon - various name formats
  'Louisiana Marathon': LouisianaMarathonScraper,
  'The Louisiana Marathon': LouisianaMarathonScraper,

  // Austin Marathon - various name formats
  'Austin Marathon': AustinMarathonScraper,
  'Austin Marathon 2026': AustinMarathonScraper,
  'Ascension Seton Austin Marathon': AustinMarathonScraper,

  // Add more races here as we implement them:
  // 'Boston Marathon': BostonMarathonScraper,
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
    }

    // Check if the race name contains key words for NYC
    if (!ScraperClass && (normalizedName.includes('new york') || normalizedName.includes('nyc'))) {
      if (normalizedName.includes('marathon')) {
        ScraperClass = NYCMarathonScraper
      }
    }

    // Check if the race name contains key words for Chicago
    if (!ScraperClass && normalizedName.includes('chicago')) {
      if (normalizedName.includes('marathon')) {
        ScraperClass = ChicagoMarathonScraper
      }
    }

    // Check if the race name contains key words for Philadelphia
    if (
      !ScraperClass &&
      (normalizedName.includes('philadelphia') || normalizedName.includes('philly'))
    ) {
      if (normalizedName.includes('marathon')) {
        ScraperClass = PhiladelphiaMarathonScraper
      }
    }

    // Check if the race name contains key words for Marine Corps Marathon
    if (
      !ScraperClass &&
      (normalizedName.includes('marine corps') || normalizedName.includes('mcm'))
    ) {
      if (normalizedName.includes('marathon')) {
        ScraperClass = MarineCorpsMarathonScraper
      }
    }

    // Check if the race name contains key words for CIM
    if (
      !ScraperClass &&
      (normalizedName.includes('california international') || normalizedName.includes('cim'))
    ) {
      if (normalizedName.includes('marathon') || normalizedName === 'cim') {
        ScraperClass = CIMMarathonScraper
      }
    }

    // Check if the race name contains key words for Kiawah Island
    if (
      !ScraperClass &&
      normalizedName.includes('kiawah')
    ) {
      if (normalizedName.includes('marathon') || normalizedName === 'kiawah') {
        ScraperClass = KiawahIslandMarathonScraper
      }
    }

    // Check if the race name contains key words for Louisiana
    if (
      !ScraperClass &&
      normalizedName.includes('louisiana')
    ) {
      if (normalizedName.includes('marathon')) {
        ScraperClass = LouisianaMarathonScraper
      }
    }

    // Check if the race name contains key words for Austin
    if (
      !ScraperClass &&
      normalizedName.includes('austin')
    ) {
      if (normalizedName.includes('marathon')) {
        ScraperClass = AustinMarathonScraper
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
  uniqueRaces.add('Chicago Marathon')
  uniqueRaces.add('Philadelphia Marathon')
  uniqueRaces.add('Marine Corps Marathon')
  uniqueRaces.add('California International Marathon')
  uniqueRaces.add('Kiawah Island Marathon')
  uniqueRaces.add('Louisiana Marathon')
  uniqueRaces.add('Austin Marathon')
  // Add more as we implement them
  return Array.from(uniqueRaces)
}

export default {
  getScraperForRace,
  hasScraperForRace,
  getSupportedRaces
}
