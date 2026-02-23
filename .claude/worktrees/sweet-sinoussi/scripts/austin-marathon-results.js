import puppeteer from 'puppeteer';

// Austin Marathon event IDs
const EVENTS = {
  marathon: '17035',
  halfMarathon: '17034'
};

/**
 * Search for a runner's results in the Austin Marathon
 * @param {string} firstName - Runner's first name
 * @param {string} lastName - Runner's last name
 * @param {string} eventType - 'marathon' or 'halfMarathon'
 * @returns {Promise<Object>} Runner's results
 */
async function searchRunner(firstName, lastName, eventType = 'marathon') {
  const eventId = EVENTS[eventType];

  if (!eventId) {
    throw new Error(`Invalid event type: ${eventType}. Use 'marathon' or 'halfMarathon'`);
  }

  const url = `https://www.mychiptime.com/searchevent.php?id=${eventId}`;

  console.log(`Searching for ${firstName} ${lastName} in Austin ${eventType}...`);
  console.log(`URL: ${url}`);

  const browser = await puppeteer.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Fill in the search form
    await page.type('input[name="firstname"]', firstName);
    await page.type('input[name="lastname"]', lastName);

    // Click search button and wait for results
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('input[type="submit"][value="Search"]')
    ]);

    // Extract results from the page
    const results = await page.evaluate(() => {
      const resultsTable = document.querySelector('table.table-striped');

      if (!resultsTable) {
        return null;
      }

      const rows = Array.from(resultsTable.querySelectorAll('tbody tr'));

      if (rows.length === 0) {
        return null;
      }

      // Get all matching results (in case there are multiple people with same name)
      return rows.map(row => {
        const cells = row.querySelectorAll('td');

        if (cells.length < 9) {
          return null;
        }

        return {
          overallPlace: cells[0]?.textContent?.trim() || '',
          gunTime: cells[1]?.textContent?.trim() || '',
          chipTime: cells[2]?.textContent?.trim() || '',
          bib: cells[3]?.textContent?.trim() || '',
          firstName: cells[4]?.textContent?.trim() || '',
          lastName: cells[5]?.textContent?.trim() || '',
          city: cells[6]?.textContent?.trim() || '',
          state: cells[7]?.textContent?.trim() || '',
          division: cells[8]?.textContent?.trim() || '',
          classPosition: cells[9]?.textContent?.trim() || ''
        };
      }).filter(result => result !== null);
    });

    if (!results || results.length === 0) {
      console.log('No results found.');
      return null;
    }

    console.log(`Found ${results.length} result(s):`);
    results.forEach((result, index) => {
      console.log(`\n--- Result ${index + 1} ---`);
      console.log(`Name: ${result.firstName} ${result.lastName}`);
      console.log(`Bib: ${result.bib}`);
      console.log(`Overall Place: ${result.overallPlace}`);
      console.log(`Gun Time: ${result.gunTime}`);
      console.log(`Chip Time: ${result.chipTime}`);
      console.log(`Division: ${result.division}`);
      console.log(`Class Position: ${result.classPosition}`);
      console.log(`Location: ${result.city}, ${result.state}`);
    });

    return results.length === 1 ? results[0] : results;

  } catch (error) {
    console.error('Error searching for runner:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Get results by bib number
 * @param {string} bibNumber - Runner's bib number
 * @param {string} eventType - 'marathon' or 'halfMarathon'
 * @returns {Promise<Object>} Runner's results
 */
async function searchByBib(bibNumber, eventType = 'marathon') {
  const eventId = EVENTS[eventType];

  if (!eventId) {
    throw new Error(`Invalid event type: ${eventType}. Use 'marathon' or 'halfMarathon'`);
  }

  const url = `https://www.mychiptime.com/searchevent.php?id=${eventId}`;

  console.log(`Searching for bib #${bibNumber} in Austin ${eventType}...`);

  const browser = await puppeteer.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Fill in the bib number search
    await page.type('input[name="bib"]', bibNumber);

    // Click search button and wait for results
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('input[type="submit"][value="Search"]')
    ]);

    // Extract results from the page
    const result = await page.evaluate(() => {
      const resultsTable = document.querySelector('table.table-striped');

      if (!resultsTable) {
        return null;
      }

      const row = resultsTable.querySelector('tbody tr');

      if (!row) {
        return null;
      }

      const cells = row.querySelectorAll('td');

      if (cells.length < 9) {
        return null;
      }

      return {
        overallPlace: cells[0]?.textContent?.trim() || '',
        gunTime: cells[1]?.textContent?.trim() || '',
        chipTime: cells[2]?.textContent?.trim() || '',
        bib: cells[3]?.textContent?.trim() || '',
        firstName: cells[4]?.textContent?.trim() || '',
        lastName: cells[5]?.textContent?.trim() || '',
        city: cells[6]?.textContent?.trim() || '',
        state: cells[7]?.textContent?.trim() || '',
        division: cells[8]?.textContent?.trim() || '',
        classPosition: cells[9]?.textContent?.trim() || ''
      };
    });

    if (!result) {
      console.log('No results found.');
      return null;
    }

    console.log('\n--- Result ---');
    console.log(`Name: ${result.firstName} ${result.lastName}`);
    console.log(`Bib: ${result.bib}`);
    console.log(`Overall Place: ${result.overallPlace}`);
    console.log(`Gun Time: ${result.gunTime}`);
    console.log(`Chip Time: ${result.chipTime}`);
    console.log(`Division: ${result.division}`);
    console.log(`Class Position: ${result.classPosition}`);
    console.log(`Location: ${result.city}, ${result.state}`);

    return result;

  } catch (error) {
    console.error('Error searching for runner:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Example usage
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  Search by name: node scripts/austin-marathon-results.js <firstName> <lastName> [marathon|halfMarathon]');
    console.log('  Search by bib:  node scripts/austin-marathon-results.js --bib <bibNumber> [marathon|halfMarathon]');
    console.log('\nExamples:');
    console.log('  node scripts/austin-marathon-results.js John Smith');
    console.log('  node scripts/austin-marathon-results.js John Smith halfMarathon');
    console.log('  node scripts/austin-marathon-results.js --bib 12345');
    console.log('  node scripts/austin-marathon-results.js --bib 12345 marathon');
    return;
  }

  try {
    if (args[0] === '--bib') {
      const bibNumber = args[1];
      const eventType = args[2] || 'marathon';
      await searchByBib(bibNumber, eventType);
    } else {
      const firstName = args[0];
      const lastName = args[1];
      const eventType = args[2] || 'marathon';
      await searchRunner(firstName, lastName, eventType);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Export functions for use in other modules
export { searchRunner, searchByBib, EVENTS };
