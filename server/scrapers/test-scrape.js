/**
 * Test script to explore NYRR results page HTML structure
 * Run: node server/scrapers/test-scrape.js
 */
import * as cheerio from 'cheerio'

async function testScrape() {
  // First, let's look at the settings file to find API config
  console.log('=== Fetching Settings ===\n')
  try {
    const settingsResponse = await fetch('https://results.nyrr.org/GetSettings/rms-settings.rjs')
    const settingsText = await settingsResponse.text()
    console.log('Settings (first 2000 chars):')
    console.log(settingsText.slice(0, 2000))
    console.log('\n')
  } catch (e) {
    console.log('Settings fetch failed:', e.message)
  }

  const year = '2024'
  const eventCode = `M${year}` // M2024 for NYC Marathon 2024
  const resultsUrl = `https://results.nyrr.org/event/${eventCode}/finishers`

  console.log(`Fetching: ${resultsUrl}\n`)

  try {
    // Step 1: Fetch the page
    const response = await fetch(resultsUrl)
    console.log(`Status: ${response.status}`)
    console.log(`Content-Type: ${response.headers.get('content-type')}\n`)

    const html = await response.text()
    console.log(`HTML length: ${html.length} characters\n`)

    // Step 2: Parse with cheerio
    const $ = cheerio.load(html)

    // Step 3: Inspect the structure
    console.log('=== Page Title ===')
    console.log($('title').text())

    console.log('\n=== Looking for forms ===')
    $('form').each((i, elem) => {
      console.log(`Form ${i}:`, $(elem).attr('action'), $(elem).attr('method'))
    })

    console.log('\n=== Looking for search inputs ===')
    $('input').each((i, elem) => {
      const name = $(elem).attr('name')
      const id = $(elem).attr('id')
      const type = $(elem).attr('type')
      const placeholder = $(elem).attr('placeholder')
      if (name || id) {
        console.log(`  Input: name="${name}" id="${id}" type="${type}" placeholder="${placeholder}"`)
      }
    })

    console.log('\n=== Looking for tables ===')
    $('table').each((i, elem) => {
      console.log(`Table ${i}: class="${$(elem).attr('class')}"`)
      const headers = []
      $(elem).find('th').each((j, th) => {
        headers.push($(th).text().trim())
      })
      if (headers.length) {
        console.log(`  Headers: ${headers.join(' | ')}`)
      }
    })

    console.log('\n=== Looking for result-related classes ===')
    const resultClasses = [
      '.result', '.results', '.finisher', '.finishers',
      '.runner', '.runners', '.participant', '.time',
      '[class*="result"]', '[class*="finish"]', '[class*="runner"]'
    ]
    for (const selector of resultClasses) {
      const count = $(selector).length
      if (count > 0) {
        console.log(`  ${selector}: ${count} elements`)
      }
    }

    console.log('\n=== Script tags (looking for data/API calls) ===')
    $('script').each((i, elem) => {
      const src = $(elem).attr('src')
      const content = $(elem).html()
      if (src) {
        console.log(`  External: ${src}`)
      } else if (content && content.includes('api')) {
        console.log(`  Inline script mentions "api":`)
        // Find lines with api
        const lines = content.split('\n').filter(l => l.toLowerCase().includes('api'))
        lines.slice(0, 5).forEach(l => console.log(`    ${l.trim().slice(0, 100)}`))
      }
    })

    console.log('\n=== First 3000 chars of HTML ===')
    console.log(html.slice(0, 3000))

  } catch (error) {
    console.error('Error:', error.message)
  }
}

testScrape()
