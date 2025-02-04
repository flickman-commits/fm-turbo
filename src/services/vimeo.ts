import { Vimeo } from '@vimeo/vimeo';
import { Video } from '@/types/forms';

// These should be in your environment variables
const VIMEO_CLIENT_ID = process.env.NEXT_PUBLIC_VIMEO_CLIENT_ID || '';
const VIMEO_CLIENT_SECRET = process.env.NEXT_PUBLIC_VIMEO_CLIENT_SECRET || '';
const VIMEO_ACCESS_TOKEN = process.env.NEXT_PUBLIC_VIMEO_ACCESS_TOKEN || '';

const client = new Vimeo(
  VIMEO_CLIENT_ID,
  VIMEO_CLIENT_SECRET,
  VIMEO_ACCESS_TOKEN
);

interface VimeoVideo {
  uri: string;
  name: string;
  description: string;
  link: string;
  pictures: {
    base_link: string;
  };
  metadata: {
    connections: {
      likes: {
        total: number;
      };
    };
    interactions: {
      view: {
        total: number;
      };
    };
  };
  tags: Array<{ tag: { name: string } }>;
}

interface VimeoResponse {
  data: VimeoVideo[];
}

type VimeoCallback = (error: Error | null, body: VimeoResponse, statusCode: number, headers: Record<string, string>) => void;

export async function fetchUserVideos(userId: string = 'flickman'): Promise<Video[]> {
  return new Promise((resolve, reject) => {
    const callback: VimeoCallback = (error, body, _statusCode, _headers) => {
      if (error) {
        console.error('Error fetching Vimeo videos:', error);
        return reject(error);
      }

      const videos: Video[] = body.data.map((video: VimeoVideo) => {
        // Determine project type from video tags
        const projectType = determineProjectType(video.tags);

        return {
          id: video.uri.split('/').pop() || '',
          title: video.name,
          description: video.description || null,
          url: video.link,
          thumbnail: video.pictures?.base_link || null,
          views: video.metadata.interactions.view.total,
          likes: video.metadata.connections.likes.total,
          projectType
        };
      });

      resolve(videos);
    };

    client.request({
      method: 'GET',
      path: `/users/${userId}/videos`,
      query: {
        fields: 'uri,name,description,link,pictures.base_link,metadata.connections.likes.total,metadata.interactions.view.total,tags'
      }
    }, callback);
  });
}

function determineProjectType(tags: Array<{ tag: { name: string } }>): string {
  const tagNames = tags.map(tag => tag.tag.name.toLowerCase());
  
  if (tagNames.some(tag => tag.includes('corporate') || tag.includes('company'))) {
    return 'corporate';
  }
  if (tagNames.some(tag => tag.includes('brand') || tag.includes('story'))) {
    return 'brand';
  }
  if (tagNames.some(tag => tag.includes('product') || tag.includes('commercial'))) {
    return 'product';
  }
  
  return 'other';
}

// This function will populate our mock database with real video data
export async function generateMockDatabase(): Promise<Video[]> {
  try {
    const videos = await fetchUserVideos();
    console.log('Fetched videos:', JSON.stringify(videos, null, 2));
    return videos;
  } catch (error) {
    console.error('Failed to generate mock database:', error);
    return [];
  }
}

// Method to validate Vimeo access token
async function validateCredentials(): Promise<boolean> {
  return new Promise((resolve) => {
    client.request({
      method: 'GET',
      path: '/me'
    }, (error) => {
      if (error) {
        console.error('Failed to validate Vimeo credentials:', error);
        resolve(false);
        return;
      }
      resolve(true);
    });
  });
}

export const vimeoService = {
  fetchUserVideos,
  generateMockDatabase,
  validateCredentials
}; 