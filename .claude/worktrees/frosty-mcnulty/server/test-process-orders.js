#!/usr/bin/env node
/**
 * Test script for processOrders
 *
 * Usage:
 *   node server/test-process-orders.js                    # Import only
 *   node server/test-process-orders.js --research         # Import + research
 *   node server/test-process-orders.js --research-only    # Research existing NYC orders
 */

import { PrismaClient } from '@prisma/client'
import { processOrders } from './processOrders.js'
import { researchService } from './services/ResearchService.js'
import { hasScraperForRace } from './scrapers/index.js'

const prisma = new PrismaClient()

async function main() {
  const args = process.argv.slice(2)
  const runResearch = args.includes('--research')
  const researchOnly = args.includes('--research-only')

  console.log('\n' + '='.repeat(60))
  console.log('TRACKSTAR ORDER PROCESSOR TEST')
  console.log('='.repeat(60))

  if (researchOnly) {
    // Research existing orders that support scraping
    console.log('\nMode: Research existing orders only\n')

    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['pending', 'missing_year'] }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`Found ${orders.length} pending orders:`)

    for (const order of orders) {
      const hasScraper = hasScraperForRace(order.raceName)
      console.log(`  ${hasScraper ? '✅' : '❌'} ${order.orderNumber}: ${order.raceName} ${order.raceYear} - ${order.runnerName}`)

      if (hasScraper && order.raceYear) {
        console.log(`     Running research...`)
        try {
          const result = await researchService.researchOrder(order.orderNumber)
          if (result.runnerResearch.researchStatus === 'found') {
            console.log(`     ✅ Found: Bib ${result.runnerResearch.bibNumber}, Time: ${result.runnerResearch.officialTime}`)
          } else {
            console.log(`     ❌ ${result.runnerResearch.researchStatus}: ${result.runnerResearch.researchNotes || 'No notes'}`)
          }
        } catch (error) {
          console.log(`     ❌ Error: ${error.message}`)
        }
      }
    }

    await researchService.disconnect()

  } else {
    // Normal import flow
    console.log(`\nMode: Import orders${runResearch ? ' + research' : ''}\n`)

    const results = await processOrders({
      runResearch,
      verbose: true
    })

    console.log('\n' + '='.repeat(60))
    console.log('FINAL SUMMARY')
    console.log('='.repeat(60))
    console.log(`
  Total from Artelo: ${results.total}
  New imports:       ${results.imported}
  Updated:           ${results.updated}
  Skipped:           ${results.skipped}
  Enriched:          ${results.enriched}
  Needs attention:   ${results.needsAttention}
  ${runResearch ? `Researched:        ${results.researched}` : ''}
  ${runResearch ? `Research failed:   ${results.researchFailed}` : ''}
  Errors:            ${results.errors.length}
`)

    if (results.errors.length > 0) {
      console.log('Errors:')
      results.errors.forEach(e => console.log(`  - ${e.orderNumber || 'unknown'}: ${e.error}`))
    }
  }

  await prisma.$disconnect()
}

main().catch(console.error)
