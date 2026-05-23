import { nanoid } from 'nanoid'

export function createShareToken() {
  return nanoid(32)
}
