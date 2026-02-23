import puppeteer from 'puppeteer';

export interface MarathonResult {
  overallPlace: string;
  gunTime: string;
  chipTime: string;
  bib: string;
  firstName: string;
  lastName: string;
  city: string;
  state: string;
  division: string;
  classPosition: string;
}

export type EventType = 'marathon' | 'halfMarathon';

const EVENTS: Record<EventType, string> = {
  marathon: '17035',
  halfMarathon: '17034'
};

/**
 * Search for a runner's results in the Austin Marathon
 */
export async function searchRunner(
  firstName: string,
  lastName: string,
  eventType: EventType = 'marathon'
): Promise<MarathonResult | MarathonResult[] | null> {
  const eventId = EVENTS[eventType];

  if (!eventId) {
    throw new Error(`Invalid event type: ${eventType}. Use 'marathon' or 'halfMarathon'`);
  }

  const url = `https://www.mychiptime.com/searchevent.php?id=${eventId}`;

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

      // Get all matching results
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
      }).filter((result): result is NonNullable<typeof result> => result !== null);
    });

    if (!results || results.length === 0) {
      return null;
    }

    return results.length === 1 ? results[0] : results;

  } finally {
    await browser.close();
  }
}

/**
 * Get results by bib number
 */
export async function searchByBib(
  bibNumber: string,
  eventType: EventType = 'marathon'
): Promise<MarathonResult | null> {
  const eventId = EVENTS[eventType];

  if (!eventId) {
    throw new Error(`Invalid event type: ${eventType}. Use 'marathon' or 'halfMarathon'`);
  }

  const url = `https://www.mychiptime.com/searchevent.php?id=${eventId}`;

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

    return result;

  } finally {
    await browser.close();
  }
}
