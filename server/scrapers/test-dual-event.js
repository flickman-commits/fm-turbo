/**
 * Test script to verify both Marathon and Half Marathon search work
 * Usage: node test-dual-event.js
 */
import KiawahIslandMarathonScraper from './races/kiawahIslandMarathon.js'

async function testDualEvent() {
  console.log('Testing Dual Event Search (Marathon + Half Marathon)\n')

  const scraper = new KiawahIslandMarathonScraper(2025)

  console.log('='.repeat(60))
  console.log('TEST 1: Search for a common name (should find in one of the events)')
  console.log('='.repeat(60))

  try {
    const result = await scraper.searchRunner('John Smith')
    console.log('\nResult:', JSON.stringify(result, null, 2))

    if (result.found) {
      console.log(`\n✅ Found runner in ${result.eventType}!`)
    } else {
      console.log(`\n❌ Runner not found in either event`)
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:')
    console.error(error)
  }
}

testDualEvent()
