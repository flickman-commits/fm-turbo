/**
 * Test script for CIM Marathon scraper
 * Usage: node test-cim-scraper.js
 */
import CIMMarathonScraper from './races/cimMarathon.js'

async function testCIMScraper() {
  console.log('Testing CIM Marathon Scraper\n')

  // Test case: Hamilton Evans, CIM 2025
  const scraper = new CIMMarathonScraper(2025)
  const runnerName = 'Hamilton Evans'
  const pid = 3022

  console.log('='.repeat(60))
  console.log('TEST: Searching for Hamilton Evans in CIM 2025')
  console.log('='.repeat(60))

  try {
    // Test getRaceInfo
    console.log('\n1. Testing getRaceInfo()...')
    const raceInfo = await scraper.getRaceInfo()
    console.log('Race Info:', JSON.stringify(raceInfo, null, 2))

    // Test searchRunner by name (no PID required!)
    console.log('\n2. Testing searchRunner() by name only...')
    const result = await scraper.searchRunner(runnerName)
    console.log('\nResult:', JSON.stringify(result, null, 2))

    // Test with a common partial name to see ambiguous handling
    console.log('\n3. Testing with partial name "Michael"...')
    const partialResult = await scraper.searchRunner('Michael Walsh')
    console.log('\nResult:', JSON.stringify(partialResult, null, 2))

    // Test URL extraction (still useful for manual lookups)
    console.log('\n4. Testing extractPidFromUrl()...')
    const testUrls = [
      'https://myrace.ai/athletes/cim-2025/3022',
      'https://myrace.ai/athletes/cim_2025/3022',
      'https://myrace.ai/athletes/CIM-2024/1234',
    ]
    testUrls.forEach(url => {
      const pid = CIMMarathonScraper.extractPidFromUrl(url)
      console.log(`  ${url} → PID: ${pid}`)
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
testCIMScraper()
