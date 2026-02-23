# California International Marathon (CIM) Scraper

## Overview
The CIM scraper has been successfully built and integrated into the system. It uses the MyRace.ai API to fetch runner results.

## Implementation

### Files Created/Modified:
1. **`server/scrapers/races/cimMarathon.js`** - Main scraper class
2. **`server/scrapers/index.js`** - Updated to register CIM scraper
3. **`server/scrapers/test-cim-scraper.js`** - Test script

### Key Features:
- ✅ Fetches race data from MyRace.ai API
- ✅ Extracts bib number, finish time, pace
- ✅ Calculates race date (first Sunday in December)
- ✅ Supports multiple name variations (CIM, California International Marathon)
- ✅ Includes detailed runner data (age, gender, rankings, etc.)

## How It Works

**The CIM scraper searches by runner name only** - no PID required!

### Two-Step Process:
1. **Search by name** using MyRace.ai's search API
2. **Fetch detailed data** using the PID from search results

### Name Matching:
- Handles exact matches
- Detects ambiguous results (multiple runners with same name)
- Returns "not found" if no matches

### Search API:
```
GET https://myrace.ai/api/search-athletes?raceId=cim_2025&type=name&value=Hamilton+Evans
```

Returns basic info + PID, then fetches full details.

## Test Results

Successfully tested with name-only searches:

### Test 1: Hamilton Evans
- **Input**: "Hamilton Evans", 2025
- **Results**:
  - Found: ✅ (unique match)
  - Bib: 3022
  - Time: 2:59:35
  - Pace: 6:51/mi
  - Rank: 1387/8168

### Test 2: Michael Walsh
- **Input**: "Michael Walsh", 2025
- **Results**:
  - Found: ✅ (unique match)
  - Bib: 2521
  - Time: 2:52:10
  - Pace: 6:34/mi
  - Rank: 894/8168

## Race Name Matching

The scraper responds to these race name variations:
- "California International Marathon"
- "CIM Marathon"
- "CIM"
- Any variation containing "california international" and "marathon"

## Data Structure

### Input:
```javascript
{
  runnerName: "Hamilton Evans",
  year: 2025
}
// No PID required!
```

### Output:
```javascript
{
  found: true,
  bibNumber: "3022",
  officialTime: "2:59:35",
  officialPace: "6:51",
  eventType: "Marathon",
  yearFound: 2025,
  researchNotes: null,
  rawData: {
    firstName: "Hamilton",
    lastName: "Evans",
    gender: "M",
    age: 27,
    city: "New York",
    state: "NY",
    country: "USA",
    overallRank: 1387,
    genderRank: 1130,
    ageGroupRank: 274,
    ageGroup: "M25-29",
    totalAthletes: 8168,
    gunTime: "3:00:49",
    chipTime: "2:59:35",
    pace: "6:51"
  }
}
```

## Integration Status

✅ **Ready to use immediately!**

The CIM scraper works with the existing order flow - just needs:
- Runner name (already captured)
- Race year (already captured)

No additional fields or data collection required!

## API Endpoint

MyRace.ai API endpoint used:
```
GET https://myrace.ai/api/athlete-analysis-official?raceId=cim_2025&pid=3022
```

## Running Tests

```bash
cd /Users/flickman/Software/fm-turbo
node server/scrapers/test-cim-scraper.js
```

## Race Date

CIM is always held on the **first Sunday of December**.

The scraper automatically calculates this date for any year.
