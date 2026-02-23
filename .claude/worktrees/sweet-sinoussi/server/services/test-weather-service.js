/**
 * Test script for WeatherService
 * Usage: node test-weather-service.js
 */
import WeatherService from './WeatherService.js'

async function testWeatherService() {
  console.log('Testing WeatherService with Open-Meteo API\n')

  const weatherService = new WeatherService()

  // Test cases with known races
  const testCases = [
    {
      name: 'NYC Marathon 2024',
      date: new Date('2024-11-03'),
      location: 'New York, NY'
    },
    {
      name: 'Boston Marathon 2024',
      date: new Date('2024-04-15'),
      location: 'Boston, MA'
    },
    {
      name: 'Chicago Marathon 2024',
      date: new Date('2024-10-13'),
      location: 'Chicago, IL'
    },
    {
      name: 'Kiawah Island Marathon 2024',
      date: new Date('2024-12-14'),
      location: 'Kiawah Island, SC'
    }
  ]

  for (const testCase of testCases) {
    console.log('='.repeat(60))
    console.log(`Testing: ${testCase.name}`)
    console.log(`Date: ${testCase.date.toDateString()}`)
    console.log(`Location: ${testCase.location}`)
    console.log('='.repeat(60))

    try {
      const weather = await weatherService.getHistoricalWeather(testCase.date, testCase.location)

      console.log('\n✅ Result:')
      console.log(`  Temperature: ${weather.temp || 'N/A'}`)
      console.log(`  Condition: ${weather.condition || 'N/A'}`)

      if (weather.temp && weather.condition) {
        console.log(`  ✓ Successfully fetched weather data`)
      } else {
        console.log(`  ⚠ Partial or no data returned`)
      }

    } catch (error) {
      console.error(`\n❌ Error: ${error.message}`)
    }

    console.log('')
  }

  console.log('='.repeat(60))
  console.log('All tests completed!')
  console.log('='.repeat(60))
}

testWeatherService()
