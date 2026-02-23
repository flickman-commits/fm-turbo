# Shopify Personalization Data Format - UPDATED

## Current Format (2025+)

As of 2025, Shopify sends personalization data as **separate properties** in the line items, making extraction much simpler.

### Two Order Types

1. **Normal Orders**: Standard race prints
   - Property name: `"Runner Name"`
   - Race name comes from product title

2. **Custom Orders**: Fully personalized prints
   - Property name: `"Runner Name (First & Last)"` (also mapped to `"Runner Name"`)
   - Race name from `"Race Name"` property (overrides product title)
   - Additional properties: Bib #, Time, etc.

**Both types are handled with the same standardized extraction logic.**

### Property Structure

```javascript
{
  "line_items": [
    {
      "title": "New York City Marathon Personalized Race Print",
      "properties": [
        {
          "name": "Race Name",  // Optional - overrides product title
          "value": "New York City Marathon"
        },
        {
          "name": "Race Year",
          "value": "2023"  // STRING, needs parseInt()
        },
        {
          "name": "Runner Name (First & Last)",  // Or "Runner Name"
          "value": "Jennifer Samp"  // ⚠️ May contain "no time"!
        },
        {
          "name": "Bib #",
          "value": "12345"  // Optional
        },
        {
          "name": "Time",
          "value": "4:23:15"  // Optional
        }
      ]
    }
  ]
}
```

### Extraction Logic with "No Time" Cleaning

```javascript
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

  // Parse race name from product title as fallback
  result.raceName = parseRaceName(item.title)

  // Extract from properties
  if (item.properties && Array.isArray(item.properties)) {
    for (const prop of item.properties) {
      const name = prop.name?.trim()
      const value = prop.value?.trim()

      // Standardized: Match all "Runner Name" variations
      if (name === 'Runner Name (First & Last)' ||
          name === 'Runner Name' ||
          name === 'runner name' ||
          name === 'runner_name') {
        // Clean runner name (removes "no time")
        result.runnerName = cleanRunnerName(value)
      }
      // Race year (comes as STRING, must parse to INT)
      else if (name === 'Race Year' ||
               name === 'race year' ||
               name === 'race_year') {
        const yearInt = parseInt(value, 10)
        result.raceYear = isNaN(yearInt) ? null : yearInt
      }
      // Race name (overrides product title if provided)
      else if (name === 'Race Name' ||
               name === 'race name' ||
               name === 'race_name') {
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
```

### Key Points

1. **Standardized Property Handling**
   - Both `"Runner Name"` and `"Runner Name (First & Last)"` are handled identically
   - Works for normal orders and custom orders

2. **"No Time" Cleaning** ⚠️
   - Customers may enter `"Jennifer Samp no time"` or just `"no time"`
   - The `cleanRunnerName()` function removes this invalid text
   - Examples:
     - `"Jennifer Samp no time"` → `"Jennifer Samp"`
     - `"no time Jennifer Samp"` → `"Jennifer Samp"`
     - `"Jennifer no time Samp"` → `"Jennifer Samp"`
     - `"no time"` → `null` (flagged for attention)
     - `"NO TIME"` → `null` (case-insensitive)

3. **Data Types**:
   - `runnerName`: **String** (cleaned, no parsing needed)
   - `raceYear`: **Number** (parse from string with `parseInt()`)
   - `raceName`: **String** (from property or product title)

4. **Validation**:
   - Set `needsAttention: true` if missing `runnerName` OR `raceYear`
   - Both fields are required for successful processing

5. **Race Name Priority**:
   - Product title is parsed as fallback (e.g., `"NYC Marathon Personalized Race Print"` → `"NYC Marathon"`)
   - `"Race Name"` property overrides this if present

## Testing

### "No Time" Cleaning Tests

```javascript
cleanRunnerName("Jennifer Samp no time")    // → "Jennifer Samp"
cleanRunnerName("no time Jennifer Samp")    // → "Jennifer Samp"
cleanRunnerName("Jennifer no time Samp")    // → "Jennifer Samp"
cleanRunnerName("no time")                  // → null
cleanRunnerName("NO TIME")                  // → null
cleanRunnerName("No Time")                  // → null
cleanRunnerName("John Doe No Time")         // → "John Doe"
```

### Full Extraction Test

Test with order ID: `7031533273371`

```json
{
  "runnerName": "David Benedetti",
  "raceYear": 2025,
  "raceName": "The Kerry Way Ultra"
}
```

## Usage in Your Projects

### Direct Extraction Example

```javascript
import { shopifyFetch } from './api/utils/shopifyAuth.js'

async function getOrderData(orderId) {
  const data = await shopifyFetch(`/orders/${orderId}.json`)
  const order = data.order

  const lineItems = order.line_items
  const firstItem = lineItems[0]

  let runnerName = null
  let raceYear = null
  let raceName = null

  // Extract from properties
  for (const prop of firstItem.properties || []) {
    // Standardized runner name (works for both order types)
    if (prop.name === 'Runner Name (First & Last)' ||
        prop.name === 'Runner Name') {
      runnerName = cleanRunnerName(prop.value)  // Clean "no time"
    }
    else if (prop.name === 'Race Year') {
      raceYear = parseInt(prop.value, 10)  // Convert string to int!
    }
    else if (prop.name === 'Race Name') {
      raceName = prop.value
    }
  }

  return { runnerName, raceYear, raceName }
}
```

### Database Storage

```prisma
model Order {
  runnerName       String      // "Jennifer Samp" (cleaned)
  raceYear         Int         // 2023 (as integer)
  raceName         String      // "New York City Marathon"
  shopifyOrderData Json?       // Full Shopify order JSON for reference
}
```

### Effective Values (with Overrides)

```javascript
// Always use effective values when retrieving data
const effectiveRunnerName = order.runnerNameOverride ?? order.runnerName
const effectiveRaceYear = order.yearOverride ?? order.raceYear
const effectiveRaceName = order.raceNameOverride ?? order.raceName
```

## Old Format (Pre-2025) - DEPRECATED

**Old Format**: Combined string like `"Jennifer Samp 2023"`

```javascript
// OLD: Single property with combined data
{
  "name": "runner name",
  "value": "Jennifer Samp 2023"
}

// Required regex parsing to extract year
const yearMatch = value.match(/\s+(20\d{2})$/)
```

This format is **no longer used** but parsing logic is preserved in `parseRunnerNameAndYear_DEPRECATED()` for reference.

## Updated Files

- ✅ `/api/orders/fetch-shopify-data.js` - Updated extraction logic + "no time" cleaning
- ✅ `/server/processOrders.js` - Updated extraction logic + "no time" cleaning
- ✅ Standardized property name handling for both order types
- ✅ Added `cleanRunnerName()` function to both files
- 📝 Old parsing functions renamed to `*_DEPRECATED` for reference

## Summary

**Key Changes:**
1. ✅ Separate properties for runner name and race year (no more parsing!)
2. ✅ Standardized handling: `"Runner Name"` works for both normal and custom orders
3. ✅ "No time" cleaning: Removes invalid customer entries automatically
4. ✅ Race name priority: Property overrides product title when present
5. ✅ Type safety: Year converted to integer, validation flags missing data
