import { createHash } from 'node:crypto'

export function hashValue(value: string, salt = process.env.APP_URL ?? 'local-dev') {
  return createHash('sha256').update(`${salt}:${value}`).digest('hex')
}
