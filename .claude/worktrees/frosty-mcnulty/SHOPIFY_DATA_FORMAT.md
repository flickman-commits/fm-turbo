# Shopify Personalization Data Format

## Current Format (2025+)

As of 2025, Shopify sends personalization data as **separate properties** in the line items, making extraction much simpler.

### Property Structure

```javascript
{
  "line_items": [
    {
      "title": "New York City Marathon Personalized Race Print",
      "properties": [
        {
          "name": "Race Name",
          "value": "New York City Marathon"
        },
        {
          "name": "Race Year",
          "value": "2023"  // STRING, needs parseInt()
        },
        {
          "name": "Runner Name (First & Last)",
          "value": "Jennifer Samp"
        },
        {
          "name": "Bib #",
          "value": "12345"  // Optional
        },
        {
          "name": "Time",
          "value": "4:23:15"  // Optional, not always present
        }
      ]
    }
  ]
}
```

### Extraction Logic

```javascript
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

      // Runner name
      if (name === 'Runner Name (First & Last)') {
        result.runnerName = value || null
      }
      // Race year (comes as STRING, must parse to INT)
      else if (name === 'Race Year') {
        const yearInt = parseInt(value, 10)
        result.raceYear = isNaN(yearInt) ? null : yearInt
      }
      // Race name (overrides product title if provided)
      else if (name === 'Race Name') {
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

1. **Property Names**: Use exact case-sensitive matches
   - Primary: `"Runner Name (First & Last)"`, `"Race Year"`, `"Race Name"`
   - Fallbacks: Also check lowercase variants for compatibility

2. **Data Types**:
   - `runnerName`: String (direct extraction, no parsing needed)
   - `raceYear`: **String in Shopify** → must use `parseInt()` to convert to number
   - `raceName`: String (from property or product title)

3. **Validation**:
   - Set `needsAttention: true` if missing `runnerName` OR `raceYear`
   - Both fields are required for successful processing

4. **Product Title Fallback**:
   - Product title (e.g., `"New York City Marathon Personalized Race Print"`) is parsed as fallback
   - The `"Race Name"` property overrides this if present

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
    if (prop.name === 'Runner Name (First & Last)') {
      runnerName = prop.value
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
  runnerName       String      // "Jennifer Samp"
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

## Updated Files

- ✅ `/api/orders/fetch-shopify-data.js` - Updated extraction logic
- ✅ `/server/processOrders.js` - Updated extraction logic
- 📝 Old parsing functions renamed to `*_DEPRECATED` for reference

## Testing

Test with order ID: `7031533273371`

Expected result:
```json
{
  "runnerName": "David Benedetti",
  "raceYear": 2025,
  "raceName": "The Kerry Way Ultra"
}
```
