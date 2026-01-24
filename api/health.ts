import type { VercelRequest, VercelResponse } from '@vercel/node'
import { corsHeaders } from './lib/helpers'

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader('Access-Control-Allow-Origin', '*').end()
  }

  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value)
  })

  return res.status(200).json({ status: 'ok' })
}
