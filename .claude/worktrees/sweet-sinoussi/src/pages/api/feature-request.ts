interface FeatureRequest {
  type: 'bug' | 'feature'
  description: string
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  try {
    const body = await req.json() as FeatureRequest
    const { type, description } = body

    if (!type || !description) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      })
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

    return new Response(JSON.stringify({ message: 'Request submitted successfully' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error handling feature request:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
} 