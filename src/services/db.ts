import { Video } from '@/types/forms'
import { getRelevantVideos as getRelevantVideosFromDb } from '@/services/videoDatabase'

export async function getRelevantVideos(_userId: string, projectType: string): Promise<Video[]> {
  return getRelevantVideosFromDb(projectType)
} 