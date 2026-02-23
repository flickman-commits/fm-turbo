/**
 * Simple test harness for MarineCorpsMarathonScraper
 *
 * Usage:
 *   node server/scrapers/test-mcm-scraper.js "Lewis Smith"
 */

import { MarineCorpsMarathonScraper } from './races/marineCorpsMarathon.js'

async function run() {
  const name = process.argv[2] || 'Lewis Smith'
  const year = 2025

  const scraper = new MarineCorpsMarathonScraper(year)
  const result = await scraper.searchRunner(name)

  console.log('\n=== Scraper Result ===\n')
  console.dir(result, { depth: null })
}

run().catch((err) => {
  console.error('Error running Marine Corps Marathon scraper test:', err)
  process.exit(1)
})

