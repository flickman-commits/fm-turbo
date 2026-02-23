#!/usr/bin/env node

/**
 * Test script to inspect how Shopify line item properties come back
 * with the new separate "runner name" and "race year" fields
 */

import { shopifyFetch } from './api/utils/shopifyAuth.js'

async function testShopifyData() {
  console.log('🔍 Testing Shopify Data Structure\n')
  console.log('=' .repeat(60))

  // You'll need to provide a recent Shopify order ID to test
  const testOrderId = process.argv[2]

  if (!testOrderId) {
    console.error('❌ Error: Please provide a Shopify order ID')
    console.log('\nUsage: node test-shopify-data.js <shopify_order_id>')
    console.log('Example: node test-shopify-data.js 5551234567890')
    process.exit(1)
  }

  try {
    console.log(`\n📦 Fetching Order ID: ${testOrderId}\n`)

    // Fetch the order from Shopify
    const data = await shopifyFetch(`/orders/${testOrderId}.json`)
    const order = data.order

    if (!order) {
      console.error('❌ Order not found')
      process.exit(1)
    }

    console.log('✅ Order fetched successfully')
    console.log(`Order Name: ${order.name}`)
    console.log(`Created At: ${order.created_at}`)
    console.log(`Line Items: ${order.line_items?.length || 0}`)
    console.log('\n' + '='.repeat(60))

    // Inspect each line item and its properties
    order.line_items.forEach((item, index) => {
      console.log(`\n📋 LINE ITEM ${index + 1}`)
      console.log('-'.repeat(60))
      console.log(`Title: ${item.title}`)
      console.log(`SKU: ${item.sku}`)
      console.log(`Quantity: ${item.quantity}`)

      if (item.properties && item.properties.length > 0) {
        console.log(`\n🏷️  Properties (${item.properties.length} found):`)
        item.properties.forEach((prop, propIndex) => {
          console.log(`\n  [${propIndex + 1}]`)
          console.log(`    Name: "${prop.name}"`)
          console.log(`    Value: "${prop.value}"`)
          console.log(`    Value Type: ${typeof prop.value}`)
          console.log(`    Name (lowercase): "${prop.name.toLowerCase()}"`)
        })
      } else {
        console.log('\n⚠️  No properties found on this line item')
      }
    })

    console.log('\n' + '='.repeat(60))
    console.log('\n🔍 EXTRACTED DATA:\n')

    // Test extraction logic
    const extracted = extractPropertiesTest(order.line_items)
    console.log('Runner Name:')
    console.log(`  Raw Value: "${extracted.runnerName}"`)
    console.log(`  Type: ${typeof extracted.runnerName}`)
    console.log(`  Found: ${extracted.runnerName ? '✅' : '❌'}`)

    console.log('\nRace Year:')
    console.log(`  Raw Value: "${extracted.raceYear}"`)
    console.log(`  Type: ${typeof extracted.raceYear}`)
    console.log(`  Found: ${extracted.raceYear ? '✅' : '❌'}`)

    console.log('\nProduct Title:')
    console.log(`  Value: "${extracted.productTitle}"`)

    console.log('\n' + '='.repeat(60))
    console.log('\n📄 RAW JSON (for detailed inspection):\n')
    console.log(JSON.stringify(order.line_items, null, 2))

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    if (error.response) {
      console.error('Response status:', error.response.status)
      console.error('Response data:', error.response.data)
    }
    process.exit(1)
  }
}

/**
 * Test extraction function to see what we can pull from the new format
 */
function extractPropertiesTest(lineItems) {
  const result = {
    runnerName: null,
    raceYear: null,
    productTitle: null
  }

  if (!lineItems || lineItems.length === 0) {
    return result
  }

  // Get product title from first item
  const firstItem = lineItems[0]
  result.productTitle = firstItem.title || null

  // Look for properties in all line items
  for (const item of lineItems) {
    if (!item.properties || !Array.isArray(item.properties)) {
      continue
    }

    for (const prop of item.properties) {
      const name = (prop.name || '').toLowerCase().trim()
      const value = prop.value

      // Check for "runner name" property
      if (name === 'runner name' || name === 'runner_name') {
        result.runnerName = value
      }

      // Check for "race year" property
      if (name === 'race year' || name === 'race_year') {
        result.raceYear = value
      }
    }

    // If we found both, we can stop looking
    if (result.runnerName && result.raceYear) {
      break
    }
  }

  return result
}

// Run the test
testShopifyData()
