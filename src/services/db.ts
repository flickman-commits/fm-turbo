import { PrismaClient } from '@prisma/client'

// Handle both browser and Node.js environments
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export async function upsertUserVimeoConnection(email: string, vimeoUserId: string) {
  return prisma.user.upsert({
    where: { email },
    update: {
      vimeoUserId,
      vimeoConnected: true
    },
    create: {
      email,
      vimeoUserId,
      vimeoConnected: true
    }
  })
}

interface VideoData {
  vimeoId: string
  title: string
  description?: string
  url: string
  thumbnail?: string
  views: number
  likes: number
  tags: string[]
  isPublic: boolean
  categories?: string[]
}

export async function syncUserVideos(userId: string, videos: VideoData[]) {
  // First, get all existing video IDs for this user
  const existingVideos = await prisma.video.findMany({
    where: { userId },
    select: { vimeoId: true }
  })
  
  // Create sets of video IDs
  const existingVimeoIds = new Set(existingVideos.map((v: { vimeoId: string }) => v.vimeoId))
  const currentVimeoIds = new Set(videos.map((v: VideoData) => v.vimeoId))
  
  // Find videos to delete
  const videosToDelete = existingVideos
    .map((v: { vimeoId: string }) => v.vimeoId)
    .filter((id: string) => !currentVimeoIds.has(id))

  // Create or update videos
  const upsertPromises = videos.map(video => 
    prisma.video.upsert({
      where: { vimeoId: video.vimeoId },
      update: {
        title: video.title,
        description: video.description,
        url: video.url,
        thumbnail: video.thumbnail,
        views: video.views,
        likes: video.likes,
        tags: video.tags,
        categories: video.categories || [],
        isPublic: video.isPublic,
      },
      create: {
        ...video,
        categories: video.categories || [],
        userId
      }
    })
  )

  // Delete videos that no longer exist in Vimeo
  if (videosToDelete.length > 0) {
    await prisma.video.deleteMany({
      where: {
        userId,
        vimeoId: { in: videosToDelete }
      }
    })
  }

  return Promise.all(upsertPromises)
}

export async function getRelevantVideos(userId: string, projectType: string, limit = 3) {
  return prisma.video.findMany({
    where: {
      userId,
      isPublic: true,
      categories: {
        has: projectType.toLowerCase()
      }
    },
    orderBy: [
      { views: 'desc' },
      { likes: 'desc' }
    ],
    take: limit
  })
} 