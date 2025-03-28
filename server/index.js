import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',              // Local development
  'https://turbo.flickman.media',       // Production domain
  'https://flickman.media',             // Additional domain
  'https://www.flickman.media',         // Additional domain with www
  'https://fm-turbo-nz1x.vercel.app'   // Vercel preview URL
];

// Function to validate if origin is a Vercel preview URL
const isVercelPreviewUrl = (origin) => {
  return origin && (
    origin.endsWith('.vercel.app') ||    // Vercel preview/deployment URLs
    origin.includes('-git-')             // Vercel branch deployments
  );
};

app.use(cors({
  origin: '*', // Allow all origins for now
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  optionsSuccessStatus: 200
}));

app.use(express.json());

// In-memory storage for user count (will persist as long as server is running)
let currentUserCount = 23;

// Feature request endpoint
app.post('/api/feature-request', async (req, res) => {
  try {
    const { type, description, feedback } = req.body;
    console.log('Received request:', { type, description, feedback });

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

    const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
    if (!SLACK_WEBHOOK_URL) {
      console.error('Slack webhook URL not configured');
      return res.status(500).json({ error: 'Slack webhook URL not configured' });
    }

    console.log('Sending to Slack...');
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error('Slack API error:', response.status, await response.text());
      throw new Error(`Failed to send to Slack: ${response.status}`);
    }

    console.log('Successfully sent to Slack');
    res.json({ success: true });
  } catch (error) {
    console.error('Error processing feature request:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Add these new endpoints
app.get('/api/user-count', (req, res) => {
  res.json({ count: currentUserCount });
});

app.post('/api/user-count', (req, res) => {
  const { count } = req.body;
  if (typeof count === 'number' && count > 0) {
    currentUserCount = count;
    res.json({ success: true, count: currentUserCount });
  } else {
    res.status(400).json({ success: false, message: 'Invalid count value' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('SLACK_WEBHOOK_URL configured:', !!process.env.SLACK_WEBHOOK_URL);
}); 