import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { type, description, feedback } = req.body
    console.log('Received request:', { type, description, feedback })

    const message = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `New ${type === 'bug' ? 'Bug Report' : 'Feature Request'} 🚀`,
            emoji: true
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Description:*\n${description}`
          }
        }
      ] as Array<{type: string; text: {type: string; text: string; emoji?: boolean}}>
    }

    if (feedback) {
      message.blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Most Useful Feature:*\n${feedback}`
        }
      })
    }

    const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL
    if (!SLACK_WEBHOOK_URL) {
      console.error('Slack webhook URL not configured')
      return res.status(500).json({ error: 'Slack webhook URL not configured' })
    }

    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      console.error('Slack API error:', response.status, await response.text())
      throw new Error(`Failed to send to Slack: ${response.status}`)
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error processing feature request:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' })
  }
}
