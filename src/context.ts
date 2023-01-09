import { PrismaClient } from '@prisma/client'
import { prisma } from './db'

export interface Context {
  prisma: PrismaClient
  req: any
}

export function createContext(req: Context) {
  return {
    ...req,
    prisma,
  }
}
