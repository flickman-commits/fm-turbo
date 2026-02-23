/**
 * Test script to explore Marine Corps Marathon (MCM) RTRT results APIs
 *
 * Goal:
 * - Open the public RTRT dashboard for MCM-2025
 * - Capture all network requests to api.rtrt.me while performing a runner search
 * - Log the request URLs, methods, bodies, and a sample of the JSON responses
 *
 * Usage:
 *   node server/scrapers/test-mcm-puppeteer.js "Runner Name"
 *
 * NOTE: This script is for discovery/debugging only. The production scraper
 * should ideally call the underlying JSON API directly instead of using
 * Puppeteer.
 */

import puppeteer from 'puppeteer'

async function captureMcmNetworkRequests(runnerName = 'Smith') {
  console.log('Launching browser for MCM-2025...\n')

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()

  const apiRequests = []

  page.on('request', (request) => {
    const url = request.url()
    if (url.includes('api.rtrt.me')) {
      apiRequests.push({
        url,
        method: request.method(),
        postData: request.postData(),
        headers: request.headers()
      })
    }
  })

  page.on('response', async (response) => {
    const url = response.url()
    if (url.includes('api.rtrt.me') && !url.endsWith('.js') && !url.endsWith('.css')) {
      const status = response.status()
      console.log(`Response: ${status} ${url}`)
      try {
        const contentType = response.headers()['content-type'] || ''
        if (contentType.includes('json')) {
          const json = await response.json()
          console.log('  Keys:', Object.keys(json))
          if (Array.isArray(json.results) && json.results.length > 0) {
            console.log('  First result keys:', Object.keys(json.results[0]))
            console.log(
              '  Sample result:',
              JSON.stringify(json.results[0], null, 2).slice(0, 800)
            )
          }
        }
      } catch {
        // ignore JSON parse errors
      }
    }
  })

  const url = 'https://track.rtrt.me/e/MCM-2025#/dashboard'
  console.log(`Navigating to: ${url}\n`)

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })

  // Give the embedded app time to load
  await new Promise((resolve) => setTimeout(resolve, 5000))

  console.log('\n=== Attempting to search for runner in embedded app ===\n')

  try {
    // The actual search UI lives inside the iframe created by embed.js
    const frame = page
      .frames()
      .find((f) => f.url().includes('app.rtrt.me') || f.name() === 'rtframe')

    if (!frame) {
      console.log('Could not find RTRT iframe (rtframe).')
    } else {
      // Heuristic: find a text/search input that looks like a search box
      const searchSelector =
        'input[type="search"], input[type="text"][placeholder*="search" i], input[placeholder*="runner" i], input[placeholder*="athlete" i]'

      await frame.waitForSelector(searchSelector, { timeout: 15000 })
      const searchInput = await frame.$(searchSelector)

      if (searchInput) {
        console.log(`Typing "${runnerName}" into search box...`)
        await searchInput.click({ clickCount: 3 })
        await searchInput.type(runnerName)
        await frame.keyboard.press('Enter')
        await new Promise((resolve) => setTimeout(resolve, 5000))
      } else {
        console.log('Search input not found with heuristic selector.')
      }
    }
  } catch (e) {
    console.log('Error while trying to interact with search UI:', e.message)
  }

  console.log('\n=== Logged api.rtrt.me requests ===\n')
  for (const req of apiRequests) {
    console.log(`${req.method} ${req.url}`)
    if (req.postData) {
      console.log(`  Body: ${req.postData}`)
    }
    console.log('')
  }

  await browser.close()
  console.log('\nBrowser closed.')
}

const nameArg = process.argv[2] || 'Smith'
captureMcmNetworkRequests(nameArg).catch((err) => {
  console.error('Error running MCM Puppeteer test:', err)
  process.exit(1)
})

