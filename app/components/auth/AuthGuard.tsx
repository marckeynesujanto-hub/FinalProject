'use client'

import { useRequireAuth } from '@/lib/hooks/useAuth'
import { PageSkeleton } from '@/components/ui/Skeleton'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { ready } = useRequireAuth()

  if (!ready) {
    return <PageSkeleton />
  }

  return <>{children}</>
}
