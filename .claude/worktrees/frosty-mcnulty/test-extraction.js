// Test the new Shopify data extraction logic

// Sample data from actual Shopify order 7031533273371
const sampleLineItems = [
  {
    title: "The Kerry Way Ultra Personalized Race Print",
    properties: [
      { name: "Race Name", value: "The Kerry Way Ultra" },
      { name: "Race Year", value: "2025" },
      { name: "Runner Name (First & Last)", value: "David Benedetti" },
      { name: "Bib #", value: "110" },
      { name: "Time", value: "35:51:23" },
      { name: "_tpo_add_by", value: "easify" }
    ]
  }
]

// Extraction function (copied from updated code)
function extractShopifyPersonalization(lineItems) {
  const result = {
    raceName: null,
    runnerName: null,
    raceYear: null,
    needsAttention: false
  }

  if (!lineItems || lineItems.length === 0) {
    result.needsAttention = true
    return result
  }

  const item = lineItems[0]

  // Simple race name parsing (remove "Personalized Race Print")
  if (item.title) {
    result.raceName = item.title
      .replace(/Personalized Race Print/i, '')
      .trim()
  }

  // Extract from properties
  if (item.properties && Array.isArray(item.properties)) {
    for (const prop of item.properties) {
      const name = (prop.name || '').trim()
      const value = (prop.value || '').trim()

      // Runner name
      if (name === 'Runner Name (First & Last)' || name === 'runner name' || name === 'runner_name') {
        result.runnerName = value || null
      }
      // Race year
      else if (name === 'Race Year' || name === 'race year' || name === 'race_year') {
        const yearInt = parseInt(value, 10)
        result.raceYear = isNaN(yearInt) ? null : yearInt
      }
      // Race name (override product title if provided)
      else if (name === 'Race Name' || name === 'race name' || name === 'race_name') {
        if (value) {
          result.raceName = value
        }
      }
    }
  }

  // Flag if missing critical data
  if (!result.runnerName || !result.raceYear) {
    result.needsAttention = true
  }

  return result
}

// Run test
console.log('\n🧪 Testing Shopify Data Extraction\n')
console.log('Input Data:')
console.log(JSON.stringify(sampleLineItems, null, 2))

console.log('\n' + '='.repeat(60))
console.log('\nExtracted Data:')

const result = extractShopifyPersonalization(sampleLineItems)
console.log(JSON.stringify(result, null, 2))

console.log('\n' + '='.repeat(60))
console.log('\n✅ Validation:')
console.log(`Runner Name: ${result.runnerName} ${result.runnerName === 'David Benedetti' ? '✅' : '❌'}`)
console.log(`Race Year: ${result.raceYear} (type: ${typeof result.raceYear}) ${result.raceYear === 2025 ? '✅' : '❌'}`)
console.log(`Race Name: ${result.raceName} ${result.raceName === 'The Kerry Way Ultra' ? '✅' : '❌'}`)
console.log(`Needs Attention: ${result.needsAttention} ${result.needsAttention === false ? '✅' : '❌'}`)

console.log('\n' + '='.repeat(60) + '\n')

if (result.runnerName === 'David Benedetti' &&
    result.raceYear === 2025 &&
    typeof result.raceYear === 'number' &&
    result.raceName === 'The Kerry Way Ultra' &&
    result.needsAttention === false) {
  console.log('🎉 ALL TESTS PASSED!\n')
} else {
  console.log('❌ SOME TESTS FAILED\n')
  process.exit(1)
}
