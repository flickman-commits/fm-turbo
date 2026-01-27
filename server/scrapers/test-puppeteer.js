/**
 * Use Puppeteer to capture network requests from NYRR results page
 * This will show us what API endpoints the AngularJS app actually calls
 */
import puppeteer from 'puppeteer'

async function captureNetworkRequests() {
  console.log('Launching browser...\n')

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()

  // Collect all API requests
  const apiRequests = []

  // Listen for all requests
  page.on('request', request => {
    const url = request.url()
    if (url.includes('api') || url.includes('nyrr.org')) {
      apiRequests.push({
        url: url,
        method: request.method(),
        postData: request.postData(),
        headers: request.headers()
      })
    }
  })

  // Listen for responses
  page.on('response', async response => {
    const url = response.url()
    if (url.includes('api') && !url.includes('.js') && !url.includes('.css')) {
      console.log(`Response: ${response.status()} ${url}`)
      try {
        const contentType = response.headers()['content-type'] || ''
        if (contentType.includes('json')) {
          const json = await response.json()
          console.log('  Data keys:', Object.keys(json))
          if (json.items && json.items.length > 0) {
            console.log('  First item keys:', Object.keys(json.items[0]))
            console.log('  Sample:', JSON.stringify(json.items[0], null, 2).slice(0, 800))
          } else if (json.totalItems !== undefined) {
            console.log('  Total items:', json.totalItems)
          }
        }
      } catch (e) {
        // ignore
      }
    }
  })

  // Navigate to the results page
  const url = 'https://results.nyrr.org/event/M2024/finishers'
  console.log(`Navigating to: ${url}\n`)

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })

  // Wait a bit for any dynamic content to load
  await new Promise(resolve => setTimeout(resolve, 3000))

  console.log('\n=== All API Requests Made ===\n')
  for (const req of apiRequests) {
    if (req.url.includes('api') && !req.url.includes('.js')) {
      console.log(`${req.method} ${req.url}`)
      if (req.postData) {
        console.log(`  Body: ${req.postData}`)
      }
      console.log('')
    }
  }

  // Now try to search for a runner
  console.log('\n=== Attempting to search for a runner ===\n')

  // Find and fill the search input
  try {
    // Wait for search input to appear
    await page.waitForSelector('input[type="text"], input[type="search"], input[placeholder*="search" i]', { timeout: 10000 })

    // Type in the search box
    const searchInputs = await page.$$('input[type="text"], input[type="search"]')
    if (searchInputs.length > 0) {
      console.log(`Found ${searchInputs.length} search input(s), typing "Smith"...`)
      await searchInputs[0].type('Smith')
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Press Enter or click search button
      await searchInputs[0].press('Enter')
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
  } catch (e) {
    console.log('Could not find search input:', e.message)
  }

  console.log('\n=== Final API Requests ===\n')
  for (const req of apiRequests.slice(-10)) {
    if (req.url.includes('api') && !req.url.includes('.js')) {
      console.log(`${req.method} ${req.url}`)
      if (req.postData) {
        console.log(`  Body: ${req.postData}`)
      }
    }
  }

  await browser.close()
  console.log('\nBrowser closed.')
}

captureNetworkRequests().catch(console.error)
