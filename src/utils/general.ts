import { Client } from '@prisma/client'
import { Context } from '../context'

require('dotenv').config()

export function getToken(context: Context) {
  const authorization = context.req.get('Authorization')

  if (!authorization || !authorization.startsWith('Bearer')) return false

  const split = authorization.split('Bearer ')
  if (split.length !== 2) return false

  const token = split[1]
  return token
}

export async function isAuthenticated(
  context: Context,
  checkIp: boolean = true,
) {
  const token = getToken(context)
  if (!token) return false

  const origin = context.req.get('origin')
  if (checkIp && !origin) return false

  try { // test for client_token
    let client = await context.prisma.client.findUnique({ where: { token } })
    return (client && !checkIp) || (client && origin === client.ip)
  } catch (err) {
    console.log(err)
    return false
  }
}
