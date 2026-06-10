/**
 * Centralized environment configuration.
 * Next.js API routes live on the same origin by default — leave NEXT_PUBLIC_API_URL empty.
 */
export const env = {
  apiUrl: (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, ''),
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
} as const

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && !env.apiUrl) {
    return window.location.origin
  }
  return env.apiUrl || 'http://localhost:3000'
}
