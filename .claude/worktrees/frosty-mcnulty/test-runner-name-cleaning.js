// Test runner name cleaning with "no time" variations

function cleanRunnerName(runnerName) {
  if (!runnerName) return null

  let cleaned = runnerName.trim()

  // Remove "no time" (case-insensitive)
  cleaned = cleaned.replace(/\bno\s+time\b/gi, '')

  // Clean up multiple spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim()

  // If nothing left after cleaning, return null
  if (!cleaned || cleaned.length === 0) {
    return null
  }

  return cleaned
}

const testCases = [
  // Normal cases
  { input: 'Jennifer Samp', expected: 'Jennifer Samp', description: 'Normal name' },
  { input: 'David Benedetti', expected: 'David Benedetti', description: 'Normal name 2' },

  // "no time" variations
  { input: 'Jennifer Samp no time', expected: 'Jennifer Samp', description: 'Name with "no time" at end' },
  { input: 'no time Jennifer Samp', expected: 'Jennifer Samp', description: 'Name with "no time" at start' },
  { input: 'Jennifer no time Samp', expected: 'Jennifer Samp', description: 'Name with "no time" in middle' },
  { input: 'no time', expected: null, description: 'Only "no time"' },
  { input: 'NO TIME', expected: null, description: 'Only "NO TIME" (uppercase)' },
  { input: 'No Time', expected: null, description: 'Only "No Time" (mixed case)' },
  { input: 'John Doe No Time', expected: 'John Doe', description: 'Name with "No Time" (mixed case)' },

  // Edge cases
  { input: '', expected: null, description: 'Empty string' },
  { input: null, expected: null, description: 'Null input' },
  { input: '   ', expected: null, description: 'Only whitespace' },
  { input: '  Jennifer Samp  ', expected: 'Jennifer Samp', description: 'Name with extra whitespace' },
]

console.log('\n🧪 Testing Runner Name Cleaning\n')
console.log('='.repeat(70))

let passed = 0
let failed = 0

testCases.forEach((test, index) => {
  const result = cleanRunnerName(test.input)
  const success = result === test.expected

  if (success) {
    passed++
    console.log(`✅ Test ${index + 1}: ${test.description}`)
  } else {
    failed++
    console.log(`❌ Test ${index + 1}: ${test.description}`)
    console.log(`   Input: "${test.input}"`)
    console.log(`   Expected: ${test.expected === null ? 'null' : `"${test.expected}"`}`)
    console.log(`   Got: ${result === null ? 'null' : `"${result}"`}`)
  }
})

console.log('\n' + '='.repeat(70))
console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests\n`)

if (failed === 0) {
  console.log('🎉 ALL TESTS PASSED!\n')
  process.exit(0)
} else {
  console.log('❌ SOME TESTS FAILED\n')
  process.exit(1)
}
