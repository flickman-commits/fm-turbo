import type { VercelRequest, VercelResponse } from '@vercel/node'
import { corsHeaders } from './lib/helpers'

// Note: In serverless, this won't persist across invocations
// For production, use a database or KV store
let currentUserCount = 23

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader('Access-Control-Allow-Origin', '*').end()
  }

  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value)
  })

  if (req.method === 'GET') {
    return res.status(200).json({ count: currentUserCount })
  }

  if (req.method === 'POST') {
    const { count } = req.body
    if (typeof count === 'number' && count > 0) {
      currentUserCount = count
      return res.status(200).json({ success: true, count: currentUserCount })
    } else {
      return res.status(400).json({ success: false, message: 'Invalid count value' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
