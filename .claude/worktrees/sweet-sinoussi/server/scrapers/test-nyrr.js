/**
 * Test script for NYC Marathon scraper
 * Run: node server/scrapers/test-nyrr.js
 */

async function testNYRRAPI() {
  console.log('=== Testing NYRR API ===\n')

  const baseUrl = 'https://results.nyrr.org/api/v2'

  // Test: Runners search endpoint (this one works!)
  console.log('Test: Runners search endpoint')
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

    console.log(`  Status: ${response.status}`)
    if (response.ok) {
      const data = await response.json()
      console.log('  Total items:', data.totalItems)
      console.log('  Results:')
      for (const item of data.items || []) {
        console.log('    -', JSON.stringify(item, null, 2))
      }
    }
  } catch (error) {
    console.log('  Failed:', error.message)
  }

  console.log('\n--- Testing runner detail endpoint ---\n')

  // If we found a runner, we might need to fetch their race results
  // Let's try to find the runner races endpoint
  const testRunnerId = '47660296' // From the earlier search results

  console.log('Test: Runner races endpoint')
  try {
    const response = await fetch(`${baseUrl}/runners/${testRunnerId}/races`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      body: JSON.stringify({
        pageIndex: 1,
        pageSize: 10
      })
    })

    console.log(`  Status: ${response.status}`)
    if (response.ok) {
      const data = await response.json()
      console.log('  Data:', JSON.stringify(data, null, 2).slice(0, 1500))
    } else {
      console.log('  Error:', await response.text())
    }
  } catch (error) {
    console.log('  Failed:', error.message)
  }

  console.log('\n--- Testing finishers/search with eventCode filter ---\n')

  // Try the finishers/search endpoint with eventCode in body
  console.log('Test: finishers/search with eventCode')
  try {
    const response = await fetch(`${baseUrl}/finishers/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      body: JSON.stringify({
        eventCode: 'm2024',  // lowercase like in results
        searchString: 'Smith',
        pageIndex: 1,
        pageSize: 3
      })
    })

    console.log(`  Status: ${response.status}`)
    if (response.ok) {
      const data = await response.json()
      console.log('  Data:', JSON.stringify(data, null, 2).slice(0, 1500))
    } else {
      console.log('  Error:', await response.text())
    }
  } catch (error) {
    console.log('  Failed:', error.message)
  }

  console.log('\n--- Testing runners/search with eventCode filter ---\n')

  // Try adding eventCode to runners/search
  console.log('Test: runners/search with eventCode filter')
  try {
    const response = await fetch(`${baseUrl}/runners/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      body: JSON.stringify({
        eventCode: 'm2024',
        searchString: 'Jennifer Samp',
        pageIndex: 1,
        pageSize: 10
      })
    })

    console.log(`  Status: ${response.status}`)
    if (response.ok) {
      const data = await response.json()
      console.log('  Total items:', data.totalItems)
      console.log('  Data:', JSON.stringify(data.items, null, 2).slice(0, 1500))
    }
  } catch (error) {
    console.log('  Failed:', error.message)
  }

  console.log('\n--- Testing runner result endpoint ---\n')

  // Try to get a specific runner's result for an event
  const testRunnerId2 = '49923838' // Jennifer Samp's runnerId from search
  const testEventCode = 'm2025'

  console.log(`Test: runner/${testRunnerId2}/results for ${testEventCode}`)
  try {
    const response = await fetch(`${baseUrl}/runners/${testRunnerId2}/results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      body: JSON.stringify({
        eventCode: testEventCode,
        pageIndex: 1,
        pageSize: 10
      })
    })

    console.log(`  Status: ${response.status}`)
    if (response.ok) {
      const data = await response.json()
      console.log('  Data:', JSON.stringify(data, null, 2).slice(0, 2000))
    } else {
      console.log('  Error body:', await response.text())
    }
  } catch (error) {
    console.log('  Failed:', error.message)
  }

  console.log('\n--- Testing more endpoint patterns ---\n')

  // Try various GET endpoints for runner results
  const testEndpoints = [
    { url: `${baseUrl}/runners/49923838`, method: 'GET' },
    { url: `${baseUrl}/results/m2024`, method: 'GET' },
    { url: `${baseUrl}/events/m2024`, method: 'GET' },
    { url: `${baseUrl}/event/m2024/results`, method: 'GET' },
  ]

  for (const endpoint of testEndpoints) {
    console.log(`Test: ${endpoint.method} ${endpoint.url}`)
    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        }
      })

      console.log(`  Status: ${response.status}`)
      if (response.ok) {
        const data = await response.json()
        console.log('  Data:', JSON.stringify(data, null, 2).slice(0, 1000))
      }
    } catch (error) {
      console.log('  Failed:', error.message)
    }
  }

  console.log('\n--- Testing results/search with POST ---\n')

  // Try the generic results/search endpoint
  console.log('Test: POST results/search')
  try {
    const response = await fetch(`${baseUrl}/results/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      body: JSON.stringify({
        eventCode: 'm2024',
        searchString: 'John Smith',
        pageIndex: 1,
        pageSize: 5
      })
    })

    console.log(`  Status: ${response.status}`)
    if (response.ok) {
      const data = await response.json()
      console.log('  Data:', JSON.stringify(data, null, 2).slice(0, 1500))
    } else {
      console.log('  Error:', await response.text())
    }
  } catch (error) {
    console.log('  Failed:', error.message)
  }

  console.log('\n--- Testing with different API base ---\n')

  // Try v1 or other variations
  const apiVariations = [
    'https://results.nyrr.org/api',
    'https://results.nyrr.org/api/v1',
    'https://live.nyrr.org/api',
  ]

  for (const apiBase of apiVariations) {
    console.log(`Test: ${apiBase}/runners/search`)
    try {
      const response = await fetch(`${apiBase}/runners/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        body: JSON.stringify({
          searchString: 'Jennifer Samp',
          pageIndex: 1,
          pageSize: 3
        })
      })

      console.log(`  Status: ${response.status}`)
      if (response.ok) {
        const data = await response.json()
        console.log('  Sample keys:', Object.keys(data))
        if (data.items && data.items.length > 0) {
          console.log('  First item keys:', Object.keys(data.items[0]))
        }
      }
    } catch (error) {
      console.log('  Failed:', error.message)
    }
  }

  console.log('\n--- Testing race result detail ---\n')

  // From the working search, Jennifer Samp has runnerId 49923838 for eventCode m2025
  // Let's try to get her race result for that specific event
  console.log('Test: POST runners/49923838 (with body)')
  try {
    const response = await fetch(`${baseUrl}/runners/49923838`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      body: JSON.stringify({})
    })

    console.log(`  Status: ${response.status}`)
    if (response.ok) {
      const data = await response.json()
      console.log('  Data:', JSON.stringify(data, null, 2).slice(0, 1500))
    }
  } catch (error) {
    console.log('  Failed:', error.message)
  }

  // Try getting race result by bib for an event
  console.log('\nTest: POST bibs/search with eventCode')
  try {
    const response = await fetch(`${baseUrl}/bibs/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      body: JSON.stringify({
        eventCode: 'm2024',
        bibNumber: '15495',
        pageIndex: 1,
        pageSize: 10
      })
    })

    console.log(`  Status: ${response.status}`)
    if (response.ok) {
      const data = await response.json()
      console.log('  Data:', JSON.stringify(data, null, 2).slice(0, 1500))
    }
  } catch (error) {
    console.log('  Failed:', error.message)
  }
}

testNYRRAPI().catch(console.error)
