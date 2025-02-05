import { NextApiRequest, NextApiResponse } from 'next'

interface FeatureRequest {
  type: 'bug' | 'feature'
  description: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { type, description } = req.body as FeatureRequest

    if (!type || !description) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const emoji = type === 'bug' ? '🐛' : '✨'
    const title = type === 'bug' ? 'Bug Report' : 'Feature Request'

    const message = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} New ${title}`,
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: description
          }
        }
      ]
    }

    const slackResponse = await fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (!slackResponse.ok) {
      throw new Error('Failed to send message to Slack')
    }

    return res.status(200).json({ message: 'Request submitted successfully' })
  } catch (error) {
    console.error('Error handling feature request:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
} 