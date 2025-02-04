interface RequestBody {
  type: 'bug' | 'feature';
  description: string;
  feedback?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as RequestBody;
    const { type, description, feedback } = body;

    // Format the message for Slack
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
      ]
    };

    // Add feedback section if provided
    if (feedback) {
      message.blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Most Useful Feature:*\n${feedback}`
        }
      });
    }

    // Send to Slack
    const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
    if (!SLACK_WEBHOOK_URL) {
      return new Response(JSON.stringify({ error: 'Slack webhook URL not configured' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error('Failed to send to Slack');
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error processing feature request:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 