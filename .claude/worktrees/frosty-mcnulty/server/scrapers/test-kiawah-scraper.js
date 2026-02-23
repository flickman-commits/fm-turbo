/**
 * Test script for Kiawah Island Marathon scraper
 * Usage: node test-kiawah-scraper.js
 */
import KiawahIslandMarathonScraper from './races/kiawahIslandMarathon.js'

async function testKiawahScraper() {
  console.log('Testing Kiawah Island Marathon Scraper\n')

  // Test case: Real runner from Kiawah 2025
  const scraper = new KiawahIslandMarathonScraper(2025)
  const runnerName = 'Yowana Wamala' // From our previous test

  console.log('='.repeat(60))
  console.log('TEST: Searching for Yowana Wamala in Kiawah 2025')
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

    // Test with another common name to see if we get results
    console.log('\n3. Testing with another runner "John Smith"...')
    const partialResult = await scraper.searchRunner('John Smith')
    console.log('\nResult:', JSON.stringify(partialResult, null, 2))

    // Test URL extraction (useful for manual lookups)
    console.log('\n4. Testing extractResultSetIdFromUrl()...')
    const testUrls = [
      'https://runsignup.com/Race/Results/139050/615623',
      'https://runsignup.com/Race/Results/139050/617138',
    ]
    testUrls.forEach(url => {
      const resultSetId = KiawahIslandMarathonScraper.extractResultSetIdFromUrl(url)
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
testKiawahScraper()
