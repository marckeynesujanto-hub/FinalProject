'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getDisplayName,
  getUserId,
  getUserRole,
  isAuthenticated,
  type UserRole,
} from '@/app/lib/auth/session'

export function useRequireAuth() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)

  useEffect(() => {
    const id = getUserId()
    if (!id) {
      router.replace('/login')
      return
    }
    setUserId(id)
    setRole(getUserRole())
    setReady(true)
  }, [router])

  return {
    ready,
    userId,
    role,
    displayName: getDisplayName(),
  }
}

export function useRedirectIfAuthenticated() {
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/home')
    }
  }, [router])
}
