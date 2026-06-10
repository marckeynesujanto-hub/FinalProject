/**
 * Session helpers — app uses custom auth via Supabase tables + localStorage (not JWT).
 */

export type UserRole = 'users' | 'drivers'

export interface StoredSession {
  user_id?: string
  driver_id?: string
  user_name?: string
  driver_name?: string
  fullname?: string
  user_email?: string
  driver_email?: string
  [key: string]: unknown
}

const KEYS = {
  userId: 'user_id',
  session: 'user_session',
  role: 'user_role',
} as const

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function getUserId(): string | null {
  if (!isBrowser()) return null
  return localStorage.getItem(KEYS.userId)
}

export function getUserRole(): UserRole | null {
  if (!isBrowser()) return null
  const role = localStorage.getItem(KEYS.role)
  return role === 'drivers' || role === 'users' ? role : null
}

export function getSession(): StoredSession | null {
  if (!isBrowser()) return null
  const raw = localStorage.getItem(KEYS.session)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredSession
  } catch {
    return null
  }
}

export function setSession(userId: string, role: UserRole, data: StoredSession): void {
  if (!isBrowser()) return
  localStorage.setItem(KEYS.userId, userId)
  localStorage.setItem(KEYS.role, role)
  localStorage.setItem(KEYS.session, JSON.stringify(data))
}

export function clearSession(): void {
  if (!isBrowser()) return
  localStorage.removeItem(KEYS.userId)
  localStorage.removeItem(KEYS.role)
  localStorage.removeItem(KEYS.session)
}

export function isAuthenticated(): boolean {
  return Boolean(getUserId())
}

export function getDisplayName(): string {
  const session = getSession()
  if (!session) return 'User'
  return (
    session.fullname ||
    session.user_name ||
    session.driver_name ||
    'User'
  )
}
