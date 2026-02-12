/**
 * Test script for Louisiana Marathon scraper
 * Usage: node test-louisiana-scraper.js
 */
import LouisianaMarathonScraper from './races/louisianaMarathon.js'

async function testLouisianaScraper() {
  console.log('Testing Louisiana Marathon Scraper\n')

  // Test with 2025 Louisiana Marathon
  const scraper = new LouisianaMarathonScraper(2025)
  const runnerName = 'John Smith' // Common name for testing

  console.log('='.repeat(60))
  console.log('TEST: Searching for a runner in Louisiana 2025')
  console.log('='.repeat(60))

  try {
    // Test getRaceInfo
    console.log('\n1. Testing getRaceInfo()...')
    const raceInfo = await scraper.getRaceInfo()
    console.log('Race Info:', JSON.stringify(raceInfo, null, 2))

    // Test searchRunner by name
    console.log('\n2. Testing searchRunner() by name only...')
    const result = await scraper.searchRunner(runnerName)
    console.log('\nResult:', JSON.stringify(result, null, 2))

    // Test URL extraction (useful for manual lookups)
    console.log('\n3. Testing extractResultSetIdFromUrl()...')
    const testUrls = [
      'https://runsignup.com/Race/Results/100074/523599',
      'https://runsignup.com/Race/Results/100074/433945',
    ]
    testUrls.forEach(url => {
      const resultSetId = LouisianaMarathonScraper.extractResultSetIdFromUrl(url)
      console.log(`  ${url} → Result Set ID: ${resultSetId}`)
    })

    console.log('\n' + '='.repeat(60))
    console.log('✅ All tests completed successfully!')
    console.log('='.repeat(60))

  } catch (error) {
    console.error('\n❌ Test failed with error:')
    console.error(error)
  }
}

// Run the test
testLouisianaScraper()
