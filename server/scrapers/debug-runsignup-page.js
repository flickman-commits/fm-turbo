/**
 * Debug script to inspect RunSignUp page structure
 * Usage: node debug-runsignup-page.js
 */
import puppeteer from 'puppeteer'

async function debugRunSignUpPage() {
  console.log('Debugging RunSignUp page structure...\n')

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()

    // Navigate to Kiawah 2025 results
    const url = 'https://runsignup.com/Race/Results/139050/615623#resultSetId-615623'
    console.log(`Loading: ${url}\n`)

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    })

    console.log('Page loaded, waiting 5 seconds...')
    await new Promise(resolve => setTimeout(resolve, 5000))

    // Take screenshot
    await page.screenshot({ path: '/tmp/runsignup-debug.png', fullPage: true })
    console.log('Screenshot saved to /tmp/runsignup-debug.png')

    // Get page title
    const title = await page.title()
    console.log(`Page title: ${title}`)

    // Check for search box with different selectors
    const selectors = [
      'input#search-box',
      'input[type="search"]',
      'input[type="text"]',
      'input.search',
      'input[name="search"]',
      'input[placeholder*="search" i]',
      'input[placeholder*="name" i]'
    ]

    console.log('\nChecking for search input with different selectors:')
    for (const selector of selectors) {
      const element = await page.$(selector)
      if (element) {
        const attrs = await page.evaluate(el => {
          return {
            id: el.id,
            name: el.name,
            placeholder: el.placeholder,
            className: el.className,
            type: el.type
          }
        }, element)
        console.log(`  ✅ FOUND: ${selector}`)
        console.log(`     Attributes:`, attrs)
      } else {
        console.log(`  ❌ NOT FOUND: ${selector}`)
      }
    }

    // Get all input elements on the page
    const allInputs = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'))
      return inputs.map(input => ({
        id: input.id,
        name: input.name,
        type: input.type,
        placeholder: input.placeholder,
        className: input.className
      }))
    })

    console.log(`\nAll input elements on page (${allInputs.length} total):`)
    allInputs.forEach((input, idx) => {
      console.log(`  ${idx + 1}. ${JSON.stringify(input)}`)
    })

    // Check for tables
    const tables = await page.$$('table')
    console.log(`\nTables found: ${tables.length}`)

    // Get page HTML snippet
    const bodyHTML = await page.evaluate(() => document.body.innerHTML.slice(0, 2000))
    console.log(`\nFirst 2000 chars of body HTML:\n${bodyHTML}`)

    // Close immediately after inspection
    console.log('\nDebug complete.')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await browser.close()
  }
}

debugRunSignUpPage()
