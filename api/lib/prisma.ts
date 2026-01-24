import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Singleton pattern for Prisma Client in serverless environments
export const prisma = global.prisma || new PrismaClient({
  log: ['error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}
