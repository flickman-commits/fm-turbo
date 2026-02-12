/**
 * Debug script to check table structure and search results
 * Usage: node debug-table-structure.js
 */
import puppeteer from 'puppeteer'

async function debugTableStructure() {
  console.log('Debugging table structure and search...\n')

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()

    // Navigate to Kiawah 2025 results - Full Marathon
    const url = 'https://runsignup.com/Race/Results/139050/615623#resultSetId-615623'
    console.log(`Loading: ${url}\n`)

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    })

    // Wait for page to render
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Wait for search
    await page.waitForSelector('input#resultsSearch', { timeout: 15000 })
    console.log('Search box found')

    // Get table count before search
    const tablesBefore = await page.$$('table')
    console.log(`\nTables found: ${tablesBefore.length}`)

    // Check for table rows before search
    const rowsBefore = await page.evaluate(() => {
      const tables = document.querySelectorAll('table')
      console.log('Tables:', tables.length)

      const rows = document.querySelectorAll('table tbody tr')
      return {
        totalRows: rows.length,
        visibleRows: Array.from(rows).filter(r => window.getComputedStyle(r).display !== 'none').length,
        tableClasses: Array.from(tables).map(t => t.className)
      }
    })
    console.log('\nBefore search:')
    console.log('  Total rows:', rowsBefore.totalRows)
    console.log('  Visible rows:', rowsBefore.visibleRows)
    console.log('  Table classes:', rowsBefore.tableClasses)

    // Type a common name in search
    await page.type('input#resultsSearch', 'Smith')
    console.log('\nTyped "Smith" in search box')

    // Wait for filtering
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Check for table rows after search
    const rowsAfter = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr')
      const visibleRows = Array.from(rows).filter(r => window.getComputedStyle(r).display !== 'none')

      return {
        totalRows: rows.length,
        visibleRows: visibleRows.length,
        sampleVisible: visibleRows.slice(0, 3).map(r => {
          const cells = Array.from(r.querySelectorAll('td'))
          return cells.map(c => c.innerText.trim()).join(' | ')
        })
      }
    })
    console.log('\nAfter search:')
    console.log('  Total rows:', rowsAfter.totalRows)
    console.log('  Visible rows:', rowsAfter.visibleRows)
    console.log('  Sample visible rows:')
    rowsAfter.sampleVisible.forEach((row, idx) => {
      console.log(`    ${idx + 1}. ${row}`)
    })

    // Get first table structure
    const tableStructure = await page.evaluate(() => {
      const table = document.querySelector('table')
      if (!table) return null

      const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.innerText.trim())
      const firstRow = table.querySelector('tbody tr')
      const cells = firstRow ? Array.from(firstRow.querySelectorAll('td')).map(td => ({
        text: td.innerText.trim().slice(0, 50),
        index: Array.from(td.parentElement.children).indexOf(td)
      })) : []

      return { headers, firstRowCells: cells }
    })

    console.log('\nTable structure:')
    console.log('  Headers:', tableStructure?.headers)
    console.log('  First row cells:', tableStructure?.firstRowCells)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await browser.close()
  }
}

debugTableStructure()
