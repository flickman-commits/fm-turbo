// Shopify API configuration
const SHOPIFY_STORE = process.env.SHOPIFY_STORE || 'flickman-3247.myshopify.com'
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN
const SHOPIFY_API_VERSION = '2024-01'

// Fetch order details from Shopify
export async function fetchShopifyOrder(orderId: string) {
  try {
    const url = `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}/orders/${orderId}.json`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN || '',
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error(`Shopify API error for order ${orderId}:`, response.status)
      return null
    }

    const data = await response.json()
    return data.order
  } catch (error) {
    console.error(`Error fetching Shopify order ${orderId}:`, error)
    return null
  }
}

// Parse race name from product title
// e.g., "New York City Marathon Personalized Race Print" -> "New York City Marathon"
export function parseRaceName(productTitle: string | null): string {
  if (!productTitle) return 'Unknown Race'

  // Remove common suffixes
  const suffixes = [
    'Personalized Race Print',
    'Personalized Print',
    'Race Print',
    'Print'
  ]

  let raceName = productTitle
  for (const suffix of suffixes) {
    if (raceName.toLowerCase().endsWith(suffix.toLowerCase())) {
      raceName = raceName.slice(0, -suffix.length).trim()
      break
    }
  }

  return raceName || 'Unknown Race'
}

// Parse personalization string for runner name and year
export function parsePersonalization(personalizationString: string | null) {
  if (!personalizationString) {
    return { runnerName: 'Unknown Runner', raceYear: new Date().getFullYear() }
  }

  // Try to extract year (4 digit number)
  const yearMatch = personalizationString.match(/\b(20\d{2})\b/)
  const raceYear = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear()

  // Remove the year to get the runner name
  let runnerName = personalizationString.replace(/\b20\d{2}\b/, '').trim()

  // Clean up any extra separators
  runnerName = runnerName.replace(/^[-,\s]+|[-,\s]+$/g, '').trim()

  return {
    runnerName: runnerName || 'Unknown Runner',
    raceYear
  }
}

interface LineItemProperty {
  name?: string
  value?: string
}

interface LineItem {
  title?: string
  name?: string
  properties?: LineItemProperty[]
  variant_title?: string
}

// Extract personalization data from Shopify line items
export function extractPersonalizationFromLineItems(lineItems: LineItem[] | null) {
  if (!lineItems || lineItems.length === 0) return null

  const firstItem = lineItems[0]
  const productTitle = firstItem.title || firstItem.name

  // Look for personalization in line item properties
  let personalizationString: string | null = null
  if (firstItem.properties && firstItem.properties.length > 0) {
    // Properties are usually [{name: "...", value: "..."}]
    for (const prop of firstItem.properties) {
      // Look for common personalization property names
      const propName = (prop.name || '').toLowerCase()
      if (propName.includes('personali') || propName.includes('runner') ||
          propName.includes('name') || propName.includes('custom')) {
        personalizationString = prop.value || null
        break
      }
    }
    // If no specific match, use the first property value
    if (!personalizationString && firstItem.properties[0]) {
      personalizationString = firstItem.properties[0].value || null
    }
  }

  return {
    productTitle,
    personalizationString,
    variantTitle: firstItem.variant_title
  }
}

// CORS headers for API responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept'
}
