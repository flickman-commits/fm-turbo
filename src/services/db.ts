import { Video } from '@/types/forms'
import { videos } from '@/services/videoDatabase'

export async function getRelevantVideos(_userId: string, projectType: string): Promise<Video[]> {
  // Filter videos by project type
  const relevantVideos = videos.filter(video => video.projectType === projectType)
  
  // Sort by views and likes
  relevantVideos.sort((a, b) => {
    const aScore = a.views + a.likes
    const bScore = b.views + b.likes
    return bScore - aScore
  })
  
  // Return top 3 videos
  return relevantVideos.slice(0, 3)
} 