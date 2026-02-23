/**
 * Test the finishers-filter endpoint we discovered from the website
 * Endpoint: POST https://rmsprodapi.nyrr.org/api/v2/runners/finishers-filter
 */

async function testFinishersAPI() {
  const baseUrl = 'https://rmsprodapi.nyrr.org/api/v2'

  console.log('=== Testing finishers-filter API ===\n')

  // Test 1: Search for "Smith" in 2024 Marathon
  console.log('--- Test 1: Search for "Smith" in M2024 ---')
  try {
    const response = await fetch(`${baseUrl}/runners/finishers-filter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Origin': 'https://results.nyrr.org',
        'Referer': 'https://results.nyrr.org/'
      },
      body: JSON.stringify({
        eventCode: 'M2024',
        searchString: 'Smith',
        handicap: null,
        sortColumn: 'overallTime',
        sortDescending: false,
        pageIndex: 1,
        pageSize: 10
      })
    })

    console.log(`Status: ${response.status}`)
    if (response.ok) {
      const data = await response.json()
      console.log('Total items:', data.totalItems)
      console.log('First 3 results:')
      for (const item of data.items?.slice(0, 3) || []) {
        console.log(`  - ${item.firstName} ${item.lastName}`)
        console.log(`    Bib: ${item.bib}, Time: ${item.overallTime}, Pace: ${item.pace}`)
        console.log(`    Place: ${item.overallPlace}, City: ${item.city}`)
      }
    } else {
      console.log('Error:', await response.text())
    }
  } catch (error) {
    console.log('Failed:', error.message)
  }

  // Test 2: Search for specific runner name
  console.log('\n--- Test 2: Search for "Jennifer Samp" in M2024 ---')
  try {
    const response = await fetch(`${baseUrl}/runners/finishers-filter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Origin': 'https://results.nyrr.org',
        'Referer': 'https://results.nyrr.org/'
      },
      body: JSON.stringify({
        eventCode: 'M2024',
        searchString: 'Jennifer Samp',
        handicap: null,
        sortColumn: 'overallTime',
        sortDescending: false,
        pageIndex: 1,
        pageSize: 10
      })
    })

    console.log(`Status: ${response.status}`)
    if (response.ok) {
      const data = await response.json()
      console.log('Total items:', data.totalItems)
      if (data.items?.length > 0) {
        console.log('Results:')
        for (const item of data.items) {
          console.log(`  - ${item.firstName} ${item.lastName}`)
          console.log(`    Bib: ${item.bib}, Time: ${item.overallTime}, Pace: ${item.pace}`)
          console.log(`    Place: ${item.overallPlace}, City: ${item.city}, ${item.stateProvince || item.countryCode}`)
        }
      } else {
        console.log('No results found')
      }
    }
  } catch (error) {
    console.log('Failed:', error.message)
  }

  // Test 3: Try M2023
  console.log('\n--- Test 3: Search for "Jennifer Samp" in M2023 ---')
  try {
    const response = await fetch(`${baseUrl}/runners/finishers-filter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Origin': 'https://results.nyrr.org',
        'Referer': 'https://results.nyrr.org/'
      },
      body: JSON.stringify({
        eventCode: 'M2023',
        searchString: 'Jennifer Samp',
        handicap: null,
        sortColumn: 'overallTime',
        sortDescending: false,
        pageIndex: 1,
        pageSize: 10
      })
    })

    console.log(`Status: ${response.status}`)
    if (response.ok) {
      const data = await response.json()
      console.log('Total items:', data.totalItems)
      if (data.items?.length > 0) {
        console.log('Results:')
        for (const item of data.items) {
          console.log(`  - ${item.firstName} ${item.lastName}`)
          console.log(`    Bib: ${item.bib}, Time: ${item.overallTime}, Pace: ${item.pace}`)
        }
      } else {
        console.log('No results found')
      }
    }
  } catch (error) {
    console.log('Failed:', error.message)
  }

  // Test 4: Full field details for one result
  console.log('\n--- Test 4: Get first Smith result with all fields ---')
  try {
    const response = await fetch(`${baseUrl}/runners/finishers-filter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Origin': 'https://results.nyrr.org',
        'Referer': 'https://results.nyrr.org/'
      },
      body: JSON.stringify({
        eventCode: 'M2024',
        searchString: 'John Smith',
        handicap: null,
        sortColumn: 'overallTime',
        sortDescending: false,
        pageIndex: 1,
        pageSize: 5
      })
    })

    if (response.ok) {
      const data = await response.json()
      if (data.items?.length > 0) {
        console.log('Full result object:')
        console.log(JSON.stringify(data.items[0], null, 2))
      }
    }
  } catch (error) {
    console.log('Failed:', error.message)
  }
}

testFinishersAPI()
