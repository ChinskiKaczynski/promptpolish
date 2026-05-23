import 'server-only'
import { randomUUID, createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'owner_anonymous_id'

/**
 * Resolves the signing secret safely, raising an exception in production
 * if it is not configured.
 */
function getSigningSecret(): string {
  const secret = process.env.COOKIE_SIGNING_SECRET
  if (process.env.NODE_ENV === 'production' && !secret) {
    throw new Error('CRITICAL SECURITY ERROR: COOKIE_SIGNING_SECRET is not configured in production.')
  }
  return secret || 'development-fallback-secret-key-1234567890'
}

/**
 * Appends a SHA-256 HMAC signature to a UUID.
 */
export function signId(id: string): string {
  const secret = getSigningSecret()
  const signature = createHmac('sha256', secret).update(id).digest('base64url')
  return `${id}.${signature}`
}

/**
 * Verifies a signature and extracts the original UUID.
 * Returns null if the signature is invalid or the value is tampered.
 */
export function verifyAndExtractId(signedValue: string): string | null {
  const secret = getSigningSecret()
  const parts = signedValue.split('.')
  if (parts.length !== 2) return null
  const [id, signature] = parts
  if (!id || !signature) return null

  // Validate standard UUID v4 format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) return null

  const expectedSignature = createHmac('sha256', secret).update(id).digest('base64url')
  
  try {
    const signatureBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expectedSignature)
    if (signatureBuffer.length === expectedBuffer.length && timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return id
    }
  } catch {
    return null
  }
  return null
}

/**
 * Extracts and verifies the owner ID from the cookie store.
 */
export async function getOwnerIdFromCookies(): Promise<string | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(COOKIE_NAME)
  if (!cookie?.value) return null
  return verifyAndExtractId(cookie.value)
}

/**
 * Sets a secure signed cookie for the owner ID.
 */
export async function setOwnerIdCookie(id: string): Promise<void> {
  const cookieStore = await cookies()
  const signed = signId(id)
  cookieStore.set(COOKIE_NAME, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365 // 1 year
  })
}

/**
 * Entry point that fetches the current verified session identity
 * or automatically provisions a new signed session cookie if missing.
 */
export async function resolveOrCreateOwnerId(): Promise<{ id: string; isNew: boolean }> {
  const existing = await getOwnerIdFromCookies()
  if (existing) {
    return { id: existing, isNew: false }
  }
  const newId = randomUUID()
  await setOwnerIdCookie(newId)
  return { id: newId, isNew: true }
}
