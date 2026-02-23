/**
 * Test the production NYRR API
 * The real API is at: https://rmsprodapi.nyrr.org/api/v2
 */

async function testProdAPI() {
  const baseUrl = 'https://rmsprodapi.nyrr.org/api/v2'

  console.log('=== Testing Production NYRR API ===\n')
  console.log(`Base URL: ${baseUrl}\n`)

  // Test 1: Search for runners
  console.log('--- Test 1: runners/search ---')
  try {
    const response = await fetch(`${baseUrl}/runners/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      body: JSON.stringify({
        searchString: 'Jennifer Samp',
        pageIndex: 1,
        pageSize: 10
      })
    })

    console.log(`Status: ${response.status}`)
    if (response.ok) {
      const data = await response.json()
      console.log('Total items:', data.totalItems)
      console.log('First result:', JSON.stringify(data.items?.[0], null, 2))
    } else {
      console.log('Error:', await response.text())
    }
  } catch (error) {
    console.log('Failed:', error.message)
  }

  // Test 2: Event finishers search (the main one we need!)
  console.log('\n--- Test 2: finishers/search ---')
  try {
    const response = await fetch(`${baseUrl}/finishers/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      body: JSON.stringify({
        eventCode: 'M2024',
        searchString: 'Smith',
        pageIndex: 1,
        pageSize: 5
      })
    })

    console.log(`Status: ${response.status}`)
    if (response.ok) {
      const data = await response.json()
      console.log('Total items:', data.totalItems)
      console.log('First result:', JSON.stringify(data.items?.[0], null, 2))
    } else {
      console.log('Error:', await response.text())
    }
  } catch (error) {
    console.log('Failed:', error.message)
  }

  // Test 3: Search for a specific name in an event
  console.log('\n--- Test 3: finishers/search for Jennifer Samp in M2024 ---')
  try {
    const response = await fetch(`${baseUrl}/finishers/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      body: JSON.stringify({
        eventCode: 'M2024',
        searchString: 'Jennifer Samp',
        pageIndex: 1,
        pageSize: 10
      })
    })

    console.log(`Status: ${response.status}`)
    if (response.ok) {
      const data = await response.json()
      console.log('Total items:', data.totalItems)
      if (data.items && data.items.length > 0) {
        console.log('Results:')
        data.items.forEach((item, i) => {
          console.log(`\n  [${i}]:`, JSON.stringify(item, null, 4))
        })
      } else {
        console.log('No items found')
      }
    } else {
      console.log('Error:', await response.text())
    }
  } catch (error) {
    console.log('Failed:', error.message)
  }

  // Test various endpoint patterns
  const endpoints = [
    { path: 'events/M2024/finishers/search', body: { searchString: 'Smith', pageIndex: 1, pageSize: 3 } },
    { path: 'events/M2024/results/search', body: { searchString: 'Smith', pageIndex: 1, pageSize: 3 } },
    { path: 'events/M2024/runners/search', body: { searchString: 'Smith', pageIndex: 1, pageSize: 3 } },
    { path: 'event/M2024/finishers/search', body: { searchString: 'Smith', pageIndex: 1, pageSize: 3 } },
    { path: 'results/search', body: { eventCode: 'M2024', searchString: 'Smith', pageIndex: 1, pageSize: 3 } },
    { path: 'race/M2024/results', body: { searchString: 'Smith', pageIndex: 1, pageSize: 3 } },
  ]

  console.log('\n--- Testing multiple endpoint patterns ---\n')
  for (const ep of endpoints) {
    console.log(`Testing: ${ep.path}`)
    try {
      const response = await fetch(`${baseUrl}/${ep.path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        body: JSON.stringify(ep.body)
      })
      console.log(`  Status: ${response.status}`)
      if (response.ok) {
        const data = await response.json()
        console.log('  Keys:', Object.keys(data))
        if (data.items?.[0]) {
          console.log('  First item keys:', Object.keys(data.items[0]))
        }
      }
    } catch (error) {
      console.log(`  Failed: ${error.message}`)
    }
  }

  // Try to get runner details with races
  console.log('\n--- Test: Get runner details with all races ---\n')
  // From earlier search: Jennifer Samp runnerId is 49923838 for m2025
  const runnerId = 49923838

  const runnerEndpoints = [
    `runners/${runnerId}`,
    `runners/${runnerId}/races`,
    `runners/${runnerId}/results`,
    `runner/${runnerId}/races`,
  ]

  for (const path of runnerEndpoints) {
    console.log(`Testing: ${path}`)
    try {
      // Try POST
      let response = await fetch(`${baseUrl}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        body: JSON.stringify({ pageIndex: 1, pageSize: 10 })
      })
      console.log(`  POST Status: ${response.status}`)
      if (response.ok) {
        const data = await response.json()
        console.log('  Data:', JSON.stringify(data, null, 2).slice(0, 500))
      }
    } catch (error) {
      console.log(`  Failed: ${error.message}`)
    }
  }
}

testProdAPI()
