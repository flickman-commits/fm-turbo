/**
 * Local development API server
 *
 * Runs your Vercel serverless functions as a regular Express server.
 * Vite proxies /api/* requests here during local development.
 */
import express from 'express'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
app.use(express.json())

// Map each API route to its Vercel handler
const routes = [
  { method: 'get',  path: '/api/orders',                    handler: '../api/orders/index.js' },
  { method: 'post', path: '/api/orders/import',              handler: '../api/orders/import.js' },
  { method: 'post', path: '/api/orders/research-runner',     handler: '../api/orders/research-runner.js' },
  { method: 'post', path: '/api/orders/accept-match',        handler: '../api/orders/accept-match.js' },
  { method: 'post', path: '/api/orders/update',              handler: '../api/orders/update.js' },
  { method: 'post', path: '/api/orders/complete',            handler: '../api/orders/complete.js' },
  { method: 'post', path: '/api/orders/clear-research',      handler: '../api/orders/clear-research.js' },
  { method: 'get',  path: '/api/orders/clear-race-cache',    handler: '../api/orders/clear-race-cache.js' },
  { method: 'get',  path: '/api/orders/refresh-weather',     handler: '../api/orders/refresh-weather.js' },
  { method: 'post', path: '/api/orders/refresh-shopify-data', handler: '../api/orders/refresh-shopify-data.js' },
  { method: 'post', path: '/api/orders/fetch-shopify-data',  handler: '../api/orders/fetch-shopify-data.js' },
  { method: 'get',  path: '/api/orders/test-scrapers',      handler: '../api/orders/test-scrapers.js' },
  { method: 'post', path: '/api/orders/test-scrapers',      handler: '../api/orders/test-scrapers.js' },
]

// Load all handlers and register routes
for (const route of routes) {
  const mod = await import(route.handler)
  const handler = mod.default

  // Register for the specific method, plus OPTIONS for CORS preflight
  app[route.method](route.path, handler)
  app.options(route.path, (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.status(204).end()
  })
}

const PORT = process.env.API_PORT || 3001
app.listen(PORT, () => {
  console.log(`\n  ⚡ API server running at http://localhost:${PORT}\n`)
})
